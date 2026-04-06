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
npm run build     # Production build
npm run lint      # ESLint checks
npm start         # Run production server
```

No test framework is configured.

## Environment Setup

Create `app/.env.local` with Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Architecture

MENUZAI is an AI-powered SaaS platform for restaurant menu digitization. It uses the **Next.js App Router** (all routes under `app/src/app/`), **Supabase** for database and auth, and **React Context API** for client-side state.

### Route Structure

| Route | Auth | Notes |
|---|---|---|
| `/` | No | Landing page |
| `/login` | No | Supabase email/password |
| `/upload` | Yes | Menu upload entry |
| `/ai-result` | Yes | AI processing display |
| `/onboarding` | Yes | Setup flow |
| `/dashboard/*` | Yes | Main app (layout has auth guard) |
| `/menu/demo` | No | Public menu showcase |
| `/menu/demo/order` | No | Cart + WhatsApp checkout |

### State Management

Two React contexts power the app:

**`MenuContext`** (`app/src/context/MenuContext.tsx`) — global menu state that auto-fetches from Supabase on login and auto-saves changes with a 2-second debounce. Manages `restaurantName`, `categories`, `menuItems`, and `menuStyle`. The Supabase `menus` table stores everything as JSON columns per user.

**`CartContext`** (`app/src/contexts/CartContext.tsx`) — ephemeral cart state for the public demo ordering flow. Cart contents are formatted into a WhatsApp message via `app/src/lib/whatsapp.ts` and sent via the `wa.me` URL scheme (no WhatsApp API key needed).

### Styling

Uses **Tailwind CSS v4** (not v3) — configuration lives in `app/src/app/globals.css` inside a `@theme` block, not in `tailwind.config.js`. Custom CSS variables define:
- Primary: `#FF6B00` (orange), Tertiary: `#00C853` (green), Surface: `#fcf9f8`
- Fonts: Plus Jakarta Sans (headings), Inter (body)
- Material Design 3 color tokens
- Special utilities: `.glass-nav`, `.editor-canvas`, `.hide-scrollbar`, `.icon-fill`, `.premium-shadow`

Material Symbols Outlined icons are loaded via Google Fonts in the root layout.

### Path Alias

`@/*` resolves to `app/src/*` (configured in `tsconfig.json`).

### Key Libraries

- `@supabase/supabase-js` — database + auth client (singleton in `app/src/lib/supabase.ts`)
- `recharts` — analytics charts
- `qrcode.react` — QR code generation

### Mock Data

`app/src/data/mockData.ts` contains sample restaurant data (35+ items, 6 categories, analytics KPIs, live activity feeds) used for the demo menu and UI prototypes. The AI menu extraction is currently simulated, not a real API call.

### Deployment

Vercel-optimized (`app/vercel.json`), build region CDG1 (Paris).
