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

-- 5. Additional Policies to allow cascading/deletion
drop policy if exists "Owner can delete their menus" on public.menus;
create policy "Owner can delete their menus"
  on public.menus for delete
  using (auth.uid() = user_id);

-- 6. Analytics Persistence: Don't delete analytics when menu is deleted
-- a. Make menu_id nullable
alter table public.analytics_events 
  alter column menu_id drop not null;

-- b. Change FK to SET NULL instead of CASCADE
alter table public.analytics_events 
  drop constraint if exists analytics_events_menu_id_fkey;

alter table public.analytics_events
  add constraint analytics_events_menu_id_fkey 
  foreign key (menu_id) references public.menus(id) on delete set null;

-- c. Allow owners to update their analytics (required for SET NULL to work)
drop policy if exists "Owner can update their analytics events" on public.analytics_events;
create policy "Owner can update their analytics events"
  on public.analytics_events for update
  using (
    auth.uid() = (
      select user_id from public.restaurants where id = public.analytics_events.restaurant_id limit 1
    )
  );

drop policy if exists "Owner can delete their analytics events" on public.analytics_events;
create policy "Owner can delete their analytics events"
  on public.analytics_events for delete
  using (
    auth.uid() = (
      select user_id from public.restaurants where id = public.analytics_events.restaurant_id limit 1
    )
  );
