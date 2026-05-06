const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Autentica com Microsoft Dynamics 365 usando Client Credentials Flow
 * Retorna um access token válido para fazer chamadas à API do Dynamics
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obter credenciais do ambiente
    const clientId = Deno.env.get("DYNAMICS_CLIENT_ID");
    const clientSecret = Deno.env.get("DYNAMICS_CLIENT_SECRET");
    const tenantId = Deno.env.get("DYNAMICS_TENANT_ID");
    const resourceUrl = Deno.env.get("DYNAMICS_RESOURCE_URL");

    if (!clientId || !clientSecret || !tenantId || !resourceUrl) {
      return Response.json({ 
        error: 'Configuração incompleta. Verifique as variáveis de ambiente do Dynamics 365' 
      }, { status: 500 });
    }

    // URL do endpoint OAuth2 do Azure AD
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    // Preparar body da requisição
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: `${resourceUrl}/.default`,
      grant_type: 'client_credentials'
    });

    // Fazer requisição de token
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro ao obter token:', errorData);
      return Response.json({ 
        error: 'Falha na autenticação com Dynamics 365',
        details: errorData
      }, { status: response.status });
    }

    const tokenData = await response.json();

    return Response.json({
      success: true,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      resource_url: resourceUrl
    });

  } catch (error) {
    console.error('Erro na autenticação Dynamics:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});