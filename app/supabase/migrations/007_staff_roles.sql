-- ============================================================
-- MENUZAI — Staff Roles (Phase 2 Enhancement)
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Create restaurant_staff table
create table if not exists public.restaurant_staff (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

-- 2. Backfill existing owners into the staff table
insert into public.restaurant_staff (restaurant_id, user_id, role)
select id, user_id, 'owner' from public.restaurants
on conflict do nothing;

-- 3. Row Level Security for restaurant_staff
alter table public.restaurant_staff enable row level security;

drop policy if exists "Owners and Managers can manage staff" on public.restaurant_staff;
create policy "Owners and Managers can manage staff"
  on public.restaurant_staff for all
  using (
    exists (
      select 1 from public.restaurant_staff rs
      where rs.restaurant_id = public.restaurant_staff.restaurant_id
      and rs.user_id = auth.uid()
      and rs.role in ('owner', 'manager')
    )
  );

drop policy if exists "Users can view their staff roles" on public.restaurant_staff;
create policy "Users can view their staff roles"
  on public.restaurant_staff for select
  using (user_id = auth.uid());

-- 4. Auto-update updated_at trigger
create or replace trigger restaurant_staff_updated_at
  before update on public.restaurant_staff
  for each row execute function public.handle_updated_at();

-- 5. Update Policies for other tables so staff can access them

-- --- restaurants ---
drop policy if exists "Owner can read their restaurant" on public.restaurants;
create policy "Staff can read their restaurant"
  on public.restaurants for select
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.restaurant_staff rs
      where rs.restaurant_id = public.restaurants.id
      and rs.user_id = auth.uid()
    )
  );

drop policy if exists "Owner can update their restaurant" on public.restaurants;
create policy "Owner and manager can update their restaurant"
  on public.restaurants for update
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.restaurant_staff rs
      where rs.restaurant_id = public.restaurants.id
      and rs.user_id = auth.uid()
      and rs.role in ('owner', 'manager')
    )
  );

-- --- menus ---
drop policy if exists "Owner can manage their menus" on public.menus;
create policy "Staff can manage menus"
  on public.menus for all
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.restaurant_staff rs
      where rs.restaurant_id = public.menus.restaurant_id
      and rs.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id or
    exists (
      select 1 from public.restaurant_staff rs
      where rs.restaurant_id = public.menus.restaurant_id
      and rs.user_id = auth.uid()
    )
  );

-- --- orders ---
drop policy if exists "Owner can read their orders" on public.orders;
create policy "Staff can read their orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = public.orders.restaurant_id and r.user_id = auth.uid()
    ) or
    exists (
      select 1 from public.restaurant_staff rs
      where rs.restaurant_id = public.orders.restaurant_id
      and rs.user_id = auth.uid()
    )
  );

drop policy if exists "Owner can update their orders" on public.orders;
create policy "Staff can update their orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = public.orders.restaurant_id and r.user_id = auth.uid()
    ) or
    exists (
      select 1 from public.restaurant_staff rs
      where rs.restaurant_id = public.orders.restaurant_id
      and rs.user_id = auth.uid()
    )
  );

-- --- analytics_events ---
drop policy if exists "Owner can read their analytics events" on public.analytics_events;
create policy "Staff can read their analytics events"
  on public.analytics_events for select
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = public.analytics_events.restaurant_id and r.user_id = auth.uid()
    ) or
    exists (
      select 1 from public.restaurant_staff rs
      where rs.restaurant_id = public.analytics_events.restaurant_id
      and rs.user_id = auth.uid()
    )
  );
