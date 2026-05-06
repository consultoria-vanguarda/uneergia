const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Webhook do DocuSign não requer autenticação de usuário
    const body = await req.json();
    
    const envelopeId = body.data?.envelopeId || body.envelopeId;
    const status = body.data?.envelopeSummary?.status || body.status;
    
    if (!envelopeId) {
      return Response.json({ error: 'envelopeId não encontrado' }, { status: 400 });
    }

    // Buscar envelope no banco
    const envelopes = await db.asServiceRole.entities.DocusignEnvelope.filter({
      envelopeId: envelopeId
    });

    if (envelopes.length === 0) {
      await db.asServiceRole.entities.IntegrationLog.create({
        provider: "DocuSign",
        action: "webhook",
        success: false,
        envelopeId: envelopeId,
        errorMessage: "Envelope não encontrado no sistema"
      });
      
      return Response.json({ 
        message: 'Envelope não encontrado',
        received: true 
      });
    }

    const envelope = envelopes[0];

    // Atualizar status
    const updateData = {
      status: status,
      lastStatusCheckAt: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }

    await db.asServiceRole.entities.DocusignEnvelope.update(
      envelope.id, 
      updateData
    );

    await db.asServiceRole.entities.IntegrationLog.create({
      provider: "DocuSign",
      action: "webhook",
      success: true,
      envelopeId: envelopeId,
      responseMeta: { 
        status: status,
        event: body.event 
      }
    });

    return Response.json({ 
      success: true,
      message: 'Webhook processado com sucesso' 
    });

  } catch (error) {
    console.error('Erro no webhook DocuSign:', error);
    
    const base44 = createClientFromRequest(req);
    await db.asServiceRole.entities.IntegrationLog.create({
      provider: "DocuSign",
      action: "webhook",
      success: false,
      errorMessage: error.message
    });
    
    return Response.json({ error: error.message }, { status: 500 });
  }
});