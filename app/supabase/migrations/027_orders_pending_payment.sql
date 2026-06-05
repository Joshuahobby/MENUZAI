-- Add pending_payment status to orders + paid flag + payment_deposit_id link
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending_payment', 'pending', 'preparing', 'confirmed', 'cancelled'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_deposit_id text;
