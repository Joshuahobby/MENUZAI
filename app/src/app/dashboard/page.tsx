"use client";
import { useEffect, useState } from "react";
import { useMenu } from "@/context/MenuContext";
import Link from "next/link";
import { formatPrice, formatEventType, formatRelativeTime } from "@/lib/utils";
import { SkeletonKpi, SkeletonRow } from "@/components/Skeleton";

interface AnalyticsData {
  kpis: { views: number; orders: number; revenue: number; avgOrderValue: number; conversionRate: number; addToCarts?: number; cartAbandons?: number; abandonRate?: number };
  topItems: { name: string; count: number }[];
  peakHours: { hour: number; count: number }[];
  recentEvents: { type: string; item: string | null; amount: number | null; time: string }[];
  dailyViews?: { date: string; views: number }[];
  funnel?: { label: string; count: number }[];
  meta?: { days: number; plan: string };
}

export default function DashboardPage() {
  const { restaurantId, lastSynced, menuStyle, menuItems, menuStatus, restaurantLogoUrl, userRole, menuSlug, plan, restaurantName, restaurantPhone } = useMenu();
  const currency = menuStyle.currency ?? "RWF";
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (restaurantId === null) {
      // Still waiting for context to hydrate — keep loading
      return;
    }
    if (!restaurantId) {
      // restaurantId resolved to empty string or falsy — stop spinner
      setTimeout(() => setLoading(false), 0);
      return;
    }

    setLoading(true);
    fetch(`/api/analytics/summary?restaurantId=${restaurantId}&days=${days}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [restaurantId, days]);

  if (loading) {
    return (
      <div className="p-6 lg:p-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis ?? { views: 0, orders: 0, revenue: 0, avgOrderValue: 0, conversionRate: 0 };
  const topDishes = data?.topItems?.slice(0, 3) ?? [];
  const recentEvents = data?.recentEvents?.slice(0, 5) ?? [];
  const peakHours = data?.peakHours ?? Array.from({ length: 16 }, (_, i) => ({ hour: i + 8, count: 0 }));
  const maxHourCount = Math.max(...peakHours.map((h) => h.count), 1);
  const peakHour = peakHours.reduce((best, h) => (h.count > best.count ? h : best), { hour: 0, count: 0 });

  const hasLogo = !!restaurantLogoUrl;
  const hasItems = menuItems && menuItems.length > 0;
  const isPublished = menuStatus === "published";
  const hasPhone = !!(restaurantPhone && restaurantPhone.trim().length > 5);
  const allStepsDone = hasLogo && hasItems && isPublished && hasPhone;

  const isNewUser = kpis.views === 0 && kpis.orders === 0;

  function downloadReport() {
    if (!data) return;
    const plan = data.meta?.plan ?? "free";
    const rows: (string | number)[][] = [
      ["MENUZA AI Analytics Report", `Last ${days} Days`, new Date().toISOString().slice(0, 10)],
      ["Plan", plan],
      [],
      ["── Summary KPIs ──", ""],
      ["Metric", "Value"],
      ["Total Revenue", formatPrice(kpis.revenue, currency)],
      ["Total Orders", kpis.orders],
      ["Menu Views", kpis.views],
      ["Conversion Rate", `${kpis.conversionRate.toFixed(1)}%`],
      ["Avg Order Value", formatPrice(kpis.avgOrderValue, currency)],
    ];

    if (data.funnel && data.funnel.length > 0) {
      rows.push([], ["── Conversion Funnel ──", ""]);
      rows.push(["Stage", "Count"]);
      data.funnel.forEach((f) => rows.push([f.label, f.count]));
      if (kpis.abandonRate != null) {
        rows.push(["Cart Abandon Rate", `${kpis.abandonRate.toFixed(1)}%`]);
      }
    }

    rows.push([], ["── Top Performing Dishes ──", ""]);
    rows.push(["Dish", "Interactions"]);
    if (data.topItems?.length) {
      data.topItems.slice(0, 10).forEach((d) => rows.push([d.name, d.count]));
    } else {
      rows.push(["No data yet", ""]);
    }

    rows.push([], ["── Peak Ordering Hours ──", ""]);
    rows.push(["Hour", "Activity Count"]);
    data.peakHours?.filter((h) => h.hour >= 8 && h.hour <= 23).forEach((h) => rows.push([`${h.hour}:00`, h.count]));

    if (data.dailyViews && data.dailyViews.length > 0) {
      rows.push([], ["── Daily Menu Views ──", ""]);
      rows.push(["Date", "Views"]);
      data.dailyViews.forEach((d) => rows.push([d.date, d.views]));
    }

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `menuza-analytics-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (userRole === "staff") {
    return (
      <div className="p-6 lg:p-12 pb-24 lg:pb-12 text-on-surface">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight text-on-surface mb-1">
              Live Staff Station
            </h1>
            <p className="text-secondary font-medium">Real-time order monitoring and dispatch terminal.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-tertiary/10 text-tertiary px-4 py-2.5 rounded-xl border border-tertiary/20 flex items-center gap-2 shadow-sm font-bold text-xs uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse shrink-0"></span>
              Live Connected
            </div>
            <Link
              href="/dashboard/orders"
              className="bg-primary hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-sm">receipt_long</span> Orders Board
            </Link>
          </div>
        </header>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {/* Menu status */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container/50 flex flex-col justify-between min-h-[140px]">
            <div>
              <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-sm icon-fill">restaurant_menu</span>
                Menu Status
              </p>
              <h3 className={`text-2xl font-extrabold ${menuStatus === "published" ? "text-tertiary" : "text-amber-600"}`}>
                {menuStatus === "published" ? "Published (Online)" : "Draft (Offline)"}
              </h3>
            </div>
            {menuSlug && menuStatus === "published" ? (
              <Link
                href={`/menu/${menuSlug}`}
                target="_blank"
                className="text-xs font-bold text-primary flex items-center gap-1 mt-4 hover:underline"
              >
                View Customer Menu <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            ) : (
              <p className="text-[10px] text-secondary mt-4">Publish menu to allow table orders.</p>
            )}
          </div>

          {/* Total Orders processed last 30 days */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container/50 flex flex-col justify-between min-h-[140px]">
            <div>
              <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-sm icon-fill">shopping_bag</span>
                Orders Processed
              </p>
              <h3 className="text-2xl font-extrabold">{kpis.orders.toLocaleString()}</h3>
            </div>
            <p className="text-[10px] text-secondary mt-4">Processed orders in the last 30 days.</p>
          </div>

          {/* Menu Views */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container/50 flex flex-col justify-between min-h-[140px]">
            <div>
              <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-sm icon-fill">visibility</span>
                Menu Interactions
              </p>
              <h3 className="text-2xl font-extrabold">{kpis.views.toLocaleString()}</h3>
            </div>
            <p className="text-[10px] text-secondary mt-4">Total visual impressions of the menu.</p>
          </div>
        </div>

        {/* Large Quick Access Card & Staff Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-7 bg-primary-container p-8 rounded-3xl shadow-xl shadow-primary-container/10 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="z-10 bg-white/20 backdrop-blur-md p-5 rounded-2xl">
              <span className="material-symbols-outlined text-white text-4xl icon-fill">notifications_active</span>
            </div>
            <div className="z-10 text-white flex-1">
              <h3 className="text-xl font-[var(--font-headline)] font-bold mb-2">Live Orders Monitor</h3>
              <p className="text-base opacity-90 leading-snug">
                Open the interactive order processing terminal to manage table requests, accept new orders, and print guest receipts.
              </p>
            </div>
            <Link
              href="/dashboard/orders"
              className="z-10 bg-white text-primary-container px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 whitespace-nowrap text-center block w-full md:w-auto"
            >
              Open Terminal
            </Link>
          </div>

          {/* Kitchen Staff Reminders / Rules */}
          <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-3xl border border-surface-container/50 shadow-sm">
            <h3 className="font-[var(--font-headline)] font-bold mb-4 flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
              Kitchen Best Practices
            </h3>
            <ul className="space-y-3 text-xs font-semibold text-secondary">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-tertiary text-base icon-fill">check_circle</span>
                <span>Acknowledge incoming order sound instantly.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-tertiary text-base icon-fill">check_circle</span>
                <span>Verify table numbers before carrying plates.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-tertiary text-base icon-fill">check_circle</span>
                <span>Print ticket receipts before kitchen preparation starts.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-tertiary text-base icon-fill">check_circle</span>
                <span>Mark dishes as &quot;Done&quot; on the board when ready to serve.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Live Activity Stream (Operational only) */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container/50 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[var(--font-headline)] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-xl">pulse</span> Live Operations Feed
            </h3>
            <span className="flex h-2.5 w-2.5 rounded-full bg-tertiary animate-pulse"></span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentEvents.length === 0 ? (
              <p className="text-secondary text-sm text-center py-4 col-span-2">No recent service activity.</p>
            ) : (
              recentEvents.slice(0, 10).map((a, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-center p-3.5 hover:bg-surface-container-low rounded-2xl transition-colors border border-surface-container/30"
                >
                  <div
                    className={`w-9 h-9 rounded-full ${
                      a.type === "order_sent" ? "bg-tertiary/10 text-tertiary" : "bg-primary/10 text-primary"
                    } flex items-center justify-center`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {a.type === "order_sent" ? "shopping_cart" : "visibility"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {a.type === "order_sent" ? "New Table Order Placed" : "Customer Viewed Menu"}
                    </p>
                    <p className="text-[10px] text-secondary truncate">
                      {formatRelativeTime(a.time)}
                      {a.item ? ` • Item: ${a.item}` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      {/* Greeting + quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-0.5">{greeting}</p>
          <h1 className="text-2xl font-[var(--font-headline)] font-extrabold tracking-tight text-on-surface">
            {restaurantName || "Dashboard"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/dashboard/orders", icon: "receipt_long", label: "Orders", highlight: false },
            { href: "/dashboard/editor", icon: "edit_note", label: "Edit Menu", highlight: false },
            { href: menuSlug ? `/menu/${menuSlug}` : "/dashboard/menus", icon: "open_in_new", label: "View Menu", highlight: false },
            { href: "/dashboard/qr-codes", icon: "qr_code_2", label: "QR Code", highlight: false },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              target={a.href.startsWith("/menu") ? "_blank" : undefined}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${a.highlight ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-surface-container-lowest border border-surface-container hover:border-primary/30 hover:shadow-sm text-on-surface"}`}
            >
              <span className="material-symbols-outlined text-[16px]">{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* WhatsApp number warning — orders silently fail without it */}
      {isPublished && !hasPhone && (
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 mb-6 px-5 py-4 bg-amber-50 border border-amber-300 rounded-2xl hover:bg-amber-100 transition-colors"
        >
          <span className="material-symbols-outlined text-amber-600 text-[22px]">warning</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-amber-900">No WhatsApp number set — orders can&apos;t be placed</p>
            <p className="text-xs text-amber-700 mt-0.5">Your menu is live but customers can&apos;t order without your WhatsApp number. Add it in Settings.</p>
          </div>
          <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0">chevron_right</span>
        </Link>
      )}

      {/* Setup checklist — shown until all steps complete */}
      {!allStepsDone && (
        <div className="mb-10 bg-gradient-to-br from-primary/5 to-primary-container/5 border border-primary/10 rounded-3xl p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
                <span className="material-symbols-outlined text-white icon-fill text-xl">rocket_launch</span>
              </div>
              <div>
                <h2 className="font-[var(--font-headline)] font-bold text-lg">Get your menu live in 4 steps</h2>
                <p className="text-secondary text-xs">Complete these to start receiving orders</p>
              </div>
            </div>
            {allStepsDone && (
              <div className="bg-tertiary/10 text-tertiary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm icon-fill">check_circle</span> Ready to go!
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: 1, done: hasItems, icon: "edit_note", label: "Add menu items", desc: "Create your first category and item", href: "/dashboard/editor", cta: "Open Editor" },
              { step: 2, done: isPublished, icon: "public", label: "Publish your menu", desc: "Make it live so customers can scan", href: "/dashboard/menus", cta: "Publish Now" },
              { step: 3, done: hasPhone, icon: "whatsapp", label: "Add WhatsApp number", desc: "Required for customers to place orders", href: "/dashboard/settings", cta: "Add in Settings" },
              { step: 4, done: hasLogo, icon: "image", label: "Upload your logo", desc: "Brand your menu with your restaurant logo", href: "/dashboard/settings", cta: "Go to Settings" },
            ].map(({ step, done, icon, label, desc, href, cta }) => (
              <Link key={step} href={href} className={`group flex flex-col gap-3 rounded-2xl p-5 border transition-all ${done ? 'bg-surface-container-low border-transparent opacity-80' : 'bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 hover:shadow-md'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${done ? 'bg-tertiary text-white' : 'bg-primary/10 text-primary'}`}>
                      {done ? <span className="material-symbols-outlined text-base">check</span> : step}
                    </div>
                    <span className={`material-symbols-outlined ${done ? 'text-tertiary' : 'text-primary'}`}>{icon}</span>
                  </div>
                </div>
                <div>
                  <p className={`font-bold text-sm ${done ? 'line-through text-secondary' : 'text-on-surface'}`}>{label}</p>
                  <p className="text-secondary text-xs mt-0.5">{desc}</p>
                </div>
                {!done && (
                  <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform mt-auto">
                    {cta} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Analytics range selector */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h2 className="text-xl font-[var(--font-headline)] font-extrabold tracking-tight text-on-surface mb-0.5">Performance Overview</h2>
          <p className="text-secondary text-sm font-medium">Growing your restaurant with data-driven insights.</p>
        </div>
        <div className="flex items-center gap-3">
          {plan === "free" ? (
            <div className="flex items-center gap-2 bg-surface-container-lowest border border-surface-container rounded-xl px-4 py-2.5 shadow-sm">
              <span className="material-symbols-outlined text-primary text-sm">calendar_month</span>
              <span className="text-sm font-semibold">Last 7 Days</span>
              <Link href="/pricing" className="ml-1 text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[11px]">lock</span>Upgrade
              </Link>
            </div>
          ) : (
            <div className="flex gap-1 bg-surface-container-lowest border border-surface-container rounded-xl p-1 shadow-sm">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${days === d ? "bg-primary text-white shadow-sm" : "text-secondary hover:text-on-surface"}`}
                >
                  {d === 7 ? "7 Days" : d === 30 ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={downloadReport}
            disabled={!data}
            className="bg-primary-container hover:opacity-90 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary-container/20"
          >
            <span className="material-symbols-outlined text-sm">download</span> Report
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Revenue", value: formatPrice(kpis.revenue, currency), color: "tertiary", icon: "payments" },
          { label: "Total Orders", value: kpis.orders.toLocaleString(), color: "tertiary", icon: "receipt_long" },
          { label: "Menu Views", value: kpis.views.toLocaleString(), color: "primary", icon: "visibility" },
          { label: "Conversion Rate", value: `${kpis.conversionRate.toFixed(1)}%`, color: "tertiary", icon: "conversion_path" },
        ].map((kpi, i) => (
          <div key={i} className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container/50">
            <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <span className={`material-symbols-outlined text-${kpi.color} text-sm icon-fill`}>{kpi.icon}</span>
              {kpi.label}
            </p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-extrabold">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AI Revenue Insight */}
        <div className="lg:col-span-8 bg-primary-container p-8 rounded-3xl shadow-xl shadow-primary-container/10 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="z-10 bg-white/20 backdrop-blur-md p-5 rounded-2xl">
              <span className={`material-symbols-outlined text-white text-4xl icon-fill`}>auto_awesome</span>
          </div>
          <div className="z-10 text-white flex-1">
            <h3 className="text-xl font-[var(--font-headline)] font-bold mb-2">AI Revenue Insight</h3>
            <p className="text-lg opacity-90 leading-snug">
              {topDishes.length > 0 ? (
                <>Your <span className="font-black underline decoration-2 underline-offset-4">{topDishes[0].name}</span> is your top performing item with {topDishes[0].count} interactions.</>
              ) : (
                <>Start getting orders to unlock AI-powered revenue insights for your menu.</>
              )}
            </p>
          </div>
          <Link href="/dashboard/analytics" className="z-10 bg-white text-primary-container px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 whitespace-nowrap">
            View Analytics
          </Link>
        </div>

        {/* Live Activity */}
        <div className="lg:col-span-4 bg-surface-container-lowest p-6 rounded-3xl border border-surface-container/50 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[var(--font-headline)] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary-container text-xl">chat</span> Live Activity
            </h3>
            <span className="flex h-2 w-2 rounded-full bg-tertiary-container animate-pulse"></span>
          </div>
          <div className="space-y-4 flex-1">
            {recentEvents.length === 0 ? (
              <p className="text-secondary text-sm text-center py-4">No recent activity.</p>
            ) : (
              recentEvents.map((a, i) => (
                <div key={i} className="flex gap-3 items-start p-3 hover:bg-surface-container-low rounded-2xl transition-colors">
                  <div className={`w-8 h-8 rounded-full ${a.type === "order_sent" ? "bg-tertiary-container/20 text-tertiary" : "bg-primary-container/20 text-primary"} flex items-center justify-center text-[10px] font-bold`}>
                    <span className="material-symbols-outlined text-sm">
                      {a.type === "order_sent" ? "shopping_cart" : a.type === "item_view" ? "visibility" : "person"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Someone {formatEventType(a.type)}</p>
                    <p className="text-[10px] text-secondary">{formatRelativeTime(a.time)}{a.item ? ` • ${a.item}` : ""}</p>
                  </div>
                  {a.amount && <span className="text-xs font-bold text-primary">{formatPrice(Number(a.amount), currency)}</span>}
                </div>
              ))
            )}
          </div>
          <Link href="/dashboard/analytics" className="mt-4 text-center text-xs font-bold text-primary hover:underline">View All Analytics</Link>
        </div>

        {/* Top Performing Dishes */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-[var(--font-headline)] font-bold">Top Performing Dishes</h3>
            <div className="flex gap-2">
              <button className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-lg">By Volume</button>
            </div>
          </div>
          <div className="space-y-6">
            {topDishes.length === 0 ? (
              <p className="text-secondary text-sm text-center py-8">No order data yet.</p>
            ) : (
              topDishes.map((dish, i) => (
                <div key={dish.name} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                    <span className="material-symbols-outlined text-xl">restaurant</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1.5">
                      <span className="font-bold text-sm">{dish.name}</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all" 
                        ref={(el) => {
                          if (el) {
                            el.style.width = `${Math.max(10, 85 - i * 20)}%`;
                            el.style.opacity = `${1 - i * 0.2}`;
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right pl-4">
                    <p className="font-bold text-sm">{dish.count}</p>
                    <p className="text-[10px] text-secondary">Interactions</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Peak Ordering Hours */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-[var(--font-headline)] font-bold">Peak Ordering Hours</h3>
              <p className="text-secondary text-xs">Prepare staffing for peak traffic</p>
            </div>
            {peakHour.count > 0 && (
              <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-[10px]">
                {peakHour.hour}:00 Peak
              </span>
            )}
          </div>
          <div className="h-48 w-full flex items-end justify-between gap-1 px-1">
            {peakHours.filter((h) => h.hour >= 8 && h.hour <= 23).map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className={`w-full rounded-t-lg transition-all min-h-[4px] ${h.count === peakHour.count && h.count > 0 ? "bg-primary-container" : "bg-surface-container-low hover:bg-primary/20"}`}
                  style={{ height: `${maxHourCount > 0 ? (h.count / maxHourCount) * 100 : 0}%` }}
                >
                  {h.count === peakHour.count && h.count > 0 && (
                    <div className="relative -top-7 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[9px] py-1 px-2 rounded font-bold shadow-sm whitespace-nowrap w-fit mx-auto">
                      Busy
                    </div>
                  )}
                </div>
                <span className={`text-[8px] font-bold ${h.count === peakHour.count && h.count > 0 ? "text-primary font-black" : "text-secondary"}`}>{h.hour}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 flex flex-col md:flex-row justify-between items-center text-secondary text-xs border-t border-surface-container pt-8 gap-4">
        <p>© 2026 MENUZA AI. {lastSynced ? `Last synced: ${formatRelativeTime(lastSynced.toISOString())}` : "Not yet synced."}</p>
        <div className="flex gap-8">
          <Link className="hover:text-primary transition-colors font-medium" href="/dashboard/analytics">Analytics</Link>
          <Link className="hover:text-primary transition-colors font-medium" href="/dashboard/settings">Settings</Link>
        </div>
      </footer>
    </div>
  );
}
