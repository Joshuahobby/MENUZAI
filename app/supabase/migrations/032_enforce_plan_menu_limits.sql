-- ============================================================
-- Migration 032: Enforce plan-based menu limits at the DB level
-- ============================================================
-- Previously only enforced client-side via MenuContext.
-- A user could bypass limits by calling the Supabase REST API
-- directly with the anon key.
--
-- This trigger enforces:
--   free plan (trial expired or no trial) → max 1 total menu,
--                                           max 1 published menu
--   trial / pro / business               → unlimited
-- ============================================================

create or replace function public.enforce_menu_plan_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan         text;
  v_trial_ends   timestamptz;
  v_total        int;
  v_published    int;
begin
  -- Determine the restaurant's effective plan
  select plan, trial_ends_at
    into v_plan, v_trial_ends
    from public.restaurants
    where id = NEW.restaurant_id;

  -- Trial, Pro, Business → no limits
  if v_plan in ('pro', 'business') then
    return NEW;
  end if;
  if v_trial_ends is not null and v_trial_ends > now() then
    return NEW;
  end if;

  -- Free plan (no active trial) → enforce limits
  if TG_OP = 'INSERT' then
    select count(*) into v_total
      from public.menus
      where restaurant_id = NEW.restaurant_id;
    if v_total >= 1 then
      raise exception 'Free plan is limited to 1 menu. Delete your existing menu or upgrade to create another.';
    end if;
  end if;

  if NEW.status = 'published' then
    select count(*) into v_published
      from public.menus
      where restaurant_id = NEW.restaurant_id
        and status = 'published'
        and id <> NEW.id;
    if v_published >= 1 then
      raise exception 'Free plan is limited to 1 published menu. Unpublish your current live menu first.';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_enforce_menu_plan_limits on public.menus;
create trigger trg_enforce_menu_plan_limits
  before insert or update on public.menus
  for each row execute function public.enforce_menu_plan_limits();
