# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js Version Notice

This project uses **Next.js 16.2.1**, which contains breaking changes from earlier versions — APIs, conventions, and file structure may differ from training data. Read the relevant guide in `app/node_modules/next/dist/docs/` before writing any code that touches Next.js internals or routing.

## Commands

All commands run from the `app/` directory:

```bash
cd app
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build (must pass before deploying)
npm run lint      # ESLint checks
npm start         # Run production server
```

No test framework is configured.

## Environment Variables

All required variables are documented in `app/.env.example`. For local dev, create `app/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENROUTER_API_KEY=          # from openrouter.ai
OPENROUTER_MODEL=google/gemma-3-27b-it:free   # swap without redeploying
NEXT_PUBLIC_SITE_URL=http://localhost:3000     # set to production domain on Vercel
# PAWAPAY_JWT=               # uncomment when enabling payments
# PAWAPAY_WEBHOOK_SECRET=    # from pawaPay dashboard → Webhooks; required for signature verification
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
| `/dashboard/editor` | Yes | Menu editor with drag-drop item/category management |
| `/dashboard/analytics` | Yes | Menu performance charts (views, conversions) via recharts |
| `/dashboard/menus` | Yes | List, create, and switch between menus |
| `/dashboard/orders` | Yes | WhatsApp order history |
| `/dashboard/qr-codes` | Yes | Generate custom QR codes with logo overlay |
| `/dashboard/settings` | Yes | Restaurant and account settings |
| `/dashboard/templates` | Yes | Choose pre-designed menu templates |
| `/menu/[slug]` | No | Public menu — only renders if `status = 'published'` |
| `/menu/[slug]/order` | No | Cart + WhatsApp checkout for public menus |
| `/menu/demo` | No | Demo using hardcoded mock data |

### API Routes

| Route | Method | Notes |
| --- | --- | --- |
| `/api/extract-menu` | POST | Image → OpenRouter LLM → parsed menu JSON; rate-limited 5 req/IP/min (in-memory) |
| `/api/auth/callback` | GET | Supabase OAuth redirect handler |
| `/api/analytics/summary` | GET | Aggregated analytics from `analytics_events` table |
| `/api/payments/pawapay` | POST | Payment initiation; falls back to simulation if `PAWAPAY_JWT` not set |
| `/api/webhooks/pawapay` | POST | Payment webhook; verifies `X-Pawapay-Signature` HMAC-SHA256 against `PAWAPAY_WEBHOOK_SECRET` |

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
| `003_rls_hardening.sql` | Row-Level Security policies (run last) |

Key tables:

- **`restaurants`** — one row per user, created on first login. Has `onboarded boolean` checked by dashboard layout.
- **`menus`** — many per restaurant. `categories` and `items` are JSONB arrays. `status` is `'draft' | 'published'`. Has a legacy `restaurant_name` column (nullable, unused — do not rely on it).
- **`analytics_events`** — fired client-side via `app/src/lib/analytics.ts` (fire-and-forget, no error handling by design).
- **`orders`** — created via WhatsApp flow, not via API currently.

### State Management

**`MenuContext`** (`app/src/context/MenuContext.tsx`) — the central store for the authenticated user's active menu. Bootstraps on login: finds/creates the restaurant row, then loads the most-recently-updated menu. Auto-saves changes (categories, items, style) to Supabase with a 2-second debounce. Manages multi-menu switching, publishing (generates slug via `app/src/lib/slug.ts`), and CRUD for items/categories.

**`CartContext`** (`app/src/contexts/CartContext.tsx`) — ephemeral cart for the public ordering flow. Contents are serialized into a WhatsApp message via `app/src/lib/whatsapp.ts` and opened via `wa.me` URL — no WhatsApp API key needed.

### AI Menu Extraction

`POST /api/extract-menu` accepts an image (JPG/PNG/WebP/GIF, max 10MB — PDF not supported by free models). It calls OpenRouter using the model in `OPENROUTER_MODEL`, passes the image as a base64 `image_url` block, and parses the JSON response via `app/src/lib/ai-extract.ts`. Rate-limited to 5 requests/IP/minute (in-memory only — resets on server restart).

### Styling

**Tailwind CSS v4** — config is inside `app/src/app/globals.css` in a `@theme {}` block, not in `tailwind.config.js` (that file doesn't exist). Custom tokens:

- Colors: primary `#FF6B00`, tertiary `#00C853`, surface `#fcf9f8`
- Fonts: Plus Jakarta Sans (headlines), Inter (body) — loaded via Google Fonts in root layout
- Material Design 3 token naming (`on-surface`, `surface-container-low`, etc.)
- Custom utilities: `.glass-nav`, `.editor-canvas`, `.hide-scrollbar`, `.icon-fill`, `.premium-shadow`, `.theme-transition`

Icons are **Material Symbols Outlined** loaded via Google Fonts — use `<span className="material-symbols-outlined">icon_name</span>`.

### Key Dependencies

- `recharts` — analytics charts in `/dashboard/analytics`
- `qrcode.react` — QR code generation in `/dashboard/qr-codes`
- `sonner` — toast notifications (Toaster registered in root layout)
- `@anthropic-ai/sdk` — present in package.json for future Claude AI features (not currently wired to routes)

### Path Alias

`@/*` → `app/src/*` (set in `app/tsconfig.json`).

### Payments

`/api/payments/pawapay` and `/api/webhooks/pawapay` exist but the actual API calls are commented out — they return a simulated success response. To enable: set `PAWAPAY_JWT`, uncomment the fetch block in the route, and implement webhook signature verification.

### Other

- **ServiceWorker** — registered in root layout (`/sw.js`), enables PWA/offline capability.
- **`app/src/data/mockData.ts`** — hardcoded fixtures used by the landing page pricing section and `/menu/demo`.

### Deployment

Vercel-optimized (`app/vercel.json`), deployed to region `cdg1` (Paris). Root directory must be set to `app` in Vercel project settings. After deploying, update Supabase Auth → URL Configuration to add `https://your-domain.com/api/auth/callback` as a redirect URL.
