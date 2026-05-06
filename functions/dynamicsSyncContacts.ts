const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sincroniza contatos do sistema com Dynamics 365
 * Cria ou atualiza contatos (accounts/contacts) no Dynamics
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contatos, direction = 'to_dynamics' } = await req.json();

    // Obter token de autenticação
    const authResponse = await db.functions.invoke('dynamicsAuth', {});
    
    if (!authResponse.data.success) {
      return Response.json({ 
        error: 'Falha ao autenticar com Dynamics 365' 
      }, { status: 500 });
    }

    const { access_token, resource_url } = authResponse.data;

    const results = {
      success: [],
      errors: []
    };

    if (direction === 'to_dynamics') {
      // Enviar contatos para o Dynamics
      const contatosToSync = contatos || await db.entities.Contato.list();

      for (const contato of contatosToSync) {
        try {
          // Mapear dados do contato para formato do Dynamics
          const dynamicsContact = {
            firstname: contato.nome,
            lastname: contato.sobrenome || '',
            emailaddress1: contato.email,
            telephone1: contato.telefone || '',
            mobilephone: contato.celular || '',
            address1_city: contato.cidade || '',
            address1_stateorprovince: contato.estado || '',
            address1_postalcode: contato.cep || '',
            address1_line1: contato.endereco || '',
            // Campos customizados (ajustar conforme schema do Dynamics)
            new_distribuidora: contato.distribuidora || '',
            new_numeroinstalacao: contato.numero_instalacao || '',
            new_consumomediokwh: contato.consumo_medio_kwh || null,
            new_valorcontamedia: contato.valor_conta_media || null,
            new_cpfcnpj: contato.cpf_cnpj || ''
          };

          // Verificar se contato já existe no Dynamics (se tiver dynamics_id salvo)
          const dynamicsId = contato.dynamics_contact_id;
          
          let response;
          if (dynamicsId) {
            // Atualizar contato existente
            response = await fetch(
              `${resource_url}/api/data/v9.2/contacts(${dynamicsId})`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${access_token}`,
                  'Content-Type': 'application/json',
                  'OData-MaxVersion': '4.0',
                  'OData-Version': '4.0'
                },
                body: JSON.stringify(dynamicsContact)
              }
            );
          } else {
            // Criar novo contato
            response = await fetch(
              `${resource_url}/api/data/v9.2/contacts`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${access_token}`,
                  'Content-Type': 'application/json',
                  'OData-MaxVersion': '4.0',
                  'OData-Version': '4.0',
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(dynamicsContact)
              }
            );
          }

          if (response.ok) {
            const createdContact = dynamicsId ? null : await response.json();
            
            // Salvar ID do Dynamics no contato local
            if (createdContact && createdContact.contactid) {
              await db.asServiceRole.entities.Contato.update(contato.id, {
                dynamics_contact_id: createdContact.contactid
              });
            }

            results.success.push({
              local_id: contato.id,
              dynamics_id: dynamicsId || createdContact?.contactid,
              nome: contato.nome,
              action: dynamicsId ? 'updated' : 'created'
            });
          } else {
            const error = await response.text();
            results.errors.push({
              local_id: contato.id,
              nome: contato.nome,
              error: error
            });
          }
        } catch (error) {
          results.errors.push({
            local_id: contato.id,
            nome: contato.nome,
            error: error.message
          });
        }
      }
    } else if (direction === 'from_dynamics') {
      // Buscar contatos do Dynamics e importar para o sistema
      const response = await fetch(
        `${resource_url}/api/data/v9.2/contacts?$select=contactid,firstname,lastname,emailaddress1,telephone1,mobilephone,address1_city,address1_stateorprovince,new_distribuidora,new_consumomediokwh`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        for (const dynamicsContact of data.value) {
          try {
            // Verificar se já existe localmente
            const existing = await db.asServiceRole.entities.Contato.filter({
              dynamics_contact_id: dynamicsContact.contactid
            });

            const contatoData = {
              nome: dynamicsContact.firstname || '',
              sobrenome: dynamicsContact.lastname || '',
              email: dynamicsContact.emailaddress1 || '',
              telefone: dynamicsContact.telephone1 || '',
              celular: dynamicsContact.mobilephone || '',
              cidade: dynamicsContact.address1_city || '',
              estado: dynamicsContact.address1_stateorprovince || '',
              distribuidora: dynamicsContact.new_distribuidora || '',
              consumo_medio_kwh: dynamicsContact.new_consumomediokwh || null,
              dynamics_contact_id: dynamicsContact.contactid,
              tipo: 'lead',
              status: 'novo'
            };

            if (existing.length > 0) {
              await db.asServiceRole.entities.Contato.update(existing[0].id, contatoData);
              results.success.push({ action: 'updated', dynamics_id: dynamicsContact.contactid });
            } else {
              await db.asServiceRole.entities.Contato.create(contatoData);
              results.success.push({ action: 'created', dynamics_id: dynamicsContact.contactid });
            }
          } catch (error) {
            results.errors.push({
              dynamics_id: dynamicsContact.contactid,
              error: error.message
            });
          }
        }
      }
    }

    return Response.json({
      success: true,
      total: results.success.length + results.errors.length,
      synced: results.success.length,
      failed: results.errors.length,
      results: results
    });

  } catch (error) {
    console.error('Erro na sincronização:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});