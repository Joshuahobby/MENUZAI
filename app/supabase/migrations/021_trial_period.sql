-- Add trial support to restaurants
-- plan = 'trial' during the trial period; trial_ends_at tracks expiry
alter table restaurants
  add column if not exists trial_ends_at timestamptz;

comment on column restaurants.trial_ends_at is
  'When the free trial expires. Set to now()+14 days on restaurant creation. NULL after trial ends or for restaurants created before trials were introduced.';

-- Backfill: give existing free-plan restaurants that were created recently
-- (within the last 14 days) a retroactive trial window, so they benefit too.
update restaurants
set trial_ends_at = created_at + interval '14 days'
where plan = 'free'
  and trial_ends_at is null
  and created_at > now() - interval '14 days';
