# UneEnergia - Migração para Supabase + Vercel

Este projeto foi migrado para:
- Autenticação: Supabase Auth (email/senha)
- Banco: Supabase Postgres
- Frontend: Vercel
- Funções: proxy Vercel em `api/functions/[name].js` para Supabase Functions

## 1) Variáveis de ambiente

Crie `.env.local`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY
VITE_APP_BASE_URL=http://localhost:5173
```

No Vercel (produção):

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY
SUPABASE_FUNCTIONS_URL=https://SEU-PROJETO.supabase.co/functions/v1
SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY
DOCUSIGN_INTEGRATION_KEY=...
DOCUSIGN_USER_ID=...
DOCUSIGN_PRIVATE_KEY=...
DOCUSIGN_AUTH_SERVER=...
DYNAMICS_CLIENT_ID=...
DYNAMICS_CLIENT_SECRET=...
DYNAMICS_TENANT_ID=...
DYNAMICS_RESOURCE_URL=...
```

## 2) Banco (schema + RLS + seed)

Ordem de execução no SQL Editor do Supabase:

1. `src/schema.sql`
2. `supabase/migrations/20260506_001_base_schema_and_rls.sql`
3. `supabase/seed.sql`

## 3) Rodar local

```bash
npm install
npm run dev
```

Login em `/login` com usuário criado no Supabase Auth.

## 4) Deploy na Vercel

1. Conectar repositório na Vercel
2. Configurar variáveis de ambiente acima
3. Fazer deploy
4. Validar smoke tests:
   - login/logout
   - leitura/escrita das entidades principais
   - invocação de funções via `db.functions.invoke(...)`
   - integrações DocuSign/Dynamics
