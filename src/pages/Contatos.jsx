const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Building2, Calendar, User, X, TrendingUp, DollarSign, FileText, Paperclip, Send } from "lucide-react";
import DataGrid from "@/components/crm/DataGrid";
import CommandBar from "@/components/crm/CommandBar";
import TimelineActivity from "@/components/crm/TimelineActivity";
import StatusBadge from "@/components/ui/StatusBadge";
import DocumentUploader from "@/components/DocumentUploader";

export default function Contatos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContato, setSelectedContato] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    cpf_cnpj: "",
    tipo_pessoa: "fisica",
    email: "",
    telefone: "",
    empresa: "",
    distribuidora: "",
    consumo_medio_kwh: "",
    valor_conta_media: "",
    desconto_percentual: "",
    proprietario: "",
    tipo: "lead",
    origem: "site",
    status: "novo"
  });

  const queryClient = useQueryClient();

  const { data: contatos = [], isLoading, refetch } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => db.entities.Contato.list('-created_date', 200),
  });

  const { data: atividades = [] } = useQuery({
    queryKey: ['atividades', selectedContato?.id],
    queryFn: () => selectedContato 
      ? db.entities.Atividade.filter({ contato_id: selectedContato.id }, '-data_atividade')
      : Promise.resolve([]),
    enabled: !!selectedContato
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Contato.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Contato.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] });
      setSelectedContato(null);
    },
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      sobrenome: "",
      cpf_cnpj: "",
      tipo_pessoa: "fisica",
      email: "",
      telefone: "",
      empresa: "",
      distribuidora: "",
      consumo_medio_kwh: "",
      valor_conta_media: "",
      desconto_percentual: "",
      proprietario: "",
      tipo: "lead",
      origem: "site",
      status: "novo"
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredContatos = contatos.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.empresa?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Nome Completo",
      key: "nome",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            {row.nome?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {row.nome} {row.sobrenome}
            </p>
            <p className="text-xs text-slate-500">{row.distribuidora || 'Sem distribuidora'}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Distribuidora",
      key: "distribuidora",
      sortable: true,
      cell: (row) => (
        <span className="text-slate-700">{row.distribuidora || '-'}</span>
      ),
    },
    {
      header: "Consumo Médio",
      key: "consumo_medio_kwh",
      cell: (row) => (
        <span className="text-slate-700">{row.consumo_medio_kwh ? `${row.consumo_medio_kwh} kWh` : '-'}</span>
      ),
    },
    {
      header: "Email",
      key: "email",
      cell: (row) => (
        <div className="flex items-center gap-2 text-slate-700">
          <Mail className="w-4 h-4 text-slate-400" />
          {row.email}
        </div>
      ),
    },
    {
      header: "Telefone",
      key: "telefone",
      cell: (row) => (
        <div className="flex items-center gap-2 text-slate-700">
          <Phone className="w-4 h-4 text-slate-400" />
          {row.telefone || '-'}
        </div>
      ),
    },
    {
      header: "Tipo",
      key: "tipo",
      cell: (row) => (
        <Badge variant="outline" className={
          row.tipo === 'cliente' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
          row.tipo === 'prospect' ? 'bg-blue-100 text-blue-700 border-blue-200' :
          row.tipo === 'inativo' ? 'bg-slate-100 text-slate-600 border-slate-200' :
          'bg-amber-100 text-amber-700 border-amber-200'
        }>
          {row.tipo}
        </Badge>
      ),
    },
    {
      header: "Status",
      key: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f2f1]">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#323130]">Clientes</h1>
            <p className="text-sm text-[#605e5c] mt-1">
              Gestão de clientes e leads de energia solar
            </p>
          </div>
          <div className="relative w-80">
            <Input
              placeholder="Pesquisar contatos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Command Bar */}
      <CommandBar
        onNew={() => setIsDialogOpen(true)}
        onRefresh={refetch}
      />

      {/* Data Grid */}
      <div className="p-6">
        <DataGrid
          columns={columns}
          data={filteredContatos}
          isLoading={isLoading}
          onRowClick={setSelectedContato}
        />
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
           <DialogTitle>Novo Cliente</DialogTitle>
           <DialogDescription>Preencha os dados do cliente abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
           <div className="grid grid-cols-2 gap-4 py-4">
             <div>
               <Label>Nome *</Label>
               <Input
                 value={formData.nome}
                 onChange={(e) => setFormData({...formData, nome: e.target.value})}
                 required
               />
             </div>
             <div>
               <Label>Sobrenome</Label>
               <Input
                 value={formData.sobrenome}
                 onChange={(e) => setFormData({...formData, sobrenome: e.target.value})}
               />
             </div>
             <div>
               <Label>CPF/CNPJ</Label>
               <Input
                 value={formData.cpf_cnpj}
                 onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
               />
             </div>
             <div>
               <Label>Tipo de Pessoa</Label>
               <select value={formData.tipo_pessoa} onChange={(e) => setFormData({...formData, tipo_pessoa: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                 <option value="fisica">Pessoa Física</option>
                 <option value="juridica">Pessoa Jurídica</option>
               </select>
             </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                />
              </div>
              <div>
                <Label>Distribuidora</Label>
                <Input
                  value={formData.distribuidora}
                  onChange={(e) => setFormData({...formData, distribuidora: e.target.value})}
                  placeholder="Ex: CEMIG, CPFL, Light"
                />
              </div>
              <div>
                <Label>Consumo Médio (kWh)</Label>
                <Input
                  type="number"
                  value={formData.consumo_medio_kwh}
                  onChange={(e) => setFormData({...formData, consumo_medio_kwh: e.target.value})}
                  placeholder="300"
                />
              </div>
              <div>
                <Label>Valor Médio Conta (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_conta_media}
                  onChange={(e) => setFormData({...formData, valor_conta_media: e.target.value})}
                  placeholder="450.00"
                />
              </div>
              <div>
                 <Label>Empresa</Label>
                 <Input
                   value={formData.empresa}
                   onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                 />
               </div>
               <div>
                 <Label>Economia / Desconto (%)</Label>
                 <Input
                   type="number"
                   step="0.01"
                   min="0"
                   max="100"
                   value={formData.desconto_percentual}
                   onChange={(e) => setFormData({...formData, desconto_percentual: e.target.value})}
                   placeholder="Ex: 15"
                 />
               </div>
               <div>
                 <Label>Vendedor Responsável</Label>
                 <Input
                   value={formData.proprietario}
                   onChange={(e) => setFormData({...formData, proprietario: e.target.value})}
                   placeholder="Email ou nome do vendedor"
                 />
               </div>
               <div>
                 <Label>Tipo</Label>
                <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="cliente">Cliente</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div>
                <Label>Origem</Label>
                <select value={formData.origem} onChange={(e) => setFormData({...formData, origem: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="site">Site</option>
                  <option value="indicacao">Indicação</option>
                  <option value="evento">Evento</option>
                  <option value="marketing">Marketing</option>
                  <option value="telefone">Telefone</option>
                  <option value="outro">Outro</option>
                </select>
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

      {/* Detail Sheet - Estilo Dynamics */}
      <Sheet open={!!selectedContato} onOpenChange={(open) => !open && setSelectedContato(null)}>
        <SheetContent className="w-full sm:max-w-2xl p-0 overflow-y-auto">
          {selectedContato && (
            <>
              {/* Header */}
              <div className="bg-[#0f6cbd] text-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                      {selectedContato.nome?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">
                        {selectedContato.nome} {selectedContato.sobrenome}
                      </h2>
                      <p className="text-white/80 text-sm mt-1">
                        {selectedContato.distribuidora} {selectedContato.consumo_medio_kwh ? `• ${selectedContato.consumo_medio_kwh} kWh/mês` : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedContato(null)}
                    className="text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="detalhes" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-white h-auto p-0">
                  <TabsTrigger 
                    value="detalhes" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0f6cbd] data-[state=active]:bg-transparent"
                  >
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="timeline"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0f6cbd] data-[state=active]:bg-transparent"
                  >
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documentos"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0f6cbd] data-[state=active]:bg-transparent"
                  >
                    Documentos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="detalhes" className="p-6 space-y-6">
                  {/* Informações de Contato */}
                  <div>
                    <h3 className="text-sm font-semibold text-[#323130] mb-3">Informações de Contato</h3>
                    <div className="space-y-3 bg-white rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="text-sm text-slate-900">{selectedContato.email}</p>
                        </div>
                      </div>
                      {selectedContato.telefone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Telefone</p>
                            <p className="text-sm text-slate-900">{selectedContato.telefone}</p>
                          </div>
                        </div>
                      )}
                      {selectedContato.celular && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Celular</p>
                            <p className="text-sm text-slate-900">{selectedContato.celular}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações de Energia */}
                  <div>
                    <h3 className="text-sm font-semibold text-[#323130] mb-3">Informações de Energia</h3>
                    <div className="space-y-3 bg-white rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Distribuidora</p>
                          <p className="text-sm text-slate-900">{selectedContato.distribuidora || '-'}</p>
                        </div>
                      </div>
                      {selectedContato.consumo_medio_kwh && (
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Consumo Médio Mensal</p>
                            <p className="text-sm text-slate-900">{selectedContato.consumo_medio_kwh} kWh</p>
                          </div>
                        </div>
                      )}
                      {selectedContato.valor_conta_media && (
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Valor Médio da Conta</p>
                            <p className="text-sm text-slate-900">R$ {selectedContato.valor_conta_media.toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                      {selectedContato.numero_instalacao && (
                        <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Nº Instalação</p>
                            <p className="text-sm text-slate-900">{selectedContato.numero_instalacao}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status e Classificação */}
                  <div>
                    <h3 className="text-sm font-semibold text-[#323130] mb-3">Status e Classificação</h3>
                    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Tipo</span>
                        <Badge>{selectedContato.tipo}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Status</span>
                        <StatusBadge status={selectedContato.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Origem</span>
                        <Badge variant="outline">{selectedContato.origem}</Badge>
                      </div>
                    </div>
                  </div>

                  {selectedContato.notas && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#323130] mb-3">Notas</h3>
                      <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedContato.notas}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="p-6">
                  <div className="max-w-3xl">
                    {atividades.length > 0 ? (
                      <div className="space-y-1">
                        {atividades.map((atividade) => (
                          <TimelineActivity key={atividade.id} atividade={atividade} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">Nenhuma atividade registrada</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="documentos" className="p-6">
                  <DocumentUploader
                    value={selectedContato.documentos || []}
                    onChange={(docs) => {
                      updateMutation.mutate({
                        id: selectedContato.id,
                        data: { documentos: docs }
                      });
                    }}
                    label="Documentos do Cliente"
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}