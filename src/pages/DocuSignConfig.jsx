const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, Key, User, Server, AlertCircle } from "lucide-react";

export default function DocuSignConfig() {
  const [testResult, setTestResult] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const { data: logs = [] } = useQuery({
    queryKey: ['docusign-logs'],
    queryFn: () => db.entities.IntegrationLog.filter(
      { provider: "DocuSign" }, 
      '-created_date', 
      10
    ),
  });

  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    
    try {
      const { data } = await db.functions.invoke('docusignAuth', {});
      
      if (data.success) {
        setTestResult({
          success: true,
          message: 'Conexão estabelecida com sucesso!',
          details: {
            accountName: data.accountName,
            accountId: data.accountId,
            baseUri: data.baseUri
          }
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Erro ao conectar com DocuSign',
          details: data.details
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erro ao testar conexão',
        details: error.message
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const lastAuthLog = logs.find(log => log.action === 'auth');

  return (
    <div className="min-h-screen bg-[#f3f2f1] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#323130]">Configuração DocuSign</h1>
          <p className="text-[#605e5c] mt-2">
            Configure e teste a integração com DocuSign eSignature
          </p>
        </div>

        {/* Status da Conexão */}
        <Card>
          <CardHeader>
            <CardTitle>Status da Integração</CardTitle>
            <CardDescription>Teste a conexão com o DocuSign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Ambiente DocuSign</p>
                  <p className="text-sm text-slate-600">
                    {"Sandbox (Desenvolvimento)"}
                  </p>
                </div>
              </div>
              {lastAuthLog && (
                <Badge variant={lastAuthLog.success ? "default" : "destructive"}>
                  {lastAuthLog.success ? "Conectado" : "Erro"}
                </Badge>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button 
                onClick={testConnection} 
                disabled={isTestingConnection}
                className="bg-[#0f6cbd] hover:bg-[#0d5ba8]"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                <div className="flex items-start gap-3">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{testResult.message}</p>
                    {testResult.details && (
                      <div className="mt-2 text-sm">
                        {testResult.success ? (
                          <>
                            <p><strong>Conta:</strong> {testResult.details.accountName}</p>
                            <p className="text-xs text-slate-600 mt-1">
                              ID: {testResult.details.accountId}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs">{testResult.details}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Credenciais Configuradas */}
        <Card>
          <CardHeader>
            <CardTitle>Credenciais</CardTitle>
            <CardDescription>
              Configure as credenciais via variáveis de ambiente (Secrets)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                As credenciais devem ser configuradas como Secrets no ambiente. Nunca exponha a chave privada RSA.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded">
                <Key className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium">DOCUSIGN_INTEGRATION_KEY</p>
                  <p className="text-xs text-slate-600">Client ID / Integration Key</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium">DOCUSIGN_USER_ID</p>
                  <p className="text-xs text-slate-600">GUID do usuário (API Username)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded">
                <Key className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium">DOCUSIGN_PRIVATE_KEY</p>
                  <p className="text-xs text-slate-600">Chave privada RSA (formato PEM)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded">
                <Server className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium">DOCUSIGN_AUTH_SERVER</p>
                  <p className="text-xs text-slate-600">account-d.docusign.com (sandbox) ou account.docusign.com (prod)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Últimos Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Operações</CardTitle>
            <CardDescription>Histórico de ações da integração</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  Nenhuma operação registrada ainda
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded border"
                  >
                    <div className="flex items-center gap-3">
                      {log.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium capitalize">{log.action}</p>
                        {log.errorMessage && (
                          <p className="text-xs text-red-600">{log.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(log.created_date).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}