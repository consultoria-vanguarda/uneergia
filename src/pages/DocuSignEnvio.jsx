const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Upload, UserPlus, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function DocuSignEnvio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    entityType: "Contrato",
    entityId: "",
    documentFile: null
  });
  
  const [recipients, setRecipients] = useState([
    { name: "", email: "" }
  ]);
  
  const [sendResult, setSendResult] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const { data: contatos = [] } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => db.entities.Contato.list('-created_date', 100),
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ['contratos'],
    queryFn: () => db.entities.Contrato.list('-created_date', 100),
  });

  const addRecipient = () => {
    setRecipients([...recipients, { name: "", email: "" }]);
  };

  const updateRecipient = (index, field, value) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, documentFile: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setSendResult(null);

    try {
      // Converter PDF para base64
      const file = formData.documentFile;
      const reader = new FileReader();
      
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        
        try {
          const { data } = await db.functions.invoke('docusignCreateEnvelope', {
            subject: formData.subject,
            message: formData.message,
            recipients: recipients.filter(r => r.name && r.email),
            documentBase64: base64,
            documentName: file.name,
            entityType: formData.entityType,
            entityId: formData.entityId
          });

          if (data.success) {
            setSendResult({
              success: true,
              message: 'Documento enviado com sucesso!',
              envelopeId: data.envelopeId
            });
            
            queryClient.invalidateQueries(['docusign-envelopes']);
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
              navigate(createPageUrl('DocuSignEnvelopes'));
            }, 2000);
          } else {
            setSendResult({
              success: false,
              message: data.error || 'Erro ao enviar documento'
            });
          }
        } catch (error) {
          setSendResult({
            success: false,
            message: error.message
          });
        } finally {
          setIsSending(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setSendResult({
        success: false,
        message: error.message
      });
      setIsSending(false);
    }
  };

  const fillFromContato = (contatoId) => {
    const contato = contatos.find(c => c.id === contatoId);
    if (contato) {
      setRecipients([{
        name: `${contato.nome} ${contato.sobrenome || ''}`.trim(),
        email: contato.email
      }]);
      
      // Buscar documentos do cliente automaticamente
      loadClientDocuments(contatoId);
    }
  };

  const loadClientDocuments = async (contatoId) => {
    try {
      // Buscar contratos do cliente
      const clientContratos = contratos.filter(c => c.cliente_id === contatoId);
      
      if (clientContratos.length > 0) {
        const contratoComDoc = clientContratos.find(c => c.documentos && c.documentos.length > 0);
        
        if (contratoComDoc && contratoComDoc.documentos[0]) {
          // Fazer download do documento e definir como arquivo
          const docUrl = contratoComDoc.documentos[0].url || contratoComDoc.documentos[0];
          
          const response = await fetch(docUrl);
          const blob = await response.blob();
          const fileName = contratoComDoc.documentos[0].name || `Contrato_${contratoComDoc.numero_contrato}.pdf`;
          const file = new File([blob], fileName, { type: 'application/pdf' });
          
          setFormData(prev => ({
            ...prev,
            documentFile: file,
            entityType: 'Contrato',
            entityId: contratoComDoc.id,
            subject: `Assinatura do Contrato ${contratoComDoc.numero_contrato}`
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f2f1] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#323130]">Enviar para Assinatura</h1>
          <p className="text-[#605e5c] mt-2">
            Envie documentos para assinatura eletrônica via DocuSign
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Documento</CardTitle>
              <CardDescription>Preencha os dados do envelope</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Documento *</Label>
                  <Select 
                    value={formData.entityType} 
                    onValueChange={(v) => setFormData({...formData, entityType: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Contrato">Contrato</SelectItem>
                      <SelectItem value="Proposta">Proposta</SelectItem>
                      <SelectItem value="Termo">Termo</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Vincular a {formData.entityType}</Label>
                  <Select 
                    value={formData.entityId} 
                    onValueChange={(v) => setFormData({...formData, entityId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.entityType === 'Contrato' && contratos.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.numero_contrato} - {c.cliente_nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Assunto *</Label>
                <Input
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Por favor, assine este documento"
                />
              </div>

              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Mensagem personalizada para os signatários"
                  rows={4}
                />
              </div>

              <div>
                <Label>Documento PDF *</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">
                        {formData.documentFile ? formData.documentFile.name : 'Clique para fazer upload do PDF'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Signatários</span>
                <Button type="button" size="sm" variant="outline" onClick={addRecipient}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </CardTitle>
              <CardDescription>Adicione as pessoas que devem assinar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Preencher de Cliente</Label>
                <Select onValueChange={fillFromContato}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contatos.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} {c.sobrenome} - {c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {recipients.map((recipient, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 p-4 bg-slate-50 rounded">
                  <div className="col-span-5">
                    <Label>Nome *</Label>
                    <Input
                      required
                      value={recipient.name}
                      onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="col-span-5">
                    <Label>Email *</Label>
                    <Input
                      required
                      type="email"
                      value={recipient.email}
                      onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="col-span-2 flex items-end">
                    {recipients.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRecipient(index)}
                        className="text-red-600"
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {sendResult && (
            <Alert variant={sendResult.success ? "default" : "destructive"} className="mt-6">
              <div className="flex items-start gap-3">
                {sendResult.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <AlertDescription>{sendResult.message}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl('DocuSignEnvelopes'))}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSending}
              className="bg-[#0f6cbd] hover:bg-[#0d5ba8]"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar para Assinatura
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}