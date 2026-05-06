const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Zap, Building2, MapPin } from "lucide-react";
import DataGrid from "@/components/crm/DataGrid";
import CommandBar from "@/components/crm/CommandBar";

export default function UnidadesConsumidoras() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    numero_uc: "",
    cliente_id: "",
    concessionaria: "",
    tipo_tarifa: "b1_convencional",
    disponibilidade: "monofasico",
    subclasse: "residencial",
    portabilidade: "nao",
    possui_outro_sge: "nao",
    consumo_medio_kwh: "",
    valor_conta_media: "",
    logradouro: "",
    numero: "",
    cidade: "",
    estado: "",
    cep: ""
  });

  const queryClient = useQueryClient();

  const { data: ucs = [], isLoading, refetch } = useQuery({
    queryKey: ['unidades_consumidoras'],
    queryFn: () => db.entities.UnidadeConsumidora.list('-created_date', 200),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => db.entities.Contato.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.UnidadeConsumidora.create({
      ...data,
      cliente_nome: clientes.find(c => c.id === data.cliente_id)?.nome,
      data_criacao: new Date().toISOString().split('T')[0],
      status: "criada"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades_consumidoras'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      numero_uc: "",
      cliente_id: "",
      concessionaria: "",
      tipo_tarifa: "b1_convencional",
      disponibilidade: "monofasico",
      subclasse: "residencial",
      portabilidade: "nao",
      possui_outro_sge: "nao",
      consumo_medio_kwh: "",
      valor_conta_media: "",
      logradouro: "",
      numero: "",
      cidade: "",
      estado: "",
      cep: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredUCs = ucs.filter(uc =>
    uc.numero_uc?.includes(search) ||
    uc.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
    uc.concessionaria?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    criada: "bg-blue-100 text-blue-700 border-blue-200",
    ativa: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pendente_aprovacao: "bg-amber-100 text-amber-700 border-amber-200",
    inativa: "bg-slate-100 text-slate-700 border-slate-200"
  };

  const columns = [
    {
      header: "Número UC",
      key: "numero_uc",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.numero_uc}</p>
            <p className="text-xs text-slate-500">{row.concessionaria}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Cliente",
      key: "cliente_nome",
      cell: (row) => row.cliente_nome || '-',
    },
    {
      header: "Consumo Médio",
      key: "consumo_medio_kwh",
      cell: (row) => row.consumo_medio_kwh ? `${row.consumo_medio_kwh} kWh` : '-',
    },
    {
      header: "Subclasse",
      key: "subclasse",
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.subclasse}
        </Badge>
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
      key: "status",
      cell: (row) => (
        <Badge variant="outline" className={statusColors[row.status]}>
          {row.status?.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f2f1]">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#323130]">Unidades Consumidoras</h1>
            <p className="text-sm text-[#605e5c] mt-1">Gestão de unidades consumidoras</p>
          </div>
          <div className="relative w-80">
            <Input
              placeholder="Pesquisar UCs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      <CommandBar onNew={() => setIsDialogOpen(true)} onRefresh={refetch} />

      <div className="p-6">
        <DataGrid columns={columns} data={filteredUCs} isLoading={isLoading} />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Unidade Consumidora</DialogTitle>
            <DialogDescription>Preencha os dados da unidade consumidora abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Número da UC *</Label>
                <Input
                  value={formData.numero_uc}
                  onChange={(e) => setFormData({...formData, numero_uc: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Cliente *</Label>
                <select value={formData.cliente_id} onChange={(e) => setFormData({...formData, cliente_id: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="">Selecione...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <Label>Concessionária *</Label>
                <Input
                  value={formData.concessionaria}
                  onChange={(e) => setFormData({...formData, concessionaria: e.target.value})}
                  placeholder="Ex: CEMIG"
                  required
                />
              </div>
              <div>
                <Label>Tipo de Tarifa</Label>
                <select value={formData.tipo_tarifa} onChange={(e) => setFormData({...formData, tipo_tarifa: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="b1_convencional">B1 Convencional</option>
                  <option value="b1_branca">B1 Branca</option>
                  <option value="b3_comercial">B3 Comercial</option>
                  <option value="a4_industrial">A4 Industrial</option>
                </select>
              </div>
              <div>
                <Label>Disponibilidade</Label>
                <select value={formData.disponibilidade} onChange={(e) => setFormData({...formData, disponibilidade: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="monofasico">Monofásico</option>
                  <option value="bifasico">Bifásico</option>
                  <option value="trifasico">Trifásico</option>
                </select>
              </div>
              <div>
                <Label>Subclasse</Label>
                <select value={formData.subclasse} onChange={(e) => setFormData({...formData, subclasse: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="residencial">Residencial</option>
                  <option value="comercial">Comercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="rural">Rural</option>
                  <option value="publico">Público</option>
                </select>
              </div>
              <div>
                <Label>Consumo Médio (kWh)</Label>
                <Input
                  type="number"
                  value={formData.consumo_medio_kwh}
                  onChange={(e) => setFormData({...formData, consumo_medio_kwh: e.target.value})}
                />
              </div>
              <div>
                <Label>Valor Conta Média (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_conta_media}
                  onChange={(e) => setFormData({...formData, valor_conta_media: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label>Logradouro</Label>
                <Input
                  value={formData.logradouro}
                  onChange={(e) => setFormData({...formData, logradouro: e.target.value})}
                />
              </div>
              <div>
                <Label>Número</Label>
                <Input
                  value={formData.numero}
                  onChange={(e) => setFormData({...formData, numero: e.target.value})}
                />
              </div>
              <div>
                <Label>CEP</Label>
                <Input
                  value={formData.cep}
                  onChange={(e) => setFormData({...formData, cep: e.target.value})}
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
                <Label>Estado</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  placeholder="MG"
                  maxLength={2}
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