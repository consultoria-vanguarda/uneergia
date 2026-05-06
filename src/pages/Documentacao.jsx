const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

const sections = [
  {
    id: "visao-geral",
    title: "🌟 Visão Geral do Sistema",
    content: `
**SolarCredits CRM** é um sistema de gestão comercial focado na venda de créditos de energia solar (Geração Distribuída).

Gerencia o ciclo completo de vendas: da captação de leads à assinatura de contratos e faturamento.

**Tecnologias:**
- Frontend: React 18 + Tailwind CSS + shadcn/ui
- Backend: Deno Deploy (funções serverless)
- Banco de Dados: Base44 BaaS
- Integrações: DocuSign, Microsoft Dynamics 365
    `
  },
  {
    id: "estrutura",
    title: "🗂️ Estrutura de Arquivos",
    content: `
\`\`\`
/
├── pages/              → Telas da aplicação
├── components/
│   ├── crm/            → Componentes do CRM
│   ├── dashboard/      → Componentes do dashboard
│   ├── financeiro/     → Componentes financeiros
│   └── ui/             → Componentes base (shadcn)
├── entities/           → Schemas do banco (JSON)
├── functions/          → Funções de backend (Deno)
├── Layout.js           → Layout principal (sidebar + header)
└── globals.css         → Estilos globais
\`\`\`
    `
  },
  {
    id: "modulos",
    title: "📦 Módulos — Páginas",
    content: `
### 🏠 Dashboard — \`pages/Dashboard.jsx\`
KPIs e resumo do sistema. Métricas: total de clientes, leads qualificados, oportunidades abertas, receita estimada.
**Para alterar métricas:** linhas 27–41. Cards e layout: linhas 43–207.

---

### 👤 Leads — \`pages/Leads.jsx\`
Gestão de leads (potenciais clientes). Cadastro, busca, qualificação (→ Contato).
- Status: novo, contatado, qualificado, desqualificado
- Origens: site, indicação, telefone, evento, marketing
**Para alterar:** campos do formulário no estado \`formData\` e no Dialog; colunas no array \`columns\`; lógica de qualificação em \`handleQualify\`.

---

### 👥 Contatos — \`pages/Contatos.jsx\`
Registro central do cliente. Cadastro/edição, timeline de atividades, upload de documentos.
Dados de consumo: kWh, valor médio da conta, distribuidora.
**Para alterar:** colunas (~linha 101); formulário no Dialog (~linha 176+); painel lateral (Sheet) com TabsContent.

---

### ⚡ Unidades Consumidoras — \`pages/UnidadesConsumidoras.jsx\`
UCs dos clientes (número de instalação na distribuidora).
- Tipos de tarifa: B1 convencional/branca, B3 comercial, A4 industrial
- Disponibilidade: mono/bi/trifásico
- Status: criada, ativa, pendente_aprovacao, inativa
**Para alterar:** adicionar concessionária/tarifa nos SelectItems do formulário; colunas no array \`columns\` (~linha 99).

---

### 🏭 Usinas — \`pages/Usinas.jsx\`
Usinas parceiras que fornecem créditos de energia. CRUD completo.
- Múltiplas distribuidoras e estados por usina
- Dados de comissão, desconto, benefícios fiscais
- Integração via API (endpoint + chave)
**Para alterar:** adicionar distribuidora (~linha 339); adicionar estado (~linha 416); campos de comissão nas linhas seguintes.

---

### 📊 Análise de Usinas — \`pages/AnaliseUsinas.jsx\`
Dashboard comparativo de usinas (preços, descontos, comissões, capacidade).

---

### 🎯 Oportunidades — \`pages/Oportunidades.jsx\`
Pipeline de vendas. Estágios: qualificacao → analise_consumo → proposta_enviada → negociacao → documentacao → ganho/perdido.
**Para alterar:** estágios em \`entities/Oportunidade.json\` + mapeamento de cores no array \`stageColors\`.

---

### 📋 Propostas — \`pages/Propostas.jsx\`
Propostas comerciais. Geração automática de número. Cálculo: valor anual = mensal × 12. Assinatura digital integrada.
- Status: valida, aguardando_aprovacao, aprovada, rejeitada, expirada
**Para alterar:** número da proposta (linha 55); cálculo de valor (linha 56); campos no Dialog.

---

### 📄 Contratos — \`pages/Contratos.jsx\`
Contratos assinados. Análise de crédito + assinatura DocuSign. Upload de documentos.
- Status: aguardando_aprovacao, aprovado, ativo, suspenso, cancelado, concluido
**Para alterar:** duração padrão (\`duracao_meses: "12"\`); status de crédito em \`creditoColors\` (~linha 187).

---

### 📅 Atividades — \`pages/Atividades.jsx\`
Timeline de interações (chamadas, emails, reuniões, notas). Watchdog de 10s para operações lentas.
**Para alterar:** tipos de atividade nos SelectItems + enum em \`entities/Atividade.json\`; visual em \`components/crm/TimelineActivity.jsx\`.

---

### 🤖 Automação — \`pages/Automacao.jsx\`
Workflows de follow-up, templates de email/SMS e fila de tarefas.
- Workflows: disparados por mudança de status ou tempo
- Templates: variáveis \`{{nome}}\`, \`{{empresa}}\`
**Para alterar:** novo tipo de ação em \`entities/FollowUpWorkflow.json\` + \`functions/executeFollowUpWorkflow.js\`.

---

### 💰 Financeiro — \`pages/Financeiro.jsx\`
Boletos e transações. Importação de extratos OFX/CSV.
**Para alterar:** \`components/financeiro/BoletoCard.jsx\` e \`components/financeiro/ImportModal.jsx\`.

---

### 🔗 Integração Dynamics 365 — \`pages/IntegracaoDynamics.jsx\`
Sincronização bidirecional com Microsoft Dynamics 365 (Contatos, Oportunidades, UCs, Propostas, Contratos).
**Para alterar:** funções \`functions/dynamicsAuth.js\`, \`functions/dynamicsSyncContacts.js\`, \`functions/dynamicsSyncOpportunities.js\`.

---

### 📝 Cadastro de Lead (Público) — \`pages/CadastroLead.jsx\`
Formulário público de captação (landing page). Não requer login. Chama \`functions/createLeadPublic.js\`.
    `
  },
  {
    id: "entidades",
    title: "🗃️ Entidades (Banco de Dados)",
    content: `
Todas em \`entities/NomeDaEntidade.json\`.

| Entidade | Descrição |
|---|---|
| \`Lead\` | Leads captados, pré-qualificação |
| \`Contato\` | Clientes qualificados — registro central do CRM |
| \`Oportunidade\` | Negociações em andamento |
| \`UnidadeConsumidora\` | UCs dos clientes |
| \`Proposta\` | Propostas comerciais |
| \`Contrato\` | Contratos assinados |
| \`Usina\` | Usinas parceiras |
| \`Cliente\` | Clientes ativos (módulo legado) |
| \`Atividade\` | Timeline de interações |
| \`Boleto\` | Boletos emitidos |
| \`Transacao\` | Transações financeiras |
| \`FollowUpWorkflow\` | Regras de automação |
| \`FollowUpTemplate\` | Templates de email/SMS |
| \`FollowUpTask\` | Tarefas geradas por workflows |
| \`DocusignEnvelope\` | Envelopes DocuSign |
| \`IntegrationLog\` | Log de integrações externas |

**Para adicionar um campo:**
1. Abra \`entities/NomeDaEntidade.json\`
2. Adicione em \`"properties"\`: \`"novo_campo": { "type": "string", "description": "..." }\`
3. Se obrigatório, adicione ao array \`"required"\`
4. Atualize o formulário na página correspondente
    `
  },
  {
    id: "functions",
    title: "⚙️ Funções de Backend",
    content: `
Localizadas em \`functions/\`. Handlers HTTP executados no servidor (Deno).

| Função | O que faz |
|---|---|
| \`createLeadPublic\` | Cria lead via formulário público (sem autenticação) |
| \`qualifyLead\` | Qualifica lead e cria Contato |
| \`executeFollowUpWorkflow\` | Executa ações de um workflow de automação |
| \`gerarPDFAssinado\` | Gera PDF com assinatura digital |
| \`docusignAuth\` | Autenticação com DocuSign |
| \`docusignCreateEnvelope\` | Cria envelope de assinatura |
| \`docusignGetStatus\` | Verifica status de envelope |
| \`docusignDownloadDocument\` | Baixa documento assinado |
| \`docusignVoidEnvelope\` | Cancela envelope |
| \`docusignWebhook\` | Recebe notificações do DocuSign |
| \`dynamicsAuth\` | Autenticação com Dynamics 365 |
| \`dynamicsQuery\` | Consulta dados do Dynamics |
| \`dynamicsSyncContacts\` | Sincroniza contatos com Dynamics |
| \`dynamicsSyncOpportunities\` | Sincroniza oportunidades com Dynamics |

**Para chamar uma função no frontend:**
\`await db.functions.invoke('nomeDaFuncao', { param: valor })\`

**Para testar:** Dashboard → Code → Functions → selecionar a função
    `
  },
  {
    id: "componentes",
    title: "🧩 Componentes Reutilizáveis",
    content: `
### CRM (\`components/crm/\`)
| Componente | Uso |
|---|---|
| \`CommandBar\` | Barra de ações (Novo, Refresh, Exportar...) |
| \`DataGrid\` | Tabela com loading, estado vazio e ordenação |
| \`TimelineActivity\` | Item visual da timeline de atividades |
| \`AtividadeErrorBoundary\` | Error boundary para a tela de atividades |

### Gerais (\`components/\`)
| Componente | Uso |
|---|---|
| \`DocumentUploader\` | Upload de arquivos com preview |
| \`AssinaturaDigital\` | Modal de assinatura digital (canvas + PDF) |

### Dashboard (\`components/dashboard/\`)
| Componente | Uso |
|---|---|
| \`StatCard\` | Card de KPI/métrica |
| \`RecentActivity\` | Lista de atividades recentes |

### Financeiro (\`components/financeiro/\`)
| Componente | Uso |
|---|---|
| \`BoletoCard\` | Card visual de boleto |
| \`ImportModal\` | Modal de importação OFX/CSV |
    `
  },
  {
    id: "layout",
    title: "🎨 Layout e Navegação",
    content: `
**Arquivo:** \`Layout.js\`

Composto por: sidebar esquerda colapsável + header superior + área de conteúdo.

### Grupos de Navegação
| Grupo | Itens |
|---|---|
| Geral | Home (Dashboard), Atividades |
| Cliente | Leads, Contatos |
| Vendas | Unidades Consumidoras, Usinas, Análise de Usinas, Propostas, Automação |
| Acompanhamento | Oportunidades |

**Para adicionar nova página ao menu:**
1. Crie \`pages/NovaPagina.jsx\`
2. Em \`Layout.js\`, adicione ao array \`navigationGroups\`:
\`\`\`js
{ name: "Nome Exibido", page: "NomeDaPagina", icon: IconeDoLucide }
\`\`\`

**Para alterar cores/tema:**
- Variáveis CSS: \`globals.css\`
- Cores da sidebar/header: classes Tailwind em \`Layout.js\`
- Cor primária: \`emerald-600\` (verde) e \`#0f6cbd\` (azul)
    `
  },
  {
    id: "fluxo",
    title: "🔄 Fluxo de Negócio",
    content: `
\`\`\`
[Formulário Público / Leads]
         ↓
    LEAD criado
    (pages/CadastroLead ou pages/Leads)
         ↓
  Qualificação → CONTATO criado
  (pages/Leads → functions/qualifyLead)
         ↓
    UC cadastrada
    (pages/UnidadesConsumidoras)
         ↓
   PROPOSTA criada e assinada
   (pages/Propostas + AssinaturaDigital)
         ↓
  CONTRATO criado
  (pages/Contratos)
         ↓
  Análise de crédito + DocuSign
         ↓
  Contrato ATIVO → Faturamento
  (pages/Financeiro)
\`\`\`
    `
  },
  {
    id: "integracoes",
    title: "🔌 Integrações Externas",
    content: `
### DocuSign (Assinatura Digital)
- Configuração: \`pages/DocuSignConfig.jsx\`
- Secrets: \`DOCUSIGN_INTEGRATION_KEY\`, \`DOCUSIGN_SECRET_KEY\`, \`DOCUSIGN_ACCOUNT_ID\`, \`DOCUSIGN_PRIVATE_KEY\`
- Webhook URL: Dashboard → Code → Functions → \`docusignWebhook\`
- Funções: \`docusignAuth\`, \`docusignCreateEnvelope\`, \`docusignGetStatus\`, \`docusignDownloadDocument\`, \`docusignVoidEnvelope\`, \`docusignWebhook\`

---

### Microsoft Dynamics 365
- Interface: \`pages/IntegracaoDynamics.jsx\`
- Secrets: \`DYNAMICS_CLIENT_ID\`, \`DYNAMICS_CLIENT_SECRET\`, \`DYNAMICS_TENANT_ID\`, \`DYNAMICS_RESOURCE_URL\`
- Funções: \`dynamicsAuth\`, \`dynamicsQuery\`, \`dynamicsSyncContacts\`, \`dynamicsSyncOpportunities\`
    `
  },
  {
    id: "guia",
    title: "🛠️ Guia de Alterações Rápidas",
    content: `
### ➕ Adicionar novo campo a uma entidade
1. Abra \`entities/NomeDaEntidade.json\`
2. Adicione em \`"properties"\`: \`"meu_campo": { "type": "string" }\`
3. Se obrigatório, adicione ao array \`"required"\`
4. Atualize o formulário na página correspondente

---

### ➕ Adicionar nova página
1. Crie \`pages/NovaPagina.jsx\` com \`export default function NovaPagina() { ... }\`
2. Adicione ao menu em \`Layout.js\` → array \`navigationGroups\`

---

### 📧 Alterar templates de email/SMS
- Via UI: \`pages/Automacao.jsx\` → aba Templates
- Variáveis disponíveis: \`{{nome}}\`, \`{{empresa}}\`
- Para adicionar variáveis: edite \`functions/executeFollowUpWorkflow.js\`

---

### 🤖 Alterar lógica de automação
- Regras/triggers: \`pages/Automacao.jsx\`
- Execução: \`functions/executeFollowUpWorkflow.js\`
- Schema: \`entities/FollowUpWorkflow.json\`

---

### 🔗 Adicionar nova integração externa
1. Crie a função em \`functions/novaIntegracao.js\`
2. Configure secrets: Dashboard → Settings → Environment Variables
3. Crie a interface na página correspondente
4. Chame via: \`await db.functions.invoke('novaIntegracao', params)\`

---

### 🎨 Alterar cores do sistema
- Tema geral: \`globals.css\` (variáveis CSS \`--primary\`, etc.)
- Sidebar/header: \`Layout.js\` (classes Tailwind)
- Cor verde: trocar \`emerald-600\` → outra cor Tailwind
- Cor azul (botões): trocar \`#0f6cbd\` → outro hex
    `
  }
];

export default function Documentacao() {
  const [activeSection, setActiveSection] = useState("visao-geral");

  const active = sections.find(s => s.id === activeSection);

  const renderContent = (text) => {
    const lines = text.trim().split('\n');
    const result = [];
    let inTable = false;
    let tableRows = [];
    let inCode = false;
    let codeLines = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('```')) {
        if (!inCode) {
          inCode = true;
          codeLines = [];
        } else {
          inCode = false;
          result.push(
            <pre key={i} className="bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto my-3 font-mono">
              {codeLines.join('\n')}
            </pre>
          );
          codeLines = [];
        }
        i++;
        continue;
      }

      if (inCode) {
        codeLines.push(line);
        i++;
        continue;
      }

      if (line.startsWith('|')) {
        if (!inTable) inTable = true;
        tableRows.push(line);
        i++;
        continue;
      } else if (inTable) {
        inTable = false;
        const rows = tableRows.filter(r => !r.replace(/\|/g, '').replace(/-/g, '').trim() === '');
        const validRows = tableRows.filter(r => !/^\|[-| ]+\|$/.test(r.trim()));
        const headers = validRows[0]?.split('|').filter(Boolean).map(h => h.trim());
        const dataRows = validRows.slice(1);
        result.push(
          <div key={`table-${i}`} className="overflow-x-auto my-3">
            <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  {headers?.map((h, idx) => (
                    <th key={idx} className="border border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, ridx) => {
                  const cells = row.split('|').filter(Boolean).map(c => c.trim());
                  return (
                    <tr key={ridx} className={ridx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      {cells.map((cell, cidx) => (
                        <td key={cidx} className="border border-slate-200 px-3 py-2 text-slate-600 font-mono text-xs">{cell}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        continue;
      }

      if (line.startsWith('### ')) {
        result.push(<h3 key={i} className="text-base font-bold text-slate-800 mt-5 mb-2">{line.replace('### ', '')}</h3>);
      } else if (line.startsWith('## ')) {
        result.push(<h2 key={i} className="text-lg font-bold text-slate-900 mt-6 mb-3">{line.replace('## ', '')}</h2>);
      } else if (line.startsWith('---')) {
        result.push(<hr key={i} className="my-4 border-slate-200" />);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const text = line.replace(/^[-*] /, '');
        result.push(
          <li key={i} className="text-sm text-slate-600 ml-4 mb-1 list-disc">
            {text.split(/(`[^`]+`)/).map((part, pi) =>
              part.startsWith('`') ? <code key={pi} className="bg-slate-100 text-emerald-700 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code> : part
            )}
          </li>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        result.push(<p key={i} className="text-sm font-bold text-slate-800 mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>);
      } else if (line.trim() === '') {
        result.push(<div key={i} className="h-1" />);
      } else {
        result.push(
          <p key={i} className="text-sm text-slate-600 mb-1 leading-relaxed">
            {line.split(/(`[^`]+`)/).map((part, pi) =>
              part.startsWith('`') ? <code key={pi} className="bg-slate-100 text-emerald-700 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code> : part
            )}
          </p>
        );
      }
      i++;
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-[#323130]">📚 Documentação do Sistema</h1>
        <p className="text-sm text-[#605e5c] mt-1">SolarCredits CRM — Guia completo de módulos e como alterá-los</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0">
          <nav className="p-3 space-y-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeSection === s.id
                    ? 'bg-emerald-50 text-emerald-700 font-medium border-l-2 border-emerald-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">
              {active?.title}
            </h2>
            <div>
              {active && renderContent(active.content)}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}