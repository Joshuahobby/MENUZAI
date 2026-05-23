# 🎯 MENUZAI

**Positioning:** “Turn your menu into a revenue engine.”

MENUZAI is an AI-powered SaaS platform designed to transform traditional restaurant menus into high-converting digital experiences. It helps restaurant owners create, optimize, and track their menus with ease, leveraging AI to streamline the process.

---

## 🚀 Core Features

- **AI Menu Processing & Generation:** Instantly convert photos to menus, auto-write delicious item descriptions with a Magic Wand, and use text prompts to generate entire menu sections.
- **Smart Templates:** Choose from professionally designed, conversion-optimized templates (Classic, Modern, Luxury, Fast Food).
- **Interactive Editor:** Drag-and-drop builder with real-time preview, unified sidebars, and smart layout suggestions.
- **QR Code Generation:** Custom QR codes with logos for tables, allowing instant menu access.
- **Frictionless Ordering:** Modern checkout flow with local cart persistence and seamless ordering via WhatsApp (with Mobile Money arriving soon).
- **Deep Analytics:** Track most viewed dishes, peak hours, conversion funnels, and cart abandonment rates to gain business insights.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Testing:** Playwright (E2E) and Vitest (Unit)
- **AI Providers:** OpenRouter & Anthropic

---

## 🏁 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Joshuahobby/MENUZAI.git
   cd MENUZAI
   ```

2. Install dependencies:
   ```bash
   cd app
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the `app` directory with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🎨 Design System

- **Primary Color:** Deep Orange (`#FF6B00`) - Stimulates appetite and urgency.
- **Secondary Color:** Dark (`#1E1E1E`) - Premium feel.
- **Accent Color:** Green (`#00C853`) - Success/Action.
- **Fonts:** [Poppins](https://fonts.google.com/specimen/Poppins) (Headings), [Inter](https://fonts.google.com/specimen/Inter) (Body).

---

## 🌍 Deployment

The application is optimized for deployment on the [Vercel Platform](https://vercel.com/).

---

## 📄 License

This project is private and proprietary.
