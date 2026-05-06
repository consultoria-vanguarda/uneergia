import React from "react";
import { Badge } from "@/components/ui/badge";

const statusStyles = {
  // Status gerais
  ativo: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inativo: "bg-slate-100 text-slate-600 border-slate-200",
  suspenso: "bg-red-100 text-red-700 border-red-200",
  
  // Status de usina
  ativa: "bg-emerald-100 text-emerald-700 border-emerald-200",
  em_negociacao: "bg-amber-100 text-amber-700 border-amber-200",
  
  // Status de injeção
  pendente: "bg-amber-100 text-amber-700 border-amber-200",
  em_analise: "bg-blue-100 text-blue-700 border-blue-200",
  injetado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejeitado: "bg-red-100 text-red-700 border-red-200",
  
  // Status de lead
  novo: "bg-blue-100 text-blue-700 border-blue-200",
  em_contato: "bg-cyan-100 text-cyan-700 border-cyan-200",
  proposta_enviada: "bg-purple-100 text-purple-700 border-purple-200",
  negociando: "bg-amber-100 text-amber-700 border-amber-200",
  fechado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  perdido: "bg-red-100 text-red-700 border-red-200",
  
  // Status de boleto
  pago: "bg-emerald-100 text-emerald-700 border-emerald-200",
  vencido: "bg-red-100 text-red-700 border-red-200",
  cancelado: "bg-slate-100 text-slate-600 border-slate-200",
};

const statusLabels = {
  ativo: "Ativo",
  inativo: "Inativo",
  suspenso: "Suspenso",
  ativa: "Ativa",
  em_negociacao: "Em Negociação",
  pendente: "Pendente",
  em_analise: "Em Análise",
  injetado: "Injetado",
  rejeitado: "Rejeitado",
  novo: "Novo",
  em_contato: "Em Contato",
  proposta_enviada: "Proposta Enviada",
  negociando: "Negociando",
  fechado: "Fechado",
  perdido: "Perdido",
  pago: "Pago",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || "bg-slate-100 text-slate-600 border-slate-200";
  const label = statusLabels[status] || status;

  return (
    <Badge variant="outline" className={`${style} font-medium`}>
      {label}
    </Badge>
  );
}