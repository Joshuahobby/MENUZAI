"use client";

import Link from "next/link";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DemoBanner } from "@/components/DemoBanner";
import { BackToTop } from "@/components/BackToTop";

const RESTAURANT = "Le Bistro Demo";
const TABS = ["Dashboard", "AI Extraction", "Templates", "Reviews", "QR Codes"] as const;
type Tab = typeof TABS[number];

// ── Dashboard data ────────────────────────────────────────────────────────────

const STATS = [
  { label: "Menu Views",   value: "847",   delta: "+12%", icon: "visibility",   color: "text-primary"  },
  { label: "Orders Today", value: "23",    delta: "+4",   icon: "receipt_long", color: "text-tertiary" },
  { label: "Revenue",      value: "45,200", delta: "+8%",  icon: "payments",     color: "text-primary"  },
  { label: "Conversion",   value: "31%",   delta: "+3pp", icon: "trending_up",  color: "text-tertiary" },
];

const CHART_DATA = [
  { day: "Mon", views: 120, revenue: 38000 },
  { day: "Tue", views: 145, revenue: 44000 },
  { day: "Wed", views: 98,  revenue: 29000 },
  { day: "Thu", views: 178, revenue: 55000 },
  { day: "Fri", views: 203, revenue: 67000 },
  { day: "Sat", views: 165, revenue: 52000 },
  { day: "Sun", views: 138, revenue: 45200 },
];

const QUICK_ACTIONS = [
  { icon: "edit",        label: "Edit Menu",        href: "/demo/owner",  desc: "Add, remove, reorder items" },
  { icon: "qr_code_2",   label: "QR Poster",        href: "/demo/owner",  desc: "Download table badge PDF" },
  { icon: "open_in_new", label: "View Public Menu",  href: "/menu/demo",   desc: "See what guests see" },
  { icon: "star_rate",   label: "Reviews",           href: "/demo/owner",  desc: "4.8 ★ from 38 reviews" },
];

type OrderStatus = "pending" | "preparing" | "ready";
interface DemoOrder { id: string; table: string; items: string[]; total: number; status: OrderStatus; minsAgo: number; source: "whatsapp" | "ai_waiter"; }

const INITIAL_ORDERS: DemoOrder[] = [
  { id: "d1", table: "4",  items: ["Truffle Ribeye x1", "House Wine x2"],      total: 54000, status: "pending",   minsAgo: 3,  source: "whatsapp"  },
  { id: "d2", table: "7",  items: ["Mediterranean Salmon x1", "Sparkling x1"], total: 26000, status: "preparing", minsAgo: 12, source: "ai_waiter" },
  { id: "d3", table: "2",  items: ["Menuza Royale x2", "Lava Cake x1"],        total: 51000, status: "ready",     minsAgo: 22, source: "whatsapp"  },
];

const MENU_PREVIEW = [
  { name: "Truffle Ribeye Steak", price: "38,000", badge: "Chef's Pick", available: true,  img: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=120&h=80&fit=crop" },
  { name: "Mediterranean Salmon", price: "24,000", badge: "Healthy",     available: true,  img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=120&h=80&fit=crop" },
  { name: "Molten Lava Cake",     price: "14,000", badge: "Bestseller",  available: false, img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=120&h=80&fit=crop" },
];

const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = { pending: "preparing", preparing: "ready", ready: null };
const STATUS_LABEL: Record<OrderStatus, string> = { pending: "Mark Preparing", preparing: "Mark Ready", ready: "Done" };
const STATUS_COLOR: Record<OrderStatus, string> = { pending: "bg-amber-500/10 text-amber-700", preparing: "bg-blue-500/10 text-blue-700", ready: "bg-green-500/10 text-green-700" };

// ── AI Extraction data ────────────────────────────────────────────────────────

const UPLOAD_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=140&fit=crop", name: "page1.jpg" },
  { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=140&fit=crop", name: "page2.jpg" },
  { url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=200&h=140&fit=crop", name: "page3.jpg" },
];

const EXTRACTED_ITEMS = [
  { name: "Truffle Ribeye Steak", category: "Mains",      price: "38,000", desc: "Premium ribeye with black truffle butter, truffled mash"    },
  { name: "Mediterranean Salmon", category: "Mains",      price: "24,000", desc: "Pan-seared Atlantic salmon, honey-soy glaze, wild rice"     },
  { name: "Bruschetta Trio",       category: "Starters",   price: "12,000", desc: "Three varieties: classic tomato, mushroom, smoked salmon"   },
  { name: "Superfood Bowl",        category: "Mains",      price: "18,000", desc: "Quinoa, roasted chickpeas, avocado, tahini dressing"        },
  { name: "Molten Lava Cake",      category: "Desserts",   price: "14,000", desc: "Warm chocolate lava cake, vanilla bean ice cream"           },
  { name: "Summer Spritz",         category: "Beverages",  price: "8,000",  desc: "Prosecco, Aperol, soda water, orange slice"                 },
];

// ── Templates data ────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: "vintage-parchment", name: "Vintage Parchment", bg: "bg-[#f5e6c8]",   text: "text-[#5c3d1a]",  accent: "border-[#c4903a]",  desc: "Warm, classic, timeless"  },
  { id: "dark-chalkboard",   name: "Dark Chalkboard",   bg: "bg-[#1a2a1a]",   text: "text-white",       accent: "border-[#7eb87e]",  desc: "Bold restaurant feel"     },
  { id: "bold-street",       name: "Bold Street",       bg: "bg-[#1c1c1e]",   text: "text-white",       accent: "border-[#ff3b30]",  desc: "Urban, energetic"         },
  { id: "bistro-split",      name: "Bistro Split",      bg: "bg-[#faf8f6]",   text: "text-[#1c1c1e]",  accent: "border-[#2c5282]",  desc: "Clean, professional"     },
  { id: "photo-gallery",     name: "Photo Gallery",     bg: "bg-[#111111]",   text: "text-white",       accent: "border-[#d4a853]",  desc: "Image-led, visual"        },
  { id: "luxury-gold",       name: "Luxury Gold",       bg: "bg-[#0d0d0d]",   text: "text-[#d4a853]",  accent: "border-[#d4a853]",  desc: "Premium, upscale"         },
  { id: "organic-clean",     name: "Organic Clean",     bg: "bg-[#f9fbf4]",   text: "text-[#1a3a1a]",  accent: "border-[#4a7c59]",  desc: "Fresh, health-focused"    },
  { id: "midnight-luxe",     name: "Midnight Luxe",     bg: "bg-[#12001e]",   text: "text-[#e8d5ff]",  accent: "border-[#9b59b6]",  desc: "Mysterious, sophisticated" },
];

// ── Reviews data ──────────────────────────────────────────────────────────────

const REVIEWS = [
  {
    id: "r1", name: "Amina K.", rating: 5, time: "2 days ago",
    comment: "The AI waiter knew exactly what I wanted! Ordered from my phone, food arrived in 8 minutes. The truffle steak was incredible.",
    sentiment: "positive",
    reply: "Thank you so much, Amina! We're thrilled the AI Waiter made your experience seamless. The truffle ribeye is indeed one of our finest. We look forward to seeing you again at Le Bistro! 🙏",
    replyShown: true,
  },
  {
    id: "r2", name: "Jean-Pierre M.", rating: 4, time: "5 days ago",
    comment: "Great ambiance and the digital menu was easy to use. Would have given 5 stars but the salmon was slightly overcooked. Service was quick though.",
    sentiment: "positive",
    reply: "",
    replyShown: false,
  },
  {
    id: "r3", name: "Claudine U.", rating: 3, time: "1 week ago",
    comment: "The menu looked beautiful on my phone but I had trouble placing my order via WhatsApp. The staff helped me out eventually. Food was good.",
    sentiment: "neutral",
    reply: "",
    replyShown: false,
  },
];

const AI_REPLIES: Record<string, string> = {
  r2: "Thank you, Jean-Pierre! Your feedback means a lot to us. We're sorry to hear the salmon wasn't cooked to your liking — we'll make sure to address this with our kitchen team. We'd love the opportunity to give you the full 5-star experience on your next visit. Complimentary dessert is on us! 🐟",
  r3: "Thank you for your honest feedback, Claudine! We're sorry for the friction with the WhatsApp order — we're looking into making that flow even smoother. We're glad our team could assist, and we hope the food made up for it. We'd love to have you back! 🙏",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function OwnerDemoPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");
  const [chartTab, setChartTab] = useState<"views" | "revenue">("views");
  const [orders, setOrders] = useState<DemoOrder[]>(INITIAL_ORDERS);
  const [menuItems, setMenuItems] = useState(MENU_PREVIEW);

  // AI Extraction state
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set(EXTRACTED_ITEMS.map((_, i) => i)));

  // Templates state
  const [selectedTemplate, setSelectedTemplate] = useState("bistro-split");

  // Reviews state
  const [reviews, setReviews] = useState(REVIEWS);
  const [generatingReply, setGeneratingReply] = useState<string | null>(null);

  const advanceOrder = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = STATUS_NEXT[o.status];
      return next ? { ...o, status: next } : o;
    }));
  };

  const toggleAvailable = (idx: number) => {
    setMenuItems(prev => prev.map((m, i) => i === idx ? { ...m, available: !m.available } : m));
  };

  const handleExtract = () => {
    setExtracting(true);
    setTimeout(() => { setExtracting(false); setExtracted(true); }, 2200);
  };

  const generateReply = (id: string) => {
    setGeneratingReply(id);
    setTimeout(() => {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, reply: AI_REPLIES[id] ?? "", replyShown: true } : r));
      setGeneratingReply(null);
    }, 1400);
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-on-surface">
      <DemoBanner role="owner" restaurantName={RESTAURANT} />

      {/* Header */}
      <header className="bg-white border-b border-black/6 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary/50 mb-0.5">Owner Dashboard</p>
            <h1 className="text-2xl font-[var(--font-headline)] font-extrabold tracking-tight">{RESTAURANT}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/menu/demo" target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-secondary border border-black/10 px-3.5 py-2 rounded-lg hover:bg-black/3 transition-colors">
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              Public Menu
            </Link>
            <Link href="/login" className="text-xs font-bold text-white bg-primary px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-black/6 px-6">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto hide-scrollbar">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-secondary hover:text-on-surface"
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ── DASHBOARD TAB ── */}
        {activeTab === "Dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {STATS.map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-black/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`material-symbols-outlined text-[20px] ${s.color}`}>{s.icon}</span>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{s.delta}</span>
                  </div>
                  <p className="text-2xl font-black tracking-tight mb-0.5">{s.value}</p>
                  <p className="text-xs text-secondary font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-black/5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-base">7-day trend</h2>
                  <div className="flex gap-1 bg-[#faf8f6] p-1 rounded-lg">
                    {(["views", "revenue"] as const).map(t => (
                      <button key={t} onClick={() => setChartTab(t)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all capitalize cursor-pointer ${chartTab === t ? "bg-white shadow-sm text-on-surface" : "text-secondary hover:text-on-surface"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a04100" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#a04100" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false}
                      tickFormatter={v => chartTab === "revenue" ? `${(Number(v) / 1000).toFixed(0)}k` : String(v)} />
                    <Tooltip
                      contentStyle={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
                      formatter={(v: unknown) => {
                        const n = Number(v);
                        return chartTab === "revenue" ? [`${fmt(n)} RWF`, "Revenue"] : [n, "Views"];
                      }}
                    />
                    <Area type="monotone" dataKey={chartTab} stroke="#a04100" strokeWidth={2} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-black/5">
                <h2 className="font-bold text-base mb-5">Quick actions</h2>
                <div className="space-y-2">
                  {QUICK_ACTIONS.map((a, i) => (
                    <Link key={i} href={a.href}
                      className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-[#faf8f6] transition-colors group">
                      <div className="w-9 h-9 bg-primary/8 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[18px]">{a.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{a.label}</p>
                        <p className="text-[11px] text-secondary truncate">{a.desc}</p>
                      </div>
                      <span className="material-symbols-outlined text-secondary text-[16px] ml-auto opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-black/5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-base">Recent orders</h2>
                  <Link href="/demo/staff" className="text-xs font-semibold text-primary hover:underline">Open staff panel →</Link>
                </div>
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="flex items-center gap-4 p-4 bg-[#faf8f6] rounded-xl border border-black/4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-primary/10 text-primary px-2.5 py-1 rounded-lg shrink-0">
                        <span className="material-symbols-outlined text-[11px]">table_restaurant</span>
                        T{o.table}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-xs text-secondary truncate">{o.items.slice(0, 2).join(" · ")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold">{fmt(o.total)} RWF · {o.minsAgo}m ago</p>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${o.source === "ai_waiter" ? "bg-violet-100 text-violet-700" : "bg-green-50 text-green-700"}`}>
                            {o.source === "ai_waiter" ? "AI Waiter" : "WhatsApp"}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status]}`}>{o.status}</span>
                        {STATUS_NEXT[o.status] && (
                          <button onClick={() => advanceOrder(o.id)} className="text-[10px] font-bold text-primary hover:underline cursor-pointer">
                            {STATUS_LABEL[o.status]}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-black/5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-base">Menu items</h2>
                  <Link href="/menu/demo" className="text-xs font-semibold text-primary hover:underline">View full menu →</Link>
                </div>
                <div className="space-y-3">
                  {menuItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3.5 bg-[#faf8f6] rounded-xl border border-black/4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.img} alt={item.name} className="w-14 h-10 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.name}</p>
                        <p className="text-xs text-secondary">{item.price} RWF · <span className="text-primary/70">{item.badge}</span></p>
                      </div>
                      <button onClick={() => toggleAvailable(idx)}
                        className={`shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer relative ${item.available ? "bg-green-500" : "bg-black/15"}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${item.available ? "right-0.5" : "left-0.5"}`} />
                      </button>
                    </div>
                  ))}
                  <p className="text-[11px] text-secondary/60 text-center pt-1">Toggle availability in real-time</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AI EXTRACTION TAB ── */}
        {activeTab === "AI Extraction" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-black/5">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">document_scanner</span>
                </div>
                <div>
                  <h2 className="font-bold text-base mb-1">AI Menu Extraction</h2>
                  <p className="text-sm text-secondary">Photograph your paper menu. Our AI reads every item, price, and description in seconds.</p>
                </div>
              </div>

              {/* Step 1: Photos */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-secondary/50 mb-3">Step 1 — Upload photos</p>
                <div className="grid grid-cols-3 gap-3">
                  {UPLOAD_PHOTOS.map((p, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden border-2 border-primary/30 aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[12px]">check</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                        <p className="text-white text-[9px] font-bold truncate">{p.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Extract button */}
              {!extracted && (
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-secondary/50 mb-3">Step 2 — Extract with AI</p>
                  <button
                    onClick={handleExtract}
                    disabled={extracting}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl text-sm shadow shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-70"
                  >
                    {extracting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Extracting menu items…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        Extract Menu Items
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 3: Results */}
              {extracted && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary/50">Step 3 — Review &amp; add to menu</p>
                    <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      {checkedItems.size} of {EXTRACTED_ITEMS.length} selected
                    </span>
                  </div>
                  <div className="space-y-2 mb-5">
                    {EXTRACTED_ITEMS.map((item, i) => (
                      <div key={i}
                        onClick={() => setCheckedItems(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; })}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${checkedItems.has(i) ? "bg-primary/5 border-primary/20" : "bg-[#faf8f6] border-black/5 opacity-50"}`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${checkedItems.has(i) ? "bg-primary border-primary" : "border-black/20"}`}>
                          {checkedItems.has(i) && <span className="material-symbols-outlined text-white text-[12px]">check</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold">{item.name}</p>
                            <span className="text-[9px] font-bold uppercase bg-surface-container-high text-secondary px-1.5 py-0.5 rounded">{item.category}</span>
                          </div>
                          <p className="text-xs text-secondary truncate">{item.desc}</p>
                        </div>
                        <p className="text-sm font-black text-primary shrink-0">{item.price} RWF</p>
                      </div>
                    ))}
                  </div>
                  <Link href="/login"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl text-sm shadow shadow-primary/20 hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    Add {checkedItems.size} items to my real menu — sign up free
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TEMPLATES TAB ── */}
        {activeTab === "Templates" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-black/5">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">style</span>
                </div>
                <div>
                  <h2 className="font-bold text-base mb-1">Menu Templates</h2>
                  <p className="text-sm text-secondary">Choose from 8 professionally designed templates. Apply in one click — your content stays intact.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                    className={`rounded-2xl overflow-hidden border-2 transition-all cursor-pointer text-left ${selectedTemplate === t.id ? "border-primary shadow-lg shadow-primary/15 scale-[1.02]" : "border-transparent hover:border-black/15"}`}
                  >
                    <div className={`${t.bg} p-4 h-28 relative flex flex-col justify-between border ${t.accent}`}>
                      {selectedTemplate === t.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[12px]">check</span>
                        </div>
                      )}
                      <div className={`text-[9px] font-black uppercase tracking-widest opacity-50 ${t.text}`}>MENU</div>
                      <div>
                        <div className={`h-1.5 rounded-full w-3/4 mb-1 opacity-40 bg-current ${t.text}`} />
                        <div className={`h-1 rounded-full w-1/2 opacity-20 bg-current ${t.text}`} />
                      </div>
                      <div className={`flex justify-between items-end ${t.text}`}>
                        <div>
                          <div className={`h-1 rounded-full w-12 mb-0.5 opacity-30 bg-current`} />
                          <div className={`h-1 rounded-full w-8 opacity-20 bg-current`} />
                        </div>
                        <div className={`text-[10px] font-black opacity-60`}>RWF</div>
                      </div>
                    </div>
                    <div className="bg-[#faf8f6] px-3 py-2">
                      <p className="text-xs font-bold truncate">{t.name}</p>
                      <p className="text-[9px] text-secondary truncate">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 p-4 bg-[#faf8f6] rounded-xl border border-black/5 mb-4">
                <span className="material-symbols-outlined text-primary text-xl">preview</span>
                <div>
                  <p className="text-sm font-semibold">Selected: {TEMPLATES.find(t => t.id === selectedTemplate)?.name}</p>
                  <p className="text-xs text-secondary">{TEMPLATES.find(t => t.id === selectedTemplate)?.desc} — applies to your entire menu instantly</p>
                </div>
              </div>

              <Link href="/login"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl text-sm shadow shadow-primary/20 hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[18px]">style</span>
                Apply this template — start free trial
              </Link>
            </div>
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {activeTab === "Reviews" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-black/5">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">star</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-base mb-1">Customer Reviews</h2>
                    <p className="text-sm text-secondary">See what guests say. Generate AI reply drafts in one click — edit and send.</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-on-surface">4.8</p>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`material-symbols-outlined text-[14px] ${s <= 4 ? "text-amber-400 icon-fill" : "text-amber-300 icon-fill"}`}>star</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-secondary mt-0.5">38 reviews</p>
                </div>
              </div>

              <div className="space-y-5">
                {reviews.map((r) => (
                  <div key={r.id} className="border border-black/6 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center font-bold text-primary text-sm shrink-0">
                          {r.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{r.name}</p>
                          <p className="text-[10px] text-secondary">{r.time}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`material-symbols-outlined text-[14px] icon-fill ${s <= r.rating ? "text-amber-400" : "text-black/10"}`}>star</span>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-secondary leading-relaxed mb-4">&ldquo;{r.comment}&rdquo;</p>

                    {r.replyShown && r.reply ? (
                      <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">reply</span>
                          Your reply
                        </p>
                        <p className="text-xs text-on-surface leading-relaxed">{r.reply}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => generateReply(r.id)}
                        disabled={generatingReply === r.id}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/15 transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        {generatingReply === r.id ? (
                          <><span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Generating reply…</>
                        ) : (
                          <><span className="material-symbols-outlined text-[14px]">auto_awesome</span> Generate AI Reply</>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-black/5">
                <Link href="/login"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl text-sm shadow shadow-primary/20 hover:opacity-90 transition-opacity">
                  <span className="material-symbols-outlined text-[18px]">star</span>
                  See all reviews &amp; replies — start free trial
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── QR CODES TAB ── */}
        {activeTab === "QR Codes" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-black/5">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">qr_code_2</span>
                </div>
                <div>
                  <h2 className="font-bold text-base mb-1">QR Code Posters</h2>
                  <p className="text-sm text-secondary">Generate branded QR table badges and batch-export an entire venue in one PDF.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Mock QR poster */}
                <div className="bg-[#1c1c1e] rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 50% 0%, #a04100, transparent 70%)" }} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">Scan to Order</p>
                  <h3 className="text-xl font-[var(--font-headline)] font-black text-white mb-1">Le Bistro</h3>
                  <p className="text-xs text-white/50 mb-5">Kigali, Rwanda</p>
                  {/* QR code placeholder */}
                  <div className="w-36 h-36 bg-white rounded-xl p-2 mb-5">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect x="5" y="5" width="35" height="35" rx="3" fill="none" stroke="#1c1c1e" strokeWidth="5"/>
                      <rect x="14" y="14" width="17" height="17" fill="#1c1c1e"/>
                      <rect x="60" y="5" width="35" height="35" rx="3" fill="none" stroke="#1c1c1e" strokeWidth="5"/>
                      <rect x="69" y="14" width="17" height="17" fill="#1c1c1e"/>
                      <rect x="5" y="60" width="35" height="35" rx="3" fill="none" stroke="#1c1c1e" strokeWidth="5"/>
                      <rect x="14" y="69" width="17" height="17" fill="#1c1c1e"/>
                      <rect x="60" y="50" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="70" y="50" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="80" y="50" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="90" y="50" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="60" y="60" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="75" y="60" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="90" y="60" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="65" y="70" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="80" y="70" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="60" y="80" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="70" y="80" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="85" y="80" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="60" y="90" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="75" y="90" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="90" y="90" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="45" y="5" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="45" y="15" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="45" y="25" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="5" y="45" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="15" y="45" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="25" y="45" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="35" y="45" width="5" height="5" fill="#1c1c1e"/>
                      <rect x="45" y="45" width="5" height="5" fill="#1c1c1e"/>
                    </svg>
                  </div>
                  <p className="text-xs text-white/40 mb-1">Table 4</p>
                  <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-bold uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[10px]">bolt</span>
                    Powered by MENUZA AI
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary/50 mb-3">Poster style</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Classic Dark", "Minimal White", "Luxury Gold", "Bistro Warm"].map((s, i) => (
                        <button key={s}
                          className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${i === 0 ? "border-primary bg-primary/5 text-primary" : "border-black/8 text-secondary hover:border-black/20"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary/50 mb-3">Batch export</p>
                    <div className="flex items-center gap-3 p-4 bg-[#faf8f6] rounded-xl border border-black/5">
                      <span className="material-symbols-outlined text-primary text-xl">table_restaurant</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Tables 1–20</p>
                        <p className="text-xs text-secondary">20 QR codes as one PDF</p>
                      </div>
                    </div>
                  </div>

                  <Link href="/login"
                    className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl text-sm shadow shadow-primary/20 hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download QR Posters — start free trial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-on-surface rounded-3xl p-6 md:p-10 text-center mt-8">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Ready to start?</p>
          <h2 className="text-2xl font-[var(--font-headline)] font-black text-white mb-4">Get your real dashboard in 2 minutes</h2>
          <p className="text-white/40 text-sm mb-7">14-day free trial — upload your menu, get your QR code, go live today.</p>
          <Link href="/login"
            className="inline-block px-8 py-3.5 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
            Start Free Trial
          </Link>
        </div>
      </main>
      <BackToTop />
    </div>
  );
}
