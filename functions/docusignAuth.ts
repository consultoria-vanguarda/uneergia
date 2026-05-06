const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obter variáveis de ambiente
    const clientId = Deno.env.get("DOCUSIGN_INTEGRATION_KEY");
    const userId = Deno.env.get("DOCUSIGN_USER_ID");
    const privateKey = Deno.env.get("DOCUSIGN_PRIVATE_KEY");
    const authServer = Deno.env.get("DOCUSIGN_AUTH_SERVER") || "account-d.docusign.com";
    
    if (!clientId || !userId || !privateKey) {
      await db.asServiceRole.entities.IntegrationLog.create({
        provider: "DocuSign",
        action: "auth",
        success: false,
        errorMessage: "Credenciais DocuSign não configuradas"
      });
      
      return Response.json({ 
        error: 'Credenciais DocuSign não configuradas. Configure DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID e DOCUSIGN_PRIVATE_KEY.' 
      }, { status: 500 });
    }

    // Criar JWT
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = {
      alg: "RS256",
      typ: "JWT"
    };
    
    const jwtPayload = {
      iss: clientId,
      sub: userId,
      aud: authServer,
      iat: now,
      exp: now + 3600,
      scope: "signature impersonation"
    };

    // Encode JWT (simplificado - em produção use biblioteca)
    const base64UrlEncode = (obj) => {
      return btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const headerEncoded = base64UrlEncode(jwtHeader);
    const payloadEncoded = base64UrlEncode(jwtPayload);
    const dataToSign = `${headerEncoded}.${payloadEncoded}`;

    // Importar chave privada e assinar
    const pemKey = privateKey.replace(/\\n/g, '\n');
    const keyData = pemKey
      .replace('-----BEGIN RSA PRIVATE KEY-----', '')
      .replace('-----END RSA PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(dataToSign)
    );

    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const assertion = `${dataToSign}.${signatureBase64}`;

    // Trocar JWT por access token
    const tokenResponse = await fetch(`https://${authServer}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: assertion
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      
      await db.asServiceRole.entities.IntegrationLog.create({
        provider: "DocuSign",
        action: "auth",
        success: false,
        errorMessage: `Erro ao obter token: ${errorText}`,
        responseMeta: { status: tokenResponse.status }
      });
      
      return Response.json({ 
        error: 'Erro ao autenticar com DocuSign',
        details: errorText 
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();

    // Obter informações do usuário (accountId e baseUrl)
    const userInfoResponse = await fetch('https://account-d.docusign.com/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      return Response.json({ 
        error: 'Erro ao obter informações do usuário' 
      }, { status: 500 });
    }

    const userInfo = await userInfoResponse.json();
    const account = userInfo.accounts[0];

    await db.asServiceRole.entities.IntegrationLog.create({
      provider: "DocuSign",
      action: "auth",
      success: true,
      responseMeta: {
        accountId: account.account_id,
        baseUri: account.base_uri
      }
    });

    return Response.json({
      success: true,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      accountId: account.account_id,
      baseUri: account.base_uri,
      accountName: account.account_name
    });

  } catch (error) {
    console.error('Erro na autenticação DocuSign:', error);
    
    const base44 = createClientFromRequest(req);
    await db.asServiceRole.entities.IntegrationLog.create({
      provider: "DocuSign",
      action: "auth",
      success: false,
      errorMessage: error.message
    });
    
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});