# MENUZA AI — Landing Page Reference (Live)

> **Status: LIVE** — The landing page is deployed at [menuzaai.com](https://menuzaai.com).
> This document was originally a Figma/Stitch AI handover spec. Updated May 2026 to reflect the actual live page.
> Source: `app/src/app/page.tsx`

---

## Live Sections (in order)

### 1. Hero
- **Left:** label "AI-Powered Restaurant Menus" → H1 "The digital menu your restaurant deserves" → subtext → two CTAs
  - Primary: "Start Free — No Card Required" → `/login`
  - Secondary: "Watch Demo (90s)" → YouTube (`youtu.be/G4vp5NQnk-I`) with play_circle icon
- **Right:** YouTube embed (autoplay, muted, looping, controls hidden) — 90-second Remotion-rendered product demo
  - Caption: "90 seconds · QR scan → AI order → staff dashboard"
- **Live social proof** (fetched from `/api/public/stats`, 1h cache): "X+ restaurants · Y+ orders served"

### 2. Value Proposition (white band)
Three problem/solution cards:
- Paper menus don't capture data → digital menus do
- Staff can't upsell → AI Waiter upsells automatically
- Orders get lost → real-time dashboard, no missed orders

### 3. Features Grid (`#features`)
6 feature cards with Material Symbols icons:
1. AI Digital Waiter
2. Real-time Ordering
3. Upload & Convert (AI menu extraction from photos)
4. QR Code Menus
5. Deep Analytics
6. WhatsApp + AI Ordering (dual channel)

### 4. Pricing (`#pricing`)
Three-tier pricing table sourced from `pricingPlans` in `mockData.ts`:
- Free: 0 RWF — 1 menu, standard QR, basic analytics, WhatsApp
- **Pro** (popular): 35,000 RWF/month — AI Waiter, unlimited menus, live analytics, staff roles
- Business: 89,000 RWF/month — everything in Pro + multi-location, custom domain

Annual toggle: 11× monthly price (2 months free), badge "Save 2 months".
Checkout via `CheckoutModal` → PawaPay MoMo push payment.

### 5. Final CTA
- Dark card, headline "Elevate your restaurant's digital presence"
- Body "Join restaurants across Africa using MENUZA AI..."
- Live stat counters (real DB data): restaurants + orders
- CTAs: "Start Free — No Card Required" + "Talk to Sales"

### 6. Footer
4 columns: Product links, Company, Legal, Social. Copyright 2026 Menuza Systems Inc.

---

## Key Design Tokens (Actual)

| Token | Value |
|---|---|
| Primary | `#a04100` |
| Primary container / CTA | `#FF6B00` |
| Surface | `#fcf9f8` |
| Headline font | Plus Jakarta Sans |
| Body font | Inter |
| Border radius | 1.5–2rem |

---

## What Changed vs Original Spec

| Original Figma spec | Live implementation |
|---|---|
| Static dashboard mockup in hero | YouTube autoplay embed (90s product demo) |
| "See Demo" → scroll to demo section | "Watch Demo (90s)" → YouTube |
| Hardcoded "social proof" placeholder | Live counter from `/api/public/stats` |
| Poppins font | Plus Jakarta Sans |
| Background: `#F8F9FB` | `#fcf9f8` (warm cream, matches app) |
| Success green: `#00C853` | `#00b149` (MENUZA AI tertiary) |
| Rounded corners 12–16px | 1.5–2rem (24–32px) |
| Trust bar section | Removed — replaced by stat counters |
| Live Demo section (phone mockup) | YouTube embed in hero |

---

## Demo Video

- **Source:** `demo-video/` (Remotion v4, 2700 frames, 30fps, 1920×1080)
- **YouTube (unlisted):** https://youtu.be/G4vp5NQnk-I
- Re-render: `cd demo-video && npm install && npm run build`

Scenes:
1. Brand intro (logo spring, typed tagline)
2. Public menu on iPhone frame (header, category pills, food cards, AI FAB)
3. AI Waiter chat (greeting → order → streaming response → confirm)
4. Staff dashboard (stat cards, order cards, new-order flash)
5. QR poster showcase + brand CTA outro
