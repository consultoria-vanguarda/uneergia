const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { UserPlus, Phone, Mail, MapPin, ArrowRight, Edit2, Save, X } from "lucide-react";
import DataGrid from "@/components/crm/DataGrid";
import CommandBar from "@/components/crm/CommandBar";
import StatusBadge from "@/components/ui/StatusBadge";

export default function Leads() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    primeiro_nome: "",
    sobrenome: "",
    tipo_cliente: "pessoa_fisica",
    telefone_comercial: "",
    telefone_celular: "",
    email: "",
    estado: "",
    cidade: "",
    cliente_que_indicou: "",
    origem: "site",
    razao_status: "novo"
  });

  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: () => db.entities.Lead.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Lead.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Lead.update(id, data),
    onSuccess: (_, { data }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedLead(prev => ({ ...prev, ...data }));
      setIsEditing(false);
    },
  });

  const qualificarMutation = useMutation({
    mutationFn: async (lead) => {
      // Criar cliente a partir do lead
      const cliente = await db.entities.Contato.create({
        nome: lead.primeiro_nome,
        sobrenome: lead.sobrenome,
        email: lead.email,
        telefone: lead.telefone_comercial,
        celular: lead.telefone_celular,
        cidade: lead.cidade,
        estado: lead.estado,
        tipo: "cliente",
        status: "qualificado",
        origem: lead.origem
      });

      // Atualizar lead com referência ao cliente
      await db.entities.Lead.update(lead.id, {
        razao_status: "qualificado",
        cliente_id: cliente.id,
        data_qualificacao: new Date().toISOString()
      });

      return cliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['contatos'] });
      if (selectedLead) {
        setSelectedLead(prev => ({ ...prev, razao_status: 'qualificado' }));
      }
    }
  });

  const resetForm = () => {
    setFormData({
      primeiro_nome: "",
      sobrenome: "",
      tipo_cliente: "pessoa_fisica",
      telefone_comercial: "",
      telefone_celular: "",
      email: "",
      estado: "",
      cidade: "",
      cliente_que_indicou: "",
      origem: "site",
      razao_status: "novo"
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleOpenLead = (lead) => {
    setSelectedLead(lead);
    setEditData({ ...lead });
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({ id: selectedLead.id, data: editData });
  };

  const filteredLeads = leads.filter(l =>
    l.primeiro_nome?.toLowerCase().includes(search.toLowerCase()) ||
    l.sobrenome?.toLowerCase().includes(search.toLowerCase()) ||
    l.telefone_comercial?.includes(search)
  );

  const statusColors = {
    novo: "bg-blue-100 text-blue-700 border-blue-200",
    pendente: "bg-amber-100 text-amber-700 border-amber-200",
    contatado: "bg-purple-100 text-purple-700 border-purple-200",
    qualificado: "bg-emerald-100 text-emerald-700 border-emerald-200",
    desqualificado: "bg-red-100 text-red-700 border-red-200"
  };

  const columns = [
    {
      header: "Nome Completo",
      key: "primeiro_nome",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
            {row.primeiro_nome?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {row.primeiro_nome} {row.sobrenome}
            </p>
            <p className="text-xs text-slate-500">{row.cidade || 'Cidade não informada'}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Telefone",
      key: "telefone_comercial",
      cell: (row) => (
        <div className="flex items-center gap-2 text-slate-700">
          <Phone className="w-4 h-4 text-slate-400" />
          {row.telefone_comercial}
        </div>
      ),
    },
    {
      header: "Email",
      key: "email",
      cell: (row) => (
        <div className="flex items-center gap-2 text-slate-700">
          <Mail className="w-4 h-4 text-slate-400" />
          {row.email || '-'}
        </div>
      ),
    },
    {
      header: "Localização",
      key: "cidade",
      cell: (row) => (
        <div className="flex items-center gap-2 text-slate-700">
          <MapPin className="w-4 h-4 text-slate-400" />
          {row.cidade && row.estado ? `${row.cidade} - ${row.estado}` : '-'}
        </div>
      ),
    },
    {
      header: "Status",
      key: "razao_status",
      cell: (row) => (
        <Badge variant="outline" className={statusColors[row.razao_status]}>
          {row.razao_status}
        </Badge>
      ),
    },
    {
      header: "Ações",
      key: "actions",
      cell: (row) => (
        row.razao_status !== 'qualificado' && (
          <Button
            size="sm"
            onClick={() => qualificarMutation.mutate(row)}
            disabled={qualificarMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <ArrowRight className="w-4 h-4 mr-1" />
            Qualificar
          </Button>
        )
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f2f1]">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#323130]">Leads</h1>
            <p className="text-sm text-[#605e5c] mt-1">
              Gestão de leads e qualificação
            </p>
          </div>
          <div className="relative w-80">
            <Input
              placeholder="Pesquisar leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      <CommandBar onNew={() => setIsDialogOpen(true)} onRefresh={refetch} />

      <div className="p-6">
        <DataGrid columns={columns} data={filteredLeads} isLoading={isLoading} onRowClick={handleOpenLead} />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Lead</DialogTitle>
            <DialogDescription>Preencha os dados do lead abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Primeiro Nome *</Label>
                <Input
                  value={formData.primeiro_nome}
                  onChange={(e) => setFormData({...formData, primeiro_nome: e.target.value})}
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
                <Label>Tipo de Cliente</Label>
                <select value={formData.tipo_cliente} onChange={(e) => setFormData({...formData, tipo_cliente: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="pessoa_fisica">Pessoa Física</option>
                  <option value="pessoa_juridica">Pessoa Jurídica</option>
                </select>
              </div>
              <div>
                <Label>Telefone Comercial *</Label>
                <Input
                  value={formData.telefone_comercial}
                  onChange={(e) => setFormData({...formData, telefone_comercial: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Telefone Celular</Label>
                <Input
                  value={formData.telefone_celular}
                  onChange={(e) => setFormData({...formData, telefone_celular: e.target.value})}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  placeholder="MG"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                />
              </div>
              <div>
                <Label>Cliente que Indicou</Label>
                <Input
                  value={formData.cliente_que_indicou}
                  onChange={(e) => setFormData({...formData, cliente_que_indicou: e.target.value})}
                />
              </div>
              <div>
                <Label>Origem</Label>
                <select value={formData.origem} onChange={(e) => setFormData({...formData, origem: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="site">Site</option>
                  <option value="indicacao">Indicação</option>
                  <option value="telefone">Telefone</option>
                  <option value="evento">Evento</option>
                  <option value="marketing">Marketing</option>
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

      {/* Painel de detalhes do Lead */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => { setSelectedLead(null); setIsEditing(false); }} />
          <div className="w-full sm:max-w-xl bg-white h-full overflow-y-auto shadow-xl flex flex-col">
            <div className="pb-4 border-b px-6 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                    {selectedLead.primeiro_nome?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {selectedLead.primeiro_nome} {selectedLead.sobrenome}
                    </p>
                    <Badge variant="outline" className={statusColors[selectedLead.razao_status]}>
                      {selectedLead.razao_status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                        <Save className="w-4 h-4 mr-1" /> Salvar
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedLead(null); setIsEditing(false); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

              <div className="py-4 space-y-6 px-6">
                {/* Dados Pessoais */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Dados Pessoais</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Primeiro Nome</Label>
                      {isEditing ? (
                        <Input value={editData.primeiro_nome || ''} onChange={(e) => setEditData({...editData, primeiro_nome: e.target.value})} />
                      ) : (
                        <p className="text-sm mt-1">{selectedLead.primeiro_nome || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Sobrenome</Label>
                      {isEditing ? (
                        <Input value={editData.sobrenome || ''} onChange={(e) => setEditData({...editData, sobrenome: e.target.value})} />
                      ) : (
                        <p className="text-sm mt-1">{selectedLead.sobrenome || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Tipo de Cliente</Label>
                      {isEditing ? (
                        <select value={editData.tipo_cliente} onChange={(e) => setEditData({...editData, tipo_cliente: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                          <option value="pessoa_fisica">Pessoa Física</option>
                          <option value="pessoa_juridica">Pessoa Jurídica</option>
                        </select>
                      ) : (
                        <p className="text-sm mt-1">{selectedLead.tipo_cliente === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Origem</Label>
                      {isEditing ? (
                        <select value={editData.origem} onChange={(e) => setEditData({...editData, origem: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                          <option value="site">Site</option>
                          <option value="indicacao">Indicação</option>
                          <option value="telefone">Telefone</option>
                          <option value="evento">Evento</option>
                          <option value="marketing">Marketing</option>
                          <option value="outro">Outro</option>
                        </select>
                      ) : (
                        <p className="text-sm mt-1">{selectedLead.origem || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Contato</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Telefone Comercial</Label>
                      {isEditing ? (
                        <Input value={editData.telefone_comercial || ''} onChange={(e) => setEditData({...editData, telefone_comercial: e.target.value})} />
                      ) : (
                        <p className="text-sm mt-1">{selectedLead.telefone_comercial || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Telefone Celular</Label>
                      {isEditing ? (
                        <Input value={editData.telefone_celular || ''} onChange={(e) => setEditData({...editData, telefone_celular: e.target.value})} />
                      ) : (
                        <p className="text-sm mt-1">{selectedLead.telefone_celular || '-'}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Email</Label>
                      {isEditing ? (
                        <Input type="email" value={editData.email || ''} onChange={(e) => setEditData({...editData, email: e.target.value})} />
                      ) : (
                        <p className="text-sm mt-1">{selectedLead.email || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Localização */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Localização</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Cidade</Label>
                      {isEditing ? (
                        <Input value={editData.cidade || ''} onChange={(e) => setEditData({...editData, cidade: e.target.value})} />
                      ) : (
                        <p className="text-sm mt-1">{selectedLead.cidade || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Estado</Label>
                      {isEditing ? (
                        <Input value={editData.estado || ''} onChange={(e) => setEditData({...editData, estado: e.target.value})} placeholder="MG" />
                      ) : (
                        <p className="text-sm mt-1">{selectedLead.estado || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Informações Adicionais</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Cliente que Indicou</Label>
                      {isEditing ? (
                        <Input value={editData.cliente_que_indicou || ''} onChange={(e) => setEditData({...editData, cliente_que_indicou: e.target.value})} />
                      ) : (
                        <p className="text-sm mt-1">{selectedLead.cliente_que_indicou || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Status</Label>
                      {isEditing ? (
                        <select value={editData.razao_status} onChange={(e) => setEditData({...editData, razao_status: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                          <option value="pendente">Pendente</option>
                          <option value="novo">Novo</option>
                          <option value="contatado">Contatado</option>
                          <option value="qualificado">Qualificado</option>
                          <option value="desqualificado">Desqualificado</option>
                        </select>
                      ) : (
                        <p className="text-sm mt-1">{selectedLead.razao_status || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Observações</Label>
                      {isEditing ? (
                        <Textarea value={editData.observacoes || ''} onChange={(e) => setEditData({...editData, observacoes: e.target.value})} rows={3} />
                      ) : (
                        <p className="text-sm mt-1 text-slate-600">{selectedLead.observacoes || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ação Qualificar */}
                {selectedLead.razao_status !== 'qualificado' && (
                  <div className="pt-2 border-t">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => qualificarMutation.mutate(selectedLead)}
                      disabled={qualificarMutation.isPending}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Qualificar Lead
                    </Button>
                  </div>
                )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}