-- ============================================================
-- MENUZAI — Enable Realtime for Orders
-- Enables Supabase Realtime publication for the orders table
-- ============================================================

-- Add the 'orders' table to the 'supabase_realtime' publication
-- This allows the Next.js client to subscribe to INSERT/UPDATE/DELETE events
alter publication supabase_realtime add table public.orders;
