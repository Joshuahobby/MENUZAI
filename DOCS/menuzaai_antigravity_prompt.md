# MENUZA AI — Platform Status (May 2026)

> **Note:** This file was originally a development handover package for Google Antigravity (Stitch AI → production build).
> The platform is now **fully built and live**. This document has been repurposed as a current-state summary.

---

## Platform: LIVE

**URL:** [menuzaai.com](https://menuzaai.com)
**Demo:** [youtu.be/G4vp5NQnk-I](https://youtu.be/G4vp5NQnk-I)
**Stack:** Next.js 16 · Supabase · OpenRouter / Anthropic · PawaPay · Resend · Vercel

---

## What Was Built (vs Original Scope)

### Original scope → Delivered

| Original requirement | Status |
|---|---|
| Menu upload (PDF / Image / Text) → AI parse | ✓ Live — up to 5 images, parallel AI extraction, merges duplicates |
| Edit categories, items, prices, highlights | ✓ Live — full WYSIWYG editor with drag-to-reorder |
| Drag & drop layout in Menu Editor | ✓ Live — @dnd-kit sortable on canvas |
| Save & Publish menu | ✓ Live — auto-save (1s debounce) + publish with slug |
| QR-code-enabled link generation | ✓ Live — QR posters, batch export, 3 templates |
| Customer QR scan → mobile menu page | ✓ Live |
| Add items to cart → sticky floating cart | ✓ Live |
| Order via WhatsApp → prefilled message | ✓ Live |
| Templates archive & selection | ✓ Live — 8 templates, apply on click |
| Analytics: orders, revenue, insights | ✓ Live — views, conversions, funnel, peak hours, CSV export |
| Admin / Settings | ✓ Live — restaurant info, staff RBAC, plan management |
| Mobile-first, responsive | ✓ Live — bottom nav on mobile, collapsible sidebar on desktop |
| PWA-ready | ✓ Live — service worker, offline page, Web Push subscriptions |

### Beyond original scope (shipped)

| Feature | Notes |
|---|---|
| **AI Digital Waiter** | Conversational AI that greets, upsells, and takes full orders in-chat |
| **Real-time order dashboard** | Supabase Realtime; live order stream; audio chime; push notifications |
| **Subscription billing** | PawaPay Mobile Money; Pro 35K/Business 89K RWF/month; annual option |
| **14-day free trial** | Auto-start on signup; day-1/7/12 email sequence; auto-expire cron |
| **Staff roles (RBAC)** | Owner / Manager / Staff; email invite with branded welcome email |
| **Customer reviews** | Star ratings; AI-drafted replies; sentiment tagging |
| **Multi-location** (Business) | Up to 5 restaurant profiles; location switcher in sidebar |
| **Custom domain** (Business) | CNAME setup instructions; proxy rewrite for custom hostname |
| **Order source tracking** | `whatsapp` vs `ai_waiter` per order; dashboard filter + stat card |
| **Batch QR export** | Generate posters for tables 1–N as single PDF |
| **Admin metrics page** | Platform-admin only; MRR, restaurant count, plan breakdown, orders |
| **Remotion demo video** | 90-second 1080p investor/sales video; embedded on landing page |

---

## Architecture Summary

```
app/                          Next.js 16 App Router
├── src/app/                  Routes (App Router convention)
│   ├── dashboard/            Protected owner/staff routes
│   ├── menu/[slug]/          Public customer menu
│   ├── admin/                Platform admin (metrics, AI config)
│   └── api/                  API routes (payments, AI, cron, etc.)
├── src/context/MenuContext   Central state + autosave
├── src/store/menuStore.ts    Zustand (fine-grained selectors)
├── src/lib/                  Supabase clients, plans, utils
├── src/types/menu.ts         Canonical MenuItem, MenuCategory, etc.
└── supabase/migrations/      020 migrations (run in order)

demo-video/                   Remotion v4 (standalone)
├── src/compositions/         5 scenes
├── src/components/           Recreated UI components
└── out/menuza-demo.mp4       Rendered output (gitignored)
```

---

## Deployment & Ops

- **Vercel** — auto-deploys from `main`; region `cdg1` (Paris); root dir `app`
- **Supabase** — Postgres + RLS + Realtime + Auth + Storage (2 buckets)
- **Crons** (Vercel, `app/vercel.json`):
  - 02:00 UTC — expire stuck payment transactions
  - 03:00 UTC — downgrade lapsed subscriptions and trials
  - 09:00 UTC — send renewal/trial reminder emails (Resend)
- **CI/CD** (GitHub Actions, `.github/workflows/ci.yml`):
  - Lint → Type-check → Vitest (56 tests) → Build

---

## Fundraising Status

Raising **$250K seed** to hire 2 engineers, sign 50 restaurants in Rwanda, expand to Uganda and Kenya by Q4 2026.

Investor outreach template: `Investor_Outreach_Email.md`
Target list: Partech Africa, Savannah Fund, Africa Tech Ventures, Consonance, Founders Factory Africa, DOB Equity, AlphaCode, RICA angels.
