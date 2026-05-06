const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        if (req.method !== 'POST') {
            return Response.json({ error: 'Method not allowed' }, { status: 405 });
        }

        const leadData = await req.json();

        // Validate required fields
        if (!leadData.primeiro_nome || !leadData.telefone_comercial) {
            return Response.json({ 
                error: 'Campos obrigatórios faltando: primeiro_nome e telefone_comercial' 
            }, { status: 400 });
        }

        // Create lead using service role (no authentication required)
        const base44 = createClientFromRequest(req);
        
        const newLead = await db.asServiceRole.entities.Lead.create({
            primeiro_nome: leadData.primeiro_nome,
            sobrenome: leadData.sobrenome || '',
            tipo_cliente: leadData.tipo_cliente || 'pessoa_fisica',
            telefone_comercial: leadData.telefone_comercial,
            telefone_celular: leadData.telefone_celular || '',
            email: leadData.email || '',
            estado: leadData.estado || '',
            cidade: leadData.cidade || '',
            cliente_que_indicou: leadData.cliente_que_indicou || '',
            origem: leadData.origem || 'site',
            observacoes: leadData.observacoes || '',
            razao_status: 'novo'
        });

        return Response.json({ 
            success: true, 
            lead_id: newLead.id,
            message: 'Lead cadastrado com sucesso!'
        }, { status: 201 });

    } catch (error) {
        console.error('Erro ao criar lead:', error);
        return Response.json({ 
            error: 'Erro ao cadastrar lead',
            details: error.message 
        }, { status: 500 });
    }
});