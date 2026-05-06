-- =============================================================
-- UneEnergia - Créditos Solares
-- schema.sql — Estrutura completa do banco de dados
-- Gerado em: 2026-03-27
-- =============================================================

-- Nota: este schema usa PostgreSQL como referência.
-- Os tipos JSONB são usados para campos array e object.
-- Adapte conforme o banco de destino (MySQL, SQLite, etc).

-- Extensão para UUID (PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- TABELA: usina
-- =============================================================
CREATE TABLE IF NOT EXISTS usina (
    id                        VARCHAR(64)    PRIMARY KEY,
    created_date              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_date              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    created_by                VARCHAR(255),

    nome                      VARCHAR(255)   NOT NULL,
    cnpj                      VARCHAR(20),
    distribuidoras            JSONB,                      -- array de strings (CEMIG, CPFL, etc)
    estados                   JSONB,                      -- array de strings
    preco_kwh                 NUMERIC(10,4)  NOT NULL,
    desconto_percentual       NUMERIC(5,2),
    isencao_tributaria        BOOLEAN        DEFAULT FALSE,
    incentivo_fiscal_percentual NUMERIC(5,2),
    tipo_comissao             VARCHAR(20)    CHECK (tipo_comissao IN ('desconto_conta','transferencia','ambos')),
    comissao_percentual       NUMERIC(5,2),
    comissao_valor_fixo       NUMERIC(10,2),
    capacidade_disponivel_kwh NUMERIC(14,2),
    contato_nome              VARCHAR(255),
    contato_email             VARCHAR(255),
    contato_telefone          VARCHAR(30),
    api_endpoint              TEXT,
    api_key                   TEXT,
    observacoes               TEXT,
    status                    VARCHAR(20)    DEFAULT 'ativa' CHECK (status IN ('ativa','inativa','em_negociacao'))
);

-- =============================================================
-- TABELA: contato
-- =============================================================
CREATE TABLE IF NOT EXISTS contato (
    id                   VARCHAR(64)   PRIMARY KEY,
    created_date         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by           VARCHAR(255),

    nome                 VARCHAR(255)  NOT NULL,
    sobrenome            VARCHAR(255),
    cpf_cnpj             VARCHAR(20),
    tipo_pessoa          VARCHAR(10)   DEFAULT 'fisica' CHECK (tipo_pessoa IN ('fisica','juridica')),
    cargo                VARCHAR(100),
    empresa              VARCHAR(255),
    email                VARCHAR(255)  NOT NULL,
    telefone             VARCHAR(30),
    celular              VARCHAR(30),
    distribuidora        VARCHAR(100),
    numero_instalacao    VARCHAR(100),
    consumo_medio_kwh    NUMERIC(10,2),
    valor_conta_media    NUMERIC(10,2),
    tipo                 VARCHAR(20)   DEFAULT 'lead' CHECK (tipo IN ('lead','prospect','cliente','inativo')),
    origem               VARCHAR(20)   DEFAULT 'site' CHECK (origem IN ('site','indicacao','evento','marketing','telefone','outro')),
    status               VARCHAR(20)   DEFAULT 'novo' CHECK (status IN ('novo','qualificado','ativo','inativo')),
    proprietario         VARCHAR(255),
    endereco             TEXT,
    cidade               VARCHAR(100),
    estado               VARCHAR(2),
    cep                  VARCHAR(9),
    observacoes          TEXT,
    documentos           JSONB,                          -- array de URLs
    dynamics_contact_id  VARCHAR(100)
);

-- =============================================================
-- TABELA: lead
-- =============================================================
CREATE TABLE IF NOT EXISTS lead (
    id                    VARCHAR(64)   PRIMARY KEY,
    created_date          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by            VARCHAR(255),

    primeiro_nome         VARCHAR(255)  NOT NULL,
    sobrenome             VARCHAR(255),
    tipo_cliente          VARCHAR(20)   DEFAULT 'pessoa_fisica' CHECK (tipo_cliente IN ('pessoa_fisica','pessoa_juridica')),
    telefone_comercial    VARCHAR(30)   NOT NULL,
    telefone_celular      VARCHAR(30),
    email                 VARCHAR(255),
    estado                VARCHAR(2),
    cidade                VARCHAR(100),
    cliente_que_indicou   VARCHAR(255),
    razao_status          VARCHAR(20)   DEFAULT 'novo' CHECK (razao_status IN ('pendente','novo','contatado','qualificado','desqualificado')),
    origem                VARCHAR(20)   DEFAULT 'site' CHECK (origem IN ('site','indicacao','telefone','evento','marketing','outro')),
    proprietario          VARCHAR(255),
    observacoes           TEXT,
    data_qualificacao     DATE,
    cliente_id            VARCHAR(64)   REFERENCES contato(id)
);

-- =============================================================
-- TABELA: oportunidade
-- =============================================================
CREATE TABLE IF NOT EXISTS oportunidade (
    id                           VARCHAR(64)   PRIMARY KEY,
    created_date                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by                   VARCHAR(255),

    titulo                       VARCHAR(255)  NOT NULL,
    contato_id                   VARCHAR(64)   NOT NULL REFERENCES contato(id),
    contato_nome                 VARCHAR(255),
    usina_parceira               VARCHAR(255),
    consumo_kwh                  NUMERIC(10,2),
    economia_estimada_percentual NUMERIC(5,2),
    economia_estimada_reais      NUMERIC(10,2),
    valor_proposta_mensal        NUMERIC(10,2),
    valor_total_anual            NUMERIC(12,2),
    probabilidade                NUMERIC(5,2),
    estagio                      VARCHAR(30)   DEFAULT 'qualificacao' CHECK (estagio IN ('qualificacao','analise_consumo','proposta_enviada','negociacao','documentacao','ganho','perdido')),
    data_inicio_injecao          DATE,
    data_fechamento_esperada     DATE,
    data_fechamento_real         DATE,
    proprietario                 VARCHAR(255),
    motivo_perda                 TEXT,
    descricao                    TEXT,
    proximos_passos              TEXT,
    documentos                   JSONB,
    dynamics_opportunity_id      VARCHAR(100)
);

-- =============================================================
-- TABELA: unidade_consumidora
-- =============================================================
CREATE TABLE IF NOT EXISTS unidade_consumidora (
    id                  VARCHAR(64)   PRIMARY KEY,
    created_date        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(255),

    numero_uc           VARCHAR(100)  NOT NULL,
    cliente_id          VARCHAR(64)   NOT NULL REFERENCES contato(id),
    cliente_nome        VARCHAR(255),
    lead_potencial_id   VARCHAR(64),
    concessionaria      VARCHAR(100)  NOT NULL,
    tipo_tarifa         VARCHAR(20)   DEFAULT 'b1_convencional' CHECK (tipo_tarifa IN ('b1_convencional','b1_branca','b3_comercial','a4_industrial')),
    disponibilidade     VARCHAR(20)   DEFAULT 'monofasico' CHECK (disponibilidade IN ('monofasico','bifasico','trifasico')),
    subclasse           VARCHAR(20)   DEFAULT 'residencial' CHECK (subclasse IN ('residencial','comercial','industrial','rural','publico')),
    portabilidade       VARCHAR(3)    DEFAULT 'nao' CHECK (portabilidade IN ('sim','nao')),
    possui_outro_sge    VARCHAR(3)    DEFAULT 'nao' CHECK (possui_outro_sge IN ('sim','nao')),
    consumo_medio_kwh   NUMERIC(10,2),
    valor_conta_media   NUMERIC(10,2),
    cep                 VARCHAR(9),
    logradouro          TEXT,
    numero              VARCHAR(20),
    complemento         VARCHAR(100),
    cidade              VARCHAR(100),
    estado              VARCHAR(2),
    status              VARCHAR(30)   DEFAULT 'criada' CHECK (status IN ('criada','ativa','pendente_aprovacao','inativa')),
    data_criacao        DATE
);

-- =============================================================
-- TABELA: proposta
-- =============================================================
CREATE TABLE IF NOT EXISTS proposta (
    id                     VARCHAR(64)   PRIMARY KEY,
    created_date           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by             VARCHAR(255),

    numero_proposta        VARCHAR(50),
    cliente_id             VARCHAR(64)   NOT NULL REFERENCES contato(id),
    cliente_nome           VARCHAR(255),
    lead_potencial_id      VARCHAR(64),
    uc_id                  VARCHAR(64)   NOT NULL REFERENCES unidade_consumidora(id),
    uc_numero              VARCHAR(100),
    parceiro_une_energia   VARCHAR(255),
    validade_proposta      DATE,
    consumo_kwh            NUMERIC(10,2),
    economia_percentual    NUMERIC(5,2),
    economia_reais_mes     NUMERIC(10,2),
    valor_proposta_mensal  NUMERIC(10,2),
    valor_proposta_anual   NUMERIC(12,2),
    desconto_aplicado      NUMERIC(5,2),
    razao_status           VARCHAR(30)   DEFAULT 'valida' CHECK (razao_status IN ('valida','aguardando_aprovacao','aprovada','rejeitada','expirada')),
    data_criacao           DATE,
    data_aprovacao         DATE,
    observacoes            TEXT,
    condicoes_diferenciadas TEXT,
    documentos             JSONB,
    contrato_id            VARCHAR(64)
);

-- =============================================================
-- TABELA: contrato
-- =============================================================
CREATE TABLE IF NOT EXISTS contrato (
    id                          VARCHAR(64)   PRIMARY KEY,
    created_date                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by                  VARCHAR(255),

    numero_contrato             VARCHAR(50),
    cliente_id                  VARCHAR(64)   NOT NULL REFERENCES contato(id),
    cliente_nome                VARCHAR(255),
    lead_potencial_id           VARCHAR(64),
    proposta_id                 VARCHAR(64)   NOT NULL REFERENCES proposta(id),
    uc_id                       VARCHAR(64)   NOT NULL REFERENCES unidade_consumidora(id),
    uc_numero                   VARCHAR(100),
    tipo_pessoa                 VARCHAR(10)   DEFAULT 'fisica' CHECK (tipo_pessoa IN ('fisica','juridica')),
    razao_status                VARCHAR(30)   DEFAULT 'aguardando_aprovacao' CHECK (razao_status IN ('aguardando_aprovacao','aprovado','ativo','suspenso','cancelado','concluido')),
    valor_plano_proposta        NUMERIC(10,2),
    valor_plano_contrato        NUMERIC(10,2),
    data_inicio                 DATE,
    data_fim                    DATE,
    duracao_meses               INTEGER       DEFAULT 12,
    resultado_analise_credito   VARCHAR(20)   DEFAULT 'pendente' CHECK (resultado_analise_credito IN ('aprovado','reprovado','reanalisar','pendente')),
    status_final_credito        VARCHAR(100),
    motivo_reprovacao           TEXT,
    docusign_status             VARCHAR(20)   DEFAULT 'nao_enviado' CHECK (docusign_status IN ('nao_enviado','enviado','assinado','concluido')),
    docusign_envelope_id        VARCHAR(100),
    condicoes_comerciais        TEXT,
    observacoes                 TEXT,
    data_assinatura             DATE,
    documentos                  JSONB
);

-- =============================================================
-- TABELA: boleto
-- =============================================================
CREATE TABLE IF NOT EXISTS boleto (
    id               VARCHAR(64)   PRIMARY KEY,
    created_date     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by       VARCHAR(255),

    cliente_id       VARCHAR(64)   NOT NULL REFERENCES contato(id),
    cliente_nome     VARCHAR(255),
    numero_boleto    VARCHAR(100),
    valor            NUMERIC(10,2) NOT NULL,
    data_vencimento  DATE          NOT NULL,
    data_pagamento   DATE,
    referencia_mes   VARCHAR(7),
    kwh_faturado     NUMERIC(10,2),
    status           VARCHAR(20)   DEFAULT 'pendente' CHECK (status IN ('pendente','pago','vencido','cancelado')),
    arquivo_url      TEXT,
    linha_digitavel  VARCHAR(100)
);

-- =============================================================
-- TABELA: transacao
-- =============================================================
CREATE TABLE IF NOT EXISTS transacao (
    id               VARCHAR(64)   PRIMARY KEY,
    created_date     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by       VARCHAR(255),

    tipo             VARCHAR(10)   DEFAULT 'entrada' CHECK (tipo IN ('entrada','saida')),
    categoria        VARCHAR(30)   DEFAULT 'boleto_cliente' CHECK (categoria IN ('boleto_cliente','pagamento_usina','comissao','despesa_operacional','outro')),
    descricao        TEXT,
    valor            NUMERIC(10,2) NOT NULL,
    data             DATE          NOT NULL,
    boleto_id        VARCHAR(64)   REFERENCES boleto(id),
    cliente_id       VARCHAR(64)   REFERENCES contato(id),
    usina_id         VARCHAR(64)   REFERENCES usina(id),
    comprovante_url  TEXT,
    origem_arquivo   VARCHAR(255)
);

-- =============================================================
-- TABELA: atividade
-- =============================================================
CREATE TABLE IF NOT EXISTS atividade (
    id                VARCHAR(64)   PRIMARY KEY,
    created_date      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by        VARCHAR(255),

    tipo              VARCHAR(20)   DEFAULT 'nota' CHECK (tipo IN ('chamada','email','reuniao','tarefa','nota','atualizacao')),
    assunto           VARCHAR(255)  NOT NULL,
    descricao         TEXT,
    contato_id        VARCHAR(64)   REFERENCES contato(id),
    oportunidade_id   VARCHAR(64)   REFERENCES oportunidade(id),
    data_atividade    TIMESTAMPTZ,
    duracao_minutos   INTEGER,
    status            VARCHAR(20)   DEFAULT 'concluido' CHECK (status IN ('agendado','concluido','cancelado')),
    proprietario      VARCHAR(255),
    participantes     JSONB,
    anexos            JSONB
);

-- =============================================================
-- TABELA: docusign_envelope
-- =============================================================
CREATE TABLE IF NOT EXISTS docusign_envelope (
    id                   VARCHAR(64)   PRIMARY KEY,
    created_date         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by           VARCHAR(255),

    envelope_id          VARCHAR(100)  NOT NULL,
    entity_type          VARCHAR(20)   DEFAULT 'Contrato' CHECK (entity_type IN ('Contrato','Proposta','Termo','Outro')),
    entity_id            VARCHAR(64),
    status               VARCHAR(20)   DEFAULT 'created' CHECK (status IN ('created','sent','delivered','completed','declined','voided')),
    subject              VARCHAR(255),
    message              TEXT,
    recipients           JSONB,
    sent_at              TIMESTAMPTZ,
    completed_at         TIMESTAMPTZ,
    last_status_check_at TIMESTAMPTZ,
    error_last           TEXT,
    signed_document_url  TEXT
);

-- =============================================================
-- TABELA: integration_log
-- =============================================================
CREATE TABLE IF NOT EXISTS integration_log (
    id             VARCHAR(64)   PRIMARY KEY,
    created_date   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by     VARCHAR(255),

    provider       VARCHAR(20)   DEFAULT 'DocuSign' CHECK (provider IN ('DocuSign','Dynamics365','Outro')),
    action         VARCHAR(100)  NOT NULL,
    request_meta   JSONB,
    response_meta  JSONB,
    success        BOOLEAN       DEFAULT TRUE,
    error_message  TEXT,
    envelope_id    VARCHAR(100)
);

-- =============================================================
-- TABELA: user_permission
-- =============================================================
CREATE TABLE IF NOT EXISTS user_permission (
    id                 VARCHAR(64)   PRIMARY KEY,
    created_date       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by         VARCHAR(255),

    user_email         VARCHAR(255)  NOT NULL,
    paginas_permitidas JSONB                               -- array de strings
);

-- =============================================================
-- TABELA: follow_up_workflow
-- =============================================================
CREATE TABLE IF NOT EXISTS follow_up_workflow (
    id               VARCHAR(64)   PRIMARY KEY,
    created_date     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by       VARCHAR(255),

    nome             VARCHAR(255)  NOT NULL,
    descricao        TEXT,
    entidade_alvo    VARCHAR(30)   CHECK (entidade_alvo IN ('Lead','Contato','Oportunidade')),
    trigger_condicao VARCHAR(30)   DEFAULT 'status_change' CHECK (trigger_condicao IN ('status_change','time_based','manual')),
    trigger_status   VARCHAR(50),
    delay_dias       INTEGER       DEFAULT 0,
    acoes            JSONB,
    ativo            BOOLEAN       DEFAULT TRUE
);

-- =============================================================
-- TABELA: follow_up_template
-- =============================================================
CREATE TABLE IF NOT EXISTS follow_up_template (
    id             VARCHAR(64)   PRIMARY KEY,
    created_date   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by     VARCHAR(255),

    nome           VARCHAR(255)  NOT NULL,
    tipo           VARCHAR(10)   DEFAULT 'email' CHECK (tipo IN ('email','sms')),
    assunto        VARCHAR(255),
    corpo          TEXT          NOT NULL,
    estagio_vendas VARCHAR(30)   CHECK (estagio_vendas IN ('lead_novo','qualificacao','proposta','negociacao','fechamento')),
    categoria      VARCHAR(30)   DEFAULT 'follow_up' CHECK (categoria IN ('boas_vindas','follow_up','proposta','lembrete','agradecimento'))
);

-- =============================================================
-- TABELA: follow_up_task
-- =============================================================
CREATE TABLE IF NOT EXISTS follow_up_task (
    id              VARCHAR(64)   PRIMARY KEY,
    created_date    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_date    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(255),

    titulo          VARCHAR(255)  NOT NULL,
    descricao       TEXT,
    entidade_tipo   VARCHAR(20)   CHECK (entidade_tipo IN ('Lead','Contato','Oportunidade')),
    entidade_id     VARCHAR(64)   NOT NULL,
    entidade_nome   VARCHAR(255),
    workflow_id     VARCHAR(64)   REFERENCES follow_up_workflow(id),
    atribuido_para  VARCHAR(255),
    data_agendada   TIMESTAMPTZ,
    data_concluida  TIMESTAMPTZ,
    status          VARCHAR(20)   DEFAULT 'pendente' CHECK (status IN ('pendente','concluida','cancelada')),
    tipo_acao       VARCHAR(20)   DEFAULT 'ligar' CHECK (tipo_acao IN ('ligar','email','reuniao','proposta')),
    prioridade      VARCHAR(10)   DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta'))
);

-- =============================================================
-- ÍNDICES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_contato_email        ON contato(email);
CREATE INDEX IF NOT EXISTS idx_contato_tipo         ON contato(tipo);
CREATE INDEX IF NOT EXISTS idx_contato_status       ON contato(status);
CREATE INDEX IF NOT EXISTS idx_lead_razao_status    ON lead(razao_status);
CREATE INDEX IF NOT EXISTS idx_lead_cliente_id      ON lead(cliente_id);
CREATE INDEX IF NOT EXISTS idx_oportunidade_contato ON oportunidade(contato_id);
CREATE INDEX IF NOT EXISTS idx_oportunidade_estagio ON oportunidade(estagio);
CREATE INDEX IF NOT EXISTS idx_uc_cliente_id        ON unidade_consumidora(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proposta_cliente_id  ON proposta(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proposta_uc_id       ON proposta(uc_id);
CREATE INDEX IF NOT EXISTS idx_contrato_cliente_id  ON contrato(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contrato_proposta_id ON contrato(proposta_id);
CREATE INDEX IF NOT EXISTS idx_boleto_cliente_id    ON boleto(cliente_id);
CREATE INDEX IF NOT EXISTS idx_boleto_status        ON boleto(status);
CREATE INDEX IF NOT EXISTS idx_transacao_data       ON transacao(data);
CREATE INDEX IF NOT EXISTS idx_atividade_contato_id ON atividade(contato_id);
CREATE INDEX IF NOT EXISTS idx_docusign_envelope    ON docusign_envelope(envelope_id);
CREATE INDEX IF NOT EXISTS idx_user_permission_email ON user_permission(user_email);