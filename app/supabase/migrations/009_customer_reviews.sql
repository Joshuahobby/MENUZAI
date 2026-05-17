-- ============================================================
-- MENUZAI — Customer Reviews (Phase 2 Enhancement)
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Create reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  customer_name text,
  comment text,
  created_at timestamptz not null default now()
);

-- 2. Create indices for performance
create index if not exists reviews_restaurant_id_idx on public.reviews(restaurant_id);
create index if not exists reviews_created_at_idx on public.reviews(created_at desc);

-- 3. Row Level Security for reviews
alter table public.reviews enable row level security;

-- 4. Policies
drop policy if exists "Anyone can insert reviews" on public.reviews;
create policy "Anyone can insert reviews"
  on public.reviews for insert
  with check (true);

drop policy if exists "Staff can read their reviews" on public.reviews;
create policy "Staff can read their reviews"
  on public.reviews for select
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = public.reviews.restaurant_id and r.user_id = auth.uid()
    ) or
    exists (
      select 1 from public.restaurant_staff rs
      where rs.restaurant_id = public.reviews.restaurant_id
      and rs.user_id = auth.uid()
    )
  );
