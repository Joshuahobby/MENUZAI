-- Add subscription expiry tracking to restaurants
-- plan_expires_at: null = free (no expiry), non-null = paid plan expiry date
alter table restaurants
  add column if not exists plan_expires_at timestamptz;

comment on column restaurants.plan_expires_at is
  'When the current paid plan expires. NULL for free plans or plans with no expiry set. The expire-subscriptions cron downgrades rows where this is in the past.';
