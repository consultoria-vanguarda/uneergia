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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Upload, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Search,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Filter,
  BarChart3
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BoletoCard from "@/components/financeiro/BoletoCard";
import ImportModal from "@/components/financeiro/ImportModal";
import StatusBadge from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState("boletos");
  const [isBoletoDialogOpen, setIsBoletoDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [periodoFilter, setPeriodoFilter] = useState("todos");
  const [boletoForm, setBoletoForm] = useState({
    cliente_id: "",
    valor: "",
    data_vencimento: "",
    referencia_mes: "",
    kwh_faturado: "",
    linha_digitavel: "",
  });

  const queryClient = useQueryClient();

  const { data: boletos = [], isLoading: loadingBoletos } = useQuery({
    queryKey: ['boletos'],
    queryFn: () => db.entities.Boleto.list('-created_date'),
  });

  const { data: transacoes = [], isLoading: loadingTransacoes } = useQuery({
    queryKey: ['transacoes'],
    queryFn: () => db.entities.Transacao.list('-data'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => db.entities.Cliente.list(),
  });

  const { data: contatos = [] } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => db.entities.Contato.list(),
  });

  // Combina clientes e contatos para o dropdown
  const clientesOptions = clientes.length > 0
    ? clientes.map(c => ({ id: c.id, nome: c.nome, tipo: 'cliente' }))
    : contatos.map(c => ({ id: c.id, nome: `${c.nome}${c.sobrenome ? ' ' + c.sobrenome : ''}`, tipo: 'contato' }));

  const createBoletoMutation = useMutation({
    mutationFn: (data) => db.entities.Boleto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      setIsBoletoDialogOpen(false);
      resetBoletoForm();
    },
  });

  const updateBoletoMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Boleto.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boletos'] }),
  });

  const resetBoletoForm = () => {
    setBoletoForm({
      cliente_id: "",
      valor: "",
      data_vencimento: "",
      referencia_mes: "",
      kwh_faturado: "",
      linha_digitavel: "",
    });
  };

  const handleCreateBoleto = (e) => {
    e.preventDefault();
    const clienteSelecionado = clientesOptions.find(c => c.id === boletoForm.cliente_id);
    createBoletoMutation.mutate({
      ...boletoForm,
      cliente_nome: clienteSelecionado?.nome,
      valor: parseFloat(boletoForm.valor) || 0,
      kwh_faturado: parseFloat(boletoForm.kwh_faturado) || 0,
      status: "pendente",
    });
  };

  const handleMarcarPago = (boleto) => {
    updateBoletoMutation.mutate({
      id: boleto.id,
      data: { 
        status: 'pago', 
        data_pagamento: new Date().toISOString().split('T')[0] 
      },
    });
  };

  const handleCancelar = (boleto) => {
    updateBoletoMutation.mutate({
      id: boleto.id,
      data: { status: 'cancelado' },
    });
  };

  // Cálculos financeiros
  const totalEntradas = transacoes
    .filter(t => t.tipo === 'entrada')
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const totalSaidas = transacoes
    .filter(t => t.tipo === 'saida')
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const saldo = totalEntradas - totalSaidas;

  const boletosPendentes = boletos.filter(b => b.status === 'pendente');
  const totalPendente = boletosPendentes.reduce((acc, b) => acc + (b.valor || 0), 0);

  // Filtros avançados
  const filteredBoletos = boletos.filter(b => {
    const matchSearch = b.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      b.numero_boleto?.includes(search);
    
    const isVencido = new Date(b.data_vencimento) < new Date() && b.status === 'pendente';
    const boletoStatus = isVencido ? 'vencido' : b.status;
    const matchStatus = statusFilter === "todos" || boletoStatus === statusFilter;
    
    let matchPeriodo = true;
    if (periodoFilter !== "todos") {
      const hoje = new Date();
      const vencimento = new Date(b.data_vencimento);
      
      if (periodoFilter === "hoje") {
        matchPeriodo = vencimento.toDateString() === hoje.toDateString();
      } else if (periodoFilter === "semana") {
        const umaSemana = new Date(hoje);
        umaSemana.setDate(hoje.getDate() + 7);
        matchPeriodo = vencimento >= hoje && vencimento <= umaSemana;
      } else if (periodoFilter === "mes") {
        matchPeriodo = vencimento.getMonth() === hoje.getMonth() && 
                      vencimento.getFullYear() === hoje.getFullYear();
      }
    }
    
    return matchSearch && matchStatus && matchPeriodo;
  });

  const filteredTransacoes = transacoes.filter(t =>
    t.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  // Dados para gráfico de fluxo de caixa
  const getFluxoCaixaMensal = () => {
    const meses = {};
    transacoes.forEach(t => {
      const mes = t.data ? format(new Date(t.data), "MMM/yy", { locale: ptBR }) : 'N/A';
      if (!meses[mes]) {
        meses[mes] = { mes, entradas: 0, saidas: 0 };
      }
      if (t.tipo === 'entrada') {
        meses[mes].entradas += t.valor || 0;
      } else {
        meses[mes].saidas += t.valor || 0;
      }
    });
    return Object.values(meses).slice(-6);
  };

  const chartData = getFluxoCaixaMensal();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-slate-500 mt-1">Gerencie boletos e transações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar OFX/CSV
          </Button>
          <Button onClick={() => setIsBoletoDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Boleto
          </Button>
        </div>
      </div>

      {/* Gráfico de Fluxo de Caixa */}
      {chartData.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Fluxo de Caixa (Últimos 6 Meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="entradas" fill="#10b981" name="Entradas" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="saidas" fill="#ef4444" name="Saídas" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Entradas</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Saídas</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Saldo</p>
                <p className={`text-2xl font-bold mt-1 ${saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">A Receber</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400 mt-1">{boletosPendentes.length} boletos</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <TabsList>
                  <TabsTrigger value="boletos">
                    Boletos <span className="ml-1 text-xs bg-slate-200 px-1.5 py-0.5 rounded-full">{filteredBoletos.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="transacoes">
                    Transações <span className="ml-1 text-xs bg-slate-200 px-1.5 py-0.5 rounded-full">{filteredTransacoes.length}</span>
                  </TabsTrigger>
                </TabsList>
                <div className="relative max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtros */}
              {activeTab === "boletos" && (
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-600">Filtros:</span>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>

                    </SelectContent>
                  </Select>
                  <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="hoje">Vence Hoje</SelectItem>
                      <SelectItem value="semana">Próximos 7 Dias</SelectItem>
                      <SelectItem value="mes">Este Mês</SelectItem>
                    </SelectContent>
                  </Select>
                  {(statusFilter !== "todos" || periodoFilter !== "todos") && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setStatusFilter("todos");
                        setPeriodoFilter("todos");
                      }}
                      className="text-xs"
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <TabsContent value="boletos" className="mt-0">
              {loadingBoletos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-xl" />
                  ))}
                </div>
              ) : filteredBoletos.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-medium text-slate-700">Nenhum boleto encontrado</h3>
                  <p className="text-sm text-slate-500 mt-1">Crie um novo boleto para começar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBoletos.map((boleto) => (
                    <BoletoCard
                      key={boleto.id}
                      boleto={boleto}
                      onMarcarPago={handleMarcarPago}
                      onCancelar={handleCancelar}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="transacoes" className="mt-0">
              {loadingTransacoes ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : filteredTransacoes.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-medium text-slate-700">Nenhuma transação encontrada</h3>
                  <p className="text-sm text-slate-500 mt-1">Importe um arquivo OFX ou CSV</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransacoes.map((transacao) => (
                    <div
                      key={transacao.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        transacao.tipo === 'entrada' ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        {transacao.tipo === 'entrada' ? (
                          <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {transacao.descricao || 'Transação'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <span>{transacao.data ? format(new Date(transacao.data), "dd/MM/yyyy") : '-'}</span>
                          {transacao.categoria && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{transacao.categoria.replace(/_/g, ' ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className={`font-bold ${
                        transacao.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {transacao.tipo === 'entrada' ? '+' : '-'} R$ {transacao.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Modal de novo boleto */}
      <Dialog open={isBoletoDialogOpen} onOpenChange={setIsBoletoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Boleto</DialogTitle>
            <DialogDescription>Preencha os dados do boleto abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBoleto} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente *</Label>
              <select
                id="cliente_id"
                value={boletoForm.cliente_id}
                onChange={(e) => setBoletoForm({ ...boletoForm, cliente_id: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                required
              >
                <option value="">Selecione um cliente</option>
                {clientesOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={boletoForm.valor}
                  onChange={(e) => setBoletoForm({ ...boletoForm, valor: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>kWh Faturado</Label>
                <Input
                  type="number"
                  value={boletoForm.kwh_faturado}
                  onChange={(e) => setBoletoForm({ ...boletoForm, kwh_faturado: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vencimento *</Label>
                <Input
                  type="date"
                  value={boletoForm.data_vencimento}
                  onChange={(e) => setBoletoForm({ ...boletoForm, data_vencimento: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Referência</Label>
                <Input
                  placeholder="Ex: 2024-01"
                  value={boletoForm.referencia_mes}
                  onChange={(e) => setBoletoForm({ ...boletoForm, referencia_mes: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Linha Digitável</Label>
              <Input
                value={boletoForm.linha_digitavel}
                onChange={(e) => setBoletoForm({ ...boletoForm, linha_digitavel: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBoletoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createBoletoMutation.isPending}
              >
                Criar Boleto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de importação */}
      <ImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['boletos'] });
          queryClient.invalidateQueries({ queryKey: ['transacoes'] });
        }}
        boletos={boletos}
      />
    </div>
  );
}