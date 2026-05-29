# MENUZA AI

**The AI Digital Waiter for African Restaurants.**

MENUZA AI is a live, production SaaS platform that turns a restaurant's paper menu into an AI-powered digital experience. Customers scan a QR code, get greeted by an AI waiter that takes their full order in chat, and the order appears instantly on the staff dashboard — no app download, no human bottleneck.

**Live at:** [menuzaai.com](https://menuzaai.com) · **Demo video:** [youtu.be/G4vp5NQnk-I](https://youtu.be/G4vp5NQnk-I)

---

## What It Does

| For restaurant owners | For customers |
|---|---|
| Upload a photo of any menu — AI extracts every item | Scan QR → see a branded digital menu on their phone |
| Customise style (8 templates, colors, fonts) | Chat with the AI Waiter to order, ask questions, get upsells |
| Publish and download a QR poster for tables | Order confirmed in-chat; no app needed |
| Watch orders arrive in real time on the staff dashboard | Leave a review at the end of the meal |
| Reply to reviews with AI-drafted responses | |
| Track analytics: views, conversions, revenue, peak hours | |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Database + Auth | Supabase (Postgres + RLS + Realtime) |
| State | React Context + Zustand |
| AI providers | OpenRouter (free tier default) · Anthropic Claude (switchable) |
| Payments | PawaPay (MTN MoMo + Airtel Money, Rwanda) |
| Email | Resend |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Video | Remotion (demo video source in `demo-video/`) |
| Deployment | Vercel (region: cdg1 Paris) |
| Testing | Vitest (unit) · Playwright (E2E) |

---

## Plans & Pricing

| Plan | Price | Key features |
|---|---|---|
| Free | 0 RWF | 1 menu, standard QR, 7-day analytics |
| **Pro** | **35,000 RWF/month** | Unlimited menus, AI Waiter, live analytics, staff roles, premium QR templates, AI review replies |
| Business | 89,000 RWF/month | Everything in Pro + multi-location (up to 5), custom domain mapping |

New accounts start on a **14-day free trial** with full Pro access. Payment via Mobile Money (MTN MoMo / Airtel Rwanda).

---

## Getting Started (Local Dev)

All commands run from the `app/` directory.

```bash
cd app
npm install
npm run dev        # http://localhost:3000
npm run build      # tsc --noEmit + next build
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright E2E
```

**Required env vars** — create `app/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

See `app/.env.example` for the full list including PawaPay, Resend, VAPID, and admin settings.

---

## Database

20 migrations in `app/supabase/migrations/` — run in order in the Supabase SQL Editor. Key tables:

- `restaurants` — one per owner; `plan`, `plan_expires_at`, `trial_ends_at`, `custom_domain`
- `menus` — many per restaurant; `categories` + `items` as JSONB, `status`, `slug`
- `orders` — `source` (`whatsapp` | `ai_waiter`), `status` lifecycle, `customer_email`
- `transactions` — PawaPay payment records
- `reviews` — customer ratings with AI-draft reply support
- `restaurant_staff` — RBAC: owner / manager / staff roles
- `push_subscriptions` — Web Push (VAPID) subscriptions per restaurant

---

## Architecture Highlights

- **Three Supabase clients**: browser singleton, per-request SSR, admin (service role) — never mix
- **Middleware replaced by `proxy.ts`** — Next.js 16 convention; also handles custom domain rewriting
- **MenuContext + Zustand** — central state with 1-second debounce autosave; fine-grained selectors prevent broad re-renders
- **AI Waiter** — server-side plan gate; per-restaurant tone/upsell/instructions config; proactive greeting after 3s; full in-chat ordering with `source = 'ai_waiter'` tracking
- **Subscription lifecycle** — trial → paid → expiry cron (03:00 UTC) → reminder emails at day 1, day 7, day 12 of trial and day −3 of paid plan
- **Server-side canonical pricing** — client cannot tamper with payment amounts

---

## Key Routes

| Route | Notes |
|---|---|
| `/` | Landing page with YouTube demo embed |
| `/dashboard` | Owner analytics + 4-step setup checklist |
| `/dashboard/editor` | 2-panel WYSIWYG menu editor |
| `/dashboard/orders` | Real-time staff panel; filterable by status + source |
| `/dashboard/qr-codes` | QR poster generator; batch export N tables |
| `/dashboard/settings` | Plans, staff, custom domain, AI Waiter config |
| `/menu/[slug]` | Public customer menu (published only) |
| `/admin/metrics` | Platform admin: MRR, restaurant/order counts |
| `/admin/settings` | AI provider config (OpenRouter ↔ Anthropic) |

---

## Demo Video (Remotion)

A 90-second 1080p investor/sales demo video is generated from source in `demo-video/`.

```bash
cd demo-video
npm install
npm run start      # Remotion Studio at localhost:3000
npm run build      # renders demo-video/out/menuza-demo.mp4
```

Hosted at: [youtu.be/G4vp5NQnk-I](https://youtu.be/G4vp5NQnk-I)

---

## Deployment

Deployed to Vercel from `main` on every push. Root directory: `app`. Region: `cdg1` (Paris).

Three daily crons (Vercel):
- `02:00 UTC` — expire stuck payment transactions
- `03:00 UTC` — downgrade lapsed subscriptions + expired trials to free
- `09:00 UTC` — send renewal + trial reminder emails

---

## License

Private and proprietary. GetRwanda LTD, 2026.
