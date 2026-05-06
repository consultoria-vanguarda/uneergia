const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Building2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

export default function Usinas() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsina, setEditingUsina] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    distribuidoras: [],
    estados: [],
    preco_kwh: "",
    desconto_percentual: "",
    isencao_tributaria: false,
    incentivo_fiscal_percentual: "",
    tipo_comissao: "",
    comissao_percentual: "",
    comissao_valor_fixo: "",
    capacidade_disponivel_kwh: "",
    contato_nome: "",
    contato_email: "",
    contato_telefone: "",
    api_endpoint: "",
    api_key: "",
    observacoes: "",
    status: "ativa",
  });

  const queryClient = useQueryClient();

  const { data: usinas = [], isLoading } = useQuery({
    queryKey: ['usinas'],
    queryFn: () => db.entities.Usina.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Usina.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usinas'] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Usina.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usinas'] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Usina.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usinas'] }),
  });

  const openDialog = (usina = null) => {
    if (usina) {
      setEditingUsina(usina);
      setFormData({
        nome: usina.nome || "",
        cnpj: usina.cnpj || "",
        distribuidoras: usina.distribuidoras || [],
        estados: usina.estados || [],
        preco_kwh: usina.preco_kwh || "",
        desconto_percentual: usina.desconto_percentual || "",
        isencao_tributaria: usina.isencao_tributaria || false,
        incentivo_fiscal_percentual: usina.incentivo_fiscal_percentual || "",
        tipo_comissao: usina.tipo_comissao || "",
        comissao_percentual: usina.comissao_percentual || "",
        comissao_valor_fixo: usina.comissao_valor_fixo || "",
        capacidade_disponivel_kwh: usina.capacidade_disponivel_kwh || "",
        contato_nome: usina.contato_nome || "",
        contato_email: usina.contato_email || "",
        contato_telefone: usina.contato_telefone || "",
        api_endpoint: usina.api_endpoint || "",
        api_key: usina.api_key || "",
        observacoes: usina.observacoes || "",
        status: usina.status || "ativa",
      });
    } else {
      setEditingUsina(null);
      setFormData({
        nome: "",
        cnpj: "",
        distribuidoras: [],
        estados: [],
        preco_kwh: "",
        desconto_percentual: "",
        isencao_tributaria: false,
        incentivo_fiscal_percentual: "",
        tipo_comissao: "",
        comissao_percentual: "",
        comissao_valor_fixo: "",
        capacidade_disponivel_kwh: "",
        contato_nome: "",
        contato_email: "",
        contato_telefone: "",
        api_endpoint: "",
        api_key: "",
        observacoes: "",
        status: "ativa",
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingUsina(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      preco_kwh: parseFloat(formData.preco_kwh) || 0,
      desconto_percentual: parseFloat(formData.desconto_percentual) || 0,
      incentivo_fiscal_percentual: parseFloat(formData.incentivo_fiscal_percentual) || 0,
      comissao_percentual: parseFloat(formData.comissao_percentual) || 0,
      comissao_valor_fixo: parseFloat(formData.comissao_valor_fixo) || 0,
      capacidade_disponivel_kwh: parseFloat(formData.capacidade_disponivel_kwh) || 0,
    };

    if (editingUsina) {
      updateMutation.mutate({ id: editingUsina.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredUsinas = usinas.filter(u => 
    u.nome?.toLowerCase().includes(search.toLowerCase()) ||
    u.distribuidoras?.some(d => d.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    {
      header: "Usina",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.nome}</p>
            <p className="text-sm text-slate-500">{row.cnpj}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Distribuidoras",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.distribuidoras?.map((dist, i) => (
            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
              {dist}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Preço/kWh",
      cell: (row) => (
        <span className="font-medium text-slate-900">
          R$ {row.preco_kwh?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      header: "Desconto",
      cell: (row) => (
        <span className="text-emerald-600 font-medium">
          {row.desconto_percentual || 0}%
        </span>
      ),
    },
    {
      header: "Capacidade",
      cell: (row) => (
        <span>{row.capacidade_disponivel_kwh?.toLocaleString('pt-BR') || 0} kWh</span>
      ),
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

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usinas</h1>
          <p className="text-slate-500 mt-1">Gerencie suas usinas parceiras</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Nova Usina
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar usinas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredUsinas}
          isLoading={isLoading}
          emptyMessage="Nenhuma usina cadastrada"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUsina ? "Editar Usina" : "Nova Usina"}
            </DialogTitle>
            <DialogDescription>Preencha os dados da usina abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Usina *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Distribuidoras *</Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.distribuidoras.map((dist, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-center gap-2"
                      >
                        {dist}
                        <button
                          type="button"
                          onClick={() => {
                            const newDist = formData.distribuidoras.filter((_, i) => i !== index);
                            setFormData({ ...formData, distribuidoras: newDist });
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && !formData.distribuidoras.includes(value)) {
                        setFormData({ ...formData, distribuidoras: [...formData.distribuidoras, value] });
                      }
                      e.target.value = "";
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Adicionar distribuidora</option>
                    <option value="CEMIG">CEMIG</option>
                    <option value="CPFL">CPFL</option>
                    <option value="ENEL">ENEL</option>
                    <option value="Light">Light</option>
                    <option value="EDP">EDP</option>
                    <option value="Energisa">Energisa</option>
                    <option value="Copel">Copel</option>
                    <option value="Celesc">Celesc</option>
                    <option value="RGE">RGE</option>
                    <option value="Coelba">Coelba</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                  <option value="em_negociacao">Em Negociação</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Preço por kWh (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.preco_kwh}
                  onChange={(e) => setFormData({ ...formData, preco_kwh: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Estados *</Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.estados.map((estado, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-lg flex items-center gap-2"
                      >
                        {estado}
                        <button
                          type="button"
                          onClick={() => {
                            const newEstados = formData.estados.filter((_, i) => i !== index);
                            setFormData({ ...formData, estados: newEstados });
                          }}
                          className="text-emerald-600 hover:text-emerald-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && !formData.estados.includes(value)) {
                        setFormData({ ...formData, estados: [...formData.estados, value] });
                      }
                      e.target.value = "";
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Adicionar estado</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="BA">Bahia</option>
                    <option value="PR">Paraná</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="GO">Goiás</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Desconto (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.desconto_percentual}
                  onChange={(e) => setFormData({ ...formData, desconto_percentual: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Capacidade Disponível (kWh)</Label>
                <Input
                  type="number"
                  value={formData.capacidade_disponivel_kwh}
                  onChange={(e) => setFormData({ ...formData, capacidade_disponivel_kwh: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium text-slate-900 mb-4">Benefícios Fiscais e Comissão</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isencao"
                      checked={formData.isencao_tributaria}
                      onChange={(e) => setFormData({ ...formData, isencao_tributaria: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 cursor-pointer"
                    />
                    <Label htmlFor="isencao" className="cursor-pointer">
                      Possui Isenção Tributária (ICMS)
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Incentivo Fiscal Estadual (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.incentivo_fiscal_percentual}
                    onChange={(e) => setFormData({ ...formData, incentivo_fiscal_percentual: e.target.value })}
                    placeholder="Ex: 5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Comissão</Label>
                  <select value={formData.tipo_comissao} onChange={(e) => setFormData({ ...formData, tipo_comissao: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                    <option value="">Selecione</option>
                    <option value="desconto_conta">Desconto na Conta</option>
                    <option value="transferencia">Transferência/Dinheiro</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Comissão (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.comissao_percentual}
                    onChange={(e) => setFormData({ ...formData, comissao_percentual: e.target.value })}
                    placeholder="Ex: 10"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Comissão Fixa (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.comissao_valor_fixo}
                    onChange={(e) => setFormData({ ...formData, comissao_valor_fixo: e.target.value })}
                    placeholder="Valor fixo por kWh ou mensal"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium text-slate-900 mb-4">Observações</h4>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre a usina, condições especiais, etc."
                rows={3}
              />
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium text-slate-900 mb-4">Contato</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.contato_nome}
                    onChange={(e) => setFormData({ ...formData, contato_nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.contato_email}
                    onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.contato_telefone}
                    onChange={(e) => setFormData({ ...formData, contato_telefone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium text-slate-900 mb-4">Integração API</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Endpoint da API</Label>
                  <Input
                    value={formData.api_endpoint}
                    onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                    placeholder="https://api.usina.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  />
                </div>
              </div>
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
                {editingUsina ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}