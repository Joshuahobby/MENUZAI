-- ============================================================
-- Migration 033: Enforce plan-based restaurant location limits
-- ============================================================
-- canCreateRestaurant() was only enforced client-side in MenuContext.
-- A user could bypass location limits by calling the Supabase API directly.
--
-- Location limits:
--   free / trial / pro → max 1 restaurant row per user
--   business            → max 5 restaurant rows per user
-- ============================================================

create or replace function public.enforce_restaurant_location_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan       text;
  v_trial_ends timestamptz;
  v_max_loc    int;
  v_count      int;
begin
  -- Determine the user's effective plan by looking at their existing restaurants
  -- (any one of them is sufficient; they all share the same owner)
  select plan, trial_ends_at
    into v_plan, v_trial_ends
    from public.restaurants
    where user_id = NEW.user_id
    limit 1;

  -- Business plan → 5 locations
  if v_plan = 'business' then
    v_max_loc := 5;
  else
    -- free, trial, pro → 1 location
    v_max_loc := 1;
  end if;

  select count(*) into v_count
    from public.restaurants
    where user_id = NEW.user_id;

  if v_count >= v_max_loc then
    raise exception 'Plan limit reached: your current plan allows % location(s). Upgrade to Business for up to 5 locations.', v_max_loc;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_enforce_restaurant_location_limits on public.restaurants;
create trigger trg_enforce_restaurant_location_limits
  before insert on public.restaurants
  for each row execute function public.enforce_restaurant_location_limits();
