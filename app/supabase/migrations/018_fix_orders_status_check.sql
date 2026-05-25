-- Migration 018: Fix orders_status_check constraint
-- The existing constraint was created outside of migrations and does not
-- include all valid status values. Drop and recreate it with the full set.

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'preparing', 'confirmed', 'cancelled'));
