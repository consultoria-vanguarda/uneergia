const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { envelopeId, envelopeDbId, reason } = await req.json();

    // Autenticar
    const authResponse = await db.functions.invoke('docusignAuth', {});
    
    if (!authResponse.data.success) {
      return Response.json({ error: 'Erro na autenticação' }, { status: 500 });
    }

    const { accessToken, accountId, baseUri } = authResponse.data;

    // Cancelar envelope
    const voidResponse = await fetch(
      `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'voided',
          voidedReason: reason || 'Cancelado pelo usuário'
        })
      }
    );

    if (!voidResponse.ok) {
      const errorText = await voidResponse.text();
      
      await db.asServiceRole.entities.IntegrationLog.create({
        provider: "DocuSign",
        action: "voidEnvelope",
        success: false,
        envelopeId: envelopeId,
        errorMessage: errorText
      });
      
      return Response.json({ 
        error: 'Erro ao cancelar envelope',
        details: errorText 
      }, { status: 500 });
    }

    // Atualizar no banco
    if (envelopeDbId) {
      await db.asServiceRole.entities.DocusignEnvelope.update(envelopeDbId, {
        status: 'voided',
        errorLast: reason
      });
    }

    await db.asServiceRole.entities.IntegrationLog.create({
      provider: "DocuSign",
      action: "voidEnvelope",
      success: true,
      envelopeId: envelopeId,
      requestMeta: { reason }
    });

    return Response.json({
      success: true,
      message: 'Envelope cancelado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao cancelar envelope:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});