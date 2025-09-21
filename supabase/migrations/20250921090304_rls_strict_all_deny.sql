-- RLS 全有効化 + 既存ポリシー撤去（Service Role でのみ操作する運用）
-- 何度流しても安全なように IF EXISTS / IF NOT EXISTS を多用

-- 1) 既存ポリシー削除（存在すれば）
drop policy if exists sel_stores_all  on public.stores;
drop policy if exists sel_casts_all   on public.casts;
drop policy if exists sel_shifts_all  on public.shifts;
drop policy if exists mut_stores_admin on public.stores;
drop policy if exists mut_casts_admin  on public.casts;
drop policy if exists mut_shifts_admin on public.shifts;

-- 2) RLS有効化（すでにONなら何もしない）
alter table public.stores enable row level security;
alter table public.casts  enable row level security;
alter table public.shifts enable row level security;

-- 3) “明示ポリシーなし” = 全Deny
-- （Service Role は RLS をバイパスするため API は動作します）

-- 4) 参考：将来の店舗スコープ閲覧ポリシー雛形（コメントアウトのままコミット）
-- create policy sel_stores_by_owner on public.stores
--   for select to authenticated
--   using (owner = auth.uid()::text);
