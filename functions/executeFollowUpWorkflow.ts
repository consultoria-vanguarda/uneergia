const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await db.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workflow_id, entidade_id, entidade_tipo } = await req.json();

        // Buscar workflow
        const workflows = await db.entities.FollowUpWorkflow.filter({ id: workflow_id });
        const workflow = workflows[0];

        if (!workflow || !workflow.ativo) {
            return Response.json({ error: 'Workflow não encontrado ou inativo' }, { status: 404 });
        }

        // Buscar entidade alvo
        let entidade;
        if (entidade_tipo === 'Lead') {
            const leads = await db.entities.Lead.filter({ id: entidade_id });
            entidade = leads[0];
        } else if (entidade_tipo === 'Contato') {
            const contatos = await db.entities.Contato.filter({ id: entidade_id });
            entidade = contatos[0];
        } else if (entidade_tipo === 'Oportunidade') {
            const oportunidades = await db.entities.Oportunidade.filter({ id: entidade_id });
            entidade = oportunidades[0];
        }

        if (!entidade) {
            return Response.json({ error: 'Entidade não encontrada' }, { status: 404 });
        }

        const results = [];

        // Executar ações do workflow
        for (const acao of workflow.acoes || []) {
            const dataAgendada = new Date();
            dataAgendada.setDate(dataAgendada.getDate() + (acao.delay_dias || 0));

            if (acao.tipo === 'tarefa') {
                // Criar tarefa de follow-up
                const task = await db.entities.FollowUpTask.create({
                    titulo: `Follow-up: ${entidade.nome || entidade.primeiro_nome || entidade.titulo}`,
                    descricao: `Tarefa automática do workflow: ${workflow.nome}`,
                    entidade_tipo: entidade_tipo,
                    entidade_id: entidade_id,
                    entidade_nome: entidade.nome || entidade.primeiro_nome || entidade.titulo,
                    workflow_id: workflow_id,
                    atribuido_para: acao.atribuir_para || user.email,
                    data_agendada: dataAgendada.toISOString(),
                    status: 'pendente',
                    tipo_acao: 'ligar',
                    prioridade: 'media'
                });
                results.push({ tipo: 'tarefa', task_id: task.id });
            } else if (acao.tipo === 'email') {
                // Buscar template se especificado
                let emailBody = `Follow-up automático para ${entidade.nome || entidade.primeiro_nome}`;
                let emailSubject = `Follow-up - ${workflow.nome}`;

                if (acao.template_id) {
                    const templates = await db.entities.FollowUpTemplate.filter({ id: acao.template_id });
                    const template = templates[0];
                    if (template) {
                        emailSubject = template.assunto || emailSubject;
                        emailBody = template.corpo || emailBody;

                        // Substituir variáveis
                        const vars = {
                            '{{nome}}': entidade.nome || entidade.primeiro_nome || '',
                            '{{empresa}}': entidade.empresa || '',
                            '{{telefone}}': entidade.telefone || entidade.telefone_comercial || '',
                            '{{email}}': entidade.email || ''
                        };
                        
                        for (const [key, value] of Object.entries(vars)) {
                            emailBody = emailBody.replaceAll(key, value);
                            emailSubject = emailSubject.replaceAll(key, value);
                        }
                    }
                }

                // Enviar email (programado)
                if (entidade.email) {
                    // Criar tarefa para envio de email
                    await db.entities.FollowUpTask.create({
                        titulo: `Enviar email: ${emailSubject}`,
                        descricao: emailBody,
                        entidade_tipo: entidade_tipo,
                        entidade_id: entidade_id,
                        entidade_nome: entidade.nome || entidade.primeiro_nome || entidade.titulo,
                        workflow_id: workflow_id,
                        atribuido_para: acao.atribuir_para || user.email,
                        data_agendada: dataAgendada.toISOString(),
                        status: 'pendente',
                        tipo_acao: 'email',
                        prioridade: 'media'
                    });
                    results.push({ tipo: 'email_agendado', para: entidade.email });
                }
            } else if (acao.tipo === 'notificacao') {
                // Criar notificação
                await db.entities.Atividade.create({
                    tipo: 'nota',
                    assunto: `Notificação: ${workflow.nome}`,
                    descricao: `Workflow executado para ${entidade.nome || entidade.primeiro_nome}`,
                    proprietario: acao.atribuir_para || user.email,
                    status: 'concluido',
                    data_atividade: new Date().toISOString()
                });
                results.push({ tipo: 'notificacao' });
            }
        }

        return Response.json({
            success: true,
            workflow: workflow.nome,
            acoes_executadas: results.length,
            detalhes: results
        });
    } catch (error) {
        console.error('Erro ao executar workflow:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});