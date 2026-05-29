import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { BackToTop } from "@/components/BackToTop";

export const metadata = {
  title: "Features — MENUZA AI",
  description: "AI Digital Waiter that greets guests, takes orders in chat, and collects reviews automatically. Plus menu extraction, live analytics, WhatsApp ordering, and more — built for African restaurants.",
};

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing",  label: "Pricing"  },
  { href: "/menu/demo", label: "Live Demo" },
];

const HERO_STATS = [
  { value: "< 45s",    label: "From QR scan to order placed" },
  { value: "3 sec",    label: "Digital Waiter greets every guest" },
  { value: "Real-time", label: "Order delivery to staff panel" },
];

const DEEP_FEATURES = [
  {
    tag: "AI Menu Extraction",
    icon: "document_scanner",
    headline: "Photograph your paper menu. Done.",
    body: "Upload up to 5 photos of your existing menu — handwritten, printed, or laminated. Our AI reads every item, price, description, and category in seconds, and builds your digital menu automatically. No typing, no spreadsheets.",
    bullets: [
      "Supports JPG, PNG, and WebP — up to 10 MB each",
      "Merges multiple photos into one structured menu",
      "Handles complex layouts, multiple columns, and decorative fonts",
      "Editable immediately after extraction",
    ],
    accent: "bg-primary/5",
    iconBg: "bg-primary/10 text-primary",
    flip: false,
  },
  {
    tag: "AI Digital Waiter",
    icon: "support_agent",
    headline: "Your restaurant's best server — always on, always upselling, always on-brand.",
    body: "The moment a guest scans your QR code, your AI Digital Waiter greets them, surfaces today's specials, and starts working toward a higher order value. It takes the full order in chat — no app switch, no WhatsApp dependency. And after the meal, it collects a review, upsells a dessert, and stamps a loyalty card — automatically.",
    bullets: [
      "Greets every guest within 3 seconds of the menu loading — proactively, not reactively",
      "Takes the full order in chat — table number, modifications, confirmation — no WhatsApp required",
      "Recommends add-ons based on what's actually converting today, not static prompts",
      "Collects reviews, upsells desserts, and stamps loyalty cards automatically after the meal",
      "Available in any language your guests type in",
      "Trained on your live menu, prices, and descriptions — updates instantly when you edit",
      "Configurable tone: friendly, formal, or vibrant — with per-item Always / Never Recommend flags",
      "Negative reviews captured privately; positive reviews redirected to Google or TripAdvisor",
    ],
    accent: "bg-on-surface",
    iconBg: "bg-white/10 text-white",
    dark: true,
    flip: true,
  },
  {
    tag: "Real-time Ordering",
    icon: "receipt_long",
    headline: "Orders reach your kitchen before the guest puts their phone down.",
    body: "When a guest places an order, it appears on your staff dashboard instantly — no polling, no page refreshes, no printers. Your team confirms, prepares, and marks orders ready from the same panel.",
    bullets: [
      "Live order stream via Supabase real-time",
      "Table number badge on every order card",
      "One-tap status transitions: Pending → Preparing → Ready",
      "Waiter pager button for table-assistance requests",
    ],
    accent: "bg-primary/5",
    iconBg: "bg-primary/10 text-primary",
    flip: false,
  },
  {
    tag: "Live Analytics",
    icon: "analytics",
    headline: "Stop guessing. Start knowing.",
    body: "Your analytics dashboard tracks every scan, view, and order. See which items get viewed most, which convert to orders, and how revenue trends over time — so you can make pricing and placement decisions on data, not intuition.",
    bullets: [
      "Daily view, order, and revenue trend charts",
      "Top items by views and conversion rate",
      "Up to 90-day history on Pro and Business plans",
      "AI-generated review replies to protect your reputation",
    ],
    accent: "bg-on-surface",
    iconBg: "bg-white/10 text-white",
    dark: true,
    flip: true,
  },
];

const GRID_FEATURES = [
  {
    icon: "chat",
    title: "WhatsApp Ordering",
    desc: "Customers tap 'Order via WhatsApp' and a pre-filled message lands in your inbox. No app, no API key, no integration needed.",
  },
  {
    icon: "qr_code_2",
    title: "QR Poster Generator",
    desc: "Design custom table badge posters with your logo, brand colours, and table number. Download as print-ready PDF in one click.",
  },
  {
    icon: "palette",
    title: "8 Menu Templates",
    desc: "Vintage Parchment, Dark Chalkboard, Luxury Gold, Photo Gallery and more — switch and preview instantly in the editor.",
  },
  {
    icon: "group",
    title: "Staff Roles & Permissions",
    desc: "Invite your team as Owner, Manager, or Staff. Each role gets the right level of access — no more shared passwords.",
  },
  {
    icon: "notifications",
    title: "Instant Notifications",
    desc: "Get push, email, and in-dashboard alerts the moment an order is placed. Never miss a customer on a busy night.",
  },
  {
    icon: "auto_awesome",
    title: "AI Description Writer",
    desc: "Select any item and tap 'Auto-write'. The AI composes a mouth-watering description using the item name and your tags.",
  },
  {
    icon: "photo_library",
    title: "Item Photo Gallery",
    desc: "Upload multiple photos per dish — a carousel on the public menu helps guests visualise exactly what they're ordering.",
  },
  {
    icon: "inventory_2",
    title: "Stock Management",
    desc: "Set a stock count per item. When it hits zero the item is automatically marked sold out — no manual updates needed.",
  },
  {
    icon: "star_rate",
    title: "Customer Reviews",
    desc: "Collect star ratings and written reviews after each order. Respond with AI-drafted replies or write your own.",
  },
];

function FeatureStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl font-[var(--font-headline)] font-black text-on-surface tracking-tight">{value}</p>
      <p className="text-sm text-secondary mt-1">{label}</p>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#faf8f6] text-on-surface">

      <PublicNav activePath="/features" />

      {/* ── Hero ── */}
      <section className="pt-24 pb-20 px-6 text-center">
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-primary/70 mb-6">Features</p>
        <h1 className="text-5xl md:text-[64px] font-[var(--font-headline)] font-extrabold tracking-tighter leading-[1.05] mb-5 max-w-3xl mx-auto">
          One platform.<br className="hidden sm:block" /> Everything your restaurant needs.
        </h1>
        <p className="text-lg text-secondary max-w-xl mx-auto mb-10 leading-relaxed">
          AI menu extraction, smart ordering, live analytics, and more — built specifically for restaurants in Africa.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <Link href="/login" className="px-7 py-3.5 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-md shadow-primary/20">
            Start Free Trial — No Card Required
          </Link>
          <Link href="/demo" className="px-7 py-3.5 border border-black/10 text-on-surface font-bold rounded-xl text-sm hover:bg-black/3 transition-colors">
            See Live Demo
          </Link>
        </div>
        <p className="text-xs text-secondary/50 mb-16">
          14-day free trial · Full Pro features · No credit card · Cancel anytime
        </p>

        {/* Stats strip */}
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-6 border-t border-black/6 pt-12">
          {HERO_STATS.map((s, i) => <FeatureStat key={i} {...s} />)}
        </div>
      </section>

      {/* ── Deep-dive feature sections ── */}
      {DEEP_FEATURES.map((f, i) => (
        <section key={i} className={`py-24 px-6 border-t border-black/5 ${f.dark ? "bg-on-surface" : "bg-white"}`}>
          <div className={`max-w-6xl mx-auto flex flex-col ${f.flip ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-16`}>

            {/* Text */}
            <div className="flex-1">
              <div className={`inline-flex items-center gap-2.5 mb-6 px-4 py-2 rounded-xl ${f.dark ? "bg-white/8" : "bg-primary/6"}`}>
                <span className={`material-symbols-outlined text-[18px] ${f.dark ? "text-white/60" : "text-primary"}`}>{f.icon}</span>
                <span className={`text-xs font-black uppercase tracking-[0.2em] ${f.dark ? "text-white/50" : "text-primary/70"}`}>{f.tag}</span>
              </div>
              <h2 className={`text-3xl md:text-4xl font-[var(--font-headline)] font-extrabold tracking-tight mb-5 leading-tight ${f.dark ? "text-white" : "text-on-surface"}`}>
                {f.headline}
              </h2>
              <p className={`text-base leading-relaxed mb-8 ${f.dark ? "text-white/50" : "text-secondary"}`}>
                {f.body}
              </p>
              <ul className="space-y-3">
                {f.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <span className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0 ${f.dark ? "text-primary" : "text-primary"}`}>check_circle</span>
                    <span className={`text-sm ${f.dark ? "text-white/60" : "text-secondary"}`}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual block */}
            <div className="flex-1 w-full">
              <div className={`rounded-3xl p-10 flex items-center justify-center min-h-[280px] ${f.dark ? "bg-white/5 border border-white/8" : "bg-[#faf8f6] border border-black/6"}`}>
                <span className={`material-symbols-outlined icon-fill text-[96px] ${f.dark ? "text-white/10" : "text-primary/10"}`}>{f.icon}</span>
              </div>
            </div>

          </div>
        </section>
      ))}

      {/* ── Feature grid ── */}
      <section className="py-28 px-6 bg-white border-t border-black/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-secondary/50 mb-4">And more</p>
            <h2 className="text-3xl md:text-4xl font-[var(--font-headline)] font-black tracking-tight">
              Every detail, covered
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GRID_FEATURES.map((f, i) => (
              <div key={i} className="bg-[#faf8f6] p-8 rounded-3xl border border-black/5 hover:border-black/10 transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl mb-5 block">{f.icon}</span>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 bg-on-surface">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-6">Get started</p>
          <h2 className="text-4xl font-[var(--font-headline)] font-black mb-4 text-white tracking-tight leading-tight">
            Ready to modernise your restaurant?
          </h2>
          <p className="text-white/40 text-base mb-12 leading-relaxed">
            14-day free trial — no credit card required. Try every Pro feature, then choose your plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="px-8 py-4 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              Start Free Trial
            </Link>
            <Link href="/pricing" className="px-8 py-4 bg-white/8 text-white/70 font-bold rounded-xl text-sm hover:bg-white/12 transition-colors border border-white/10">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-black/5 bg-[#faf8f6] py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-[var(--font-headline)] font-black tracking-tight text-primary">MENUZA AI</span>
          <p className="text-xs text-secondary/50">© 2026 Menuza Systems Inc. All rights reserved.</p>
          <div className="flex gap-8 text-xs font-medium text-secondary/60">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/features" className="text-primary">Features</Link>
            <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="/menu/demo" className="hover:text-primary transition-colors">Live Demo</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
      <BackToTop />
    </div>
  );
}
