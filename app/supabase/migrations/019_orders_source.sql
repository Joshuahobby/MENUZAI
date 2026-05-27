-- ============================================================
-- Migration 019: Add source column to orders
-- Tracks whether an order came from WhatsApp button or AI Waiter chat
-- ============================================================

alter table public.orders
  add column if not exists source text not null default 'whatsapp';

-- Backfill: all existing orders are whatsapp orders
update public.orders set source = 'whatsapp' where source is null;

comment on column public.orders.source is
  'Order origin: ''whatsapp'' = tapped Order via WhatsApp, ''ai_waiter'' = placed through AI chat';
