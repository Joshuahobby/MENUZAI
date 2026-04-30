-- ============================================================
-- MENUZAI — Restaurant Assets Storage Bucket
-- Run after 003_rls_hardening.sql
-- ============================================================

-- Create the public bucket for logos and other restaurant assets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-assets',
  'restaurant-assets',
  true,
  2097152,  -- 2 MB (matches upload validation in settings page)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set public = true;

-- ============================================================
-- RLS POLICIES: storage.objects (restaurant-assets bucket)
-- ============================================================

drop policy if exists "Public read restaurant assets" on storage.objects;
create policy "Public read restaurant assets"
  on storage.objects for select
  using ( bucket_id = 'restaurant-assets' );

drop policy if exists "Owners upload restaurant assets" on storage.objects;
create policy "Owners upload restaurant assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'restaurant-assets'
  );

drop policy if exists "Owners update restaurant assets" on storage.objects;
create policy "Owners update restaurant assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'restaurant-assets'
  );

drop policy if exists "Owners delete restaurant assets" on storage.objects;
create policy "Owners delete restaurant assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'restaurant-assets'
  );

-- ============================================================
-- Fix stale logo_url values saved without the /public/ segment
-- Old format: /storage/v1/object/restaurant-assets/...
-- New format: /storage/v1/object/public/restaurant-assets/...
-- ============================================================
update public.restaurants
set logo_url = replace(
  logo_url,
  '/storage/v1/object/restaurant-assets/',
  '/storage/v1/object/public/restaurant-assets/'
)
where logo_url like '%/storage/v1/object/restaurant-assets/%'
  and logo_url not like '%/storage/v1/object/public/restaurant-assets/%';
