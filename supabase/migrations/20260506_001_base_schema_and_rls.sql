-- Base schema migration for Supabase.
-- 1) Execute full DDL from src/schema.sql before this file.
-- 2) This migration applies auth linkage and RLS policies.

create extension if not exists pgcrypto;

-- Optional mapping between auth.users and app roles.
create table if not exists public.app_user (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.app_user u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

create or replace function public.can_access_page(page_name text)
returns boolean
language sql
stable
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.user_permission up
      where lower(up.user_email) = lower(auth.email())
      and (up.paginas_permitidas is null or up.paginas_permitidas ? page_name)
    );
$$;

alter table if exists public.usina enable row level security;
alter table if exists public.contato enable row level security;
alter table if exists public.lead enable row level security;
alter table if exists public.oportunidade enable row level security;
alter table if exists public.unidade_consumidora enable row level security;
alter table if exists public.proposta enable row level security;
alter table if exists public.contrato enable row level security;
alter table if exists public.boleto enable row level security;
alter table if exists public.transacao enable row level security;
alter table if exists public.atividade enable row level security;
alter table if exists public.docusign_envelope enable row level security;
alter table if exists public.integration_log enable row level security;
alter table if exists public.user_permission enable row level security;
alter table if exists public.follow_up_workflow enable row level security;
alter table if exists public.follow_up_template enable row level security;
alter table if exists public.follow_up_task enable row level security;

-- Reusable baseline policies:
-- Admin can do everything.
do $$
declare
  t text;
  tables text[] := array[
    'usina','contato','lead','oportunidade','unidade_consumidora','proposta','contrato',
    'boleto','transacao','atividade','docusign_envelope','integration_log',
    'user_permission','follow_up_workflow','follow_up_template','follow_up_task'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all',
      t
    );
  end loop;
end $$;

-- Authenticated users can read base business tables.
do $$
declare
  t text;
  read_tables text[] := array[
    'usina','contato','lead','oportunidade','unidade_consumidora','proposta','contrato',
    'boleto','transacao','atividade','docusign_envelope','integration_log',
    'follow_up_workflow','follow_up_template','follow_up_task'
  ];
begin
  foreach t in array read_tables loop
    execute format('drop policy if exists %I on public.%I', t || '_authenticated_select', t);
    execute format(
      'create policy %I on public.%I for select using (auth.role() = ''authenticated'')',
      t || '_authenticated_select',
      t
    );
  end loop;
end $$;

-- user_permission: user can read only own record by email.
drop policy if exists user_permission_own_select on public.user_permission;
create policy user_permission_own_select
on public.user_permission
for select
using (lower(user_email) = lower(auth.email()));

