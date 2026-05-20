-- ============================================================
-- MENUZAI — Add customer_email to orders
-- Stores the optional email address submitted on the order form
-- so staff can follow up and so /api/notifications/order can
-- send a receipt to the customer even if looked up after the fact.
-- ============================================================

alter table public.orders add column if not exists customer_email text;

-- Update the status comment to reflect all four states used by the UI
comment on column public.orders.status is 'pending | preparing | confirmed | cancelled';
comment on column public.orders.customer_email is 'Optional — provided by customer on order form; used for Resend receipt email';
