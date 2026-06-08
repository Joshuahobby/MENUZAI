-- ============================================================
-- MENUZAI — store plan prices in platform_settings
-- Adds plan_prices JSONB to the existing single-row config table
-- so admins can update pricing without a code deployment.
-- Falls back to { pro: 35000, business: 89000 } (RWF) if missing.
-- ============================================================

alter table public.platform_settings
  add column if not exists plan_prices jsonb not null
    default '{"pro": 35000, "business": 89000}'::jsonb;

-- Backfill the existing global row so it carries an explicit value
update public.platform_settings
  set plan_prices = '{"pro": 35000, "business": 89000}'::jsonb
  where id = 'global';
