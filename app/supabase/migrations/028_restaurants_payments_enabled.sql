-- Allow restaurant owners to opt in to online food payments via PawaPay
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS payments_enabled boolean NOT NULL DEFAULT false;
