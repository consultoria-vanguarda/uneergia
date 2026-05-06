const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// @ts-nocheck
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    // Auth check
    const user = await db.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { leadId } = await req.json();
    if (!leadId) {
      return Response.json({ error: 'leadId é obrigatório' }, { status: 400 });
    }

    // Fetch lead
    const lead = await db.entities.Lead.get(leadId);
    if (!lead) {
      return Response.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // ── Idempotência: se já qualificado, retorna dados existentes ──
    if (lead.razao_status === 'qualificado' && lead.cliente_id) {
      try {
        const existingCustomer = await db.entities.Contato.get(lead.cliente_id);
        return Response.json({
          lead,
          customer: existingCustomer,
          action: 'already_qualified',
        });
      } catch {
        // Referência quebrada — segue para re-qualificar
      }
    }

    // ── Normalizar chaves de dedup ──
    const normalizedEmail = lead.email?.trim().toLowerCase() || null;
    const normalizedPhone = lead.telefone_comercial?.replace(/\D/g, '') || null;

    // ── Buscar Contato existente (dedup por email → telefone) ──
    let existingCustomer: any = null;

    if (normalizedEmail) {
      try {
        const byEmail = await db.entities.Contato.filter({ email: normalizedEmail });
        if (byEmail?.length > 0) existingCustomer = byEmail[0];
      } catch { /* sem resultado */ }
    }

    if (!existingCustomer && lead.email && lead.email !== normalizedEmail) {
      try {
        const byEmailOriginal = await db.entities.Contato.filter({ email: lead.email });
        if (byEmailOriginal?.length > 0) existingCustomer = byEmailOriginal[0];
      } catch { /* sem resultado */ }
    }

    if (!existingCustomer && normalizedPhone) {
      try {
        const byPhone = await db.entities.Contato.filter({ telefone: lead.telefone_comercial });
        if (byPhone?.length > 0) existingCustomer = byPhone[0];
      } catch { /* sem resultado */ }
    }

    // ── Criar ou vincular Contato ──
    let customer: any;
    let action: string;

    if (existingCustomer) {
      // Preencher campos faltantes SEM sobrescrever dados existentes
      const updates: Record<string, any> = {};
      if (!existingCustomer.nome && lead.primeiro_nome) updates.nome = lead.primeiro_nome;
      if (!existingCustomer.sobrenome && lead.sobrenome) updates.sobrenome = lead.sobrenome;
      if (!existingCustomer.email && normalizedEmail) updates.email = normalizedEmail;
      if (!existingCustomer.telefone && lead.telefone_comercial) updates.telefone = lead.telefone_comercial;
      if (!existingCustomer.cidade && lead.cidade) updates.cidade = lead.cidade;
      if (!existingCustomer.estado && lead.estado) updates.estado = lead.estado;
      if (!existingCustomer.origem && lead.origem) updates.origem = lead.origem;

      // Sempre promover para cliente
      if (existingCustomer.tipo !== 'cliente') {
        updates.tipo = 'cliente';
      }

      if (Object.keys(updates).length > 0) {
        await db.entities.Contato.update(existingCustomer.id, updates);
        action = 'updated';
      } else {
        action = 'linked';
      }
      customer = { ...existingCustomer, ...updates };
    } else {
      // Criar novo Contato como cliente
      customer = await db.entities.Contato.create({
        nome: lead.primeiro_nome || '',
        sobrenome: lead.sobrenome || '',
        email: lead.email || '',
        telefone: lead.telefone_comercial || '',
        cidade: lead.cidade || '',
        estado: lead.estado || '',
        tipo: 'cliente',
        status: 'qualificado',
        origem: lead.origem || '',
      });
      action = 'created';
    }

    // ── Atualizar Lead (somente após sucesso do Contato) ──
    const updatedLead = await db.entities.Lead.update(leadId, {
      razao_status: 'qualificado',
      cliente_id: customer.id,
      data_qualificacao: new Date().toISOString(),
    });

    return Response.json({
      lead: updatedLead,
      customer,
      action,
    });
  } catch (error) {
    console.error('Erro ao qualificar lead:', error);
    return Response.json(
      { error: error.message || 'Erro interno ao qualificar lead' },
      { status: 500 }
    );
  }
});
