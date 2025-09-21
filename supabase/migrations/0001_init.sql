-- supabase/migrations/0001_init.sql
-- Tiara Portal / 勤怠基盤 初回マイグレーション
-- 対象: stores / casts / shifts / audit_logs
-- 既存: tasks, questionnaire_answers は変更しない

-- ===== Extensions =====
create extension if not exists "pgcrypto";     -- gen_random_uuid()
create extension if not exists "uuid-ossp";    -- uuid_generate_v4()

-- ===== Common: updated_at 自動更新トリガ =====
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =========================================================
-- stores（店舗）
-- =========================================================
create table if not exists public.stores (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table  public.stores is '出店（拠点）情報';
comment on column public.stores.name    is '店舗名';
comment on column public.stores.address is '住所';
comment on column public.stores.phone   is '電話番号';

create index if not exists idx_stores_name on public.stores using btree (name);

drop trigger if exists trg_stores_updated_at on public.stores;
create trigger trg_stores_updated_at
before update on public.stores
for each row execute function set_updated_at();

-- =========================================================
-- casts（キャスト）
-- =========================================================
create table if not exists public.casts (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid references public.stores(id) on delete set null,
  name        text not null,
  nickname    text,
  rating      numeric(3,2) default 0 check (rating between 0 and 5),
  wage        integer,                -- 時給(円)
  genre       text[],                 -- タグ配列（例: {'レギュラー','新人'}）
  drinkable   boolean default false,  -- 同伴/飲酒可否のビットとして流用可
  owner       text,                   -- 所属/オーナー名等
  active      boolean default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table  public.casts is 'キャストの基本情報';
comment on column public.casts.rating is '0.00〜5.00';

create index if not exists idx_casts_store   on public.casts using btree (store_id);
create index if not exists idx_casts_active  on public.casts using btree (active);
create index if not exists idx_casts_name    on public.casts using btree (name);

drop trigger if exists trg_casts_updated_at on public.casts;
create trigger trg_casts_updated_at
before update on public.casts
for each row execute function set_updated_at();

-- =========================================================
-- shifts（シフト）
-- =========================================================
create table if not exists public.shifts (
  id          uuid primary key default gen_random_uuid(),
  cast_id     uuid not null references public.casts(id) on delete cascade,
  store_id    uuid references public.stores(id) on delete set null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      text not null default 'scheduled' check (status in ('scheduled','confirmed','absent')),
  memo        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint chk_time_window check (ends_at > starts_at)
);

comment on table  public.shifts is 'キャストの出勤予定/実績';
comment on column public.shifts.status is 'scheduled/confirmed/absent';

-- 検索用: キャスト×開始時刻、店舗×開始時刻
create index if not exists idx_shifts_cast_time  on public.shifts using btree (cast_id, starts_at desc);
create index if not exists idx_shifts_store_time on public.shifts using btree (store_id, starts_at desc);

drop trigger if exists trg_shifts_updated_at on public.shifts;
create trigger trg_shifts_updated_at
before update on public.shifts
for each row execute function set_updated_at();

-- =========================================================
-- audit_logs（監査ログ）
-- =========================================================
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor       text not null,            -- user id / system
  action      text not null,            -- created/updated/deleted/webhook_received など
  entity      text not null,            -- casts/shifts/stores/... 自由記述
  entity_id   uuid,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_created on public.audit_logs using btree (created_at desc);
create index if not exists idx_audit_entity  on public.audit_logs using btree (entity, created_at desc);

-- =========================================================
-- RLS / RBAC（最小セット）
-- 役割: admin / cast / store_viewer
-- 方針:
--   ・stores, casts, shifts は 一旦 read を緩め（全件閲覧可）→ 後続PRで store_id / 所属 による絞り込み導入
--   ・write は admin のみ（JWT クレーム: role=admin）
--   ・audit_logs は admin のみ閲覧、insert は admin（※Service RoleはRLSをバイパス）
-- =========================================================

alter table public.stores     enable row level security;
alter table public.casts      enable row level security;
alter table public.shifts     enable row level security;
alter table public.audit_logs enable row level security;

-- ===== SELECT: 暫定で全公開（後で tighten する）=====
drop policy if exists "public read stores" on public.stores;
create policy "public read stores"
  on public.stores for select
  using (true);

drop policy if exists "public read casts" on public.casts;
create policy "public read casts"
  on public.casts for select
  using (true);

drop policy if exists "public read shifts" on public.shifts;
create policy "public read shifts"
  on public.shifts for select
  using (true);

-- ===== WRITE: admin のみ =====
-- stores
drop policy if exists "admin write stores" on public.stores;
create policy "admin write stores"
  on public.stores for all
  using (coalesce(auth.jwt() ->> 'role','') = 'admin')
  with check (coalesce(auth.jwt() ->> 'role','') = 'admin');

-- casts
drop policy if exists "admin write casts" on public.casts;
create policy "admin write casts"
  on public.casts for all
  using (coalesce(auth.jwt() ->> 'role','') = 'admin')
  with check (coalesce(auth.jwt() ->> 'role','') = 'admin');

-- shifts
drop policy if exists "admin write shifts" on public.shifts;
create policy "admin write shifts"
  on public.shifts for all
  using (coalesce(auth.jwt() ->> 'role','') = 'admin')
  with check (coalesce(auth.jwt() ->> 'role','') = 'admin');

-- ===== audit_logs: admin 閲覧 + admin 追記のみ =====
drop policy if exists "admin read audit"  on public.audit_logs;
create policy "admin read audit"
  on public.audit_logs for select
  using (coalesce(auth.jwt() ->> 'role','') = 'admin');

drop policy if exists "admin insert audit" on public.audit_logs;
create policy "admin insert audit"
  on public.audit_logs for insert
  with check (coalesce(auth.jwt() ->> 'role','') = 'admin');

-- 参考: Service Role は RLS をバイパスするため、サーバ側からの監査書き込みはこのままで可
