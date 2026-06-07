-- Migration 029: Tighten analytics_events INSERT RLS
--
-- The previous policy checked only that menu_id refers to a published menu,
-- but did not verify that restaurant_id matches the menu's actual restaurant.
-- This allowed any visitor to inject fake analytics events into any restaurant
-- by supplying a valid published menu_id alongside an arbitrary restaurant_id.
--
-- Fix: add an AND clause requiring restaurant_id = menus.restaurant_id.

drop policy if exists "Anyone can insert analytics events for published menus" on public.analytics_events;

create policy "Anyone can insert analytics events for published menus"
  on public.analytics_events for insert
  with check (
    exists (
      select 1 from public.menus
      where id    = menu_id
        and status = 'published'
        and restaurant_id = analytics_events.restaurant_id
    )
  );
