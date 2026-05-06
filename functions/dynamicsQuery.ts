const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Executa queries personalizadas na API do Dynamics 365
 * Permite buscar qualquer entidade com filtros customizados
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity, query = '', method = 'GET', body = null } = await req.json();

    if (!entity) {
      return Response.json({ 
        error: 'Entity name is required' 
      }, { status: 400 });
    }

    // Obter token de autenticação
    const authResponse = await db.functions.invoke('dynamicsAuth', {});
    
    if (!authResponse.data.success) {
      return Response.json({ 
        error: 'Falha ao autenticar com Dynamics 365' 
      }, { status: 500 });
    }

    const { access_token, resource_url } = authResponse.data;

    // Construir URL da query
    const url = `${resource_url}/api/data/v9.2/${entity}${query ? '?' + query : ''}`;

    // Executar requisição
    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
    };

    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ 
        error: 'Falha na query do Dynamics',
        details: error
      }, { status: response.status });
    }

    const data = await response.json();

    return Response.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Erro na query Dynamics:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});