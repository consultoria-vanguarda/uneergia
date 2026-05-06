# Checklist de Cutover - Base44 -> Supabase/Vercel

## Pre-cutover
- [ ] Criar backup lógico do banco legado.
- [ ] Executar `src/schema.sql` no Supabase.
- [ ] Executar `supabase/migrations/20260506_001_base_schema_and_rls.sql`.
- [ ] Executar `supabase/seed.sql`.
- [ ] Criar usuário admin no Supabase Auth.
- [ ] Inserir usuário admin em `public.app_user` com `role = 'admin'`.
- [ ] Configurar variáveis de ambiente na Vercel.

## Smoke tests (staging)
- [ ] Login email/senha (`/login`).
- [ ] Logout e redirecionamento.
- [ ] Carregamento de Dashboard.
- [ ] CRUD de `Lead`, `Contato`, `Oportunidade`.
- [ ] CRUD de `Proposta`, `Contrato`, `Boleto`.
- [ ] Permissões por `user_permission`.
- [ ] Chamadas `db.functions.invoke(...)` respondendo via proxy Vercel.

## Cutover
- [ ] Congelar alterações no ambiente antigo.
- [ ] Realizar deploy da branch de migração na Vercel.
- [ ] Revalidar smoke tests em produção.
- [ ] Monitorar erros 30-60 minutos após release.

## Rollback
- [ ] Reverter deployment na Vercel para versão anterior.
- [ ] Restaurar apontamento do ambiente legado.
- [ ] Reabrir gravações somente após validação.

