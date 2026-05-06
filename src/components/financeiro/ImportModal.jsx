const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ImportModal({ open, onOpenChange, onImportSuccess, boletos = [] }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [preview, setPreview] = useState(null);
  const [step, setStep] = useState(1); // 1: upload, 2: preview, 3: resultado
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
      setPreview(null);
      
      // Gerar preview automaticamente
      try {
        const text = await selectedFile.text();
        let transactions = [];

        if (selectedFile.name.toLowerCase().endsWith('.ofx')) {
          transactions = parseOFX(text);
        } else if (selectedFile.name.toLowerCase().endsWith('.csv')) {
          transactions = parseCSV(text);
        }

        setPreview(transactions.slice(0, 10)); // Mostrar primeiras 10
        setStep(2);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
      }
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      if (values.length >= 3) {
        const obj = {};
        headers.forEach((header, idx) => {
          obj[header] = values[idx]?.trim() || '';
        });

        // Tentar identificar campos comuns
        const data = obj.data || obj.date || obj.data_pagamento || values[0];
        const descricao = obj.descricao || obj.description || obj.historico || values[1];
        const valorStr = obj.valor || obj.value || obj.amount || values[2];
        const valor = parseFloat(valorStr?.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;

        if (data && valor !== 0) {
          transactions.push({
            data: parseDate(data),
            descricao,
            valor: Math.abs(valor),
            tipo: valor > 0 ? 'entrada' : 'saida',
          });
        }
      }
    }

    return transactions;
  };

  const parseOFX = (text) => {
    const transactions = [];
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = stmtTrnRegex.exec(text)) !== null) {
      const trnContent = match[1];
      
      const dtPosted = trnContent.match(/<DTPOSTED>(\d+)/)?.[1];
      const trnAmt = trnContent.match(/<TRNAMT>([-\d.,]+)/)?.[1];
      const memo = trnContent.match(/<MEMO>(.*?)(?:<|$)/)?.[1]?.trim();
      const name = trnContent.match(/<NAME>(.*?)(?:<|$)/)?.[1]?.trim();

      if (dtPosted && trnAmt) {
        const valor = parseFloat(trnAmt.replace(',', '.')) || 0;
        const descricao = memo || name || 'Transação importada';
        
        // Parse data OFX (formato: YYYYMMDD)
        const year = dtPosted.substring(0, 4);
        const month = dtPosted.substring(4, 6);
        const day = dtPosted.substring(6, 8);
        const data = `${year}-${month}-${day}`;

        transactions.push({
          data,
          descricao,
          valor: Math.abs(valor),
          tipo: valor > 0 ? 'entrada' : 'saida',
        });
      }
    }

    return transactions;
  };

  const parseDate = (dateStr) => {
    // Tentar diferentes formatos de data
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr?.match(format);
      if (match) {
        if (format === formats[0]) {
          return dateStr;
        } else {
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }

    return new Date().toISOString().split('T')[0];
  };

  const matchBoleto = (transaction) => {
    // Tentar encontrar boleto pendente com valor similar
    const tolerancia = 0.01; // 1 centavo de tolerância
    
    return boletos.find(b => 
      b.status === 'pendente' && 
      Math.abs(b.valor - transaction.valor) <= tolerancia
    );
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setResults(null);
    setStep(3);

    try {
      const text = await file.text();
      let transactions = [];

      if (file.name.toLowerCase().endsWith('.ofx')) {
        transactions = parseOFX(text);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        transactions = parseCSV(text);
      }

      // Processar transações
      const processedResults = {
        total: transactions.length,
        importadas: 0,
        boletosAtualizados: 0,
        erros: 0,
      };

      for (const transaction of transactions) {
        try {
          // Verificar se é um pagamento de boleto
          const boletoMatch = matchBoleto(transaction);
          
          if (boletoMatch && transaction.tipo === 'entrada') {
            // Atualizar boleto como pago
            await db.entities.Boleto.update(boletoMatch.id, {
              status: 'pago',
              data_pagamento: transaction.data,
            });
            processedResults.boletosAtualizados++;
          }

          // Criar transação
          await db.entities.Transacao.create({
            tipo: transaction.tipo,
            categoria: boletoMatch ? 'boleto_cliente' : 'outro',
            descricao: transaction.descricao,
            valor: transaction.valor,
            data: transaction.data,
            boleto_id: boletoMatch?.id,
            cliente_id: boletoMatch?.cliente_id,
            origem_arquivo: file.name,
          });

          processedResults.importadas++;
        } catch (err) {
          processedResults.erros++;
        }
      }

      setResults(processedResults);
      onImportSuccess();
    } catch (error) {
      setResults({
        total: 0,
        importadas: 0,
        boletosAtualizados: 0,
        erros: 1,
        errorMessage: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    setPreview(null);
    setStep(1);
    onOpenChange(false);
  };

  const handleVoltar = () => {
    setFile(null);
    setPreview(null);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Importar Extrato
            <span className="text-sm font-normal text-slate-500">
              (Passo {step} de 3)
            </span>
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div 
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-emerald-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ofx,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="font-medium text-slate-700">
                {file ? file.name : 'Clique para selecionar'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Arquivos OFX ou CSV
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Arquivo processado</p>
                  <p className="text-sm text-blue-700">{preview.length} transações encontradas</p>
                </div>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b">
                <p className="text-sm font-medium text-slate-700">Preview (primeiras 10 transações)</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {preview.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-3 border-b last:border-0 hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{t.descricao}</p>
                      <p className="text-sm text-slate-500">
                        {t.data ? new Date(t.data).toLocaleDateString('pt-BR') : 'Data inválida'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        t.tipo === 'entrada' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {t.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                      <span className={`font-bold ${
                        t.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {t.tipo === 'entrada' ? '+' : '-'} R$ {t.valor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Nota:</strong> Ao confirmar, as transações serão importadas e boletos pendentes com valores correspondentes serão marcados como pagos automaticamente.
              </p>
            </div>
          </div>
        )}

        {step === 3 && results && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${results.erros > 0 && results.importadas === 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <div className="flex items-center gap-3 mb-3">
                {results.importadas > 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <h4 className="font-semibold text-slate-900">
                  {results.importadas > 0 ? 'Importação Concluída' : 'Erro na Importação'}
                </h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Transações encontradas</p>
                  <p className="font-bold text-slate-900">{results.total}</p>
                </div>
                <div>
                  <p className="text-slate-500">Importadas</p>
                  <p className="font-bold text-emerald-600">{results.importadas}</p>
                </div>
                <div>
                  <p className="text-slate-500">Boletos baixados</p>
                  <p className="font-bold text-blue-600">{results.boletosAtualizados}</p>
                </div>
                <div>
                  <p className="text-slate-500">Erros</p>
                  <p className="font-bold text-red-600">{results.erros}</p>
                </div>
              </div>

              {results.errorMessage && (
                <p className="mt-3 text-sm text-red-600">{results.errorMessage}</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={handleVoltar}>
                Voltar
              </Button>
              <Button 
                onClick={processFile} 
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirmar Importação
                  </>
                )}
              </Button>
            </>
          )}
          {step === 3 && (
            <Button onClick={handleClose} className="bg-emerald-600 hover:bg-emerald-700">
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}