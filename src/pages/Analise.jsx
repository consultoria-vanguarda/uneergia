const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calculator, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  DollarSign,
  Percent
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Analise() {
  const [consumo, setConsumo] = useState("");
  const [distribuidora, setDistribuidora] = useState("");
  const [analisado, setAnalisado] = useState(false);

  const { data: usinas = [], isLoading } = useQuery({
    queryKey: ['usinas'],
    queryFn: () => db.entities.Usina.list(),
  });

  const usinasAtivas = usinas.filter(u => u.status === 'ativa');

  const calcularEconomia = (usina) => {
    const consumoNum = parseFloat(consumo) || 0;
    if (!consumoNum || !usina.preco_kwh) return null;

    // Tarifa média da distribuidora (estimativa)
    const tarifaDistribuidora = 0.85; // R$/kWh
    const custoSemCredito = consumoNum * tarifaDistribuidora;
    const custoComCredito = consumoNum * usina.preco_kwh;
    const economiaReais = custoSemCredito - custoComCredito;
    const economiaPercent = ((economiaReais / custoSemCredito) * 100).toFixed(1);

    return {
      custoSemCredito,
      custoComCredito,
      economiaReais,
      economiaPercent,
      capacidadeDisponivel: usina.capacidade_disponivel_kwh >= consumoNum,
    };
  };

  const usinasAnalisadas = usinasAtivas
    .map(usina => ({
      ...usina,
      analise: calcularEconomia(usina),
    }))
    .filter(u => u.analise)
    .sort((a, b) => b.analise.economiaReais - a.analise.economiaReais);

  const handleAnalise = (e) => {
    e.preventDefault();
    if (consumo) {
      setAnalisado(true);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Análise de Usinas</h1>
        <p className="text-slate-500 mt-1">Compare as usinas e encontre a mais vantajosa para seu cliente</p>
      </div>

      {/* Formulário de análise */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            Dados para Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalise} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Consumo Mensal (kWh) *</Label>
              <Input
                type="number"
                placeholder="Ex: 500"
                value={consumo}
                onChange={(e) => {
                  setConsumo(e.target.value);
                  setAnalisado(false);
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Distribuidora</Label>
              <Input
                placeholder="Ex: CEMIG"
                value={distribuidora}
                onChange={(e) => setDistribuidora(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analisar Usinas
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Resultados */}
      <AnimatePresence>
        {analisado && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-2xl" />
                ))}
              </div>
            ) : usinasAnalisadas.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-medium text-slate-700">Nenhuma usina disponível</h3>
                  <p className="text-sm text-slate-500 mt-1">Cadastre usinas para fazer a análise comparativa</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Ranking de Usinas ({usinasAnalisadas.length} disponíveis)
                </h2>

                {usinasAnalisadas.map((usina, index) => (
                  <motion.div
                    key={usina.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`overflow-hidden ${index === 0 ? 'ring-2 ring-emerald-500' : ''}`}>
                      {index === 0 && (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 text-sm font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Melhor Opção
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          {/* Info da usina */}
                          <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                              index === 0 
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-500' 
                                : 'bg-gradient-to-br from-slate-600 to-slate-700'
                            }`}>
                              <span className="text-white font-bold text-xl">#{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{usina.nome}</h3>
                              <p className="text-sm text-slate-500">{usina.distribuidora}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {usina.analise.capacidadeDisponivel ? (
                                  <Badge className="bg-emerald-100 text-emerald-700">
                                    Capacidade OK
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    Capacidade Insuficiente
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Métricas */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mb-1">
                                <DollarSign className="w-3 h-3" />
                                Preço/kWh
                              </div>
                              <p className="text-lg font-bold text-slate-900">
                                R$ {usina.preco_kwh?.toFixed(2)}
                              </p>
                            </div>

                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mb-1">
                                <Percent className="w-3 h-3" />
                                Desconto
                              </div>
                              <p className="text-lg font-bold text-emerald-600">
                                {usina.desconto_percentual || 0}%
                              </p>
                            </div>

                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mb-1">
                                <Zap className="w-3 h-3" />
                                Economia/mês
                              </div>
                              <p className="text-lg font-bold text-emerald-600">
                                R$ {usina.analise.economiaReais.toFixed(2)}
                              </p>
                            </div>

                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mb-1">
                                <TrendingUp className="w-3 h-3" />
                                % Economia
                              </div>
                              <p className="text-lg font-bold text-emerald-600">
                                {usina.analise.economiaPercent}%
                              </p>
                            </div>
                          </div>

                          {/* Comparação */}
                          <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4">
                            <div className="text-center">
                              <p className="text-xs text-slate-500">Sem crédito</p>
                              <p className="text-sm font-medium text-slate-600 line-through">
                                R$ {usina.analise.custoSemCredito.toFixed(2)}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                            <div className="text-center">
                              <p className="text-xs text-slate-500">Com crédito</p>
                              <p className="text-sm font-bold text-emerald-600">
                                R$ {usina.analise.custoComCredito.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* Resumo */}
                {usinasAnalisadas.length > 0 && (
                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-emerald-900">Economia Anual Potencial</h3>
                          <p className="text-sm text-emerald-700">
                            Com a melhor usina ({usinasAnalisadas[0]?.nome})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-emerald-600">
                            R$ {((usinasAnalisadas[0]?.analise?.economiaReais || 0) * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-emerald-700">/ano</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info inicial */}
      {!analisado && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Compare as Usinas</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Insira o consumo mensal do cliente para ver qual usina oferece a melhor economia
          </p>
        </div>
      )}
    </div>
  );
}