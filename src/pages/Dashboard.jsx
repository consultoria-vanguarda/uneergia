const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, TrendingUp, DollarSign, Calendar, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { data: contatos = [] } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => db.entities.Contato.list('-created_date', 50),
  });

  const { data: oportunidades = [] } = useQuery({
    queryKey: ['oportunidades'],
    queryFn: () => db.entities.Oportunidade.list('-created_date', 50),
  });

  const { data: atividades = [] } = useQuery({
    queryKey: ['atividades'],
    queryFn: () => db.entities.Atividade.list('-created_date', 20),
  });

  const stats = {
    totalClientes: contatos.filter(c => c.tipo === 'cliente').length,
    leadsQualificados: contatos.filter(c => c.status === 'qualificado').length,
    oportunidadesAbertas: oportunidades.filter(o => !['ganho', 'perdido'].includes(o.estagio)).length,
    economiaMensalTotal: oportunidades
      .filter(o => o.estagio === 'ganho')
      .reduce((sum, o) => sum + (o.economia_estimada_reais || 0), 0),
    receitaMensalRecorrente: oportunidades
      .filter(o => o.estagio === 'ganho')
      .reduce((sum, o) => sum + (o.valor_proposta_mensal || 0), 0),
    atividadesHoje: atividades.filter(a => {
      const hoje = new Date().toDateString();
      return new Date(a.data_atividade).toDateString() === hoje;
    }).length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#323130]">Dashboard Solar</h1>
        <p className="text-sm text-[#605e5c]">Gestão de créditos de energia solar</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link to={createPageUrl("Contatos")}>
          <Card className="border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clientes Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{stats.totalClientes}</p>
              <p className="text-xs text-slate-500 mt-1">recebendo créditos</p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl("Oportunidades")}>
          <Card className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Oportunidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{stats.oportunidadesAbertas}</p>
              <p className="text-xs text-slate-500 mt-1">em negociação</p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl("Oportunidades")}>
          <Card className="border-l-4 border-l-purple-500 cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Receita Mensal (MRR)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                R$ {(stats.receitaMensalRecorrente / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-slate-500 mt-1">receita recorrente</p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl("Oportunidades")}>
          <Card className="border-l-4 border-l-amber-500 cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Economia Gerada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">
                R$ {(stats.economiaMensalTotal / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-slate-500 mt-1">economia mensal clientes</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Grid layout estilo Dynamics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividades recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#323130]">
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atividades.slice(0, 5).map((atividade) => {
                const icons = {
                  chamada: Phone,
                  email: Mail,
                  reuniao: Calendar,
                  tarefa: Target,
                  nota: Users,
                  atualizacao: TrendingUp
                };
                const Icon = icons[atividade.tipo] || Users;

                return (
                  <div key={atividade.id} className="flex gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      atividade.status === 'concluido' 
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">{atividade.assunto}</p>
                      <p className="text-xs text-slate-500">
                        {atividade.data_atividade 
                          ? format(new Date(atividade.data_atividade), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Sem data'
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
              {atividades.length === 0 && (
                <p className="text-center text-slate-500 py-8 text-sm">Nenhuma atividade recente</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Oportunidades em destaque */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#323130]">
              Principais Oportunidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {oportunidades
                .filter(o => !['ganho', 'perdido'].includes(o.estagio))
                .sort((a, b) => (b.valor_estimado || 0) - (a.valor_estimado || 0))
                .slice(0, 5)
                .map((opp) => (
                  <Link 
                    key={opp.id} 
                    to={createPageUrl(`Oportunidades?id=${opp.id}`)}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">{opp.titulo}</p>
                      <p className="text-xs text-slate-500">{opp.contato_nome}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-emerald-600">
                        R$ {(opp.valor_estimado || 0).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-slate-500">{opp.probabilidade || 0}%</p>
                    </div>
                  </Link>
                ))}
              {oportunidades.filter(o => !['ganho', 'perdido'].includes(o.estagio)).length === 0 && (
                <p className="text-center text-slate-500 py-8 text-sm">Nenhuma oportunidade aberta</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}