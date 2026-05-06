const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Target, 
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Database,
  Cloud,
  FileText,
  Zap
} from "lucide-react";

export default function IntegracaoDynamics() {
  const [testStatus, setTestStatus] = useState(null);
  const [syncResults, setSyncResults] = useState(null);
  const queryClient = useQueryClient();

  // Testar conexão
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await db.functions.invoke('dynamicsAuth', {});
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setTestStatus({ success: true, message: 'Conexão estabelecida com sucesso!' });
      } else {
        setTestStatus({ success: false, message: 'Falha na autenticação' });
      }
    },
    onError: (error) => {
      setTestStatus({ success: false, message: error.message });
    }
  });

  // Sincronizar Contatos
  const syncContactsMutation = useMutation({
    mutationFn: async (direction) => {
      const response = await db.functions.invoke('dynamicsSyncContacts', { 
        direction 
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSyncResults(data);
      queryClient.invalidateQueries(['contatos']);
    }
  });

  // Sincronizar Oportunidades
  const syncOpportunitiesMutation = useMutation({
    mutationFn: async (direction) => {
      const response = await db.functions.invoke('dynamicsSyncOpportunities', { 
        direction 
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSyncResults(data);
      queryClient.invalidateQueries(['oportunidades']);
    }
  });

  // Sincronizar UCs
  const syncUCsMutation = useMutation({
    mutationFn: async (direction) => {
      const response = await db.functions.invoke('dynamicsSyncUCs', { 
        direction 
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSyncResults(data);
      queryClient.invalidateQueries(['unidades_consumidoras']);
    }
  });

  // Sincronizar Propostas
  const syncPropostasMutation = useMutation({
    mutationFn: async (direction) => {
      const response = await db.functions.invoke('dynamicsSyncPropostas', { 
        direction 
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSyncResults(data);
      queryClient.invalidateQueries(['propostas']);
    }
  });

  // Sincronizar Contratos
  const syncContratosMutation = useMutation({
    mutationFn: async (direction) => {
      const response = await db.functions.invoke('dynamicsSyncContratos', { 
        direction 
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSyncResults(data);
      queryClient.invalidateQueries(['contratos']);
    }
  });

  return (
    <div className="min-h-screen bg-[#f3f2f1]">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#323130]">Integração Dynamics 365</h1>
            <p className="text-sm text-[#605e5c] mt-1">
              Sincronize dados entre o sistema e Microsoft Dynamics CRM
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Teste de Conexão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-600" />
              Teste de Conexão
            </CardTitle>
            <CardDescription>
              Verifique se as credenciais do Dynamics 365 estão configuradas corretamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending}
                className="bg-[#0f6cbd] hover:bg-[#0d5ba8]"
              >
                {testConnectionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>

              {testStatus && (
                <Alert className={testStatus.success ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
                  <div className="flex items-center gap-2">
                    {testStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <AlertDescription className={testStatus.success ? 'text-emerald-700' : 'text-red-700'}>
                      {testStatus.message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sincronização de Contatos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Sincronização de Clientes
            </CardTitle>
            <CardDescription>
              Sincronize dados de clientes entre o sistema e Dynamics 365
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Sistema → Dynamics</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Envia clientes deste sistema para o Dynamics 365
                      </p>
                    </div>
                    <Button
                      onClick={() => syncContactsMutation.mutate('to_dynamics')}
                      disabled={syncContactsMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {syncContactsMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      Enviar para Dynamics
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Cloud className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Dynamics → Sistema</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Importa clientes do Dynamics 365 para este sistema
                      </p>
                    </div>
                    <Button
                      onClick={() => syncContactsMutation.mutate('from_dynamics')}
                      disabled={syncContactsMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {syncContactsMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      )}
                      Importar do Dynamics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Sincronização de Oportunidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Sincronização de Oportunidades
            </CardTitle>
            <CardDescription>
              Sincronize oportunidades de vendas entre os sistemas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Sistema → Dynamics</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Envia oportunidades para o Dynamics 365
                      </p>
                    </div>
                    <Button
                      onClick={() => syncOpportunitiesMutation.mutate('to_dynamics')}
                      disabled={syncOpportunitiesMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {syncOpportunitiesMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      Enviar para Dynamics
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Cloud className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Dynamics → Sistema</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Importa oportunidades do Dynamics 365
                      </p>
                    </div>
                    <Button
                      onClick={() => syncOpportunitiesMutation.mutate('from_dynamics')}
                      disabled={syncOpportunitiesMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {syncOpportunitiesMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      )}
                      Importar do Dynamics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Sincronização de Unidades Consumidoras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-600" />
              Sincronização de Unidades Consumidoras
            </CardTitle>
            <CardDescription>
              Sincronize dados de UCs e instalações entre os sistemas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Sistema → Dynamics</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Envia UCs para o Dynamics 365
                      </p>
                    </div>
                    <Button
                      onClick={() => syncUCsMutation.mutate('to_dynamics')}
                      disabled={syncUCsMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {syncUCsMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      Enviar para Dynamics
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Cloud className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Dynamics → Sistema</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Importa UCs do Dynamics 365
                      </p>
                    </div>
                    <Button
                      onClick={() => syncUCsMutation.mutate('from_dynamics')}
                      disabled={syncUCsMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {syncUCsMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      )}
                      Importar do Dynamics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Sincronização de Propostas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Sincronização de Propostas
            </CardTitle>
            <CardDescription>
              Sincronize propostas comerciais com documentos anexados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Sistema → Dynamics</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Envia propostas e documentos para o Dynamics 365
                      </p>
                    </div>
                    <Button
                      onClick={() => syncPropostasMutation.mutate('to_dynamics')}
                      disabled={syncPropostasMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {syncPropostasMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      Enviar para Dynamics
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Cloud className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Dynamics → Sistema</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Importa propostas do Dynamics 365
                      </p>
                    </div>
                    <Button
                      onClick={() => syncPropostasMutation.mutate('from_dynamics')}
                      disabled={syncPropostasMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {syncPropostasMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      )}
                      Importar do Dynamics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Sincronização de Contratos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Sincronização de Contratos UNE ENERGIA
            </CardTitle>
            <CardDescription>
              Sincronize contratos assinados com toda documentação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Sistema → Dynamics</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Envia contratos e documentos para o Dynamics 365
                      </p>
                    </div>
                    <Button
                      onClick={() => syncContratosMutation.mutate('to_dynamics')}
                      disabled={syncContratosMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {syncContratosMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      Enviar para Dynamics
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Cloud className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Dynamics → Sistema</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Importa contratos do Dynamics 365
                      </p>
                    </div>
                    <Button
                      onClick={() => syncContratosMutation.mutate('from_dynamics')}
                      disabled={syncContratosMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {syncContratosMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      )}
                      Importar do Dynamics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Resultados da Sincronização */}
        {syncResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Resultados da Sincronização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-slate-900">{syncResults.total}</p>
                      <p className="text-sm text-slate-500 mt-1">Total</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-emerald-600">{syncResults.synced}</p>
                      <p className="text-sm text-slate-500 mt-1">Sincronizados</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-red-600">{syncResults.failed}</p>
                      <p className="text-sm text-slate-500 mt-1">Falhas</p>
                    </CardContent>
                  </Card>
                </div>

                {syncResults.results?.errors?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 mb-2">Erros:</h4>
                    <div className="space-y-2">
                      {syncResults.results.errors.slice(0, 5).map((error, idx) => (
                        <Alert key={idx} className="border-red-200 bg-red-50">
                          <AlertDescription className="text-xs text-red-700">
                            {error.nome || error.titulo}: {error.error}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Como Configurar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <ol className="space-y-3 text-sm text-slate-600">
                <li>Registre uma aplicação no <strong>Azure AD</strong> (Azure Active Directory)</li>
                <li>Configure as permissões da API do Dynamics 365 para a aplicação</li>
                <li>Copie o <strong>Client ID</strong>, <strong>Client Secret</strong> e <strong>Tenant ID</strong></li>
                <li>Adicione a URL da sua instância do Dynamics (ex: https://suaempresa.crm2.dynamics.com)</li>
                <li>Configure esses valores nas variáveis de ambiente do sistema</li>
                <li>Teste a conexão usando o botão acima</li>
                <li>Execute as sincronizações conforme necessário</li>
              </ol>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 mb-2"><strong>Campos Mapeados com Documentos:</strong></p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• <strong>Contatos:</strong> nome, email, telefone, distribuidora, consumo kWh + documentos anexados</li>
                  <li>• <strong>Oportunidades:</strong> título, valor, estágio, probabilidade, economia + documentos</li>
                  <li>• <strong>UCs:</strong> número UC, concessionária, consumo, tarifa, endereço completo</li>
                  <li>• <strong>Propostas:</strong> número, valores, economia, validade + PDF proposta, simulação</li>
                  <li>• <strong>Contratos:</strong> número, valores, datas, status crédito + PDF assinado, RG, comprovantes</li>
                </ul>
                <p className="text-xs text-blue-800 mt-3"><strong>Documentos incluídos automaticamente:</strong> Todos os arquivos anexados nos registros são enviados como anotações no Dynamics 365</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}