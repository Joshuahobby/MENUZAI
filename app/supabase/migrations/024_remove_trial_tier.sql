-- Normalize existing trial-plan rows to free.
-- Trial state is now tracked solely by trial_ends_at being in the future,
-- not by a separate plan value. This removes 'trial' as a stored DB value.
UPDATE restaurants SET plan = 'free' WHERE plan = 'trial';

COMMENT ON COLUMN restaurants.plan IS
  'Values: free, pro, business. Trial state is derived from trial_ends_at being in the future — it is never stored as a separate plan tier.';
