-- ==================================================
-- 0004: RLS/RBAC minimum
-- - app_users にユーザーとロールを保持
-- - 認証済みは読み取り可、書き込みは admin のみ
-- ==================================================

-- ロール管理テーブル（auth.users と紐付け）
create table if not exists public.app_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','cast','store_viewer')),
  cast_id uuid references public.casts(id),    -- 将来: cast ログイン時の本人紐付けに利用
  store_id uuid references public.stores(id),  -- 将来: 店舗ビューアの範囲制限に利用
  created_at timestamptz not null default now()
);

create index if not exists idx_app_users_role on public.app_users(role);

-- RLS を有効化
alter table public.stores enable row level security;
alter table public.casts  enable row level security;
alter table public.shifts enable row level security;
-- （監査ログがあれば）alter table public.audit_logs enable row level security;

-- 便利: admin 判定（将来ポリシーで使い回し）
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.app_users au
    where au.user_id = auth.uid() and au.role = 'admin'
  );
$$;

-- ========== SELECT（閲覧） ==========
-- 認証済みなら閲覧可（必要に応じて cast/store_viewer のみに絞ってもOK）
drop policy if exists sel_stores_all on public.stores;
create policy sel_stores_all on public.stores
  for select using (auth.uid() is not null);

drop policy if exists sel_casts_all on public.casts;
create policy sel_casts_all on public.casts
  for select using (auth.uid() is not null);

drop policy if exists sel_shifts_all on public.shifts;
create policy sel_shifts_all on public.shifts
  for select using (auth.uid() is not null);

-- ========== INSERT/UPDATE/DELETE（管理者のみ） ==========
drop policy if exists mut_stores_admin on public.stores;
create policy mut_stores_admin on public.stores
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists mut_casts_admin on public.casts;
create policy mut_casts_admin on public.casts
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists mut_shifts_admin on public.shifts;
create policy mut_shifts_admin on public.shifts
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 参考: 監査ログは admin のみ閲覧・書込
-- drop policy if exists sel_audit_admin on public.audit_logs;
-- create policy sel_audit_admin on public.audit_logs
--   for select using (public.is_admin());
-- drop policy if exists ins_audit_admin on public.audit_logs;
-- create policy ins_audit_admin on public.audit_logs
--   for insert with check (public.is_admin());
