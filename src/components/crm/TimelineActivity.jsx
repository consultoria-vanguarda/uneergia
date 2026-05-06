import React from "react";
import { Phone, Mail, Calendar, Target, Users, TrendingUp, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const activityIcons = {
  chamada: Phone,
  email: Mail,
  reuniao: Calendar,
  tarefa: Target,
  nota: Users,
  atualizacao: TrendingUp
};

const activityColors = {
  chamada: "bg-blue-500",
  email: "bg-purple-500",
  reuniao: "bg-emerald-500",
  tarefa: "bg-amber-500",
  nota: "bg-slate-500",
  atualizacao: "bg-indigo-500"
};

const statusIcons = {
  agendado: Clock,
  concluido: CheckCircle2,
  cancelado: XCircle
};

export default function TimelineActivity({ atividade }) {
  const Icon = activityIcons[atividade.tipo] || Users;
  const StatusIcon = statusIcons[atividade.status] || Clock;
  const color = activityColors[atividade.tipo] || "bg-slate-500";

  return (
    <div className="flex gap-4 group">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white shadow-md`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-slate-900">{atividade.assunto}</h4>
              <p className="text-xs text-slate-500 mt-1">
                {atividade.data_atividade 
                  ? format(new Date(atividade.data_atividade), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                  : 'Sem data'
                }
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <StatusIcon className={`w-4 h-4 ${
                atividade.status === 'concluido' ? 'text-emerald-600' :
                atividade.status === 'cancelado' ? 'text-red-600' :
                'text-amber-600'
              }`} />
              <span className="text-slate-600 capitalize">{atividade.status}</span>
            </div>
          </div>
          
          {atividade.descricao && (
            <p className="text-sm text-slate-600 mb-3">{atividade.descricao}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500">
            {atividade.duracao_minutos && (
              <span>Duração: {atividade.duracao_minutos} min</span>
            )}
            {atividade.proprietario && (
              <span>Por: {atividade.proprietario}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}