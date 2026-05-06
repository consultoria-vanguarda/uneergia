const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Target, DollarSign, TrendingUp, Calendar, Zap } from "lucide-react";
import DataGrid from "@/components/crm/DataGrid";
import CommandBar from "@/components/crm/CommandBar";

export default function Oportunidades() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    titulo: "",
    contato_id: "",
    consumo_kwh: "",
    economia_estimada_percentual: "15",
    economia_estimada_reais: "",
    valor_proposta_mensal: "",
    usina_parceira: "",
    probabilidade: "50",
    estagio: "qualificacao",
    data_inicio_injecao: ""
  });

  const queryClient = useQueryClient();

  const { data: oportunidades = [], isLoading, refetch } = useQuery({
    queryKey: ['oportunidades'],
    queryFn: () => db.entities.Oportunidade.list('-created_date', 200),
  });

  const { data: contatos = [] } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => db.entities.Contato.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const contato = contatos.find(c => c.id === data.contato_id);
      return db.entities.Oportunidade.create({
        ...data,
        contato_nome: contato ? `${contato.nome} ${contato.sobrenome || ''}` : ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oportunidades'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      titulo: "",
      contato_id: "",
      consumo_kwh: "",
      economia_estimada_percentual: "15",
      economia_estimada_reais: "",
      valor_proposta_mensal: "",
      usina_parceira: "",
      probabilidade: "50",
      estagio: "qualificacao",
      data_inicio_injecao: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      consumo_kwh: parseFloat(formData.consumo_kwh) || 0,
      economia_estimada_percentual: parseFloat(formData.economia_estimada_percentual) || 0,
      economia_estimada_reais: parseFloat(formData.economia_estimada_reais) || 0,
      valor_proposta_mensal: parseFloat(formData.valor_proposta_mensal) || 0,
      probabilidade: parseInt(formData.probabilidade)
    });
  };

  const filteredOportunidades = oportunidades.filter(o =>
    o.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    o.contato_nome?.toLowerCase().includes(search.toLowerCase())
  );

  const estagioColors = {
    qualificacao: "bg-blue-100 text-blue-700 border-blue-200",
    analise_consumo: "bg-cyan-100 text-cyan-700 border-cyan-200",
    proposta_enviada: "bg-purple-100 text-purple-700 border-purple-200",
    negociacao: "bg-amber-100 text-amber-700 border-amber-200",
    documentacao: "bg-orange-100 text-orange-700 border-orange-200",
    ganho: "bg-emerald-100 text-emerald-700 border-emerald-200",
    perdido: "bg-red-100 text-red-700 border-red-200"
  };

  const estagioLabels = {
    qualificacao: "Qualificação",
    analise_consumo: "Análise de Consumo",
    proposta_enviada: "Proposta Enviada",
    negociacao: "Negociação",
    documentacao: "Documentação",
    ganho: "Ganho",
    perdido: "Perdido"
  };

  const columns = [
    {
      header: "Oportunidade",
      key: "titulo",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.titulo}</p>
            <p className="text-xs text-slate-500">{row.contato_nome}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Estágio",
      key: "estagio",
      cell: (row) => (
        <Badge variant="outline" className={estagioColors[row.estagio]}>
          {estagioLabels[row.estagio] || row.estagio}
        </Badge>
      ),
    },
    {
      header: "Consumo (kWh)",
      key: "consumo_kwh",
      cell: (row) => (
        <span className="text-slate-700">{row.consumo_kwh || '-'} kWh</span>
      ),
    },
    {
      header: "Economia Mensal",
      key: "economia_estimada_reais",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-emerald-700">
            R$ {(row.economia_estimada_reais || 0).toLocaleString('pt-BR')}
          </span>
        </div>
      ),
    },
    {
      header: "Valor Proposta",
      key: "valor_proposta_mensal",
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-slate-900">
          R$ {(row.valor_proposta_mensal || 0).toLocaleString('pt-BR')}/mês
        </span>
      ),
    },
    {
      header: "Probabilidade",
      key: "probabilidade",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[100px]">
            <div 
              className="bg-emerald-500 h-2 rounded-full"
              style={{ width: `${row.probabilidade || 0}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-slate-700">{row.probabilidade || 0}%</span>
        </div>
      ),
    },
    {
      header: "Início Injeção",
      key: "data_inicio_injecao",
      cell: (row) => (
        row.data_inicio_injecao ? (
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            {new Date(row.data_inicio_injecao).toLocaleDateString('pt-BR')}
          </div>
        ) : '-'
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f2f1]">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#323130]">Oportunidades</h1>
            <p className="text-sm text-[#605e5c] mt-1">
              Gestão do pipeline de vendas
            </p>
          </div>
          <div className="relative w-80">
            <Input
              placeholder="Pesquisar oportunidades..."
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
          data={filteredOportunidades}
          isLoading={isLoading}
        />
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Oportunidade</DialogTitle>
            <DialogDescription>Preencha os dados da oportunidade abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label>Título *</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Ex: Proposta Economia Solar - Cliente X"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Cliente *</Label>
                <select required value={formData.contato_id} onChange={(e) => setFormData({...formData, contato_id: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="">Selecione um cliente</option>
                  {contatos.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} {c.sobrenome} {c.distribuidora ? `- ${c.distribuidora}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Consumo (kWh/mês)</Label>
                <Input
                  type="number"
                  value={formData.consumo_kwh}
                  onChange={(e) => setFormData({...formData, consumo_kwh: e.target.value})}
                  placeholder="300"
                />
              </div>
              <div>
                <Label>Usina Parceira</Label>
                <Input
                  value={formData.usina_parceira}
                  onChange={(e) => setFormData({...formData, usina_parceira: e.target.value})}
                  placeholder="Ex: Solar Energy Brasil"
                />
              </div>
              <div>
                <Label>Economia (%) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.economia_estimada_percentual}
                  onChange={(e) => setFormData({...formData, economia_estimada_percentual: e.target.value})}
                  placeholder="15"
                />
              </div>
              <div>
                <Label>Economia Mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.economia_estimada_reais}
                  onChange={(e) => setFormData({...formData, economia_estimada_reais: e.target.value})}
                  placeholder="120.00"
                />
              </div>
              <div>
                <Label>Valor Proposta Mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_proposta_mensal}
                  onChange={(e) => setFormData({...formData, valor_proposta_mensal: e.target.value})}
                  placeholder="350.00"
                />
              </div>
              <div>
                <Label>Probabilidade (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probabilidade}
                  onChange={(e) => setFormData({...formData, probabilidade: e.target.value})}
                />
              </div>
              <div>
                <Label>Estágio</Label>
                <select value={formData.estagio} onChange={(e) => setFormData({...formData, estagio: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="qualificacao">Qualificação</option>
                  <option value="analise_consumo">Análise de Consumo</option>
                  <option value="proposta_enviada">Proposta Enviada</option>
                  <option value="negociacao">Negociação</option>
                  <option value="documentacao">Documentação</option>
                  <option value="ganho">Ganho</option>
                  <option value="perdido">Perdido</option>
                </select>
              </div>
              <div>
                <Label>Início da Injeção</Label>
                <Input
                  type="date"
                  value={formData.data_inicio_injecao}
                  onChange={(e) => setFormData({...formData, data_inicio_injecao: e.target.value})}
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
    </div>
  );
}