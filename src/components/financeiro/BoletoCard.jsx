import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Receipt, Calendar, User, MoreHorizontal, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "@/components/ui/StatusBadge";

export default function BoletoCard({ boleto, onMarcarPago, onCancelar }) {
  const isVencido = new Date(boleto.data_vencimento) < new Date() && boleto.status === 'pendente';

  return (
    <div className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${
      isVencido ? 'border-red-200' : 'border-slate-100'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            boleto.status === 'pago' 
              ? 'bg-emerald-100' 
              : isVencido 
                ? 'bg-red-100' 
                : 'bg-amber-100'
          }`}>
            {boleto.status === 'pago' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : isVencido ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-slate-900">{boleto.cliente_nome}</p>
            <p className="text-sm text-slate-500">#{boleto.numero_boleto || boleto.id?.slice(-6)}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {boleto.status === 'pendente' && (
              <DropdownMenuItem onClick={() => onMarcarPago(boleto)}>
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                Marcar como Pago
              </DropdownMenuItem>
            )}
            {boleto.status === 'pendente' && (
              <DropdownMenuItem onClick={() => onCancelar(boleto)} className="text-red-600">
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Valor</p>
          <p className="font-bold text-slate-900">
            R$ {boleto.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Vencimento</p>
          <p className={`font-medium ${isVencido ? 'text-red-600' : 'text-slate-900'}`}>
            {boleto.data_vencimento ? format(new Date(boleto.data_vencimento), "dd/MM/yyyy") : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Referência</p>
          <p className="text-slate-700">{boleto.referencia_mes || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Status</p>
          <StatusBadge status={isVencido ? 'vencido' : boleto.status} />
        </div>
      </div>

      {boleto.status === 'pago' && boleto.data_pagamento && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500">
          Pago em {format(new Date(boleto.data_pagamento), "dd/MM/yyyy")}
        </div>
      )}
    </div>
  );
}