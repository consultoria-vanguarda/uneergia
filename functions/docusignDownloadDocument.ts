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

    // Baixar documento combinado
    const docResponse = await fetch(
      `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!docResponse.ok) {
      const errorText = await docResponse.text();
      
      await db.asServiceRole.entities.IntegrationLog.create({
        provider: "DocuSign",
        action: "downloadDocument",
        success: false,
        envelopeId: envelopeId,
        errorMessage: errorText
      });
      
      return Response.json({ 
        error: 'Erro ao baixar documento',
        details: errorText 
      }, { status: 500 });
    }

    const pdfBlob = await docResponse.blob();

    // Fazer upload para storage do Base44
    const uploadResponse = await db.asServiceRole.integrations.Core.UploadFile({ 
      file: pdfBlob 
    });

    // Atualizar no banco
    if (envelopeDbId) {
      await db.asServiceRole.entities.DocusignEnvelope.update(envelopeDbId, {
        signedDocumentUrl: uploadResponse.file_url
      });
    }

    await db.asServiceRole.entities.IntegrationLog.create({
      provider: "DocuSign",
      action: "downloadDocument",
      success: true,
      envelopeId: envelopeId,
      responseMeta: { fileUrl: uploadResponse.file_url }
    });

    return Response.json({
      success: true,
      fileUrl: uploadResponse.file_url
    });

  } catch (error) {
    console.error('Erro ao baixar documento:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});