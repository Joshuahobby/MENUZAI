# MENUZA AI — Product Structure, Screens & UX Logic

> **Status: LIVE** — This document reflects the product as built and deployed at [menuzaai.com](https://menuzaai.com).
> Original spec written pre-build; this version updated May 2026 to match reality.

---

## Positioning

**"The AI Waiter for Every Restaurant."**

MENUZA AI is an AI-powered SaaS for African restaurants. A restaurant owner uploads their menu, the AI extracts every item, the owner customises the design and publishes — customers then scan a QR code and an AI Digital Waiter greets them, takes their order in chat, and upsells automatically. Orders appear on the staff dashboard in real time.

**Live demo video:** [youtu.be/G4vp5NQnk-I](https://youtu.be/G4vp5NQnk-I)

---

## 1. User Flow

### Owner onboarding
**Signup → Onboarding setup → Upload menu photo → AI extraction → Review/edit items → Choose template → Customize style → Publish → Download QR poster → Go live**

### Customer flow
**Scan QR → Public menu loads → AI Waiter greets (auto, after 3s on Pro) → Customer orders in chat → Order confirmed → Receipt to kitchen → Staff dashboard updates in real time**

---

## 2. App Structure (Navigation)

### Desktop: collapsible sidebar
### Mobile: bottom tab bar + "More" overflow sheet

**Nav links by role:**

| Link | Owner | Manager | Staff |
|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ |
| Orders | ✓ | ✓ | ✓ |
| My Menus | ✓ | ✓ | — |
| Analytics | ✓ | ✓ | — |
| Reviews | ✓ | ✓ | — |
| Templates | ✓ | — | — |
| QR Codes | ✓ | ✓ | — |
| Editor | ✓ | ✓ | — |
| Settings | ✓ | — | — |

---

## 3. Core Screens

### Dashboard (Home)
- Greeting + restaurant name
- **4-step setup checklist** (shown until complete): add items → publish → set WhatsApp number → upload logo
- **WhatsApp guard**: amber warning if menu is published but no phone set
- KPI cards: total revenue, orders, views, conversion rate (7/30/90 day range)
- AI Revenue Insight: top-performing dish
- Peak ordering hours chart
- Live activity feed
- Staff role sees: live orders monitor, kitchen best practices, operations feed

### Menu Upload (`/upload`)
- Accepts up to 5 images (JPG/PNG/WebP/GIF, max 10 MB each)
- AI extraction runs in parallel for multi-image uploads
- Duplicate categories and items are merged automatically
- Rate-limited: 5 requests/IP/minute

### AI Result (`/ai-result`)
- Split view: extracted categories (left) + items with prices (right)
- Inline edit before saving
- Confirm → saves to active menu, redirects to editor

### Menu Editor (`/dashboard/editor`)
**2-panel layout:**
- **Left sidebar** — Build tab (categories, items, AI item generator) + Design tab (Theme/Colors/Fonts/Layout)
- **Center canvas** — Device-frame WYSIWYG preview (mobile 390px / tablet 680px / desktop 920px)

Item editing: image upload, gallery (Pro), price, name, AI auto-description, availability toggle, badge picker, dietary tags, stock count, duplicate/delete.

Design: 10 headline + 9 body Google Fonts, accent + background presets, "Magic Vibes" one-click style presets, card style (flat/elevated/glass), corner radius, spacing density, 13 currencies (African focus).

### Orders Dashboard (`/dashboard/orders`)
**Real-time staff panel:**
- Live order stream via Supabase Realtime (postgres_changes)
- Status tabs: All / Pending / Preparing / Ready / Cancelled
- Source filter: AI Waiter / WhatsApp
- Stat cards: today's orders, pending, AI Waiter count, revenue
- Order cards: status badge, items, total, accept/decline/ready/serve actions
- Waiter pager: broadcast channel for table requests (call waiter, bill, water)
- **New order visual flash** on pending card + audio chime
- **Push notification prompt** after 4s if permission not granted
- Tab title shows pending count e.g. "(3) Real-Time Staff Panel"

### QR Codes (`/dashboard/qr-codes`)
- Elegant-minimal / dark-premium / classic-frame poster templates
- A4 or A5 size, custom primary color, logo overlay
- **Batch export**: generate QR posters for tables 1–N as single PDF
- Single poster export as PNG or PDF

### Reviews (`/dashboard/reviews`)
- All customer reviews with star rating, sentiment (positive/negative/neutral)
- **AI Reply drafts** (Pro): one-click AI-generated professional response
- Save and publish replies

### Analytics (`/dashboard/analytics`)
- Menu views, orders, revenue, conversion rate, cart abandonment
- Top performing dishes
- Peak ordering hours
- Daily views trend
- Conversion funnel
- Download CSV report
- 7/30/90-day range (90 days = Pro/Business)

### Templates (`/dashboard/templates`)
8 live-rendered templates: `vintage-parchment`, `dark-chalkboard`, `bold-street`, `bistro-split`, `photo-gallery`, `luxury-gold`, `organic-clean`, `midnight-luxe`.

Template gallery for applying; Print/PDF overlay with template switcher for print menus.

### Settings (`/dashboard/settings`)
- Restaurant info: name, phone, logo, currency
- AI Waiter config: tone (friendly/formal/vibrant), upsell prompt, custom instructions
- Plan management: upgrade (MoMo payment), downgrade, annual toggle (11 months price)
- **Staff management** (Pro): invite by email, assign roles, remove members → new members receive a branded welcome email
- **Custom domain** (Business): enter domain, CNAME instructions shown
- **Locations** (Business): create up to 5 restaurant profiles, location switcher

### Public Menu (`/menu/[slug]`)
- Only renders for `status = 'published'`
- AI Digital Waiter floating button (Pro/Business): auto-opens after 3s with time-of-day greeting
- Full in-chat ordering: takes order, shows confirm card, saves to `orders` with `source = 'ai_waiter'`
- WhatsApp cart checkout as fallback
- Customer review submission after order
- Item detail modal with gallery, dietary tags, add-to-cart
- Custom domain support (Business plan)

---

## 4. Plans & Subscription System

| Feature | Free | Trial (14 days) | Pro | Business |
|---|---|---|---|---|
| Menus | 1 | Unlimited | Unlimited | Unlimited |
| AI Waiter | — | ✓ | ✓ | ✓ |
| AI Review Replies | — | ✓ | ✓ | ✓ |
| Gallery uploads | — | ✓ | ✓ | ✓ |
| Staff management | — | ✓ | ✓ | ✓ |
| Premium QR templates | — | ✓ | ✓ | ✓ |
| Multi-location | — | — | — | Up to 5 |
| Custom domain | — | — | — | ✓ |

**Payment:** PawaPay (MTN MoMo + Airtel Rwanda). Pro = 35,000 RWF/month or 385,000 RWF/year. Business = 89,000 RWF/month or 979,000 RWF/year.

**Lifecycle:** new signup → 14-day trial (full Pro) → day-1/7/12 emails → upgrade or drop to free → monthly payment → renewal reminder at day −3 → auto-downgrade on expiry.

**Dashboard banners:**
- Purple banner during trial (shows days left)
- Amber banner 3 days before plan expiry
- Red banner on expiry

---

## 5. Design System (Actual)

**Colors (from `globals.css @theme`):**
- Primary: `#a04100` (warm orange-brown)
- Primary container / accent: `#FF6B00` (vibrant orange)
- Tertiary: `#006e2a` / `#00b149` (green — success, live indicators)
- Surface: `#fcf9f8` (off-white cream)
- On-surface: `#1b1b1c`

**Fonts:**
- Headlines: **Plus Jakarta Sans** (weights 400–800)
- Body: **Inter** (weights 400–600)
- Icons: **Material Symbols Outlined** (Google Fonts)

**Style:**
- Tailwind CSS v4 (`@theme {}` block in globals.css — no tailwind.config.js)
- Material Design 3 token naming
- Custom utilities: `.glass-nav`, `.editor-canvas`, `.hide-scrollbar`, `.premium-shadow`
- Device frames via `data-viewport` attribute

---

## 6. UX Principles (Unchanged)

1. Speed > Features
2. Mobile-first always
3. 1-click actions
4. No learning curve
5. Everything editable instantly

---

## 7. What Was Built vs Original Spec

| Original spec | Actual implementation |
|---|---|
| "Mobile Money arriving soon" | PawaPay fully live — MTN MoMo + Airtel Rwanda |
| 4 templates (Classic, Modern, Luxury, Fast Food) | 8 fully live templates |
| "WhatsApp order flow" | WhatsApp AND AI Waiter in-chat ordering |
| Basic analytics | Full analytics + conversion funnel + CSV export |
| "AI Upload" | Multi-image AI extraction (up to 5 images parallel) |
| Plan gates (UI only) | Server-side enforcement on all API routes |
| No subscription system | Full lifecycle: trial → paid → expiry → reminders → cron downgrade |
| No staff roles | RBAC: owner / manager / staff with email invites |
| No reviews | Customer reviews with AI-drafted replies |
| No real-time | Supabase Realtime on orders table + broadcast for table requests |
| Poppins font | Plus Jakarta Sans |
