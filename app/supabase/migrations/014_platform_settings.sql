-- ============================================================
-- MENUZAI — platform_settings table
-- Single-row config table (id = 'global') for platform-level
-- AI provider and model selection, managed via /admin/settings.
-- All three AI routes (extract-menu, ai-waiter, ai-config)
-- fall back to OpenRouter defaults when this table is missing
-- or the row does not exist, so existing deployments are safe.
-- ============================================================

create table if not exists public.platform_settings (
  id           text primary key,                         -- always 'global'
  ai_provider  text not null default 'openrouter',       -- 'openrouter' | 'anthropic'
  ai_model     text not null default 'meta-llama/llama-3.2-11b-vision-instruct:free',
  updated_at   timestamptz not null default now()
);

-- Seed the default row so reads always return a result
insert into public.platform_settings (id, ai_provider, ai_model)
values ('global', 'openrouter', 'meta-llama/llama-3.2-11b-vision-instruct:free')
on conflict (id) do nothing;

-- Only the service_role key (admin client) should read/write this table
alter table public.platform_settings enable row level security;

-- No public or authenticated access — admin client bypasses RLS
create policy "service_role only" on public.platform_settings
  as restrictive
  for all
  using (false);
