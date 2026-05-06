const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, Calendar, PenTool, X, Download } from "lucide-react";
import DataGrid from "@/components/crm/DataGrid";
import CommandBar from "@/components/crm/CommandBar";
import DocumentUploader from "@/components/DocumentUploader";
import AssinaturaDigital from "@/components/AssinaturaDigital";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function Propostas() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [assinaturaOpen, setAssinaturaOpen] = useState(false);
  const [propostaParaAssinar, setPropostaParaAssinar] = useState(null);
  const [selectedProposta, setSelectedProposta] = useState(null);
  const [formData, setFormData] = useState({
    cliente_id: "",
    uc_id: "",
    parceiro_une_energia: "",
    consumo_kwh: "",
    economia_percentual: "",
    valor_proposta_mensal: "",
    validade_proposta: "",
    data_aprovacao: "",
    documentos: []
  });

  const queryClient = useQueryClient();

  const { data: propostas = [], isLoading, refetch } = useQuery({
    queryKey: ['propostas'],
    queryFn: () => db.entities.Proposta.list('-created_date', 200),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => db.entities.Contato.list('-created_date', 200),
  });

  const { data: ucs = [] } = useQuery({
    queryKey: ['unidades_consumidoras'],
    queryFn: () => db.entities.UnidadeConsumidora.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const numeroPropostaGerado = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000000)}`;
      const valorAnual = parseFloat(data.valor_proposta_mensal) * 12;
      
      return db.entities.Proposta.create({
        ...data,
        numero_proposta: numeroPropostaGerado,
        cliente_nome: clientes.find(c => c.id === data.cliente_id)?.nome,
        uc_numero: ucs.find(u => u.id === data.uc_id)?.numero_uc,
        valor_proposta_anual: valorAnual,
        data_criacao: new Date().toISOString().split('T')[0],
        razao_status: "valida"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Proposta.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
    },
  });

  const handleAssinaturaComplete = async (assinaturaData) => {
    if (!propostaParaAssinar) return;
    
    await updateMutation.mutateAsync({
      id: propostaParaAssinar.id,
      data: {
        razao_status: "aprovada",
        data_aprovacao: assinaturaData.data_assinatura,
        documentos: [
              ...(propostaParaAssinar.documentos || []),
              assinaturaData.pdf_assinado_url
            ]
      }
    });
    
    setPropostaParaAssinar(null);
  };

  const resetForm = () => {
    setFormData({
      cliente_id: "",
      uc_id: "",
      parceiro_une_energia: "",
      consumo_kwh: "",
      economia_percentual: "",
      valor_proposta_mensal: "",
      validade_proposta: "",
      data_aprovacao: "",
      documentos: []
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredPropostas = propostas.filter(p =>
    p.numero_proposta?.includes(search) ||
    p.cliente_nome?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    valida: "bg-blue-100 text-blue-700 border-blue-200",
    aguardando_aprovacao: "bg-amber-100 text-amber-700 border-amber-200",
    aprovada: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejeitada: "bg-red-100 text-red-700 border-red-200",
    expirada: "bg-slate-100 text-slate-700 border-slate-200"
  };

  const statusLabels = {
    valida: "Válida",
    aguardando_aprovacao: "Aguardando Aprovação",
    aprovada: "Aprovada",
    rejeitada: "Rejeitada",
    expirada: "Expirada"
  };

  const columns = [
    {
      header: "Número Proposta",
      key: "numero_proposta",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.numero_proposta}</p>
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
      key: "valor_proposta_mensal",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">
            {row.valor_proposta_mensal ? 
              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor_proposta_mensal) 
              : '-'}
          </span>
        </div>
      ),
    },
    {
      header: "Economia",
      key: "economia_percentual",
      cell: (row) => row.economia_percentual ? `${row.economia_percentual}%` : '-',
    },
    {
      header: "Validade",
      key: "validade_proposta",
      cell: (row) => (
        <div className="flex items-center gap-2 text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          {row.validade_proposta ? format(new Date(row.validade_proposta), 'dd/MM/yyyy') : '-'}
        </div>
      ),
    },
    {
      header: "Status",
      key: "razao_status",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColors[row.razao_status]}>
            {statusLabels[row.razao_status] || row.razao_status}
          </Badge>
          {row.razao_status === 'valida' && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setPropostaParaAssinar(row);
                setAssinaturaOpen(true);
              }}
              className="h-7"
            >
              <PenTool className="w-3 h-3 mr-1" />
              Assinar
            </Button>
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
            <h1 className="text-xl font-semibold text-[#323130]">Propostas</h1>
            <p className="text-sm text-[#605e5c] mt-1">Gestão de propostas comerciais</p>
          </div>
          <div className="relative w-80">
            <Input
              placeholder="Pesquisar propostas..."
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
          data={filteredPropostas} 
          isLoading={isLoading}
          onRowClick={setSelectedProposta}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Proposta</DialogTitle>
            <DialogDescription>Preencha os dados da proposta abaixo.</DialogDescription>
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
                <Label>Unidade Consumidora *</Label>
                <select required value={formData.uc_id} onChange={(e) => setFormData({...formData, uc_id: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="">Selecione...</option>
                  {ucs.map(u => <option key={u.id} value={u.id}>{u.numero_uc}</option>)}
                </select>
              </div>
              <div>
                <Label>Parceiro UNE ENERGIA</Label>
                <Input
                  value={formData.parceiro_une_energia}
                  onChange={(e) => setFormData({...formData, parceiro_une_energia: e.target.value})}
                  placeholder="Nome da usina"
                />
              </div>
              <div>
                <Label>Consumo (kWh)</Label>
                <Input
                  type="number"
                  value={formData.consumo_kwh}
                  onChange={(e) => setFormData({...formData, consumo_kwh: e.target.value})}
                />
              </div>
              <div>
                <Label>Economia (%)</Label>
                <Input
                  type="number"
                  value={formData.economia_percentual}
                  onChange={(e) => setFormData({...formData, economia_percentual: e.target.value})}
                />
              </div>
              <div>
                <Label>Valor Mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_proposta_mensal}
                  onChange={(e) => setFormData({...formData, valor_proposta_mensal: e.target.value})}
                />
              </div>
              <div>
               <Label>Validade da Proposta</Label>
               <Input
                 type="date"
                 value={formData.validade_proposta}
                 onChange={(e) => setFormData({...formData, validade_proposta: e.target.value})}
               />
              </div>
              <div>
               <Label>Data da Assinatura</Label>
               <Input
                 type="date"
                 value={formData.data_aprovacao}
                 onChange={(e) => setFormData({...formData, data_aprovacao: e.target.value})}
               />
              </div>
              <div className="col-span-2">
               <DocumentUploader
                 value={formData.documentos}
                 onChange={(docs) => setFormData({...formData, documentos: docs})}
                 label="Anexar Documentos da Proposta"
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

      <Sheet open={!!selectedProposta} onOpenChange={(open) => !open && setSelectedProposta(null)}>
        <SheetContent className="w-full sm:max-w-2xl p-0 overflow-y-auto">
          {selectedProposta && (
            <>
              <div className="bg-[#0f6cbd] text-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      {selectedProposta.numero_proposta}
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                      {selectedProposta.cliente_nome}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedProposta(null)}
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
                      <span className="text-sm font-medium">{selectedProposta.uc_numero || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Consumo</span>
                      <span className="text-sm font-medium">{selectedProposta.consumo_kwh ? `${selectedProposta.consumo_kwh} kWh` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Economia</span>
                      <span className="text-sm font-medium">{selectedProposta.economia_percentual ? `${selectedProposta.economia_percentual}%` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Valor Mensal</span>
                      <span className="text-sm font-medium">
                        {selectedProposta.valor_proposta_mensal ? 
                          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProposta.valor_proposta_mensal) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Valor Anual</span>
                      <span className="text-sm font-medium">
                        {selectedProposta.valor_proposta_anual ? 
                          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProposta.valor_proposta_anual) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Validade</span>
                      <span className="text-sm font-medium">
                        {selectedProposta.validade_proposta ? format(new Date(selectedProposta.validade_proposta), 'dd/MM/yyyy') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Status</span>
                      <Badge variant="outline">{statusLabels[selectedProposta.razao_status] || selectedProposta.razao_status}</Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documentos" className="p-6">
                  <DocumentUploader
                    value={selectedProposta.documentos || []}
                    onChange={(docs) => {
                      updateMutation.mutate({
                        id: selectedProposta.id,
                        data: { documentos: docs }
                      });
                    }}
                    label="Documentos da Proposta (Simulação, Conta de Luz, etc)"
                  />
                  
                  {selectedProposta.documentos && selectedProposta.documentos.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-semibold text-slate-700">Documentos Anexados:</h4>
                      {selectedProposta.documentos.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{doc.name || `Documento ${idx + 1}`}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(doc.url || doc, '_blank')}
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
          setPropostaParaAssinar(null);
        }}
        onComplete={handleAssinaturaComplete}
        documentTitle={`Proposta ${propostaParaAssinar?.numero_proposta || ''}`}
        documentData={propostaParaAssinar ? {
          'Número da Proposta': propostaParaAssinar.numero_proposta,
          'Cliente': propostaParaAssinar.cliente_nome,
          'UC': propostaParaAssinar.uc_numero,
          'Consumo': propostaParaAssinar.consumo_kwh ? `${propostaParaAssinar.consumo_kwh} kWh` : '-',
          'Economia': propostaParaAssinar.economia_percentual ? `${propostaParaAssinar.economia_percentual}%` : '-',
          'Valor Mensal': propostaParaAssinar.valor_proposta_mensal ? 
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(propostaParaAssinar.valor_proposta_mensal) : '-',
          'Valor Anual': propostaParaAssinar.valor_proposta_anual ? 
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(propostaParaAssinar.valor_proposta_anual) : '-'
        } : {}}
      />
    </div>
  );
}