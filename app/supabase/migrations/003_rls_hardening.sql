-- ============================================================
-- MENUZAI — RLS Hardening (Phase D)
-- Run this in the Supabase SQL editor after 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- restaurants: add missing DELETE policy
-- ============================================================
drop policy if exists "Owner can delete their restaurant" on public.restaurants;
create policy "Owner can delete their restaurant"
  on public.restaurants for delete
  using (auth.uid() = user_id);

-- ============================================================
-- analytics_events: tighten insert policy
-- Customers can only fire events for menus that exist and
-- are published, preventing spam against arbitrary IDs.
-- ============================================================
drop policy if exists "Anyone can insert analytics events" on public.analytics_events;

drop policy if exists "Anyone can insert analytics events for published menus" on public.analytics_events;
create policy "Anyone can insert analytics events for published menus"
  on public.analytics_events for insert
  with check (
    exists (
      select 1 from public.menus
      where id = menu_id
        and status = 'published'
    )
  );

-- ============================================================
-- orders: tighten insert policy
-- Customers can only place orders against published menus,
-- preventing inserts with arbitrary restaurant_id values.
-- ============================================================
drop policy if exists "Anyone can insert orders" on public.orders;

drop policy if exists "Anyone can insert orders for published menus" on public.orders;
create policy "Anyone can insert orders for published menus"
  on public.orders for insert
  with check (
    exists (
      select 1 from public.menus
      where id = menu_id
        and status = 'published'
    )
  );

-- ============================================================
-- orders: add DELETE policy so owners can remove old orders
-- ============================================================
drop policy if exists "Owner can delete their orders" on public.orders;
create policy "Owner can delete their orders"
  on public.orders for delete
  using (
    auth.uid() = (
      select user_id from public.restaurants where id = restaurant_id limit 1
    )
  );
