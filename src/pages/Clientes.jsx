const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, MoreHorizontal, Pencil, Trash2, Zap, Eye, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Clientes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [formData, setFormData] = useState({
    nome: "",
    cpf_cnpj: "",
    tipo_pessoa: "fisica",
    email: "",
    telefone: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    numero_instalacao: "",
    distribuidora: "",
    consumo_medio_kwh: "",
    usina_id: "",
    status_injecao: "pendente",
    status: "ativo",
    observacoes: "",
  });

  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => db.entities.Cliente.list(),
  });

  const { data: usinas = [] } = useQuery({
    queryKey: ['usinas'],
    queryFn: () => db.entities.Usina.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Cliente.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Cliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Cliente.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });

  const openDialog = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        nome: cliente.nome || "",
        cpf_cnpj: cliente.cpf_cnpj || "",
        tipo_pessoa: cliente.tipo_pessoa || "fisica",
        email: cliente.email || "",
        telefone: cliente.telefone || "",
        endereco: cliente.endereco || "",
        cidade: cliente.cidade || "",
        estado: cliente.estado || "",
        cep: cliente.cep || "",
        numero_instalacao: cliente.numero_instalacao || "",
        distribuidora: cliente.distribuidora || "",
        consumo_medio_kwh: cliente.consumo_medio_kwh || "",
        usina_id: cliente.usina_id || "",
        status_injecao: cliente.status_injecao || "pendente",
        status: cliente.status || "ativo",
        observacoes: cliente.observacoes || "",
      });
    } else {
      setEditingCliente(null);
      setFormData({
        nome: "",
        cpf_cnpj: "",
        tipo_pessoa: "fisica",
        email: "",
        telefone: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
        numero_instalacao: "",
        distribuidora: "",
        consumo_medio_kwh: "",
        usina_id: "",
        status_injecao: "pendente",
        status: "ativo",
        observacoes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCliente(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      consumo_medio_kwh: parseFloat(formData.consumo_medio_kwh) || 0,
      data_vinculacao: formData.usina_id ? new Date().toISOString().split('T')[0] : null,
    };

    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredClientes = clientes.filter(c => {
    const matchSearch = c.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf_cnpj?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === "todos" || c.status_injecao === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const getUsinaName = (usinaId) => {
    const usina = usinas.find(u => u.id === usinaId);
    return usina?.nome || "-";
  };

  const getStatusNaUsina = (cliente) => {
    if (!cliente.usina_id) {
      return { status: 'sem_usina', label: 'Sem usina vinculada', color: 'bg-slate-100 text-slate-600', icon: AlertCircle };
    }
    
    if (cliente.status_injecao === 'injetado') {
      return { status: 'na_base', label: 'Registrado na usina', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
    }
    
    if (cliente.status_injecao === 'em_analise') {
      return { status: 'pendente', label: 'Aguardando registro', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock };
    }
    
    return { status: 'nao_registrado', label: 'Não registrado na usina', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle };
  };

  const columns = [
    {
      header: "Cliente",
      cell: (row) => {
        const statusUsina = getStatusNaUsina(row);
        const StatusIcon = statusUsina.icon;
        
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                {row.nome?.charAt(0)?.toUpperCase()}
              </div>
              {row.usina_id && (
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${statusUsina.color} border-2 border-white flex items-center justify-center`}>
                  <StatusIcon className="w-3 h-3" />
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-slate-900">{row.nome}</p>
              <p className="text-sm text-slate-500">{row.cpf_cnpj}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Contato",
      cell: (row) => (
        <div>
          <p className="text-slate-900">{row.email}</p>
          <p className="text-sm text-slate-500">{row.telefone}</p>
        </div>
      ),
    },
    {
      header: "Distribuidora",
      accessor: "distribuidora",
    },
    {
      header: "Consumo",
      cell: (row) => (
        <span>{row.consumo_medio_kwh?.toLocaleString('pt-BR') || 0} kWh</span>
      ),
    },
    {
      header: "Usina",
      cell: (row) => getUsinaName(row.usina_id),
    },
    {
      header: "Status na Usina",
      cell: (row) => {
        const statusUsina = getStatusNaUsina(row);
        const StatusIcon = statusUsina.icon;
        
        return (
          <div className="flex flex-col gap-1">
            <StatusBadge status={row.status_injecao} />
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${statusUsina.color}`}>
              <StatusIcon className="w-3 h-3" />
              <span className="font-medium">{statusUsina.label}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openDialog(row)}>
              <Pencil className="w-4 h-4 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => deleteMutation.mutate(row.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const statusCounts = {
    todos: clientes.length,
    pendente: clientes.filter(c => c.status_injecao === 'pendente').length,
    em_analise: clientes.filter(c => c.status_injecao === 'em_analise').length,
    injetado: clientes.filter(c => c.status_injecao === 'injetado').length,
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1">Gerencie seus clientes e status de injeção</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      {/* Filtros por status de injeção */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="todos" className="gap-2">
              Todos <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">{statusCounts.todos}</span>
            </TabsTrigger>
            <TabsTrigger value="pendente" className="gap-2">
              Pendente <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{statusCounts.pendente}</span>
            </TabsTrigger>
            <TabsTrigger value="em_analise" className="gap-2">
              Em Análise <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{statusCounts.em_analise}</span>
            </TabsTrigger>
            <TabsTrigger value="injetado" className="gap-2">
              Injetado <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{statusCounts.injetado}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredClientes}
          isLoading={isLoading}
          emptyMessage="Nenhum cliente cadastrado"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Pessoa</Label>
                <Select
                  value={formData.tipo_pessoa}
                  onValueChange={(value) => setFormData({ ...formData, tipo_pessoa: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisica">Pessoa Física</SelectItem>
                    <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{formData.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'} *</Label>
                <Input
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium text-slate-900 mb-4">Endereço</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium text-slate-900 mb-4">Dados de Energia</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Distribuidora *</Label>
                  <Input
                    value={formData.distribuidora}
                    onChange={(e) => setFormData({ ...formData, distribuidora: e.target.value })}
                    placeholder="Ex: CEMIG, CPFL, ENEL"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nº Instalação</Label>
                  <Input
                    value={formData.numero_instalacao}
                    onChange={(e) => setFormData({ ...formData, numero_instalacao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Consumo Médio (kWh)</Label>
                  <Input
                    type="number"
                    value={formData.consumo_medio_kwh}
                    onChange={(e) => setFormData({ ...formData, consumo_medio_kwh: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Usina Vinculada</Label>
                  <Select
                    value={formData.usina_id}
                    onValueChange={(value) => setFormData({ ...formData, usina_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma usina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhuma</SelectItem>
                      {usinas.filter(u => u.status === 'ativa').map(usina => (
                        <SelectItem key={usina.id} value={usina.id}>
                          {usina.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status de Injeção</Label>
                  <Select
                    value={formData.status_injecao}
                    onValueChange={(value) => setFormData({ ...formData, status_injecao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="injetado">Injetado</SelectItem>
                      <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status do Cliente</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingCliente ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}