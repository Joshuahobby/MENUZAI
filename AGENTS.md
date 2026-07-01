# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Important: Next.js Version Notice

This project uses **Next.js 16.2.1**, which contains breaking changes from earlier versions — APIs, conventions, and file structure may differ from training data. Read the relevant guide in `app/node_modules/next/dist/docs/` before writing any code that touches Next.js internals or routing.

**Middleware is replaced by `proxy.ts`** — `app/src/proxy.ts` exports a `proxy()` function (not `middleware()`) that refreshes Supabase sessions on every request. This is the Next.js 16 convention; `middleware.ts` is deprecated.

## Commands

All commands run from the `app/` directory:

```bash
cd app
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000 (uses --webpack, not Turbopack)
npm run build     # Runs tsc --noEmit + next build (all must pass)
npm run lint      # ESLint checks
npm run test      # Run unit tests (Vitest)
npm run test:watch # Run Vitest in watch mode
npm start         # Run production server
```

Unit tests are handled by Vitest. E2E tests use Playwright:

```bash
npm run test:e2e            # Run all Playwright tests
npm run test:e2e:ui         # Run with Playwright UI
npm run test:e2e:headed     # Run in headed browser
npm run test:e2e:debug      # Debug mode
```

Run a single test file:

```bash
npx vitest run src/lib/utils.test.ts          # single Vitest file
npx playwright test e2e/tests/04-editor.spec.ts          # single E2E spec
npx playwright test e2e/tests/04-editor.spec.ts --headed # headed
```

The dashboard layout sets `data-auth-ready="true"` on its root `<div>` once auth + onboarding checks complete — Playwright tests use this as a synchronization signal.

**E2E infrastructure**: `global-setup.ts` creates/resets a confirmed test user via Supabase Admin API and saves browser session (cookies + localStorage) to `e2e/.auth/user.json`. Most test specs reuse this saved session. Tests are numbered `01–14` and run in sequence. Page Object classes live in `e2e/pages/` (`LoginPage`, `DashboardPage`, `EditorPage`, `OnboardingPage`). The login page now requires clicking **"Continue with Email"** before the email input appears — all PO helpers handle this.

**Lint**: `npm run lint` has pre-existing failures in root utility scripts (`apply_all_migrations.js`, `inspect.js`, etc.) and `scratch/` — CommonJS `require()` forbidden by the ESLint config. These don't block build or TypeScript. App source is lint-clean except a handful of `no-explicit-any` in API routes and `react-hooks` warnings.

## Environment Variables

All required variables are documented in `app/.env.example`. For local dev, create `app/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Required for admin tasks, emails, E2E tests
OPENROUTER_API_KEY=              # from openrouter.ai
OPENROUTER_MODEL=meta-llama/llama-3.2-11b-vision-instruct:free  # swap without redeploying; falls back through VISION_FALLBACK_MODELS chain if unset
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # set to production domain on Vercel
# Upstash Redis — for persistent rate limiting across Vercel instances
# UPSTASH_REDIS_REST_URL=        # from Upstash console → REST API
# UPSTASH_REDIS_REST_TOKEN=      # from Upstash console → REST API
# (rate limiting fails open / allows requests if these are absent)
# ANTHROPIC_API_KEY=sk-ant-...   # set in Admin → AI Settings to switch provider to Anthropic
# NEXT_PUBLIC_ADMIN_EMAILS=admin@menuzai.com,other@example.com  # comma-separated; gates /admin/settings
# PAWAPAY_API_KEY=               # from pawaPay dashboard → API Keys
# PAWAPAY_MODE=sandbox           # "sandbox" (default) or "live"
# PAWAPAY_BASE_URL=              # override; auto-set from PAWAPAY_MODE if omitted
# PAWAPAY_WEBHOOK_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
# RESEND_API_KEY=re_...          # order confirmation, plan-upgrade & welcome emails
# RESEND_FROM_EMAIL=welcome@menuzaai.com  # sender address for welcome emails (optional, has default)
CRON_SECRET=                     # REQUIRED — cron endpoints return 500 if not set; use openssl rand -hex 32
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=  # alias for VAPID_PUBLIC_KEY — needed client-side for push subscribe
# VAPID_PUBLIC_KEY=              # Web Push VAPID public key
# VAPID_PRIVATE_KEY=             # Web Push VAPID private key
# VAPID_CONTACT_EMAIL=           # Web Push contact email (mailto: in VAPID details)
# For Playwright E2E tests:
# E2E_TEST_EMAIL=
# E2E_TEST_PASSWORD=
# PLAYWRIGHT_BASE_URL=http://localhost:3000
```

## Architecture

MENUZAI is an AI-powered SaaS platform for restaurant menu digitization. Stack: **Next.js 16 App Router**, **Supabase** (Postgres + auth + RLS), **React Context API + Zustand**, **OpenRouter** for AI vision, **Tailwind CSS v4**.

### Route Map

| Route | Auth Required | Notes |
| --- | --- | --- |
| `/` | No | Landing page, uses `mockData.ts` for pricing section |
| `/login` | No | Supabase email/password |
| `/pricing` | No | Standalone pricing page |
| `/onboarding` | Yes | One-time setup; sets `restaurants.onboarded = true` |
| `/upload` | Yes | File upload → `/api/extract-menu` → redirects to `/ai-result` |
| `/ai-result` | Yes | Review/edit AI-extracted menu items before saving |
| `/dashboard` | Yes | Auth + onboarding guard in `dashboard/layout.tsx` |
| `/dashboard/editor` | Yes | WYSIWYG menu editor — 2-panel layout (sidebar + device-frame canvas) |
| `/dashboard/analytics` | Yes | Menu performance charts (views, conversions) via recharts |
| `/dashboard/menus` | Yes | List, create, and switch between menus |
| `/dashboard/orders` | Yes | Real-time staff panel — live order stream (Supabase postgres_changes) + waiter pager (Supabase broadcast channel `table_requests:{restaurantId}`); filterable by status and source (WhatsApp / AI Waiter) |
| `/dashboard/qr-codes` | Yes | Generate custom QR poster badges with logo overlay; batch export N table QR codes as a single PDF; uses `QRPosterRenderer` |
| `/dashboard/reviews` | Yes | View customer reviews; AI-generated reply drafts via `/api/ai-reply` |
| `/dashboard/settings` | Yes | Restaurant and account settings, plan upgrade/downgrade |
| `/dashboard/templates` | Yes | Choose pre-designed menu templates (8 templates, live-rendered) |
| `/admin/metrics` | Yes (platform admin) | MRR, restaurant/order counts, cron job status |
| `/admin/restaurants` | Yes (platform admin) | Restaurant list with search, plan filter, plan override |
| `/admin/restaurants/[id]` | Yes (platform admin) | Individual restaurant drilldown — menus, orders, transactions |
| `/admin/transactions` | Yes (platform admin) | Full payment transaction ledger |
| `/admin/broadcast` | Yes (platform admin) | Send segmented emails (all / trial / free / pro / business) via Resend |
| `/admin/audit` | Yes (platform admin) | Immutable audit log of admin-initiated mutations |
| `/admin/subscriptions` | Yes (platform admin) | Live subscriber counts, estimated MRR by plan, and an in-page pricing editor (reads/writes `platform_settings.plan_prices`); changes take effect immediately with no redeploy |
| `/admin/settings` | Yes (platform admin) | Super-admin AI provider config; guarded by `isPlatformAdmin()` |
| `/menu/[slug]` | No | Public menu — only renders if `status = 'published'` |
| `/menu/[slug]/order` | No | Cart + WhatsApp checkout for public menus |
| `/menu/demo` | No | Demo using hardcoded mock data |
| `/demo` | No | Demo role chooser — links to customer, owner, and staff demos |
| `/demo/owner` | No | Interactive owner dashboard demo (no auth required) |
| `/demo/staff` | No | Interactive staff orders panel demo (no auth required) |
| `/features` | No | Features marketing page |
| `/terms` | No | Terms of Service |
| `/privacy` | No | Privacy Policy |

### API Routes

| Route | Method | Notes |
| --- | --- | --- |
| `/api/extract-menu` | POST | Image → OpenRouter LLM → parsed menu JSON; if `OPENROUTER_MODEL` not set, tries vision models in order: llama-3.2-11b → gemini-2.0-flash-exp → qwen2-vl-7b; rate-limited 5 req/IP/min via Upstash Redis (fails open if Redis unavailable) |
| `/api/auth/callback` | GET | Supabase OAuth redirect handler |
| `/api/analytics/summary` | GET | Aggregated analytics from `analytics_events` table |
| `/api/ai-waiter` | POST | AI-powered conversational waiter in public menu; routes to configured AI provider |
| `/api/ai-reply` | POST | Generates AI reply draft for a customer review; **Pro-only** (auth + plan checked server-side); uses OpenRouter with fallback template |
| `/api/ai/generate-items` | POST | Generates menu items from a natural-language prompt; bulk-inserts into the active category; uses configured AI provider |
| `/api/ai/description` | POST | Auto-writes a single item description given the item name and tags; uses configured AI provider |
| `/api/admin/subscriptions` | GET/POST | GET: live plan distribution + MRR + current prices from `platform_settings.plan_prices`. POST: update Pro/Business prices (1,000–10,000,000 RWF); writes `plan_price_change` to `admin_audit_log`; admin-only |
| `/api/admin/ai-config` | GET/POST | Read/write `platform_settings`; restricted to `isPlatformAdmin()` emails |
| `/api/admin/metrics` | GET | Platform-wide MRR, restaurant/order counts by plan; admin-only |
| `/api/admin/restaurants` | GET | Paginated restaurant list with plan/search filters; admin-only |
| `/api/admin/set-plan` | POST | Override a restaurant's plan and expiry; writes to `admin_audit_log`; admin-only |
| `/api/admin/transactions` | GET | Full transaction ledger (all restaurants); admin-only |
| `/api/admin/broadcast` | POST | Send email to a plan segment (`all`/`trial`/`free`/`pro`/`business`) via Resend; writes to `admin_audit_log`; admin-only |
| `/api/admin/audit-log` | GET | Paginated `admin_audit_log` entries; admin-only |
| `/api/admin/cron-status` | GET | Last run status for each cron job from `cron_execution_logs`; admin-only |
| `/api/admin/health` | GET | Liveness check — returns `{ ok: true }`; admin-only |
| `/api/admin/upgrade-db` | POST | Runs pending DB migrations server-side; admin-only |
| `/api/notifications/order` | POST | Sends order receipt emails to restaurant owner and (if provided) customer via Resend; body: `{ restaurantId, items, total, currency, customerName?, customerEmail?, tableNumber? }` |
| `/api/public/stats` | GET | Returns `{ restaurants, orders }` counts for landing page social proof; cached 1 hr (`s-maxage=3600`); falls back to seed values if admin client unavailable |
| `/api/orders/confirm` | POST | Confirms order, decrements `stock_count` on each item, auto-sets `available=false` when stock hits 0; requires `SUPABASE_SERVICE_ROLE_KEY` |
| `/api/payments/pawapay` | POST | Payment initiation; amount is looked up server-side from `platform_settings.plan_prices` (not trusted from client), falling back to hardcoded defaults; falls back to simulation if `PAWAPAY_API_KEY` not set |
| `/api/payments/food` | POST | Initiates a food order payment via PawaPay; restaurant must have `payments_enabled=true`; creates order in `pending_payment` status; body: `{ restaurantId, menuId, items, total, currency, phone, tableNumber?, customerName? }` |
| `/api/payments/status` | GET | Poll transaction status by `?depositId=`; auth-scoped to the requesting user; returns `{ status, plan }` |
| `/api/webhooks/pawapay` | POST | Payment webhook; verifies `X-Pawapay-Signature` RSA-SHA256; on `COMPLETED` upgrades plan and sets `plan_expires_at = now()+30d` |
| `/api/plan/change` | POST | Voluntary downgrade only (upgrades require payment); clears `plan_expires_at` on downgrade |
| `/api/reviews` | POST | Submit a customer review (unauthenticated); writes to `reviews` table via admin client; rate-limited 5 req/IP per 5 min |
| `/api/staff` | GET/POST/DELETE | List/add/remove `restaurant_staff` entries; owner-only writes (POST/DELETE), owner+manager reads; POST is **Pro-only** (plan checked server-side); uses admin client to resolve emails via `auth.admin.listUsers` |
| `/api/push/subscribe` | POST | Upserts a Web Push subscription for the authenticated restaurant; requires VAPID env vars |
| `/api/push/send` | POST | Sends a Web Push notification to all subscribers of a `restaurantId`; auto-purges expired (410) subscriptions; admin client |
| `/api/notifications/welcome` | POST | Sends a welcome onboarding email via Resend on first restaurant creation; body: `{ userId, restaurantName }` |
| `/api/cron/expire-transactions` | POST | Expires `transactions` rows stuck in `pending` for >15 min; runs on Vercel cron at 02:00 UTC daily; secured by `CRON_SECRET` bearer token (required) |
| `/api/cron/expire-subscriptions` | POST | Downgrades restaurants whose `plan_expires_at` has passed to `free`; runs on Vercel cron at 03:00 UTC daily; secured by optional `CRON_SECRET` |
| `/api/cron/remind-subscriptions` | POST | Sends lifecycle emails via Resend: trial day-1 welcome, day-7 midpoint nudge, day-12 expiry warning, and 3-day paid-plan expiry reminder; runs on Vercel cron at 09:00 UTC daily; secured by optional `CRON_SECRET` |

### Platform Admin Access

`isPlatformAdmin(email)` in `app/src/lib/utils.ts` checks against a comma-separated `NEXT_PUBLIC_ADMIN_EMAILS` env var (falls back to `admin@menuzai.com,e2e-test@menuzai.test`). All `/admin/*` pages and `/api/admin/*` routes check this. Platform admins can switch the global AI provider between `openrouter` and `anthropic`, override restaurant plans (logged to `admin_audit_log`), update plan prices (logged as `plan_price_change`), send broadcast emails, and view all transactions and cron job status.

### Supabase: Four Clients

**Never mix these up:**

- **Browser client** (`app/src/lib/supabase.ts`) — singleton, used in Client Components and `"use client"` route handlers. Import: `import { supabase } from "@/lib/supabase"`
- **Server client** (`app/src/lib/supabase-server.ts`) — created per-request with SSR cookies, used in Server Components and API routes that need auth context. Import: `import { createSupabaseServerClient } from "@/lib/supabase-server"`
- **Admin client** (`app/src/lib/supabase-admin.ts`) — uses `service_role` key, bypasses RLS. Only use in trusted server-side contexts where elevated privileges are required.
- **Public client** (`app/src/lib/supabase-public.ts`) — cookie-free singleton, used in ISR-cached Server Components (e.g. `GET /api/public/stats`). Calling `cookies()` from the SSR client opts routes out of Next.js caching — use this client instead when the response should be ISR-cached.

### Database Schema

Migrations live in `app/supabase/migrations/` — run them in order in the Supabase SQL Editor.

| Migration | Purpose |
| --- | --- |
| `001_initial_schema.sql` | Core tables: `restaurants`, `menus`, `analytics_events`, `orders` |
| `002_storage_buckets.sql` | Supabase Storage bucket configuration |
| `002_transactions_schema.sql` | Payment transaction tracking for PawaPay |
| `003_rls_hardening.sql` | Row-Level Security policies |
| `004_restaurant_assets_bucket.sql` | Storage bucket for restaurant assets (logos etc.) |
| `004_restaurants_schema_fix.sql` | Schema fixes for the `restaurants` table |
| `005_strict_rls_lockdown.sql` | Stricter RLS policy hardening |
| `006_drop_menus_user_id_unique.sql` | Drops unique constraint on `menus.user_id` to allow multiple menus |
| `007_staff_roles.sql` | `restaurant_staff` table (owner/manager/staff roles), RLS, backfills existing restaurant owners |
| `008_get_user_by_email.sql` | `get_user_id_by_email()` RPC (security definer); callable by `authenticated` and `service_role` only |
| `009_customer_reviews.sql` | `reviews` table — public insert, staff-only select via RLS |
| `010_fix_rls_recursion.sql` | Fixes mutual RLS recursion via a `SECURITY DEFINER` helper function |
| `011_fix_menus_rls_and_autosave.sql` | Fixes menus RLS for auto-save (upsert without `restaurant_id`) and reliability |
| `012_enable_realtime_orders.sql` | Adds `orders` table to the `supabase_realtime` publication |
| `013_orders_customer_email.sql` | Adds `customer_email` column to `orders`; adds column comments for all statuses |
| `014_platform_settings.sql` | `platform_settings` table — single `'global'` row for AI provider/model config; service_role only |
| `015_restaurants_category.sql` | Adds `category varchar(50)` and `terms_accepted_at timestamptz` columns to `restaurants` |
| `016_push_subscriptions.sql` | `push_subscriptions` table — stores Web Push subscription objects per restaurant; unique index on `(restaurant_id, endpoint)`; used by `/api/push/subscribe` and `/api/push/send` |
| `017_orders_update_with_check.sql` | Adds explicit `WITH CHECK` to orders UPDATE policy (mirrors USING clause; prevents PostgREST ambiguity) |
| `018_fix_orders_status_check.sql` | Recreates `orders_status_check` constraint with the full valid set: `pending`, `preparing`, `confirmed`, `cancelled` |
| `019_orders_source.sql` | Adds `source text not null default 'whatsapp'` to `orders`; tracks whether an order came from the WhatsApp button or AI Waiter chat |
| `020_plan_expires_at.sql` | Adds `plan_expires_at timestamptz` to `restaurants`; `null` = free/no expiry; set to `now()+30d` by PawaPay webhook on each payment |
| `021_trial_period.sql` | Adds `trial_ends_at timestamptz` to `restaurants`; set to `now()+14 days` on creation; backfills existing free restaurants created within the last 14 days |
| `022_multi_location.sql` | Drops the unique constraint on `restaurants.user_id` to allow Business plan owners to have multiple restaurant rows (locations) |
| `023_custom_domain.sql` | Adds `custom_domain varchar(255)` to `restaurants` with a unique partial index; Business plan only; used by the public menu route to serve on a custom hostname |
| `024_remove_trial_tier.sql` | Normalizes all `plan = 'trial'` rows to `plan = 'free'`; trial state is now derived from `trial_ends_at` being in the future, not a separate plan tier |
| `025_cron_logs.sql` | `cron_execution_logs` table — persists each cron job run (status, rows affected, errors); service_role only |
| `025_performance_indexes.sql` | Composite indexes on `analytics_events`, `orders`, `menus`, `reviews` for the most frequent query patterns |
| `026_admin_audit_log.sql` | `admin_audit_log` table — immutable record of admin mutations (plan overrides, AI config changes); service_role only |
| `027_orders_pending_payment.sql` | Adds `pending_payment` status to `orders`; adds `paid boolean` and `payment_deposit_id text` columns |
| `028_restaurants_payments_enabled.sql` | Adds `payments_enabled boolean default false` to `restaurants`; opt-in flag for online food payment via PawaPay |
| `029_analytics_rls_restaurant_check.sql` | Tightens analytics_events INSERT RLS — adds `restaurant_id = menus.restaurant_id` cross-check to prevent fake event injection |
| `030_fix_restaurant_assets_rls.sql` | Fixes restaurant-assets Storage bucket RLS — adds ownership check so users can only manage their own files (was checking bucket_id only) |
| `031_fix_orders_insert_rls.sql` | Fixes orders INSERT RLS — adds `restaurant_id` cross-check against `menu_id`'s actual restaurant (was checkable with arbitrary restaurant_id) |
| `032_enforce_plan_menu_limits.sql` | DB-level trigger enforcing plan menu limits (free: max 1 total, max 1 published); previously client-side only via MenuContext |
| `033_enforce_location_limits.sql` | DB-level trigger enforcing restaurant location limits (free/pro: max 1, business: max 5); previously client-side only |
| `034_reviews_update_policy.sql` | Adds UPDATE RLS policy to `reviews` — was missing, silently blocking staff reply saves in the dashboard |
| `035_plan_prices.sql` | Adds `plan_prices jsonb` column to `platform_settings`; default `{"pro":35000,"business":89000}` RWF; enables admin price changes without redeploy |

Key tables:

- **`restaurants`** — one row per user (or multiple rows for Business plan multi-location owners — migration 022 dropped the unique constraint on `user_id`). Has `onboarded boolean` checked by dashboard layout. `plan_expires_at timestamptz` tracks subscription expiry — `null` for free; set 30 days forward on each successful payment; cleared on voluntary downgrade. `trial_ends_at timestamptz` marks end of the 14-day free trial (set on creation, `null` after trial or for pre-trial accounts). `custom_domain varchar(255)` maps a custom hostname to the restaurant's public menu (Business only). `payments_enabled boolean` — owner opt-in for online food payment via PawaPay (default false).
- **`menus`** — many per restaurant. `categories` and `items` are JSONB arrays. `status` is `'draft' | 'published'`. Has a legacy `restaurant_name` column (nullable, unused — do not rely on it).
- **`analytics_events`** — fired client-side via `app/src/lib/analytics.ts` (fire-and-forget, no error handling by design).
- **`orders`** — created via WhatsApp flow or AI Waiter. `status`: `pending_payment` → `pending` → `preparing` → `confirmed` → `cancelled`. `pending_payment` is set when online food payment is initiated; transitions to `pending` on PawaPay `COMPLETED` webhook. Use `POST /api/orders/confirm` to mark ready (sets `confirmed`, decrements stock). `preparing` and `cancelled` are set directly via Supabase client. Also stores `customer_email` (migration 013) for Resend receipt emails, `source` (migration 019): `'whatsapp'` or `'ai_waiter'`, `paid boolean`, and `payment_deposit_id` (PawaPay deposit reference).
- **`platform_settings`** — single row ('global') managing global AI provider and model orchestration. Also stores `plan_prices: { pro, business }` (JSONB) — the canonical prices used by payment initiation, the public pricing page, and `/admin/subscriptions`. Defaults to 35,000/89,000 RWF if the column is absent (pre-migration fallback in `DEFAULT_PRICES` in `api/admin/subscriptions/route.ts`).
- **`restaurant_staff`** — RBAC join table: `(restaurant_id, user_id, role)`. Roles: `owner`, `manager`, `staff`. Unique per `(restaurant_id, user_id)`. Backfilled from `restaurants.user_id` on migration.
- **`reviews`** — customer reviews: `(restaurant_id, rating 1–5, customer_name?, comment?, order_id?, sentiment, reply?, replied_at?)`. Open insert, staff-only read. `sentiment` is `"positive" | "negative" | "neutral"`. Staff can draft and save replies via `/dashboard/reviews`.
- **`push_subscriptions`** — Web Push subscription objects per restaurant. Upserted via `/api/push/subscribe` (authenticated); sent via `/api/push/send` (admin client). Requires `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL` env vars; silently skips if not configured.
- **`cron_execution_logs`** — one row per cron job run: `job_name`, `started_at`, `completed_at`, `status` (`running`/`success`/`error`), `rows_affected`, `error_message`. Written via `app/src/lib/cron-logger.ts` (`startCronRun` / `completeCronRun`); service_role only. Surfaced in `/admin/metrics` cron status panel.
- **`admin_audit_log`** — immutable record of admin-initiated mutations. Actions: `plan_override`, `ai_config_change`. Written server-side via admin client; never modified after insert. Surfaced in `/admin/audit`.

### Shared Types

`app/src/types/menu.ts` is the canonical source for `MenuItem`, `MenuCategory`, `MenuStyle`, `CartItem`, `QRTemplate`, and `QRPosterData`. `MenuContext` re-exports them for backward compatibility — import from `@/types/menu` directly in new code.

`MenuItem` fields:

- `available`: `undefined` or `true` = available; `false` = sold out. Optional — absence means available.
- `badge`: optional string from `["bestseller", "popular", "healthy", "chefs-pick", "new"]`.
- `image`: URL string (Supabase Storage or Unsplash placeholder).
- `tags`: `string[]` — user-defined dietary/attribute tags.
- `margin`, `orders`: optional numeric fields for analytics.
- `stock_count`: optional number. When set, `/api/orders/confirm` decrements it and sets `available=false` at zero.
- `gallery`: optional `string[]` — additional item photo URLs, stored under `{userId}/gallery/` in `menu-images` bucket.

`MenuCategory` fields:

- `hidden`: optional boolean — when true, category is excluded from public menu and print.
- `image`: optional string — category banner image URL, displayed in editor canvas header and sidebar thumbnail.

`MenuStyle.currency`: string code (default `"RWF"`). `app/src/lib/utils.ts` exports `formatPrice(amount, currency)` which handles whole-unit currencies (RWF, UGX, TZS, etc.) without decimal places — important for the primary African market.

`MenuStyle` AI Waiter settings: `aiWaiterTone?: "friendly" | "formal" | "vibrant"`, `aiWaiterUpsell?: string` (upsell prompt), `aiWaiterInstructions?: string` (custom system instructions injected per restaurant).

`QRPosterData`: Used by `QRPosterRenderer` to define poster layout — includes `templateId`, `headline`, `subheadline`, `footer?`, `backgroundImage?`, `logoUrl?`, `primaryColor`, `textColor`, `qrColor`, `pageSize ("A4" | "A5")`, `tableNumber?`.

### State Management

**`MenuContext`** (`app/src/context/MenuContext.tsx`) — the central store for the authenticated user's active menu. Auto-saves changes (categories, items, style) to Supabase with a 1-second debounce. Manages multi-menu switching (with `flushPendingSave` before switching), publishing (generates slug via `app/src/lib/slug.ts`), and CRUD for items/categories.

**`useMenuBootstrap`** (`app/src/hooks/useMenuBootstrap.ts`) — extracted custom hook that encapsulates the auth listener + restaurant/menu bootstrap logic (~240 lines). On login: verifies session, finds/creates the restaurant row, loads the most-recently-updated menu. Called by MenuProvider.

Key actions exposed: `addCategory`, `renameCategory`, `removeCategory`, `toggleCategoryVisibility`, `addItem`, `removeItem`, `updateItem`, `duplicateItem`, `applyTemplate`, `publishMenu`, `unpublishMenu`, `switchMenu`, `createMenu`, `deleteMenu`, `renameMenu`.

The dashboard auth guard lives in `app/src/app/dashboard/layout.tsx` and runs **client-side** — it reads `onboarded` from `MenuContext` and redirects to `/onboarding` if false. There is no server-side middleware. The layout waits for `isLoading` to be false before evaluating auth state.

**`useMenuStore`** (`app/src/store/menuStore.ts`) — Zustand store (with `subscribeWithSelector`) that holds the high-frequency editor state: `categories`, `menuItems`, `menuStyle`, `isSyncing`, `isLoading`, `userRole`, `restaurantLogoUrl`, and restaurant metadata. `MenuContext` remains the public API for all actions and side-effects; it reads/writes this store internally. Components should subscribe with granular selectors (e.g. `useMenuStore(s => s.menuItems)`) to avoid broad re-renders. Convenience selector hooks exported: `useMenuItems`, `useCategories`, `useMenuStyle`, `useIsSyncing`, `useIsLoading`, `useActiveMenuId`, `useRestaurantName`, `useUserRole`. Includes a `hydrate(data)` action for bulk initial load and a `updateItem(id, updates)` action for in-place item patching without full array replacement.

**`CartContext`** (`app/src/contexts/CartContext.tsx`) — ephemeral cart for the public ordering flow. Contents are serialized into a WhatsApp message via `app/src/lib/whatsapp.ts` and opened via `wa.me` URL — no WhatsApp API key needed.

### Menu Editor (2-Panel Architecture)

The editor (`app/src/app/dashboard/editor/page.tsx`) is the core authoring experience. It uses a 2-panel layout:

1. **Left: `EditorSidebar`** (`app/src/app/dashboard/editor/EditorSidebar.tsx`) — a persistent panel with two top-level tabs:
   - **Build tab** (`BuildSidebarContent.tsx`) — category list with HTML5 drag-to-reorder, banner image upload, rename/hide/delete actions, item list per active category, and an **AI Generate Items** panel (calls `/api/ai/generate-items`). Clicking an item opens `EditorItemForm` as a detail view within the same sidebar. On mobile, a bottom-sheet replaces the sidebar for the Build and Design tabs.
   - **Design tab** (`StyleEditorSidebarContent.tsx`) — 4 sub-tabs (Theme/Colors/Fonts/Layout): headline/body font pickers (10 headline + 9 body Google Fonts), accent + background color presets, "Magic Vibes" one-click style presets, card style (flat/elevated/glass), corner radius (sharp/soft/round/pill), spacing density, currency selector (13 currencies, African focus).
2. **Center: Device-frame canvas** — WYSIWYG preview wrapped in a phone/tablet/desktop frame. Viewport switcher (mobile `390px` / tablet `680px` / desktop `920px`) in the header. Items are draggable via `@dnd-kit` (`DndContext` + `SortableContext`). Each item renders as a read-only **`EditorItemCard`** — clicking it selects the item and opens `EditorItemForm` in the sidebar. **`EditorItemForm`** holds all editing controls: image upload, gallery (Pro-gated), inline price, name/description with AI auto-write, availability toggle, badge picker, dietary tag quick-toggles, custom tags, stock count, duplicate/delete.

Item images upload to Supabase Storage `menu-images` bucket under `{userId}/items/{timestamp}.{ext}`. Gallery images upload under `{userId}/gallery/`. Category banners upload under `{userId}/banners/` via the `ImageUpload` component.

The editor also integrates a **Print Menu** overlay using `PrintView` from the templates system.

### Template System

`app/src/app/dashboard/templates/` contains the live-rendered template engine:

- **`TemplatePreview.tsx`** — renders 8 distinct menu templates as pure React/inline-style components, scaled to fit any container width. Templates: `vintage-parchment`, `dark-chalkboard`, `bold-street`, `bistro-split`, `photo-gallery`, `luxury-gold`, `organic-clean`, `midnight-luxe`. Each template uses its own Google Fonts (Playfair Display, Oswald, Bebas Neue, Cormorant Garamond, Outfit). Exports `TplData`, `TplItem`, `TplCategory`, `TplStyle` types and `DEMO_DATA` constant. Canvas base dimensions: 700×990px.
- **`PrintView.tsx`** — print/PDF overlay with template switcher dropdown (all 8 templates), accent color picker, and a "Download PDF" button that opens the browser print dialog targeting "Save as PDF". Also includes a share link button.
- **`page.tsx`** — template gallery page for browsing and applying templates.

### AI Provider Stack & Admin Dashboard

The platform uses a dynamic AI provider stack configurable by the platform admin.

- **Admin Dashboard**: `/admin/settings` allows the super-admin to set the global AI provider (`openrouter` or `anthropic`) and model string. Settings are stored in the `platform_settings` table. Access is gated by `isPlatformAdmin()`.
- **Anthropic Integration**: Uses `@anthropic-ai/sdk` with `Codex-3-5-sonnet-20241022` for high-accuracy text extraction and conversational waiter capabilities. Requires `ANTHROPIC_API_KEY`.
- **OpenRouter Integration**: Serves as the free tier default, using `meta-llama/llama-3.2-11b-vision-instruct:free` (or whatever `OPENROUTER_MODEL` is set to).

### AI Menu Extraction

`POST /api/extract-menu` accepts **up to 5 images** (JPG/PNG/WebP/GIF, max 10MB each — PDF not supported). Submit as `file` (single) or `file_0`…`file_4` (multiple) in multipart form data. It dynamically fetches the provider from `platform_settings`. Runs extractions in parallel, then merges results via `mergeExtractionResults` in `app/src/lib/ai-extract.ts` (deduplicates categories by normalized name, deduplicates items by name). Rate-limited to 5 requests/IP/minute (in-memory only — resets on server restart).

### AI Waiter

`POST /api/ai-waiter` handles customer queries via a conversational interface in the public menu. It dynamically routes queries to the configured AI provider, using the restaurant's menu items as context. Per-restaurant tone and upsell behavior is controlled by `MenuStyle.aiWaiter*` fields. The chat widget auto-opens with a time-of-day greeting after 3 seconds on Pro/Business plans (proactive greeting fires once per page load via `useRef` guard in `PublicMenuClient`). Customers can place full orders in-chat; these are saved with `source = 'ai_waiter'` in the `orders` table.

### Styling

**Tailwind CSS v4** — config is inside `app/src/app/globals.css` in a `@theme {}` block, not in `tailwind.config.js` (that file doesn't exist). Custom tokens:

- Colors: primary `#a04100` (darker brown-orange), primary-container `#FF6B00` (vibrant orange), tertiary `#006e2a` / tertiary-container `#00b149`, surface `#fcf9f8`
- Fonts: Plus Jakarta Sans (headlines), Inter (body) — loaded via Google Fonts in root layout
- Material Design 3 token naming (`on-surface`, `surface-container-low`, etc.)
- Custom utilities: `.glass-nav`, `.editor-canvas` (dot grid background), `.hide-scrollbar`, `.icon-fill`, `.premium-shadow`, `.theme-transition`
- Device frame sizing via `data-viewport` attribute on `.device-frame`

Icons are **Material Symbols Outlined** loaded via Google Fonts — use `<span className="material-symbols-outlined">icon_name</span>`.

### Plan Limits

`app/src/lib/plans.ts` defines per-plan feature limits. Three DB tiers: `free`, `pro`, `business`. `"trial"` is a computed/ephemeral label returned by `resolvePlan()` when `plan = 'free'` and `trial_ends_at` is in the future — it is never stored in the DB.

**Pricing model (A+B Hybrid):** All new users get a 14-day trial (full Pro features) tracked by `trial_ends_at` on the `free`-plan record. After trial: pay Pro (14-day money-back guarantee) or remain on Free Lite (public menu works but shows "Powered by MENUZA AI" branding; no AI features). The `TrialExpiredModal` component surfaces this choice in the dashboard.

| Plan | Max Total Menus | Max Published | Max Drafts | Max Locations |
| --- | --- | --- | --- | --- |
| Free / Trial | 1 / ∞ | 1 / ∞ | 1 / ∞ | 1 |
| Pro | ∞ | ∞ | ∞ | 1 |
| Business | ∞ | ∞ | ∞ | 5 |

`showBranding(storedPlan, trialEndsAt)` in `plans.ts` is the single authority for whether the "Powered by MENUZA AI" footer renders on the public menu.

The `restaurants` table stores the current plan tier; check `canCreateMenu()`, `canPublishMenu()`, `canCreateDraft()`, and `canCreateRestaurant()` before adding any feature that should be gated by plan.

### Key Components

| Component | Location | Purpose |
| --- | --- | --- |
| `CheckoutModal` | `app/src/components/CheckoutModal.tsx` | Payment checkout modal |
| `ImageUpload` | `app/src/components/ImageUpload.tsx` | Reusable image upload with Supabase Storage |
| `Modals` | `app/src/components/Modals.tsx` | Imperative `prompt()` and `confirm()` functions via global modals |
| `QRCodeModal` | `app/src/components/QRCodeModal.tsx` | Standalone QR code canvas with size control and download |
| `QRPosterRenderer` | `app/src/app/dashboard/qr-codes/QRPosterRenderer.tsx` | Renders a styled QR poster from `QRPosterData`; used for table badges and printable sheets |
| `Skeleton` | `app/src/components/Skeleton.tsx` | Loading skeleton placeholders |
| `PublicMenuClient` | `app/src/app/menu/[slug]/PublicMenuClient.tsx` | Client-side public menu renderer (~27KB) |
| `EditorItemCard` | `app/src/app/dashboard/editor/EditorItemCard.tsx` | Read-only sortable item preview card in the canvas; click to open EditorItemForm |
| `EditorSidebar` | `app/src/app/dashboard/editor/EditorSidebar.tsx` | Left panel container with Build and Design tabs (desktop only; mobile uses bottom sheets) |
| `BuildSidebarContent` | `app/src/app/dashboard/editor/BuildSidebarContent.tsx` | Build tab — category management, item list, AI item generator |
| `StyleEditorSidebarContent` | `app/src/app/dashboard/editor/StyleEditorSidebarContent.tsx` | Design tab with 4 sub-tabs (Theme/Colors/Fonts/Layout) |
| `EditorItemForm` | `app/src/app/dashboard/editor/EditorItemForm.tsx` | Full item edit form (image, gallery, price, name, description with AI auto-write, availability, badge, dietary tags, stock count, duplicate/delete); shown inside BuildSidebarContent when an item is selected |
| `ItemDetailsModal` | `app/src/components/menu/ItemDetailsModal.tsx` | Public menu item detail sheet — shows gallery, dietary tags, add-to-cart; opened from `PublicMenuClient` |
| `useMenuBootstrap` | `app/src/hooks/useMenuBootstrap.ts` | Auth + restaurant/menu bootstrap hook used by MenuProvider |
| `StaffManager` | `app/src/app/dashboard/settings/StaffManager.tsx` | Staff invite/remove UI in dashboard settings; calls `/api/staff` |

### Key Dependencies

- `@dnd-kit/core` + `@dnd-kit/sortable` — drag-and-drop for item reordering in the editor canvas (canvas uses `DndContext`/`SortableContext`; sidebar category list uses native HTML5 drag events)
- `recharts` — analytics charts in `/dashboard/analytics`
- `qrcode.react` — QR code generation in `/dashboard/qr-codes`
- `sonner` — toast notifications (Toaster registered in root layout)
- `vitest` — unit test framework (56 tests across 5 suites)
- `@anthropic-ai/sdk` — used by `/api/extract-menu` and `/api/ai-waiter` when platform is configured for Anthropic
- `@supabase/ssr` — PKCE-compatible Supabase client creation
- `zustand` — Zustand store (`useMenuStore`) with `subscribeWithSelector` middleware; backs `MenuContext` for granular component subscriptions

### Path Alias

`@/*` → `app/src/*` (set in `app/tsconfig.json`).

### Payments

Two payment flows share the PawaPay integration:

1. **Plan upgrade** — `/api/payments/pawapay` initiates, `/api/webhooks/pawapay` confirms. Amount looked up server-side from `PLAN_PRICES`. On `COMPLETED`: upgrades `restaurants.plan`, sets `plan_expires_at = now()+30d`, sends confirmation email via Resend.
2. **Food order payment** — `/api/payments/food` initiates, same `/api/webhooks/pawapay` webhook handles completion (distinguished by `depositId` prefix). Requires `restaurants.payments_enabled = true`. On `COMPLETED`: marks order `paid = true`, transitions status from `pending_payment` → `pending`.

Set `PAWAPAY_API_KEY` to activate real payments; without it the plan payment route returns a simulated success. The webhook verifies `X-Pawapay-Signature` (RSA-SHA256, `PAWAPAY_WEBHOOK_PUBLIC_KEY`). Set `PAWAPAY_MODE=live` for production (defaults to sandbox).

### Other

- **ServiceWorker** — registered in root layout (`/sw.js`), enables PWA/offline capability with an offline fallback page at `/offline`.
- **`app/src/data/mockData.ts`** — hardcoded fixtures used by the landing page pricing section, `/menu/demo`, and the style editor presets.
- **Dashboard sidebar** — collapsible via a toggle button; collapsed state persisted to `localStorage` under `sidebar-collapsed`. Mobile uses a bottom tab bar with a "More" overflow sheet.
- **SEO** — `robots.ts` and `sitemap.ts` are configured. Root layout includes Open Graph and Twitter Card metadata.
- **Error handling** — `global-error.tsx` at app root, `error.tsx` in dashboard and public menu routes.
- **`app/scratch/`** — untracked utility scripts for one-off admin tasks (`check_rls.js`, `get_all_users.js`, `reset_user_password.js`); not part of the app.
- **`demo-video/`** — standalone Remotion v4 project. 90-second 1920×1080 investor demo video. `cd demo-video && npm install && npm run start` (Studio) or `npm run build` (MP4). YouTube: [youtu.be/G4vp5NQnk-I](https://youtu.be/G4vp5NQnk-I). Output at `demo-video/out/` is gitignored.

### Deployment

Vercel-optimized (`app/vercel.json`), deployed to region `cdg1` (Paris). Root directory must be set to `app` in Vercel project settings. After deploying, update Supabase Auth → URL Configuration to add `https://your-domain.com/api/auth/callback` as a redirect URL.

### Git

Single branch: `main`. All development happens on main. Repository has 45+ commits.

### CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push/PR to `main`:

1. **Lint** — `npm run lint`
2. **Type-check** — `npx tsc --noEmit`
3. **Unit tests** — `npm run test` (Vitest, 56 tests across 5 suites)
4. **Build** — `npm run build`

Vercel auto-deploys from `main` on push.

### Unit Tests

Vitest is configured in `app/vitest.config.ts` (jsdom environment, `@/` path alias). Test files live alongside their source in `app/src/lib/`:

| Test File | Tests | What It Covers |
| --- | --- | --- |
| `utils.test.ts` | 11 | `formatPrice`, `formatRelativeTime`, `formatEventType` |
| `slug.test.ts` | 8 | `generateSlug` — slugification, edge cases, fallback |
| `plans.test.ts` | 18 | Plan limits, meta, gating functions |
| `ai-extract.test.ts` | 11 | `parseExtractionResponse`, `mergeExtractionResults` |
| `whatsapp.test.ts` | 8 | `buildWhatsAppMessage`, `buildWhatsAppURL` |

Note: `slug.test.ts` mocks the `supabase` module because `slug.ts` imports it at module level.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:

- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
