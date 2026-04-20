-- ============================================================
-- MENUZAI — Restaurants schema backfill
-- Run this if your restaurants table was created before logo_url
-- and the user_id UNIQUE constraint were added to 001_initial_schema.sql
-- ============================================================

-- Add missing logo_url column
alter table public.restaurants
  add column if not exists logo_url text;

-- Remove duplicate user_id rows, keeping the most recently updated one
delete from public.restaurants
where id not in (
  select distinct on (user_id) id
  from public.restaurants
  order by user_id, updated_at desc nulls last
);

-- Add UNIQUE constraint on user_id if it doesn't already exist
-- (required for ON CONFLICT (user_id) upserts in MenuContext)
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'restaurants_user_id_key'
      and conrelid = 'public.restaurants'::regclass
  ) then
    alter table public.restaurants
      add constraint restaurants_user_id_key unique (user_id);
  end if;
end $$;
