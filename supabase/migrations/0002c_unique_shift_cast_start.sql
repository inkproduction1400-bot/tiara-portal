-- 同一キャストの同一開始時刻を一意に
create unique index if not exists uq_shifts_cast_start
  on public.shifts (cast_id, starts_at);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'uq_shifts_cast_start'
      and conrelid = 'public.shifts'::regclass
  ) then
    alter table public.shifts
      add constraint uq_shifts_cast_start
      unique using index uq_shifts_cast_start;
  end if;
end$$;
