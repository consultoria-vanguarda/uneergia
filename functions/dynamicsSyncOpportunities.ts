const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sincroniza oportunidades do sistema com Dynamics 365
 * Cria ou atualiza oportunidades no Dynamics
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { oportunidades, direction = 'to_dynamics' } = await req.json();

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
      // Enviar oportunidades para o Dynamics
      const oportunidadesToSync = oportunidades || await db.entities.Oportunidade.list();

      // Mapear estágios para IDs do Dynamics (ajustar conforme configuração)
      const estagioMap = {
        'qualificacao': 0,
        'analise_consumo': 1,
        'proposta_enviada': 2,
        'negociacao': 3,
        'documentacao': 4,
        'ganho': 5,
        'perdido': 6
      };

      for (const opp of oportunidadesToSync) {
        try {
          // Buscar contato relacionado para obter dynamics_contact_id
          let customerid = null;
          if (opp.contato_id) {
            const contatos = await db.asServiceRole.entities.Contato.filter({
              id: opp.contato_id
            });
            if (contatos.length > 0 && contatos[0].dynamics_contact_id) {
              customerid = `contacts(${contatos[0].dynamics_contact_id})`;
            }
          }

          // Mapear dados da oportunidade para formato do Dynamics
          const dynamicsOpportunity = {
            name: opp.titulo,
            estimatedvalue: opp.valor_proposta_mensal ? (opp.valor_proposta_mensal * 12) : null,
            closeprobability: opp.probabilidade || null,
            estimatedclosedate: opp.data_inicio_injecao || null,
            description: opp.descricao || '',
            // Campos customizados (ajustar conforme schema)
            new_consumokwh: opp.consumo_kwh || null,
            new_economiamesestimada: opp.economia_estimada_reais || null,
            new_economiapercentual: opp.economia_estimada_percentual || null,
            new_valorpropostamensal: opp.valor_proposta_mensal || null,
            new_usinaparceira: opp.usina_parceira || '',
            stepname: opp.estagio || 'qualificacao'
          };

          // Adicionar referência ao cliente se disponível
          if (customerid) {
            dynamicsOpportunity['customerid@odata.bind'] = `/${customerid}`;
          }

          const dynamicsId = opp.dynamics_opportunity_id;
          
          let response;
          if (dynamicsId) {
            // Atualizar oportunidade existente
            response = await fetch(
              `${resource_url}/api/data/v9.2/opportunities(${dynamicsId})`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${access_token}`,
                  'Content-Type': 'application/json',
                  'OData-MaxVersion': '4.0',
                  'OData-Version': '4.0'
                },
                body: JSON.stringify(dynamicsOpportunity)
              }
            );
          } else {
            // Criar nova oportunidade
            response = await fetch(
              `${resource_url}/api/data/v9.2/opportunities`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${access_token}`,
                  'Content-Type': 'application/json',
                  'OData-MaxVersion': '4.0',
                  'OData-Version': '4.0',
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(dynamicsOpportunity)
              }
            );
          }

          if (response.ok) {
            const createdOpp = dynamicsId ? null : await response.json();
            
            // Salvar ID do Dynamics na oportunidade local
            if (createdOpp && createdOpp.opportunityid) {
              await db.asServiceRole.entities.Oportunidade.update(opp.id, {
                dynamics_opportunity_id: createdOpp.opportunityid
              });
            }

            results.success.push({
              local_id: opp.id,
              dynamics_id: dynamicsId || createdOpp?.opportunityid,
              titulo: opp.titulo,
              action: dynamicsId ? 'updated' : 'created'
            });
          } else {
            const error = await response.text();
            results.errors.push({
              local_id: opp.id,
              titulo: opp.titulo,
              error: error
            });
          }
        } catch (error) {
          results.errors.push({
            local_id: opp.id,
            titulo: opp.titulo,
            error: error.message
          });
        }
      }
    } else if (direction === 'from_dynamics') {
      // Buscar oportunidades do Dynamics
      const response = await fetch(
        `${resource_url}/api/data/v9.2/opportunities?$select=opportunityid,name,estimatedvalue,closeprobability,estimatedclosedate,description,stepname&$expand=customerid_contact($select=contactid)`,
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
        
        for (const dynamicsOpp of data.value) {
          try {
            // Buscar contato local pelo dynamics_contact_id
            let contato_id = null;
            let contato_nome = '';
            
            if (dynamicsOpp.customerid_contact?.contactid) {
              const contatos = await db.asServiceRole.entities.Contato.filter({
                dynamics_contact_id: dynamicsOpp.customerid_contact.contactid
              });
              if (contatos.length > 0) {
                contato_id = contatos[0].id;
                contato_nome = `${contatos[0].nome} ${contatos[0].sobrenome || ''}`;
              }
            }

            const oppData = {
              titulo: dynamicsOpp.name || '',
              contato_id: contato_id,
              contato_nome: contato_nome,
              valor_proposta_mensal: dynamicsOpp.estimatedvalue ? (dynamicsOpp.estimatedvalue / 12) : null,
              probabilidade: dynamicsOpp.closeprobability || null,
              data_inicio_injecao: dynamicsOpp.estimatedclosedate || null,
              descricao: dynamicsOpp.description || '',
              estagio: dynamicsOpp.stepname || 'qualificacao',
              dynamics_opportunity_id: dynamicsOpp.opportunityid
            };

            // Verificar se já existe localmente
            const existing = await db.asServiceRole.entities.Oportunidade.filter({
              dynamics_opportunity_id: dynamicsOpp.opportunityid
            });

            if (existing.length > 0) {
              await db.asServiceRole.entities.Oportunidade.update(existing[0].id, oppData);
              results.success.push({ action: 'updated', dynamics_id: dynamicsOpp.opportunityid });
            } else {
              if (contato_id) {
                await db.asServiceRole.entities.Oportunidade.create(oppData);
                results.success.push({ action: 'created', dynamics_id: dynamicsOpp.opportunityid });
              } else {
                results.errors.push({
                  dynamics_id: dynamicsOpp.opportunityid,
                  error: 'Contato relacionado não encontrado no sistema local'
                });
              }
            }
          } catch (error) {
            results.errors.push({
              dynamics_id: dynamicsOpp.opportunityid,
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