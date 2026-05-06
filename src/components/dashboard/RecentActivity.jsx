import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserPlus, Zap, Receipt, CheckCircle2 } from "lucide-react";

const activityIcons = {
  cliente: UserPlus,
  injecao: Zap,
  boleto: Receipt,
  pagamento: CheckCircle2,
};

const activityColors = {
  cliente: "bg-blue-100 text-blue-600",
  injecao: "bg-amber-100 text-amber-600",
  boleto: "bg-purple-100 text-purple-600",
  pagamento: "bg-emerald-100 text-emerald-600",
};

export default function RecentActivity({ activities = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Atividade Recente</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {activities.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400">
            Nenhuma atividade recente
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = activityIcons[activity.type] || UserPlus;
            const colorClass = activityColors[activity.type] || "bg-slate-100 text-slate-600";
            
            return (
              <div key={index} className="px-6 py-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{activity.title}</p>
                  <p className="text-xs text-slate-500">{activity.description}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {activity.date ? format(new Date(activity.date), "dd MMM", { locale: ptBR }) : ''}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}