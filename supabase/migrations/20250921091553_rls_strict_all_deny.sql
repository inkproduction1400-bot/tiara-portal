-- 既存ポリシー撤去
drop policy if exists sel_stores_all  on public.stores;
drop policy if exists sel_casts_all   on public.casts;
drop policy if exists sel_shifts_all  on public.shifts;
drop policy if exists mut_stores_admin on public.stores;
drop policy if exists mut_casts_admin  on public.casts;
drop policy if exists mut_shifts_admin on public.shifts;

-- RLS有効化（=明示ポリシーなし→全Deny。Service Roleのみ可）
alter table public.stores enable row level security;
alter table public.casts  enable row level security;
alter table public.shifts enable row level security;
