const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Users, Target, DollarSign, FileText, FileCheck, Zap,
  TrendingUp, Building2, Activity, UserPlus, BarChart3, Award
} from "lucide-react";

const COLORS = ['#10b981', '#0f6cbd', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) + '%' : '0%';

function KPICard({ icon: Icon, label, value, sub, color = "blue" }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-teal-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-orange-500",
    red: "from-red-500 to-red-600",
  };
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Relatorios() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: leads = [] } = useQuery({ queryKey: ['leads'], queryFn: () => db.entities.Lead.list() });
  const { data: contatos = [] } = useQuery({ queryKey: ['contatos'], queryFn: () => db.entities.Contato.list() });
  const { data: oportunidades = [] } = useQuery({ queryKey: ['oportunidades'], queryFn: () => db.entities.Oportunidade.list() });
  const { data: propostas = [] } = useQuery({ queryKey: ['propostas'], queryFn: () => db.entities.Proposta.list() });
  const { data: contratos = [] } = useQuery({ queryKey: ['contratos'], queryFn: () => db.entities.Contrato.list() });
  const { data: usinas = [] } = useQuery({ queryKey: ['usinas'], queryFn: () => db.entities.Usina.list() });
  const { data: ucs = [] } = useQuery({ queryKey: ['unidades_consumidoras'], queryFn: () => db.entities.UnidadeConsumidora.list() });
  const { data: atividades = [] } = useQuery({ queryKey: ['atividades'], queryFn: () => db.entities.Atividade.list() });
  const { data: boletos = [] } = useQuery({ queryKey: ['boletos'], queryFn: () => db.entities.Boleto.list() });

  // Filtro de data para contratos
  const contratosFiltrados = contratos.filter(c => {
    const d = c.data_inicio || c.created_date;
    if (!d) return true;
    const dt = new Date(d);
    if (dateFrom && dt < new Date(dateFrom)) return false;
    if (dateTo && dt > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  // Filtro de data para boletos
  const boletosFiltrados = boletos.filter(b => {
    const d = b.data_vencimento || b.created_date;
    if (!d) return true;
    const dt = new Date(d);
    if (dateFrom && dt < new Date(dateFrom)) return false;
    if (dateTo && dt > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  // === Comissões ===
  // Calcula comissão por contrato: usa usina vinculada via proposta
  const contratosComComissao = contratosFiltrados.map(c => {
    const proposta = propostas.find(p => p.id === c.proposta_id);
    const usina = usinas.find(u => u.nome === proposta?.parceiro_une_energia);
    const valorMensal = c.valor_plano_contrato || 0;
    const comissaoPct = usina?.comissao_percentual || 0;
    const comissaoMensal = (valorMensal * comissaoPct) / 100;
    const comissaoAnual = comissaoMensal * (c.duracao_meses || 12);
    const vendedor = c.proprietario || proposta?.proprietario || contatos.find(ct => ct.id === c.cliente_id)?.proprietario || '-';
    return {
      ...c,
      proposta,
      usina,
      comissaoPct,
      comissaoMensal,
      comissaoAnual,
      vendedor,
      cliente_nome: c.cliente_nome || '-',
      usinaStr: usina?.nome || proposta?.parceiro_une_energia || '-'
    };
  });

  // Comissão total
  const comissaoTotal = contratosComComissao.reduce((s, c) => s + c.comissaoAnual, 0);
  const comissaoMensalTotal = contratosComComissao.reduce((s, c) => s + c.comissaoMensal, 0);

  // Comissão por vendedor
  const comissaoPorVendedor = Object.entries(
    contratosComComissao.reduce((acc, c) => {
      const v = c.vendedor || '-';
      if (!acc[v]) acc[v] = { contratos: 0, comissaoMensal: 0, comissaoAnual: 0 };
      acc[v].contratos++;
      acc[v].comissaoMensal += c.comissaoMensal;
      acc[v].comissaoAnual += c.comissaoAnual;
      return acc;
    }, {})
  ).map(([vendedor, d]) => ({ vendedor, ...d })).sort((a, b) => b.comissaoAnual - a.comissaoAnual);

  // === CRUZAMENTOS ===
  const funnelData = [
    { name: "Leads", value: leads.length, fill: "#64748b" },
    { name: "Contatos", value: contatos.length, fill: "#0f6cbd" },
    { name: "Oportunidades", value: oportunidades.length, fill: "#8b5cf6" },
    { name: "Propostas", value: propostas.length, fill: "#f59e0b" },
    { name: "Contratos", value: contratos.length, fill: "#10b981" },
  ];

  const leadsPorOrigem = Object.entries(
    leads.reduce((acc, l) => { acc[l.origem || 'outro'] = (acc[l.origem || 'outro'] || 0) + 1; return acc; }, {})
  ).map(([origem, total]) => ({ origem, total }));

  const leadsPorStatus = Object.entries(
    leads.reduce((acc, l) => { acc[l.razao_status || 'novo'] = (acc[l.razao_status || 'novo'] || 0) + 1; return acc; }, {})
  ).map(([status, total]) => ({ status, total }));

  const contatosPorTipo = Object.entries(
    contatos.reduce((acc, c) => { acc[c.tipo || 'lead'] = (acc[c.tipo || 'lead'] || 0) + 1; return acc; }, {})
  ).map(([tipo, total]) => ({ tipo, total }));

  const opsPorEstagio = Object.entries(
    oportunidades.reduce((acc, o) => {
      const e = o.estagio || 'qualificacao';
      if (!acc[e]) acc[e] = { count: 0, valor: 0 };
      acc[e].count++;
      acc[e].valor += o.valor_proposta_mensal || 0;
      return acc;
    }, {})
  ).map(([estagio, d]) => ({ estagio, quantidade: d.count, valor_mensal: d.valor }));

  const contratosPorStatus = Object.entries(
    contratos.reduce((acc, c) => { acc[c.razao_status || 'aguardando_aprovacao'] = (acc[c.razao_status || 'aguardando_aprovacao'] || 0) + 1; return acc; }, {})
  ).map(([status, total]) => ({ status, total }));

  const contratosPorCredito = Object.entries(
    contratos.reduce((acc, c) => { acc[c.resultado_analise_credito || 'pendente'] = (acc[c.resultado_analise_credito || 'pendente'] || 0) + 1; return acc; }, {})
  ).map(([resultado, total]) => ({ resultado, total }));

  const propostasPorStatus = Object.entries(
    propostas.reduce((acc, p) => { acc[p.razao_status || 'valida'] = (acc[p.razao_status || 'valida'] || 0) + 1; return acc; }, {})
  ).map(([status, total]) => ({ status, total }));

  const ucsPorConcess = Object.entries(
    ucs.reduce((acc, u) => { acc[u.concessionaria || 'Outros'] = (acc[u.concessionaria || 'Outros'] || 0) + 1; return acc; }, {})
  ).map(([concessionaria, total]) => ({ concessionaria, total }));

  const ucsPorSubclasse = Object.entries(
    ucs.reduce((acc, u) => { acc[u.subclasse || 'residencial'] = (acc[u.subclasse || 'residencial'] || 0) + 1; return acc; }, {})
  ).map(([subclasse, total]) => ({ subclasse, total }));

  const usinasPorProposta = usinas.map(u => ({
    usina: u.nome,
    propostas: propostas.filter(p => p.parceiro_une_energia === u.nome).length,
    contratos: contratos.filter(c => {
      const prop = propostas.find(p => p.id === c.proposta_id);
      return prop?.parceiro_une_energia === u.nome;
    }).length,
    capacidade: u.capacidade_disponivel_kwh || 0,
    desconto: u.desconto_percentual || 0,
  })).filter(u => u.propostas > 0 || u.contratos > 0);

  const atividadesPorTipo = Object.entries(
    atividades.reduce((acc, a) => { acc[a.tipo || 'nota'] = (acc[a.tipo || 'nota'] || 0) + 1; return acc; }, {})
  ).map(([tipo, total]) => ({ tipo, total }));

  const boletosPagos = boletos.filter(b => b.status === 'pago');
  const boletosVencidos = boletos.filter(b => b.status === 'vencido');
  const boletosPendentes = boletos.filter(b => b.status === 'pendente');
  const receitaTotal = boletosPagos.reduce((s, b) => s + (b.valor || 0), 0);
  const inadimplencia = boletosVencidos.reduce((s, b) => s + (b.valor || 0), 0);

  const boletosPorStatus = [
    { status: 'pago', total: boletosPagos.length, valor: receitaTotal },
    { status: 'pendente', total: boletosPendentes.length, valor: boletosPendentes.reduce((s,b) => s+(b.valor||0), 0) },
    { status: 'vencido', total: boletosVencidos.length, valor: inadimplencia },
  ];

  const mrr = contratos.filter(c => c.razao_status === 'ativo').reduce((s, c) => s + (c.valor_plano_contrato || 0), 0);
  const opsAbertas = oportunidades.filter(o => !['ganho','perdido'].includes(o.estagio)).length;
  const taxaConversaoLeadContato = pct(contatos.length, leads.length + contatos.length);

  // Filtro de data UI
  const FiltroData = () => (
    <div className="flex gap-4 items-end mb-6 bg-white rounded-lg border border-slate-200 p-4">
      <div>
        <Label className="text-xs">Data início</Label>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-sm w-44" />
      </div>
      <div>
        <Label className="text-xs">Data fim</Label>
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-sm w-44" />
      </div>
      {(dateFrom || dateTo) && (
        <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-red-500 hover:underline pb-1">
          Limpar filtro
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f2f1]">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-emerald-600" />
          <div>
            <h1 className="text-xl font-semibold text-[#323130]">Relatórios</h1>
            <p className="text-sm text-[#605e5c] mt-0.5">Visão cruzada de todos os módulos do sistema</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="geral">
          <TabsList className="mb-6 bg-white border border-slate-200 p-1 rounded-lg h-auto flex-wrap gap-1">
            <TabsTrigger value="geral" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded text-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="funil" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded text-sm">Funil de Vendas</TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded text-sm">Leads</TabsTrigger>
            <TabsTrigger value="propostas" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded text-sm">Propostas & Contratos</TabsTrigger>
            <TabsTrigger value="usinas" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded text-sm">Usinas & UCs</TabsTrigger>
            <TabsTrigger value="financeiro" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded text-sm">Financeiro</TabsTrigger>
            <TabsTrigger value="comissoes" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded text-sm">Comissões</TabsTrigger>
            <TabsTrigger value="atividades" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded text-sm">Atividades</TabsTrigger>
          </TabsList>

          {/* === ABA GERAL === */}
          <TabsContent value="geral" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={UserPlus} label="Total de Leads" value={leads.length} sub={`${leadsPorStatus.find(l=>l.status==='qualificado')?.total || 0} qualificados`} color="blue" />
              <KPICard icon={Users} label="Contatos" value={contatos.length} sub={`Taxa de conversão: ${taxaConversaoLeadContato}`} color="purple" />
              <KPICard icon={Target} label="Oportunidades Abertas" value={opsAbertas} sub={`${oportunidades.filter(o=>o.estagio==='ganho').length} ganhas`} color="amber" />
              <KPICard icon={DollarSign} label="MRR (Contratos Ativos)" value={fmt(mrr)} sub={`${contratos.filter(c=>c.razao_status==='ativo').length} contratos`} color="green" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={FileText} label="Propostas" value={propostas.length} sub={`${propostas.filter(p=>p.razao_status==='aprovada').length} aprovadas`} color="blue" />
              <KPICard icon={FileCheck} label="Contratos" value={contratos.length} sub={`${contratos.filter(c=>c.razao_status==='ativo').length} ativos`} color="green" />
              <KPICard icon={Zap} label="UCs Cadastradas" value={ucs.length} sub={`${ucs.filter(u=>u.status==='ativa').length} ativas`} color="amber" />
              <KPICard icon={Building2} label="Usinas Parceiras" value={usinas.length} sub={`${usinas.filter(u=>u.status==='ativa').length} ativas`} color="purple" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Funil: Lead → Contrato</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {funnelData.map((item, i) => {
                      const max = funnelData[0].value || 1;
                      const width = Math.max((item.value / max) * 100, 2);
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600 font-medium">{item.name}</span>
                            <span className="text-slate-900 font-bold">{item.value}</span>
                          </div>
                          <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full flex items-center px-2" style={{ width: `${width}%`, backgroundColor: item.fill }}>
                              {item.value > 0 && <span className="text-white text-xs font-semibold">{i > 0 ? pct(item.value, funnelData[i-1].value) : '100%'}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Oportunidades por Estágio</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={opsPorEstagio} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" fontSize={10} />
                        <YAxis dataKey="estagio" type="category" fontSize={9} width={90} />
                        <Tooltip />
                        <Bar dataKey="quantidade" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === ABA FUNIL === */}
          <TabsContent value="funil" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Volume por Etapa do Funil</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {funnelData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Taxa de Conversão</CardTitle></CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {funnelData.slice(1).map((item, i) => {
                    const prev = funnelData[i];
                    const taxa = prev.value > 0 ? ((item.value / prev.value) * 100).toFixed(0) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">{prev.name} → {item.name}</span>
                          <span className="font-bold text-slate-800">{taxa}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${taxa}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {funnelData.map((item, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-slate-900">{item.value}</p>
                    <p className="text-sm text-slate-600 mt-1">{item.name}</p>
                    {i > 0 && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        {pct(item.value, funnelData[i - 1].value)} da etapa anterior
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* === ABA LEADS === */}
          <TabsContent value="leads" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Leads por Origem</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={leadsPorOrigem} dataKey="total" nameKey="origem" cx="50%" cy="50%" outerRadius={80} label={({origem, total}) => `${origem}: ${total}`}>
                          {leadsPorOrigem.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Leads por Status</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadsPorStatus}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="status" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#0f6cbd" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Contatos por Tipo</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contatosPorTipo}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="tipo" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                        {contatosPorTipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ABA PROPOSTAS & CONTRATOS === */}
          <TabsContent value="propostas" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={FileText} label="Total Propostas" value={propostas.length} color="blue" />
              <KPICard icon={FileText} label="Aprovadas" value={propostas.filter(p=>p.razao_status==='aprovada').length} sub={pct(propostas.filter(p=>p.razao_status==='aprovada').length, propostas.length) + ' do total'} color="green" />
              <KPICard icon={FileCheck} label="Contratos Ativos" value={contratos.filter(c=>c.razao_status==='ativo').length} color="green" />
              <KPICard icon={FileCheck} label="Crédito Aprovado" value={contratos.filter(c=>c.resultado_analise_credito==='aprovado').length} sub={pct(contratos.filter(c=>c.resultado_analise_credito==='aprovado').length, contratos.length) + ' dos contratos'} color="purple" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Propostas por Status</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={propostasPorStatus} dataKey="total" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({status, total}) => `${status}: ${total}`}>
                          {propostasPorStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Contratos por Status</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={contratosPorStatus}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="status" fontSize={10} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#10b981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Análise de Crédito dos Contratos</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={contratosPorCredito} dataKey="total" nameKey="resultado" cx="50%" cy="50%" outerRadius={80} label={({resultado, total}) => `${resultado}: ${total}`}>
                        {contratosPorCredito.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ABA USINAS & UCS === */}
          <TabsContent value="usinas" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">UCs por Concessionária</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ucsPorConcess}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="concessionaria" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">UCs por Subclasse</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={ucsPorSubclasse} dataKey="total" nameKey="subclasse" cx="50%" cy="50%" outerRadius={80} label={({subclasse, total}) => `${subclasse}: ${total}`}>
                          {ucsPorSubclasse.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            {usinasPorProposta.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Usinas × Propostas × Contratos</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={usinasPorProposta}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="usina" fontSize={10} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="propostas" name="Propostas" fill="#0f6cbd" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="contratos" name="Contratos" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Detalhamento das Usinas</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-slate-600 font-semibold">Usina</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Desconto</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Capacidade (kWh)</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Propostas</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Contratos</th>
                        <th className="text-center py-2 px-3 text-slate-600 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usinas.map((u, i) => {
                        const propCount = propostas.filter(p => p.parceiro_une_energia === u.nome).length;
                        const conCount = contratos.filter(c => {
                          const prop = propostas.find(p => p.id === c.proposta_id);
                          return prop?.parceiro_une_energia === u.nome;
                        }).length;
                        return (
                          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-800">{u.nome}</td>
                            <td className="py-2 px-3 text-right text-emerald-600 font-medium">{u.desconto_percentual || 0}%</td>
                            <td className="py-2 px-3 text-right text-slate-600">{(u.capacidade_disponivel_kwh || 0).toLocaleString('pt-BR')}</td>
                            <td className="py-2 px-3 text-right text-blue-600 font-medium">{propCount}</td>
                            <td className="py-2 px-3 text-right text-emerald-600 font-medium">{conCount}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.status === 'ativa' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{u.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ABA FINANCEIRO === */}
          <TabsContent value="financeiro" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={DollarSign} label="Receita Total (Pago)" value={fmt(receitaTotal)} sub={`${boletosPagos.length} boletos`} color="green" />
              <KPICard icon={DollarSign} label="MRR Contratos Ativos" value={fmt(mrr)} color="blue" />
              <KPICard icon={DollarSign} label="Inadimplência" value={fmt(inadimplencia)} sub={`${boletosVencidos.length} boletos vencidos`} color="red" />
              <KPICard icon={DollarSign} label="A Receber" value={fmt(boletosPendentes.reduce((s,b)=>s+(b.valor||0),0))} sub={`${boletosPendentes.length} pendentes`} color="amber" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Boletos por Status (quantidade)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={boletosPorStatus}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="status" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Boletos por Status (R$)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={boletosPorStatus}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="status" fontSize={11} />
                        <YAxis fontSize={11} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => fmt(v)} />
                        <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === ABA COMISSÕES === */}
          <TabsContent value="comissoes" className="space-y-6">
            <FiltroData />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={Award} label="Comissão Total Anual" value={fmt(comissaoTotal)} sub={`${contratosComComissao.length} contratos`} color="green" />
              <KPICard icon={DollarSign} label="Comissão Mensal" value={fmt(comissaoMensalTotal)} color="blue" />
              <KPICard icon={Users} label="Vendedores Ativos" value={comissaoPorVendedor.filter(v => v.vendedor !== '-').length} color="purple" />
              <KPICard icon={FileCheck} label="Contratos no Período" value={contratosFiltrados.length} color="amber" />
            </div>

            {/* Gráfico por vendedor */}
            {comissaoPorVendedor.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Comissão Anual por Vendedor</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comissaoPorVendedor} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" fontSize={10} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                        <YAxis dataKey="vendedor" type="category" fontSize={10} width={120} />
                        <Tooltip formatter={(v) => fmt(v)} />
                        <Bar dataKey="comissaoAnual" name="Comissão Anual" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabela vendedor × comissão */}
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Comissionamento por Vendedor</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-slate-600 font-semibold">Vendedor</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Contratos</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Comissão Mensal</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Comissão Anual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comissaoPorVendedor.map((v, i) => (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">{v.vendedor}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{v.contratos}</td>
                          <td className="py-2 px-3 text-right text-blue-600 font-medium">{fmt(v.comissaoMensal)}</td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-semibold">{fmt(v.comissaoAnual)}</td>
                        </tr>
                      ))}
                      {comissaoPorVendedor.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">Nenhum dado encontrado para o período selecionado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Tabela por contrato */}
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Comissão por Contrato</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-slate-600 font-semibold">Contrato</th>
                        <th className="text-left py-2 px-3 text-slate-600 font-semibold">Cliente</th>
                        <th className="text-left py-2 px-3 text-slate-600 font-semibold">Vendedor</th>
                        <th className="text-left py-2 px-3 text-slate-600 font-semibold">Usina</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Valor Mensal</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Comissão %</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Comissão Mensal</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Comissão Anual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contratosComComissao.map((c, i) => (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">{c.numero_contrato || '-'}</td>
                          <td className="py-2 px-3 text-slate-700">{c.cliente_nome}</td>
                          <td className="py-2 px-3 text-slate-700">{c.vendedor}</td>
                          <td className="py-2 px-3 text-slate-700">{c.usinaStr}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{fmt(c.valor_plano_contrato)}</td>
                          <td className="py-2 px-3 text-right text-purple-600">{c.comissaoPct}%</td>
                          <td className="py-2 px-3 text-right text-blue-600 font-medium">{fmt(c.comissaoMensal)}</td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-semibold">{fmt(c.comissaoAnual)}</td>
                        </tr>
                      ))}
                      {contratosComComissao.length === 0 && (
                        <tr><td colSpan={8} className="py-8 text-center text-slate-400 text-sm">Nenhum contrato encontrado para o período selecionado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ABA ATIVIDADES === */}
          <TabsContent value="atividades" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={Activity} label="Total Atividades" value={atividades.length} color="blue" />
              <KPICard icon={Activity} label="Concluídas" value={atividades.filter(a=>a.status==='concluido').length} sub={pct(atividades.filter(a=>a.status==='concluido').length, atividades.length)} color="green" />
              <KPICard icon={Activity} label="Agendadas" value={atividades.filter(a=>a.status==='agendado').length} color="amber" />
              <KPICard icon={Activity} label="Canceladas" value={atividades.filter(a=>a.status==='cancelado').length} color="red" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Atividades por Tipo</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={atividadesPorTipo} dataKey="total" nameKey="tipo" cx="50%" cy="50%" outerRadius={80} label={({tipo, total}) => `${tipo}: ${total}`}>
                          {atividadesPorTipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Volume de Atividades por Tipo</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={atividadesPorTipo} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" fontSize={10} />
                        <YAxis dataKey="tipo" type="category" fontSize={10} width={70} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#0f6cbd" radius={[0, 4, 4, 0]}>
                          {atividadesPorTipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}