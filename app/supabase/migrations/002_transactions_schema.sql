-- ============================================================
-- TABLE: transactions
-- Tracks PawaPay/MoMo payment attempts and results.
-- ============================================================
create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  restaurant_id   uuid references public.restaurants(id) on delete cascade not null,
  deposit_id      text unique not null,
  amount          numeric not null,
  currency        text not null default 'RWF',
  status          text not null default 'pending', -- pending | completed | failed
  plan_name       text not null,                   -- pro | business
  external_id     text,                            -- pawaPay internal ID if returned
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS
alter table public.transactions enable row level security;

create policy "Owner can read their transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

-- Enable trigger for updated_at
create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.handle_updated_at();
