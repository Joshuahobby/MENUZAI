-- ============================================================
-- MENUZAI — Storage Buckets
-- Run this after 001_initial_schema.sql
-- ============================================================

-- Create a public bucket for menu item images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- ============================================================
-- RLS POLICIES: storage.objects (menu-images bucket)
-- ============================================================

drop policy if exists "Public read menu images" on storage.objects;
create policy "Public read menu images"
  on storage.objects for select
  using ( bucket_id = 'menu-images' );

drop policy if exists "Users upload own images" on storage.objects;
create policy "Users upload own images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'menu-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own images" on storage.objects;
create policy "Users update own images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'menu-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own images" on storage.objects;
create policy "Users delete own images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'menu-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
