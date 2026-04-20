-- ============================================================
-- MENUZAI — Strict RLS Lockdown (Phase 5)
-- Tightens access to ensure public users can only see 
-- restaurant info for published menus.
-- ============================================================

-- 1. restaurants: Allow public SELECT only for published menus
drop policy if exists "Anyone can read restaurants for published menus" on public.restaurants;
create policy "Anyone can read restaurants for published menus"
  on public.restaurants for select
  using (
    exists (
      select 1 from public.menus
      where restaurant_id = public.restaurants.id
        and status = 'published'
    )
  );

-- 2. menus: Double-check global read policy
drop policy if exists "Anyone can read published menus" on public.menus;
create policy "Anyone can read published menus"
  on public.menus for select
  using (status = 'published');

-- 3. analytics_events: Strict lockdown on selection
-- Only internal service role or owners can select.
-- (Public already has INSERT access)
drop policy if exists "Owner can read their analytics events" on public.analytics_events;
create policy "Owner can read their analytics events"
  on public.analytics_events for select
  using (
    auth.uid() = (
      select user_id from public.restaurants where id = public.analytics_events.restaurant_id limit 1
    )
  );

-- 4. orders: Strict lockdown on selection
-- Only internal service role or owners can select.
-- (Public already has INSERT access)
drop policy if exists "Owner can read their orders" on public.orders;
create policy "Owner can read their orders"
  on public.orders for select
  using (
    auth.uid() = (
      select user_id from public.restaurants where id = public.orders.restaurant_id limit 1
    )
  );

drop policy if exists "Owner can update their orders" on public.orders;
create policy "Owner can update their orders"
  on public.orders for update
  using (
    auth.uid() = (
      select user_id from public.restaurants where id = public.orders.restaurant_id limit 1
    )
  );
