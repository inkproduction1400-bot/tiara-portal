-- supabase/migrations/0002b_unique_store_name.sql
create unique index if not exists uq_stores_name_idx on public.stores (name);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'uq_stores_name'
      and conrelid = 'public.stores'::regclass
  ) then
    alter table public.stores
      add constraint uq_stores_name
      unique using index uq_stores_name_idx;
  end if;
end$$;
