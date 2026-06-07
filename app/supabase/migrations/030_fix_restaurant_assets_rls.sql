-- Migration 030: Fix restaurant-assets bucket RLS — add ownership check
--
-- The original policies only checked bucket_id, allowing any authenticated
-- user to upload, overwrite, or delete files belonging to any other user.
-- This matches the correct pattern already used in the menu-images bucket.

drop policy if exists "Owners upload restaurant assets"   on storage.objects;
drop policy if exists "Owners update restaurant assets"   on storage.objects;
drop policy if exists "Owners delete restaurant assets"   on storage.objects;

create policy "Owners upload restaurant assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'restaurant-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners update restaurant assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'restaurant-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners delete restaurant assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'restaurant-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
