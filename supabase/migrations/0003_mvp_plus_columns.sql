-- ============================================
-- 0003: MVP+ columns (stores / casts / shifts)
-- ============================================

-- stores -------------------------------------------------
alter table public.stores
  add column if not exists code text,                                   -- 内部用コード（店舗コード）
  add column if not exists active boolean not null default true,        -- 稼働フラグ
  add column if not exists notes text;                                   -- 備考

-- コードや名前での検索用
create index if not exists idx_stores_code on public.stores (code);
create index if not exists idx_stores_lower_name on public.stores (lower(name));

-- 任意：店舗コードを一意にしたい場合（null重複は許容）
create unique index if not exists uq_stores_code on public.stores (code);

-- casts --------------------------------------------------
alter table public.casts
  add column if not exists code text,                                   -- 社内管理コード
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists status text not null default 'active'        -- 'active' | 'inactive' | 'retired' 想定
    check (status in ('active','inactive','retired')),
  add column if not exists deleted_at timestamptz,                      -- ソフト削除
  add column if not exists profile_note text,                           -- 紹介文/メモ
  add column if not exists tags text[] default '{}'::text[];            -- 任意タグ

-- よく使う検索のためのインデックス
create index if not exists idx_casts_store on public.casts (store_id);
create index if not exists idx_casts_status on public.casts (status);
create index if not exists idx_casts_lower_name on public.casts (lower(name));

-- shifts -------------------------------------------------
alter table public.shifts
  add column if not exists role text not null default 'cast'            -- 'cast' | 'staff' 等
    check (role in ('cast','staff')),
  add column if not exists pay_rate int,                                -- 当時点の時給スナップショット
  add column if not exists memo text,
  add column if not exists canceled_at timestamptz;

-- 既存: uq_shifts_cast_start (cast_id, starts_at) は 0002c で作成済み想定
create index if not exists idx_shifts_store_start on public.shifts (store_id, starts_at);
