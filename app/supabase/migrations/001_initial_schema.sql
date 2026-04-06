-- ============================================================
-- MENUZAI — Initial Schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE: restaurants
-- One row per user. Created on first login.
-- ============================================================
create table if not exists public.restaurants (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null unique,
  name         text not null default 'My Restaurant',
  tagline      text,
  phone        text,             -- WhatsApp number (with country code, no +)
  hours        text,
  logo_url     text,
  slug         text unique,      -- public URL key: /menu/[slug]
  plan         text not null default 'free',  -- free | pro | business
  onboarded    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- TABLE: menus
-- A restaurant can have multiple menus (breakfast, dinner, etc.)
-- categories and items stored as JSONB blobs.
-- ============================================================
create table if not exists public.menus (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid references public.restaurants(id) on delete cascade not null,
  user_id        uuid references auth.users(id) not null,
  name           text not null default 'My Menu',
  slug           text,            -- public URL key: /menu/[slug]
  status         text not null default 'draft',   -- draft | published
  categories     jsonb not null default '[]',
  items          jsonb not null default '[]',
  style          jsonb not null default '{}',
  view_count     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Backfill any columns missing from a prior partial run
alter table public.menus add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;
-- restaurant_name is a legacy column from an older schema; make it nullable so inserts don't fail
alter table public.menus alter column restaurant_name drop not null;
alter table public.menus add column if not exists name text not null default 'My Menu';
alter table public.menus add column if not exists slug text;
alter table public.menus add column if not exists status text not null default 'draft';
alter table public.menus add column if not exists categories jsonb not null default '[]';
alter table public.menus add column if not exists items jsonb not null default '[]';
alter table public.menus add column if not exists style jsonb not null default '{}';
alter table public.menus add column if not exists view_count integer not null default 0;

create index if not exists menus_user_id_idx on public.menus(user_id);
create index if not exists menus_slug_idx on public.menus(slug) where slug is not null;

-- ============================================================
-- TABLE: analytics_events
-- Fired by the public customer menu view (no auth required).
-- event_type: menu_view | item_view | add_to_cart | order_sent
-- ============================================================
create table if not exists public.analytics_events (
  id             uuid primary key default gen_random_uuid(),
  menu_id        uuid references public.menus(id) on delete cascade not null,
  restaurant_id  uuid references public.restaurants(id) on delete cascade not null,
  event_type     text not null,
  item_id        text,
  item_name      text,
  amount         numeric,
  session_id     text,
  created_at     timestamptz not null default now()
);

-- Backfill any columns missing from a prior partial run
alter table public.analytics_events add column if not exists menu_id uuid references public.menus(id) on delete cascade;
alter table public.analytics_events add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;
alter table public.analytics_events add column if not exists event_type text;
alter table public.analytics_events add column if not exists item_id text;
alter table public.analytics_events add column if not exists item_name text;
alter table public.analytics_events add column if not exists amount numeric;
alter table public.analytics_events add column if not exists session_id text;

create index if not exists analytics_events_restaurant_id_idx on public.analytics_events(restaurant_id);
create index if not exists analytics_events_menu_id_idx on public.analytics_events(menu_id);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);

-- ============================================================
-- TABLE: orders
-- Created when a customer taps "Order via WhatsApp".
-- ============================================================
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  menu_id         uuid references public.menus(id),
  restaurant_id   uuid references public.restaurants(id) on delete cascade not null,
  items           jsonb not null,
  total           numeric not null,
  customer_name   text,
  table_number    text,
  status          text not null default 'pending',   -- pending | confirmed | cancelled
  whatsapp_sent   boolean not null default false,
  created_at      timestamptz not null default now()
);

-- Backfill any columns missing from a prior partial run
alter table public.orders add column if not exists menu_id uuid references public.menus(id);
alter table public.orders add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade;
alter table public.orders add column if not exists items jsonb;
alter table public.orders add column if not exists total numeric;
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists table_number text;
alter table public.orders add column if not exists status text not null default 'pending';
alter table public.orders add column if not exists whatsapp_sent boolean not null default false;

create index if not exists orders_restaurant_id_idx on public.orders(restaurant_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.restaurants enable row level security;
alter table public.menus enable row level security;
alter table public.analytics_events enable row level security;
alter table public.orders enable row level security;

-- --- restaurants ---
create policy "Owner can read their restaurant"
  on public.restaurants for select
  using (auth.uid() = user_id);

create policy "Owner can insert their restaurant"
  on public.restaurants for insert
  with check (auth.uid() = user_id);

create policy "Owner can update their restaurant"
  on public.restaurants for update
  using (auth.uid() = user_id);

-- --- menus ---
create policy "Owner can manage their menus"
  on public.menus for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Customers can read published menus without logging in
create policy "Anyone can read published menus"
  on public.menus for select
  using (status = 'published');

-- --- analytics_events ---
-- Restaurant owners can read their own events
create policy "Owner can read their analytics events"
  on public.analytics_events for select
  using (
    auth.uid() = (
      select user_id from public.restaurants where id = restaurant_id limit 1
    )
  );

-- Anyone (including unauthenticated customers) can insert events
create policy "Anyone can insert analytics events"
  on public.analytics_events for insert
  with check (true);

-- --- orders ---
-- Restaurant owners can read and update their orders
create policy "Owner can read their orders"
  on public.orders for select
  using (
    auth.uid() = (
      select user_id from public.restaurants where id = restaurant_id limit 1
    )
  );

create policy "Owner can update their orders"
  on public.orders for update
  using (
    auth.uid() = (
      select user_id from public.restaurants where id = restaurant_id limit 1
    )
  );

-- Anyone (unauthenticated customers) can place orders
create policy "Anyone can insert orders"
  on public.orders for insert
  with check (true);

-- ============================================================
-- HELPER: auto-update updated_at timestamp
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger restaurants_updated_at
  before update on public.restaurants
  for each row execute function public.handle_updated_at();

create trigger menus_updated_at
  before update on public.menus
  for each row execute function public.handle_updated_at();
