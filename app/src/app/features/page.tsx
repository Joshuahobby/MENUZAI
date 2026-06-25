import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { BackToTop } from "@/components/BackToTop";
import { AuthCta } from "@/components/AuthCta";

export const metadata = {
  title: "Features — MENUZA AI",
  description: "AI Digital Waiter that greets guests, takes orders in chat, and collects reviews automatically. Plus menu extraction, live analytics, WhatsApp ordering, and more — built for African restaurants.",
};

const HERO_STATS = [
  { value: "< 45s",     label: "From QR scan to order placed" },
  { value: "7 sec",     label: "AI reads your entire menu" },
  { value: "Real-time", label: "Orders reach the kitchen instantly" },
];

const GRID_FEATURES = [
  { icon: "chat",           title: "WhatsApp Ordering",     desc: "Customers tap 'Order via WhatsApp' and a pre-filled message lands in your inbox. No app, no API key, no integration needed." },
  { icon: "qr_code_2",      title: "QR Poster Generator",   desc: "Design custom table badge posters with your logo, brand colours, and table number. Download as print-ready PDF in one click." },
  { icon: "palette",        title: "8 Menu Templates",      desc: "Vintage Parchment, Dark Chalkboard, Luxury Gold, Photo Gallery and more — switch and preview instantly in the editor." },
  { icon: "group",          title: "Staff Roles",           desc: "Invite your team as Owner, Manager, or Staff. Each role gets the right level of access — no more shared passwords." },
  { icon: "notifications",  title: "Instant Notifications", desc: "Get push, email, and in-dashboard alerts the moment an order is placed. Never miss a customer on a busy night." },
  { icon: "auto_awesome",   title: "AI Description Writer", desc: "Select any item and tap 'Auto-write'. The AI composes a mouth-watering description using the item name and your tags." },
  { icon: "photo_library",  title: "Item Photo Gallery",    desc: "Upload multiple photos per dish — a carousel on the public menu helps guests visualise exactly what they're ordering." },
  { icon: "inventory_2",    title: "Stock Management",      desc: "Set a stock count per item. When it hits zero the item is automatically marked sold out — no manual updates needed." },
  { icon: "star_rate",      title: "Customer Reviews",      desc: "Collect star ratings and written reviews after each order. Respond with AI-drafted replies or write your own." },
];

/* ── Feature visual components ── */
function ExtractionVisual() {
  return (
    <div className="bg-surface rounded-3xl p-8 border border-black/6 space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-secondary/40 mb-4">AI extracting your menu…</p>
      {[
        ["Brochette ya Nk'osa",  "3,500 RWF", "Mains"],
        ["Isombe na Poisson",    "2,800 RWF", "Mains"],
        ["Fanta Orange",         "500 RWF",   "Drinks"],
        ["Ibirayi Zisukuwe",     "1,200 RWF", "Sides"],
      ].map(([name, price, cat]) => (
        <div key={name} className="flex items-center gap-3 bg-surface-container rounded-2xl px-4 py-3">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-sm">restaurant</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">{name}</p>
            <p className="text-[10px] text-secondary">{cat}</p>
          </div>
          <p className="text-sm font-bold text-primary shrink-0">{price}</p>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-2">
        <div className="w-2 h-2 bg-tertiary rounded-full animate-pulse" />
        <p className="text-xs text-tertiary font-semibold">4 items extracted · 2 categories found</p>
      </div>
    </div>
  );
}

function WaiterChatVisual() {
  return (
    <div className="bg-on-surface rounded-[2rem] overflow-hidden shadow-2xl max-w-xs mx-auto">
      <div className="bg-primary px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white text-base icon-fill">robot_2</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-xs">AI Digital Waiter</p>
          <p className="text-white/60 text-[9px] uppercase tracking-widest font-black">MENUZA AI</p>
        </div>
        <div className="w-2 h-2 bg-tertiary/70 rounded-full animate-pulse shrink-0" />
      </div>
      <div className="px-3 py-4 space-y-3 bg-surface-container-lowest">
        <div className="flex items-end gap-2">
          <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-xs icon-fill">robot_2</span>
          </div>
          <div className="bg-surface-container rounded-2xl rounded-bl-sm px-3 py-2 max-w-[80%]">
            <p className="text-[11px] text-on-surface leading-relaxed">Good evening! 🍽️ Welcome to Kigali Grill. What can I get for you tonight?</p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-primary rounded-2xl rounded-br-sm px-3 py-2 max-w-[75%]">
            <p className="text-[11px] text-white">The Tilapia please!</p>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-xs icon-fill">robot_2</span>
          </div>
          <div className="bg-surface-container rounded-2xl rounded-bl-sm px-3 py-2 max-w-[80%]">
            <p className="text-[11px] text-on-surface leading-relaxed">Great choice! 🐟 <strong>Grilled Tilapia</strong> — 3,500 RWF. Shall I add a drink?</p>
          </div>
        </div>
      </div>
      <div className="px-3 py-3 bg-surface-container-lowest border-t border-surface-container flex items-center gap-2">
        <div className="flex-1 bg-surface-container rounded-xl px-3 py-2 text-[10px] text-secondary/40">Type a message…</div>
        <button type="button" className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white text-xs">send</span>
        </button>
      </div>
    </div>
  );
}

function OrdersVisual() {
  const orders = [
    { table: "T3", items: "Tilapia + Fanta", status: "Preparing", color: "bg-accent-saffron" },
    { table: "T7", items: "Brochette × 2",  status: "Ready",     color: "bg-tertiary" },
    { table: "T1", items: "Isombe + Ibirayi",status: "Pending",   color: "bg-primary" },
  ];
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-surface/40 mb-4">Live order stream</p>
      {orders.map((o) => (
        <div key={o.table} className="bg-white/6 border border-white/10 rounded-2xl px-4 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-xs font-black text-primary">{o.table}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface/90 truncate">{o.items}</p>
            <p className="text-[10px] text-surface/40">Just now</p>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider text-white px-3 py-1 rounded-full ${o.color}`}>{o.status}</span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsVisual() {
  const bars = [
    { label: "Mon", h: 40  },
    { label: "Tue", h: 65  },
    { label: "Wed", h: 55  },
    { label: "Thu", h: 80  },
    { label: "Fri", h: 100 },
    { label: "Sat", h: 90  },
    { label: "Sun", h: 70  },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total views",    value: "1,247" },
          { label: "Orders placed",  value: "384"   },
          { label: "Conversion",     value: "30.8%" },
          { label: "Top dish",       value: "Tilapia" },
        ].map((s) => (
          <div key={s.label} className="bg-white/6 border border-white/10 rounded-2xl px-4 py-4">
            <p className="text-[10px] text-surface/40 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-lg font-black text-surface/90">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white/6 border border-white/10 rounded-2xl px-4 py-4">
        <p className="text-[10px] text-surface/40 uppercase tracking-wider mb-4">Orders this week</p>
        <div className="flex items-end gap-2 h-20">
          {bars.map((b) => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary rounded-t-md transition-colors"
                style={{ height: `${b.h}%` }}
              />
              <span className="text-[9px] text-surface/30 font-medium">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
    dark: false,
    flip: false,
    visual: <ExtractionVisual />,
  },
  {
    tag: "AI Digital Waiter",
    icon: "support_agent",
    headline: "Your restaurant's best server — always on, always upselling.",
    body: "The moment a guest scans your QR code, your AI Digital Waiter greets them, surfaces today's specials, and starts working toward a higher order value. It takes the full order in chat — no app switch, no WhatsApp dependency.",
    bullets: [
      "Greets every guest within 3 seconds — proactively, not reactively",
      "Takes the full order in chat — table number, modifications, confirmation",
      "Recommends add-ons based on what's converting today",
      "Collects reviews and stamps loyalty cards automatically after the meal",
      "Configurable tone: friendly, formal, or vibrant",
    ],
    dark: true,
    flip: true,
    visual: <WaiterChatVisual />,
  },
  {
    tag: "Real-time Ordering",
    icon: "receipt_long",
    headline: "Orders reach your kitchen before the guest puts their phone down.",
    body: "When a guest places an order, it appears on your staff dashboard instantly — no polling, no page refreshes, no printers. Your team confirms, prepares, and marks orders ready from the same panel.",
    bullets: [
      "Live order stream via Supabase real-time",
      "Table number badge on every order card",
      "One-tap status: Pending → Preparing → Ready",
      "Waiter pager button for table-assistance requests",
    ],
    dark: false,
    flip: false,
    visual: (
      <div className="bg-on-surface rounded-3xl p-6">
        <OrdersVisual />
      </div>
    ),
  },
  {
    tag: "Live Analytics",
    icon: "analytics",
    headline: "Stop guessing. Start knowing.",
    body: "Your analytics dashboard tracks every scan, view, and order. See which items get viewed most, which convert to orders, and how revenue trends — so you make pricing decisions on data, not intuition.",
    bullets: [
      "Daily view, order, and revenue trend charts",
      "Top items by views and conversion rate",
      "Up to 90-day history on Pro and Business plans",
      "AI-generated review replies to protect your reputation",
    ],
    dark: true,
    flip: true,
    visual: <AnalyticsVisual />,
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <PublicNav activePath="/features" />

      {/* ── Hero ── */}
      <section className="pt-16 pb-14 lg:pt-24 lg:pb-20 px-6 text-center">
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-primary/70 mb-6">Features</p>
        <h1
          className="text-5xl md:text-[64px] font-extrabold tracking-tighter leading-[1.05] mb-5 max-w-3xl mx-auto"

        >
          One platform.<br className="hidden sm:block" /> Everything your restaurant needs.
        </h1>
        <p className="text-lg text-secondary max-w-xl mx-auto mb-10 leading-relaxed">
          AI menu extraction, smart ordering, live analytics, and more — built specifically for restaurants in Africa.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <AuthCta className="px-7 py-3.5 bg-primary text-white font-bold rounded-[2rem] text-sm hover:bg-[#a04100] transition-colors shadow-md shadow-primary/20">
            Start Free Trial — No Card Required
          </AuthCta>
          <Link href="/demo" className="px-7 py-3.5 border border-outline-variant text-on-surface font-bold rounded-[2rem] text-sm hover:border-primary/40 hover:bg-surface-container-low transition-colors">
            See Live Demo
          </Link>
        </div>
        <p className="text-xs text-secondary/50 mb-16">
          14-day free trial · Full Pro features · No credit card · Cancel anytime
        </p>

        {/* Stats strip */}
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-3 lg:gap-6 border-t border-black/6 pt-10 lg:pt-12">
          {HERO_STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl font-black text-on-surface tracking-tight font-syne">
                {s.value}
              </p>
              <p className="text-sm text-secondary mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Deep-dive sections ── */}
      {DEEP_FEATURES.map((f, i) => (
        <section key={i} className={`py-14 lg:py-24 px-6 border-t border-black/5 ${f.dark ? "bg-on-surface" : "bg-surface-container-lowest"}`}>
          <div className={`max-w-6xl mx-auto flex flex-col ${f.flip ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-10 lg:gap-16`}>
            {/* Text */}
            <div className="flex-1">
              <div className={`inline-flex items-center gap-2.5 mb-6 px-4 py-2 rounded-xl ${f.dark ? "bg-white/8" : "bg-primary/6"}`}>
                <span className={`material-symbols-outlined text-[18px] ${f.dark ? "text-white/60" : "text-primary"}`}>{f.icon}</span>
                <span className={`text-xs font-black uppercase tracking-[0.2em] ${f.dark ? "text-white/50" : "text-primary/70"}`}>{f.tag}</span>
              </div>
              <h2
                className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-5 leading-tight ${f.dark ? "text-white" : "text-on-surface"}`}
      
              >
                {f.headline}
              </h2>
              <p className={`text-base leading-relaxed mb-8 ${f.dark ? "text-white/50" : "text-secondary"}`}>
                {f.body}
              </p>
              <ul className="space-y-3">
                {f.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0 text-primary">check_circle</span>
                    <span className={`text-sm ${f.dark ? "text-white/60" : "text-secondary"}`}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual */}
            <div className="flex-1 w-full">
              {f.visual ?? (
                <div className={`rounded-3xl p-10 flex items-center justify-center min-h-[280px] ${f.dark ? "bg-white/5 border border-white/8" : "bg-surface border border-black/6"}`}>
                  <span className={`material-symbols-outlined icon-fill text-[96px] ${f.dark ? "text-white/10" : "text-primary/10"}`}>{f.icon}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* ── Feature grid ── */}
      <section className="py-16 lg:py-28 px-6 bg-surface-container-lowest border-t border-black/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 lg:mb-16">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-secondary/50 mb-4">And more</p>
            <h2
              className="text-3xl md:text-4xl font-black tracking-tight"
    
            >
              Every detail, covered
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GRID_FEATURES.map((f, i) => (
              <div key={i} className="bg-surface p-8 rounded-3xl border border-black/5 hover:border-primary/20 hover:shadow-sm transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl mb-5 block">{f.icon}</span>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 lg:py-28 px-6 bg-on-surface">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-6">Get started</p>
          <h2
            className="text-4xl font-black mb-4 text-white tracking-tight leading-tight"
  
          >
            Ready to modernise your restaurant?
          </h2>
          <p className="text-white/40 text-base mb-12 leading-relaxed">
            14-day free trial — no credit card required. Try every Pro feature, then choose your plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <AuthCta className="px-8 py-4 bg-primary text-white font-bold rounded-[2rem] text-sm hover:bg-[#a04100] transition-colors shadow-lg shadow-primary/20">
              Start Free Trial
            </AuthCta>
            <Link href="/pricing" className="px-8 py-4 bg-white/8 text-white/70 font-bold rounded-[2rem] text-sm hover:bg-white/12 transition-colors border border-white/10">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-black/5 bg-surface py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-black tracking-tight text-primary" style={{ fontFamily: "var(--font-headline)" }}>MENUZA AI</span>
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
