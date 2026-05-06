const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileCheck, DollarSign, Calendar, PenTool, FileText, X, Download, CheckCircle2 } from "lucide-react";
import DataGrid from "@/components/crm/DataGrid";
import CommandBar from "@/components/crm/CommandBar";
import DocumentUploader from "@/components/DocumentUploader";
import AssinaturaDigital from "@/components/AssinaturaDigital";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function Contratos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [assinaturaOpen, setAssinaturaOpen] = useState(false);
  const [contratoParaAssinar, setContratoParaAssinar] = useState(null);
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [formData, setFormData] = useState({
    cliente_id: "",
    proposta_id: "",
    uc_id: "",
    tipo_pessoa: "fisica",
    valor_plano_proposta: "",
    data_inicio: "",
    duracao_meses: "12",
    documentos: []
  });

  const queryClient = useQueryClient();

  const { data: contratos = [], isLoading, refetch } = useQuery({
    queryKey: ['contratos'],
    queryFn: () => db.entities.Contrato.list('-created_date', 200),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => db.entities.Contato.list('-created_date', 200),
  });

  const { data: propostas = [] } = useQuery({
    queryKey: ['propostas'],
    queryFn: () => db.entities.Proposta.list('-created_date', 200),
  });

  const { data: ucs = [] } = useQuery({
    queryKey: ['unidades_consumidoras'],
    queryFn: () => db.entities.UnidadeConsumidora.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const numeroContratoGerado = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000000)}`;
      
      return db.entities.Contrato.create({
        ...data,
        numero_contrato: numeroContratoGerado,
        cliente_nome: clientes.find(c => c.id === data.cliente_id)?.nome,
        uc_numero: ucs.find(u => u.id === data.uc_id)?.numero_uc,
        valor_plano_contrato: data.valor_plano_proposta,
        razao_status: "aguardando_aprovacao",
        resultado_analise_credito: "pendente",
        docusign_status: "nao_enviado"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Contrato.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
    },
  });

  const handleAssinaturaComplete = async (assinaturaData) => {
    if (!contratoParaAssinar) return;
    
    await updateMutation.mutateAsync({
      id: contratoParaAssinar.id,
      data: {
        docusign_status: "assinado",
        razao_status: "aprovado",
        data_assinatura: assinaturaData.data_assinatura,
        documentos: [
          ...(contratoParaAssinar.documentos || []),
          assinaturaData.pdf_assinado_url
        ]
      }
    });
    
    setContratoParaAssinar(null);
  };

  const resetForm = () => {
    setFormData({
      cliente_id: "",
      proposta_id: "",
      uc_id: "",
      tipo_pessoa: "fisica",
      valor_plano_proposta: "",
      data_inicio: "",
      duracao_meses: "12",
      documentos: []
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredContratos = contratos.filter(c =>
    c.numero_contrato?.includes(search) ||
    c.cliente_nome?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    aguardando_aprovacao: "bg-amber-100 text-amber-700 border-amber-200",
    aprovado: "bg-blue-100 text-blue-700 border-blue-200",
    ativo: "bg-emerald-100 text-emerald-700 border-emerald-200",
    suspenso: "bg-orange-100 text-orange-700 border-orange-200",
    cancelado: "bg-red-100 text-red-700 border-red-200",
    concluido: "bg-slate-100 text-slate-700 border-slate-200"
  };

  const statusLabels = {
    aguardando_aprovacao: "Aguardando Aprovação",
    aprovado: "Aprovado",
    ativo: "Ativo",
    suspenso: "Suspenso",
    cancelado: "Cancelado",
    concluido: "Concluído"
  };

  const creditoLabels = {
    aprovado: "Aprovado",
    reprovado: "Reprovado",
    reanalisar: "Reanalisar",
    pendente: "Pendente"
  };

  const docusignLabels = {
    nao_enviado: "Não Enviado",
    enviado: "Enviado",
    assinado: "Assinado",
    concluido: "Concluído"
  };

  const columns = [
    {
      header: "Número Contrato",
      key: "numero_contrato",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.numero_contrato}</p>
            <p className="text-xs text-slate-500">{row.cliente_nome}</p>
          </div>
        </div>
      ),
    },
    {
      header: "UC",
      key: "uc_numero",
      cell: (row) => row.uc_numero || '-',
    },
    {
      header: "Valor Mensal",
      key: "valor_plano_contrato",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">
            {row.valor_plano_contrato ? 
              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor_plano_contrato) 
              : '-'}
          </span>
        </div>
      ),
    },
    {
      header: "Data Início",
      key: "data_inicio",
      cell: (row) => (
        <div className="flex items-center gap-2 text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          {row.data_inicio ? format(new Date(row.data_inicio), 'dd/MM/yyyy') : '-'}
        </div>
      ),
    },
    {
      header: "Análise Crédito",
      key: "resultado_analise_credito",
      cell: (row) => {
        const creditoColors = {
          aprovado: "bg-emerald-100 text-emerald-700",
          reprovado: "bg-red-100 text-red-700",
          reanalisar: "bg-amber-100 text-amber-700",
          pendente: "bg-blue-100 text-blue-700"
        };
        return (
          <Badge variant="outline" className={creditoColors[row.resultado_analise_credito]}>
            {creditoLabels[row.resultado_analise_credito] || row.resultado_analise_credito}
          </Badge>
        );
      },
    },
    {
      header: "Status",
      key: "razao_status",
      cell: (row) => (
        <Badge variant="outline" className={statusColors[row.razao_status]}>
            {statusLabels[row.razao_status] || row.razao_status}
          </Badge>
      ),
    },
    {
      header: "Assinatura",
      key: "docusign_status",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={
            row.docusign_status === 'concluido' ? 'bg-emerald-100 text-emerald-700' :
            row.docusign_status === 'assinado' ? 'bg-blue-100 text-blue-700' :
            row.docusign_status === 'enviado' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-700'
          }>
            {docusignLabels[row.docusign_status] || row.docusign_status}
          </Badge>
          {row.docusign_status === 'nao_enviado' && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setContratoParaAssinar(row);
                  setAssinaturaOpen(true);
                }}
                className="h-7"
              >
                <PenTool className="w-3 h-3 mr-1" />
                Assinar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  updateMutation.mutate({
                    id: row.id,
                    data: {
                      docusign_status: "assinado",
                      razao_status: "aprovado",
                      data_assinatura: new Date().toISOString().split('T')[0]
                    }
                  });
                }}
                className="h-7 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Marcar Assinado
              </Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f2f1]">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#323130]">Contratos UNE ENERGIA</h1>
            <p className="text-sm text-[#605e5c] mt-1">Gestão de contratos</p>
          </div>
          <div className="relative w-80">
            <Input
              placeholder="Pesquisar contratos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      <CommandBar onNew={() => setIsDialogOpen(true)} onRefresh={refetch} />

      <div className="p-6">
        <DataGrid 
          columns={columns} 
          data={filteredContratos} 
          isLoading={isLoading}
          onRowClick={setSelectedContrato}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Contrato</DialogTitle>
            <DialogDescription>Preencha os dados do contrato abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Cliente *</Label>
                <select required value={formData.cliente_id} onChange={(e) => setFormData({...formData, cliente_id: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="">Selecione...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <Label>Proposta *</Label>
                <select required value={formData.proposta_id} onChange={(e) => setFormData({...formData, proposta_id: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="">Selecione...</option>
                  {propostas.map(p => <option key={p.id} value={p.id}>{p.numero_proposta}</option>)}
                </select>
              </div>
              <div>
                <Label>Unidade Consumidora *</Label>
                <select required value={formData.uc_id} onChange={(e) => setFormData({...formData, uc_id: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="">Selecione...</option>
                  {ucs.map(u => <option key={u.id} value={u.id}>{u.numero_uc}</option>)}
                </select>
              </div>
              <div>
                <Label>Tipo de Pessoa</Label>
                <select value={formData.tipo_pessoa} onChange={(e) => setFormData({...formData, tipo_pessoa: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="fisica">Física</option>
                  <option value="juridica">Jurídica</option>
                </select>
              </div>
              <div>
                <Label>Valor Plano Mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_plano_proposta}
                  onChange={(e) => setFormData({...formData, valor_plano_proposta: e.target.value})}
                />
              </div>
              <div>
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                />
              </div>
              <div>
               <Label>Duração (meses)</Label>
               <Input
                 type="number"
                 value={formData.duracao_meses}
                 onChange={(e) => setFormData({...formData, duracao_meses: e.target.value})}
               />
              </div>
              <div className="col-span-2">
               <DocumentUploader
                 value={formData.documentos}
                 onChange={(docs) => setFormData({...formData, documentos: docs})}
                 label="Anexar Documentos do Contrato (RG, CPF, Comprovante de Endereço, etc)"
               />
              </div>
              </div>
              <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#0f6cbd] hover:bg-[#0d5ba8]">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedContrato} onOpenChange={(open) => !open && setSelectedContrato(null)}>
        <SheetContent className="w-full sm:max-w-2xl p-0 overflow-y-auto">
          {selectedContrato && (
            <>
              <div className="bg-[#0f6cbd] text-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      {selectedContrato.numero_contrato}
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                      {selectedContrato.cliente_nome}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedContrato(null)}
                    className="text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="detalhes" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-white h-auto p-0">
                  <TabsTrigger value="detalhes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0f6cbd] data-[state=active]:bg-transparent">
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger value="documentos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0f6cbd] data-[state=active]:bg-transparent">
                    Documentos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="detalhes" className="p-6 space-y-4">
                  <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">UC</span>
                      <span className="text-sm font-medium">{selectedContrato.uc_numero || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Valor Mensal</span>
                      <span className="text-sm font-medium">
                        {selectedContrato.valor_plano_contrato ? 
                          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedContrato.valor_plano_contrato) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Data Início</span>
                      <span className="text-sm font-medium">
                        {selectedContrato.data_inicio ? format(new Date(selectedContrato.data_inicio), 'dd/MM/yyyy') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Duração</span>
                      <span className="text-sm font-medium">{selectedContrato.duracao_meses || 12} meses</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Status</span>
                      <Badge variant="outline">{statusLabels[selectedContrato.razao_status] || selectedContrato.razao_status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Análise Crédito</span>
                      <Badge variant="outline">{creditoLabels[selectedContrato.resultado_analise_credito] || selectedContrato.resultado_analise_credito}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Assinatura Digital</span>
                      <Badge variant="outline">{docusignLabels[selectedContrato.docusign_status] || selectedContrato.docusign_status}</Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documentos" className="p-6">
                  <DocumentUploader
                    value={selectedContrato.documentos || []}
                    onChange={(docs) => {
                      updateMutation.mutate({
                        id: selectedContrato.id,
                        data: { documentos: docs }
                      });
                    }}
                    label="Documentos do Contrato (RG, CNH, Comprovante de Endereço, Fatura, etc)"
                  />
                  
                  {selectedContrato.documentos && selectedContrato.documentos.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-semibold text-slate-700">Documentos Anexados:</h4>
                      {selectedContrato.documentos.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{`Documento ${idx + 1}`}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(typeof doc === 'string' ? doc : doc.url, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AssinaturaDigital
        open={assinaturaOpen}
        onClose={() => {
          setAssinaturaOpen(false);
          setContratoParaAssinar(null);
        }}
        onComplete={handleAssinaturaComplete}
        documentTitle={`Contrato ${contratoParaAssinar?.numero_contrato || ''}`}
        documentData={contratoParaAssinar ? {
          'Número do Contrato': contratoParaAssinar.numero_contrato,
          'Cliente': contratoParaAssinar.cliente_nome,
          'UC': contratoParaAssinar.uc_numero,
          'Valor Mensal': contratoParaAssinar.valor_plano_contrato ? 
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contratoParaAssinar.valor_plano_contrato) : '-',
          'Data de Início': contratoParaAssinar.data_inicio ? format(new Date(contratoParaAssinar.data_inicio), 'dd/MM/yyyy') : '-',
          'Duração': `${contratoParaAssinar.duracao_meses || 12} meses`
        } : {}}
      />
    </div>
  );
}