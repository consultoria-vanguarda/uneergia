const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Zap, 
  TrendingDown, 
  Shield, 
  Award, 
  DollarSign, 
  BarChart3, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function AnaliseUsinas() {
  const [consumoMensal, setConsumoMensal] = useState("");
  const [estadoCliente, setEstadoCliente] = useState("");
  const [distribuidora, setDistribuidora] = useState("");

  const { data: usinas = [], isLoading } = useQuery({
    queryKey: ['usinas'],
    queryFn: () => db.entities.Usina.list(),
  });

  const usinasAtivas = usinas.filter(u => u.status === 'ativa');

  const usinasFiltradas = useMemo(() => {
    let filtered = usinasAtivas;
    
    if (distribuidora) {
      filtered = filtered.filter(u => u.distribuidora === distribuidora);
    }
    
    if (estadoCliente) {
      filtered = filtered.filter(u => u.estado === estadoCliente || !u.estado);
    }
    
    return filtered;
  }, [usinasAtivas, distribuidora, estadoCliente]);

  const calcularBeneficios = (usina) => {
    const consumo = parseFloat(consumoMensal) || 0;
    if (consumo === 0) return null;

    const precoBase = usina.preco_kwh || 0;
    const desconto = (usina.desconto_percentual || 0) / 100;
    const incentivoFiscal = (usina.incentivo_fiscal_percentual || 0) / 100;
    const comissao = (usina.comissao_percentual || 0) / 100;

    // Cálculo do valor base
    const valorBase = consumo * precoBase;
    
    // Aplicar desconto da usina
    const valorComDesconto = valorBase * (1 - desconto);
    
    // Aplicar incentivo fiscal
    const valorComIncentivo = valorComDesconto * (1 - incentivoFiscal);
    
    // Calcular economia total
    const economiaTotal = valorBase - valorComIncentivo;
    const economiaPercentual = (economiaTotal / valorBase) * 100;
    
    // Calcular comissão
    const valorComissao = valorBase * comissao;
    const comissaoFixa = usina.comissao_valor_fixo || 0;

    return {
      valorBase,
      valorFinal: valorComIncentivo,
      economiaTotal,
      economiaPercentual,
      valorComissao: valorComissao + comissaoFixa,
      descontoUsina: valorBase * desconto,
      incentivoFiscalValor: valorComDesconto * incentivoFiscal,
      score: economiaPercentual + (usina.isencao_tributaria ? 5 : 0) + (comissao * 100)
    };
  };

  const usinasComAnalise = useMemo(() => {
    return usinasFiltradas
      .map(usina => ({
        ...usina,
        beneficios: calcularBeneficios(usina)
      }))
      .filter(u => u.beneficios)
      .sort((a, b) => b.beneficios.score - a.beneficios.score);
  }, [usinasFiltradas, consumoMensal]);

  const melhorUsina = usinasComAnalise[0];

  const distribuidorasUnicas = [...new Set(usinasAtivas.map(u => u.distribuidora))].filter(Boolean);
  const estadosUnicos = [...new Set(usinasAtivas.map(u => u.estado))].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f3f2f1] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#323130]">Análise de Usinas</h1>
          <p className="text-[#605e5c] mt-2">
            Compare usinas parceiras e encontre a melhor opção para cada cliente
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Dados do Cliente
            </CardTitle>
            <CardDescription>Informe os dados para análise comparativa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Consumo Mensal (kWh) *</Label>
                <Input
                  type="number"
                  placeholder="Ex: 500"
                  value={consumoMensal}
                  onChange={(e) => setConsumoMensal(e.target.value)}
                />
              </div>
              <div>
                <Label>Distribuidora</Label>
                <Select value={distribuidora} onValueChange={setDistribuidora}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Todas</SelectItem>
                    {distribuidorasUnicas.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado do Cliente</Label>
                <Select value={estadoCliente} onValueChange={setEstadoCliente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Todos</SelectItem>
                    {estadosUnicos.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Melhor Opção em Destaque */}
        {melhorUsina && (
          <Card className="border-2 border-emerald-500 bg-emerald-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <Award className="w-6 h-6" />
                    Melhor Opção
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Usina com maior benefício total para este perfil
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-600 text-white text-base px-4 py-2">
                  Score: {melhorUsina.beneficios.score.toFixed(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-[#323130] mb-2">
                    {melhorUsina.nome}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-[#605e5c] mb-4">
                    <span>{melhorUsina.distribuidora}</span>
                    {melhorUsina.estado && (
                      <>
                        <span>•</span>
                        <span>{melhorUsina.estado}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Desconto: {melhorUsina.desconto_percentual || 0}%</span>
                    </div>
                    {melhorUsina.isencao_tributaria && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">Com isenção tributária</span>
                      </div>
                    )}
                    {melhorUsina.incentivo_fiscal_percentual > 0 && (
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">Incentivo fiscal: {melhorUsina.incentivo_fiscal_percentual}%</span>
                      </div>
                    )}
                    {melhorUsina.comissao_percentual > 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">
                          Comissão: {melhorUsina.comissao_percentual}% 
                          ({melhorUsina.tipo_comissao === 'desconto_conta' ? 'Desconto na conta' : 
                            melhorUsina.tipo_comissao === 'transferencia' ? 'Transferência' : 'Ambos'})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#605e5c]">Valor Base</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(melhorUsina.beneficios.valorBase)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-blue-600">
                    <span className="text-sm">Desconto Usina</span>
                    <span className="text-sm font-medium">
                      -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(melhorUsina.beneficios.descontoUsina)}
                    </span>
                  </div>
                  {melhorUsina.beneficios.incentivoFiscalValor > 0 && (
                    <div className="flex justify-between items-center text-orange-600">
                      <span className="text-sm">Incentivo Fiscal</span>
                      <span className="text-sm font-medium">
                        -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(melhorUsina.beneficios.incentivoFiscalValor)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-semibold text-[#323130]">Valor Final</span>
                    <span className="font-bold text-lg text-emerald-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(melhorUsina.beneficios.valorFinal)}
                    </span>
                  </div>
                  <div className="bg-emerald-100 rounded p-2 flex justify-between items-center">
                    <span className="text-sm font-semibold text-emerald-700">Economia Total</span>
                    <span className="font-bold text-emerald-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(melhorUsina.beneficios.economiaTotal)}
                      <span className="text-sm ml-1">({melhorUsina.beneficios.economiaPercentual.toFixed(1)}%)</span>
                    </span>
                  </div>
                  {melhorUsina.beneficios.valorComissao > 0 && (
                    <div className="bg-blue-50 rounded p-2 flex justify-between items-center">
                      <span className="text-sm font-semibold text-blue-700">Sua Comissão</span>
                      <span className="font-bold text-blue-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(melhorUsina.beneficios.valorComissao)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista Comparativa */}
        {consumoMensal && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#323130]">
              Comparativo de Todas as Usinas
            </h2>
            
            {usinasComAnalise.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">
                    Nenhuma usina encontrada com os filtros selecionados
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usinasComAnalise.map((usina, index) => (
                  <Card key={usina.id} className={index === 0 ? 'border-emerald-300' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            {usina.nome}
                            {index === 0 && (
                              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Melhor
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {usina.distribuidora} {usina.estado && `• ${usina.estado}`}
                          </CardDescription>
                        </div>
                        <Badge className="bg-slate-100 text-slate-700">
                          Score: {usina.beneficios.score.toFixed(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-[#605e5c]">Desconto</span>
                          <p className="font-medium text-blue-600">{usina.desconto_percentual || 0}%</p>
                        </div>
                        <div>
                          <span className="text-[#605e5c]">Economia</span>
                          <p className="font-medium text-emerald-600">
                            {usina.beneficios.economiaPercentual.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <span className="text-[#605e5c]">Valor Final</span>
                          <p className="font-medium">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(usina.beneficios.valorFinal)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#605e5c]">Comissão</span>
                          <p className="font-medium text-blue-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(usina.beneficios.valorComissao)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {usina.isencao_tributaria && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Isenção
                          </Badge>
                        )}
                        {usina.incentivo_fiscal_percentual > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            Incentivo {usina.incentivo_fiscal_percentual}%
                          </Badge>
                        )}
                        {usina.tipo_comissao && (
                          <Badge variant="outline" className="text-xs">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {usina.tipo_comissao === 'desconto_conta' ? 'Desc. Conta' : 
                             usina.tipo_comissao === 'transferencia' ? 'Transfer.' : 'Ambos'}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {!consumoMensal && (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#323130] mb-2">
                Pronto para Análise
              </h3>
              <p className="text-[#605e5c]">
                Informe o consumo mensal do cliente para ver a comparação entre usinas
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}