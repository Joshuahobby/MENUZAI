"use client";

import { useEffect, useState } from "react";
import { useMenu } from "@/context/MenuContext";
import { isPlatformAdmin } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Metrics {
  totalRestaurants: number;
  freeCount: number;
  trialCount: number;
  proCount: number;
  businessCount: number;
  mrrRwf: number;
  totalOrders: number;
  ordersToday: number;
  aiWaiterOrders: number;
  totalMenus: number;
  publishedMenus: number;
}

export default function AdminMetricsPage() {
  const { user, isLoading } = useMenu();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user?.email || !isPlatformAdmin(user.email)) {
      router.replace("/dashboard");
      return;
    }
    fetch("/api/admin/metrics")
      .then((r) => r.json())
      .then((d) => { setMetrics(d); setLoading(false); })
      .catch(() => { setError("Failed to load metrics."); setLoading(false); });
  }, [user, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">progress_activity</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-12 text-center text-error">{error}</div>;
  }

  if (!metrics) return null;

  const stat = (label: string, value: string | number, sub?: string, color = "text-on-surface") => (
    <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container/50">
      <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-extrabold font-[var(--font-headline)] ${color}`}>{value}</p>
      {sub && <p className="text-xs text-secondary mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Platform Metrics</h1>
        <p className="text-secondary text-sm">Live snapshot — admin only</p>
      </div>

      <section className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">Revenue</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stat("MRR (est.)", `${metrics.mrrRwf.toLocaleString()} RWF`, "Pro × 35K + Business × 89K", "text-primary")}
          {stat("Pro Restaurants", metrics.proCount, "paid plan")}
          {stat("Business", metrics.businessCount, "paid plan")}
          {stat("On Trial", metrics.trialCount, "14-day trial")}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">Restaurants</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stat("Total", metrics.totalRestaurants)}
          {stat("Free", metrics.freeCount)}
          {stat("Total Menus", metrics.totalMenus)}
          {stat("Published", metrics.publishedMenus, "live menus")}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">Orders</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {stat("Total Orders", metrics.totalOrders.toLocaleString())}
          {stat("Today", metrics.ordersToday, "since midnight UTC")}
          {stat("AI Waiter Orders", metrics.aiWaiterOrders, "via in-chat ordering", "text-violet-600")}
        </div>
      </section>
    </div>
  );
}
