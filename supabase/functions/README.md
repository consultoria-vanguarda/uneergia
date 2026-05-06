# Migração de funções para Supabase Edge Functions

As telas continuam chamando `db.functions.invoke("nomeFuncao", payload)`.
No frontend, isso passa pelo proxy `api/functions/[name].js`, que encaminha para:

`$SUPABASE_FUNCTIONS_URL/<name>`

## Variáveis necessárias nas Functions

- `DOCUSIGN_INTEGRATION_KEY`
- `DOCUSIGN_USER_ID`
- `DOCUSIGN_PRIVATE_KEY`
- `DOCUSIGN_AUTH_SERVER`
- `DYNAMICS_CLIENT_ID`
- `DYNAMICS_CLIENT_SECRET`
- `DYNAMICS_TENANT_ID`
- `DYNAMICS_RESOURCE_URL`

## Contratos esperados

- `dynamicsAuth`
- `dynamicsSyncContacts`
- `dynamicsSyncOpportunities`
- `docusignAuth`
- `docusignCreateEnvelope`
- `docusignGetStatus`
- `docusignDownloadDocument`
- `docusignVoidEnvelope`
- `createLeadPublic`
- `qualifyLead`
- `gerarPDFAssinado`

## Pendências conhecidas

Estas rotas retornam stub de sucesso no proxy até implementação definitiva:
- `dynamicsSyncUCs`
- `dynamicsSyncPropostas`
- `dynamicsSyncContratos`

