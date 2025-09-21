-- 0005: audit_logs
create extension if not exists pgcrypto;

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  actor       text not null,                            -- 'system/line' など
  action      text not null check (
                action in ('created','updated','deleted','webhook_received','login','other')
              ),
  entity      text not null,                            -- 'casts' / 'stores' / 'line' など
  entity_id   text,
  payload     jsonb,
  ip          text,
  user_agent  text
);

create index if not exists idx_audit_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_entity on public.audit_logs (entity, entity_id);
create index if not exists idx_audit_action on public.audit_logs (action);

-- RLS: admin のみ閲覧/書込（Service Role は常にバイパス）
alter table public.audit_logs enable row level security;

drop policy if exists sel_audit_admin on public.audit_logs;
create policy sel_audit_admin
  on public.audit_logs for select
  to authenticated using (public.is_admin());

drop policy if exists mut_audit_admin on public.audit_logs;
create policy mut_audit_admin
  on public.audit_logs for all
  to authenticated using (public.is_admin())
  with check (public.is_admin());
