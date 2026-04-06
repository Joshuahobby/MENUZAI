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

-- Anyone can read public images (for public menu pages)
create policy "Public read menu images"
  on storage.objects for select
  using ( bucket_id = 'menu-images' );

-- Authenticated users can upload to their own folder (user_id/*)
create policy "Users upload own images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'menu-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update/replace their own images
create policy "Users update own images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'menu-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own images
create policy "Users delete own images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'menu-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
