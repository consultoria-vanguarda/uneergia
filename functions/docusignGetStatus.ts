const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { envelopeId, envelopeDbId } = await req.json();

    // Autenticar
    const authResponse = await db.functions.invoke('docusignAuth', {});
    
    if (!authResponse.data.success) {
      return Response.json({ error: 'Erro na autenticação' }, { status: 500 });
    }

    const { accessToken, accountId, baseUri } = authResponse.data;

    // Obter status do envelope
    const statusResponse = await fetch(
      `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      
      await db.asServiceRole.entities.IntegrationLog.create({
        provider: "DocuSign",
        action: "getStatus",
        success: false,
        envelopeId: envelopeId,
        errorMessage: errorText
      });
      
      return Response.json({ 
        error: 'Erro ao obter status',
        details: errorText 
      }, { status: 500 });
    }

    const statusData = await statusResponse.json();

    // Atualizar no banco
    if (envelopeDbId) {
      await db.asServiceRole.entities.DocusignEnvelope.update(envelopeDbId, {
        status: statusData.status,
        lastStatusCheckAt: new Date().toISOString(),
        completedAt: statusData.status === 'completed' ? (statusData.completedDateTime || new Date().toISOString()) : null
      });
    }

    await db.asServiceRole.entities.IntegrationLog.create({
      provider: "DocuSign",
      action: "getStatus",
      success: true,
      envelopeId: envelopeId,
      responseMeta: { status: statusData.status }
    });

    return Response.json({
      success: true,
      status: statusData.status,
      sentDateTime: statusData.sentDateTime,
      deliveredDateTime: statusData.deliveredDateTime,
      completedDateTime: statusData.completedDateTime,
      statusChangedDateTime: statusData.statusChangedDateTime,
      recipients: statusData.recipients
    });

  } catch (error) {
    console.error('Erro ao obter status:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});