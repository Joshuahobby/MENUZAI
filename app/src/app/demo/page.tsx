import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";

export const metadata = {
  title: "Live Demo — MENUZA AI",
  description: "Try MENUZA AI before you sign up. Explore the customer menu, owner dashboard, and staff orders panel — no account needed.",
};

const ROLES = [
  {
    href: "/menu/demo",
    role: "customer",
    icon: "person",
    label: "Customer Experience",
    tagline: "What your guests see",
    color: "bg-tertiary",
    border: "border-tertiary/20",
    ring: "hover:border-tertiary/50",
    desc: "Browse a live digital menu, add items to a cart, and place a WhatsApp order — exactly as your restaurant guests would.",
    features: [
      "Browse categories and menu items",
      "Add to cart and see live totals",
      "Place an order via WhatsApp",
      "Chat with the AI Digital Waiter",
    ],
    cta: "Try Customer Demo",
  },
  {
    href: "/demo/owner",
    role: "owner",
    icon: "store",
    label: "Owner Dashboard",
    tagline: "Your command centre",
    color: "bg-primary",
    border: "border-primary/20",
    ring: "hover:border-primary/60",
    desc: "See your restaurant's performance at a glance — revenue, menu views, conversion rates, and recent orders.",
    features: [
      "Analytics: views, orders, revenue trends",
      "Quick actions: edit menu, view QR, analytics",
      "Recent orders with live status",
      "Menu item management",
    ],
    cta: "Try Owner Demo",
    highlight: true,
  },
  {
    href: "/demo/staff",
    role: "staff",
    icon: "badge",
    label: "Staff Orders Panel",
    tagline: "Real-time kitchen view",
    color: "bg-on-surface",
    border: "border-black/12",
    ring: "hover:border-black/25",
    desc: "Manage incoming orders in real-time — move them through the pipeline from new to preparing to ready.",
    features: [
      "Live order stream with table numbers",
      "One-tap status: New → Preparing → Ready",
      "Simulate incoming orders",
      "Urgency timers for waiting tables",
    ],
    cta: "Try Staff Demo",
  },
];

export default function DemoHubPage() {
  return (
    <div className="min-h-screen bg-[#faf8f6] text-on-surface">
      <PublicNav activePath="/demo" />

      {/* ── Hero ── */}
      <section className="pt-20 pb-16 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/8 text-primary text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
          <span className="material-symbols-outlined text-[14px]">play_circle</span>
          No account needed
        </div>
        <h1 className="text-5xl md:text-[58px] font-[var(--font-headline)] font-extrabold tracking-tighter leading-[1.05] mb-5 max-w-2xl mx-auto">
          See MENUZA AI in action
        </h1>
        <p className="text-lg text-secondary max-w-lg mx-auto leading-relaxed">
          Explore all three perspectives — how guests browse, how owners manage, and how staff handle orders.
        </p>
      </section>

      {/* ── Role Cards ── */}
      <section className="pb-28 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {ROLES.map((r) => (
            <div key={r.role}
              className={`relative flex flex-col rounded-3xl border-2 p-8 transition-all duration-200 ${r.border} ${r.ring} ${r.highlight ? "bg-on-surface" : "bg-white"}`}
            >
              {r.highlight && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md">
                  Most useful
                </span>
              )}

              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${r.color}`}>
                <span className="material-symbols-outlined text-white text-[22px]">{r.icon}</span>
              </div>

              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${r.highlight ? "text-white/40" : "text-secondary/50"}`}>
                {r.tagline}
              </p>
              <h2 className={`text-xl font-[var(--font-headline)] font-extrabold mb-3 ${r.highlight ? "text-white" : "text-on-surface"}`}>
                {r.label}
              </h2>
              <p className={`text-sm leading-relaxed mb-7 ${r.highlight ? "text-white/50" : "text-secondary"}`}>
                {r.desc}
              </p>

              <ul className="space-y-2.5 mb-8 flex-grow">
                {r.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`material-symbols-outlined text-[14px] mt-0.5 shrink-0 ${r.highlight ? "text-primary" : "text-primary"}`}>
                      check_circle
                    </span>
                    <span className={`text-xs leading-snug ${r.highlight ? "text-white/60" : "text-secondary"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href={r.href}
                className={`flex items-center justify-center gap-2 w-full py-3.5 text-sm font-bold rounded-xl transition-all ${
                  r.highlight
                    ? "bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/30"
                    : "bg-on-surface text-surface hover:opacity-90"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                {r.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-secondary mt-10">
          Ready to set up your own menu?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Create a free account →
          </Link>
        </p>
      </section>

      {/* ── What you can do ── */}
      <section className="py-20 px-6 bg-white border-y border-black/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-[var(--font-headline)] font-black tracking-tight mb-3">
              Everything is interactive
            </h2>
            <p className="text-secondary text-sm max-w-md mx-auto">
              These aren&apos;t screenshots. You can actually use the features below in the demo.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "add_shopping_cart", text: "Add items to cart" },
              { icon: "whatsapp",          text: "Place a WhatsApp order" },
              { icon: "support_agent",     text: "Chat with AI Waiter" },
              { icon: "analytics",         text: "View revenue charts" },
              { icon: "swap_horiz",        text: "Change order status" },
              { icon: "notifications",     text: "Simulate new orders" },
              { icon: "table_restaurant",  text: "Track table numbers" },
              { icon: "timer",             text: "See urgency timers" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-5 bg-[#faf8f6] rounded-2xl border border-black/5 text-center">
                <span className="material-symbols-outlined text-primary text-[28px]">{item.icon}</span>
                <span className="text-xs font-semibold text-secondary leading-tight">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-[var(--font-headline)] font-black tracking-tight mb-4">
            Convinced? Get your restaurant online in minutes.
          </h2>
          <p className="text-secondary mb-8">Free plan — no card required. Upgrade when you&apos;re ready.</p>
          <Link href="/login"
            className="inline-block px-8 py-4 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            Start Free — No Card Required
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-[#faf8f6] py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-[var(--font-headline)] font-black tracking-tight text-primary">MENUZA AI</span>
          <p className="text-xs text-secondary/50">© 2026 Menuza Systems Inc.</p>
          <div className="flex gap-6 text-xs font-medium text-secondary/60">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
