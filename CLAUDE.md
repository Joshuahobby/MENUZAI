# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js Version Notice

This project uses **Next.js 16.2.1**, which contains breaking changes from earlier versions — APIs, conventions, and file structure may differ from training data. Read the relevant guide in `app/node_modules/next/dist/docs/` before writing any code that touches Next.js internals or routing.

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

No unit test framework is configured. E2E tests use Playwright:

```bash
npm run test:e2e            # Run all Playwright tests
npm run test:e2e:ui         # Run with Playwright UI
npm run test:e2e:headed     # Run in headed browser
npm run test:e2e:debug      # Debug mode
```

The dashboard layout sets `data-auth-ready="true"` on its root `<div>` once auth + onboarding checks complete — Playwright tests use this as a synchronization signal.

## Environment Variables

All required variables are documented in `app/.env.example`. For local dev, create `app/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENROUTER_API_KEY=          # from openrouter.ai
OPENROUTER_MODEL=google/gemma-4-31b-it:free   # swap without redeploying; if unset, auto-selects best free vision model
NEXT_PUBLIC_SITE_URL=http://localhost:3000     # set to production domain on Vercel
# PAWAPAY_JWT=               # uncomment when enabling payments
# PAWAPAY_WEBHOOK_SECRET=    # from pawaPay dashboard → Webhooks; required for signature verification
# For Playwright E2E tests:
# SUPABASE_SERVICE_ROLE_KEY=
# E2E_TEST_EMAIL=
# E2E_TEST_PASSWORD=
# PLAYWRIGHT_BASE_URL=http://localhost:3000
```

## Architecture

MENUZAI is an AI-powered SaaS platform for restaurant menu digitization. Stack: **Next.js 16 App Router**, **Supabase** (Postgres + auth + RLS), **React Context API**, **OpenRouter** for AI vision, **Tailwind CSS v4**.

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
| `/dashboard/editor` | Yes | WYSIWYG menu editor — 3-panel layout with device frame preview |
| `/dashboard/analytics` | Yes | Menu performance charts (views, conversions) via recharts |
| `/dashboard/menus` | Yes | List, create, and switch between menus |
| `/dashboard/orders` | Yes | WhatsApp order history |
| `/dashboard/qr-codes` | Yes | Generate custom QR codes with logo overlay |
| `/dashboard/settings` | Yes | Restaurant and account settings, plan upgrade/downgrade |
| `/dashboard/templates` | Yes | Choose pre-designed menu templates (6 templates, live-rendered) |
| `/menu/[slug]` | No | Public menu — only renders if `status = 'published'` |
| `/menu/[slug]/order` | No | Cart + WhatsApp checkout for public menus |
| `/menu/demo` | No | Demo using hardcoded mock data |

### API Routes

| Route | Method | Notes |
| --- | --- | --- |
| `/api/extract-menu` | POST | Image → OpenRouter LLM → parsed menu JSON; auto-selects best free vision model if `OPENROUTER_MODEL` not set; rate-limited 5 req/IP/min (in-memory) |
| `/api/auth/callback` | GET | Supabase OAuth redirect handler |
| `/api/analytics/summary` | GET | Aggregated analytics from `analytics_events` table |
| `/api/payments/pawapay` | POST | Payment initiation; falls back to simulation if `PAWAPAY_JWT` not set |
| `/api/webhooks/pawapay` | POST | Payment webhook; verifies `X-Pawapay-Signature` HMAC-SHA256 against `PAWAPAY_WEBHOOK_SECRET` |
| `/api/ai-waiter` | POST | AI-powered waiter/recommendation feature |
| `/api/notifications/order` | POST | Order notification handler |
| `/api/plan/change` | POST | Subscription plan upgrade/downgrade |

### Supabase: Three Clients

**Never mix these up:**

- **Browser client** (`app/src/lib/supabase.ts`) — singleton, used in Client Components and `"use client"` route handlers. Import: `import { supabase } from "@/lib/supabase"`
- **Server client** (`app/src/lib/supabase-server.ts`) — created per-request with SSR cookies, used in Server Components and API routes that need auth context. Import: `import { createSupabaseServerClient } from "@/lib/supabase-server"`
- **Admin client** (`app/src/lib/supabase-admin.ts`) — uses `service_role` key, bypasses RLS. Only use in trusted server-side contexts where elevated privileges are required.

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

Key tables:

- **`restaurants`** — one row per user, created on first login. Has `onboarded boolean` checked by dashboard layout.
- **`menus`** — many per restaurant. `categories` and `items` are JSONB arrays. `status` is `'draft' | 'published'`. Has a legacy `restaurant_name` column (nullable, unused — do not rely on it).
- **`analytics_events`** — fired client-side via `app/src/lib/analytics.ts` (fire-and-forget, no error handling by design).
- **`orders`** — created via WhatsApp flow, not via API currently.

### Shared Types

`app/src/types/menu.ts` is the canonical source for `MenuItem`, `MenuCategory`, `MenuStyle`, and `CartItem`. `MenuContext` re-exports them for backward compatibility — import from `@/types/menu` directly in new code.

`MenuItem` fields:
- `available`: `undefined` or `true` = available; `false` = sold out. Optional — absence means available.
- `badge`: optional string from `["bestseller", "popular", "healthy", "chefs-pick", "new"]`.
- `image`: URL string (Supabase Storage or Unsplash placeholder).
- `tags`: `string[]` — user-defined dietary/attribute tags.
- `margin`, `orders`: optional numeric fields for analytics.

`MenuCategory` fields:
- `hidden`: optional boolean — when true, category is excluded from public menu and print.
- `image`: optional string — category banner image URL, displayed in editor canvas header and sidebar thumbnail.

`MenuStyle.currency`: string code (default `"RWF"`). `app/src/lib/utils.ts` exports `formatPrice(amount, currency)` which handles whole-unit currencies (RWF, UGX, TZS, etc.) without decimal places — important for the primary African market.

### State Management

**`MenuContext`** (`app/src/context/MenuContext.tsx`) — the central store for the authenticated user's active menu. Auto-saves changes (categories, items, style) to Supabase with a 1-second debounce. Manages multi-menu switching (with `flushPendingSave` before switching), publishing (generates slug via `app/src/lib/slug.ts`), and CRUD for items/categories.

**`useMenuBootstrap`** (`app/src/hooks/useMenuBootstrap.ts`) — extracted custom hook that encapsulates the auth listener + restaurant/menu bootstrap logic (~240 lines). On login: verifies session, finds/creates the restaurant row, loads the most-recently-updated menu. Called by MenuProvider.

Key actions exposed: `addCategory`, `renameCategory`, `removeCategory`, `toggleCategoryVisibility`, `addItem`, `removeItem`, `updateItem`, `duplicateItem`, `applyTemplate`, `publishMenu`, `unpublishMenu`, `switchMenu`, `createMenu`, `deleteMenu`, `renameMenu`.

The dashboard auth guard lives in `app/src/app/dashboard/layout.tsx` and runs **client-side** — it reads `onboarded` from `MenuContext` and redirects to `/onboarding` if false. There is no server-side middleware. The layout waits for `isLoading` to be false before evaluating auth state.

**`CartContext`** (`app/src/contexts/CartContext.tsx`) — ephemeral cart for the public ordering flow. Contents are serialized into a WhatsApp message via `app/src/lib/whatsapp.ts` and opened via `wa.me` URL — no WhatsApp API key needed.

### Menu Editor (3-Panel Architecture)

The editor (`app/src/app/dashboard/editor/page.tsx`, ~530 lines) is the core authoring experience. It uses a 3-panel layout:

1. **Left: `MenuSectionsSidebar`** — category list with drag-to-reorder, inline banner image upload, rename/hide/delete actions. Hidden on mobile; replaced by a horizontal tab strip with a bottom-sheet action menu.
2. **Center: Device-frame canvas** — WYSIWYG preview wrapped in a phone/tablet/desktop frame. Viewport switcher (mobile `390px` / tablet `680px` / desktop `920px`) in the header. Each item renders as an **`EditorItemCard`** (`app/src/app/dashboard/editor/EditorItemCard.tsx`, ~290 lines) — a self-contained component with image upload, inline price editing, name/description inputs, tag chips, and an expandable panel for availability toggle, badge picker, tag editor, duplicate, and delete.
3. **Right: `StyleEditorSidebar`** — toggled via the "Design" button. Controls: headline/body font pickers (10 headline + 9 body Google Fonts loaded on demand), primary accent color (6 presets + custom picker), background color, currency selector (13 currencies, African focus), style presets from `mockData.ts` templates, card style (flat/elevated/glass), corner radius (sharp/soft/round/pill), grid layout (single/compact), and spacing density slider.

Item images upload to Supabase Storage `menu-images` bucket under `{userId}/items/{timestamp}.{ext}`. Category banners upload to `menu-images` bucket under `{userId}/banners/` via the `ImageUpload` component.

The editor also integrates a **Print Menu** overlay using `PrintView` from the templates system.

### Template System

`app/src/app/dashboard/templates/` contains the live-rendered template engine:

- **`TemplatePreview.tsx`** — renders 6 distinct menu templates as pure React/inline-style components, scaled to fit any container width. Templates: `vintage-parchment`, `dark-chalkboard`, `bold-street`, `bistro-split`, `photo-gallery`, `luxury-gold`. Each template uses its own Google Fonts (Playfair Display, Oswald, Bebas Neue, Cormorant Garamond, Outfit). Exports `TplData`, `TplItem`, `TplCategory`, `TplStyle` types and `DEMO_DATA` constant. Canvas base dimensions: 700×990px.
- **`PrintView.tsx`** — print/PDF overlay with template switcher dropdown (all 6 templates), accent color picker, and a "Download PDF" button that opens the browser print dialog targeting "Save as PDF". Also includes a share link button.
- **`page.tsx`** — template gallery page for browsing and applying templates.

### AI Menu Extraction

`POST /api/extract-menu` accepts **up to 5 images** (JPG/PNG/WebP/GIF, max 10MB each — PDF not supported by free models). Submit as `file` (single) or `file_0`…`file_4` (multiple) in multipart form data. It calls OpenRouter using the model in `OPENROUTER_MODEL` (or auto-selects the best free vision model if unset, preferring Gemma-4 > Gemma-3 by param count). Runs extractions in parallel, then merges results via `mergeExtractionResults` in `app/src/lib/ai-extract.ts` (deduplicates categories by normalized name, deduplicates items by name). Rate-limited to 5 requests/IP/minute (in-memory only — resets on server restart). Model selection result is cached for 5 minutes.

### Styling

**Tailwind CSS v4** — config is inside `app/src/app/globals.css` in a `@theme {}` block, not in `tailwind.config.js` (that file doesn't exist). Custom tokens:

- Colors: primary `#a04100` (darker brown-orange), primary-container `#FF6B00` (vibrant orange), tertiary `#006e2a` / tertiary-container `#00b149`, surface `#fcf9f8`
- Fonts: Plus Jakarta Sans (headlines), Inter (body) — loaded via Google Fonts in root layout
- Material Design 3 token naming (`on-surface`, `surface-container-low`, etc.)
- Custom utilities: `.glass-nav`, `.editor-canvas` (dot grid background), `.hide-scrollbar`, `.icon-fill`, `.premium-shadow`, `.theme-transition`
- Device frame sizing via `data-viewport` attribute on `.device-frame`

Icons are **Material Symbols Outlined** loaded via Google Fonts — use `<span className="material-symbols-outlined">icon_name</span>`.

### Plan Limits

`app/src/lib/plans.ts` defines per-plan feature limits. Three tiers: `free`, `pro`, `business`.

| Plan | Max Total Menus | Max Published | Max Drafts |
| --- | --- | --- | --- |
| Free | 1 | 1 | 1 |
| Pro | ∞ | ∞ | ∞ |
| Business | ∞ | ∞ | ∞ |

The `restaurants` table stores the current plan tier; check `canCreateMenu()`, `canPublishMenu()`, and `canCreateDraft()` before adding any feature that should be gated by plan.

### Key Components

| Component | Location | Purpose |
| --- | --- | --- |
| `CheckoutModal` | `app/src/components/CheckoutModal.tsx` | Payment checkout modal |
| `ImageUpload` | `app/src/components/ImageUpload.tsx` | Reusable image upload with Supabase Storage |
| `Modals` | `app/src/components/Modals.tsx` | Imperative `prompt()` and `confirm()` functions via global modals |
| `Skeleton` | `app/src/components/Skeleton.tsx` | Loading skeleton placeholders |
| `PublicMenuClient` | `app/src/app/menu/[slug]/PublicMenuClient.tsx` | Client-side public menu renderer (~27KB) |
| `EditorItemCard` | `app/src/app/dashboard/editor/EditorItemCard.tsx` | Self-contained menu item card with image upload, tags, badges |
| `useMenuBootstrap` | `app/src/hooks/useMenuBootstrap.ts` | Auth + restaurant/menu bootstrap hook used by MenuProvider |

### Key Dependencies

- `recharts` — analytics charts in `/dashboard/analytics`
- `qrcode.react` — QR code generation in `/dashboard/qr-codes`
- `sonner` — toast notifications (Toaster registered in root layout)
- `vitest` — unit test framework (56 tests across 5 suites)
- `@anthropic-ai/sdk` — present in package.json for future Claude AI features (not currently wired to routes)
- `@supabase/ssr` — PKCE-compatible Supabase client creation

### Path Alias

`@/*` → `app/src/*` (set in `app/tsconfig.json`).

### Payments

`/api/payments/pawapay` and `/api/webhooks/pawapay` exist but the actual API calls are commented out — they return a simulated success response. To enable: set `PAWAPAY_JWT`, uncomment the fetch block in the route, and implement webhook signature verification.

### Other

- **ServiceWorker** — registered in root layout (`/sw.js`), enables PWA/offline capability with an offline fallback page at `/offline`.
- **`app/src/data/mockData.ts`** — hardcoded fixtures used by the landing page pricing section, `/menu/demo`, and the style editor presets.
- **Dashboard sidebar** — collapsible via a toggle button; collapsed state persisted to `localStorage` under `sidebar-collapsed`. Mobile uses a bottom tab bar with a "More" overflow sheet.
- **SEO** — `robots.ts` and `sitemap.ts` are configured. Root layout includes Open Graph and Twitter Card metadata.
- **Error handling** — `global-error.tsx` at app root, `error.tsx` in dashboard and public menu routes.

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
