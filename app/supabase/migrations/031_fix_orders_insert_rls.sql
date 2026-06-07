-- ============================================================
-- Migration 031: Fix orders INSERT RLS — verify restaurant_id
-- ============================================================
-- The previous policy only checked that `menu_id` belongs to a
-- published menu. An attacker could supply any `restaurant_id`
-- and the check would still pass. This migration adds an explicit
-- cross-check so the supplied `restaurant_id` must match the menu.
-- ============================================================

drop policy if exists "Anyone can insert orders for published menus" on public.orders;

create policy "Anyone can insert orders for published menus"
  on public.orders for insert
  with check (
    exists (
      select 1 from public.menus
      where id            = menu_id
        and status        = 'published'
        and restaurant_id = orders.restaurant_id
    )
  );
