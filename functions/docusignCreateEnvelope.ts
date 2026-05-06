const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      subject, 
      message, 
      recipients, 
      documentBase64, 
      documentName,
      entityType,
      entityId
    } = await req.json();

    // Autenticar e obter token
    const authResponse = await db.functions.invoke('docusignAuth', {});
    
    if (!authResponse.data.success) {
      return Response.json({ 
        error: 'Erro na autenticação DocuSign' 
      }, { status: 500 });
    }

    const { accessToken, accountId, baseUri } = authResponse.data;

    // Criar envelope
    const envelopeDefinition = {
      emailSubject: subject,
      emailMessage: message,
      status: 'sent',
      documents: [{
        documentBase64: documentBase64,
        name: documentName || 'Documento.pdf',
        fileExtension: 'pdf',
        documentId: '1'
      }],
      recipients: {
        signers: recipients.map((r, idx) => ({
          email: r.email,
          name: r.name,
          recipientId: String(idx + 1),
          routingOrder: String(idx + 1),
          tabs: {
            signHereTabs: [{
              anchorString: '/s1/',
              anchorUnits: 'pixels',
              anchorXOffset: '0',
              anchorYOffset: '0',
              optional: 'false',
              documentId: '1',
              pageNumber: '1',
              xPosition: '100',
              yPosition: '200'
            }]
          }
        }))
      }
    };

    const envelopeResponse = await fetch(
      `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelopeDefinition)
      }
    );

    if (!envelopeResponse.ok) {
      const errorText = await envelopeResponse.text();
      
      await db.asServiceRole.entities.IntegrationLog.create({
        provider: "DocuSign",
        action: "createEnvelope",
        success: false,
        errorMessage: errorText,
        requestMeta: { subject, recipientCount: recipients.length }
      });
      
      return Response.json({ 
        error: 'Erro ao criar envelope',
        details: errorText 
      }, { status: 500 });
    }

    const envelopeData = await envelopeResponse.json();

    // Salvar no banco
    const envelope = await db.asServiceRole.entities.DocusignEnvelope.create({
      envelopeId: envelopeData.envelopeId,
      entityType: entityType || 'Outro',
      entityId: entityId || '',
      status: envelopeData.status || 'sent',
      subject: subject,
      message: message,
      recipients: recipients,
      sentAt: new Date().toISOString()
    });

    await db.asServiceRole.entities.IntegrationLog.create({
      provider: "DocuSign",
      action: "createEnvelope",
      success: true,
      envelopeId: envelopeData.envelopeId,
      requestMeta: { subject, recipientCount: recipients.length },
      responseMeta: { status: envelopeData.status }
    });

    return Response.json({
      success: true,
      envelopeId: envelopeData.envelopeId,
      status: envelopeData.status,
      envelope: envelope
    });

  } catch (error) {
    console.error('Erro ao criar envelope:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});