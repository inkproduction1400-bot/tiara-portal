-- cast別の期間絞り込み
create index if not exists idx_shifts_cast_starts
  on public.shifts (cast_id, starts_at);

-- store別の期間絞り込み
create index if not exists idx_shifts_store_starts
  on public.shifts (store_id, starts_at);

-- starts_at 単体のソート最適化
create index if not exists idx_shifts_starts_at
  on public.shifts (starts_at);
