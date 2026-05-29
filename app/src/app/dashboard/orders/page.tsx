"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useMenu } from "@/context/MenuContext";
import { formatPrice, formatRelativeTime, formatTimeOnly } from "@/lib/utils";
import { toast } from "sonner";
import type { CartItem } from "@/types/menu";
import { Skeleton } from "@/components/Skeleton";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0))).buffer;
}

interface OrderRow {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  table_number: string | null;
  total: number;
  status: "pending" | "confirmed" | "preparing" | "cancelled";
  created_at: string;
  items: CartItem[];
  whatsapp_sent: boolean;
  source?: string | null;
}

interface TableRequest {
  id: string;
  tableNumber: string;
  type: "call_waiter" | "bill" | "water" | "custom";
  message?: string;
  created_at: string;
  status: "pending" | "resolved";
}

type StatusFilter = "all" | "pending" | "preparing" | "confirmed" | "cancelled";
type SourceFilter = "all" | "ai_waiter" | "whatsapp";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "confirmed", label: "Ready" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLE = {
  pending:   { badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",   dot: "bg-amber-500",   icon: "pending" },
  preparing: { badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400",     dot: "bg-blue-500",    icon: "skillet" },
  confirmed: { badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",  dot: "bg-emerald-500",    icon: "check_circle" },
  cancelled: { badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400",        dot: "bg-rose-500",       icon: "cancel" },
};

function SkeletonOrder() {
  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-surface-container/50 space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-3 py-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="flex justify-between pt-2 border-t border-surface-container">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-7 w-24" />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { restaurantId, menuStyle, restaurantName, plan } = useMenu();
  const router = useRouter();
  const currency = menuStyle.currency ?? "RWF";

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tableRequests, setTableRequests] = useState<TableRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [now, setNow] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<OrderRow | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const initialLoadDone = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
      // Show in-page prompt if permission not yet decided, after a short delay
      if (Notification.permission === "default") {
        const t = setTimeout(() => setShowPermissionPrompt(true), 4000);
        return () => clearTimeout(t);
      }
    }
  }, []);

  const enableNotifications = async () => {
    if (!restaurantId || !("Notification" in window) || !("serviceWorker" in navigator)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission !== "granted") {
      toast.error("Notification permission denied.");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.success("Sound alerts are active. For push notifications, ask your admin to configure VAPID keys.");
        setShowPermissionPrompt(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });
      if (!res.ok) throw new Error("Subscribe API failed");
      toast.success("Push notifications enabled!");
      setShowPermissionPrompt(false);
    } catch (err) {
      console.error("Push subscription failed:", err);
      toast.error("Failed to enable push notifications.");
    }
  };

  useEffect(() => {
    if (printingOrder) {
      const timer = setTimeout(() => {
        window.print();
        setPrintingOrder(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [printingOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // ── Fetch & Realtime Subscriptions ─────────────────────────
  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) setOrders(data as OrderRow[]);
      setLoading(false);
      initialLoadDone.current = true;
    };

    fetchOrders();

    // Web Audio API chimes — no CDN dependency
    const playOrderChime = () => {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        [1047, 1319, 1568].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = freq; osc.type = "sine";
          const t = ctx.currentTime + i * 0.16;
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.start(t); osc.stop(t + 0.35);
        });
      } catch {}
    };
    const playRequestChime = () => {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        [0, 0.22].forEach(delay => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880; osc.type = "sine";
          const t = ctx.currentTime + delay;
          gain.gain.setValueAtTime(0.28, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
          osc.start(t); osc.stop(t + 0.28);
        });
      } catch {}
    };

    // Orders Realtime Channel
    const orderChannel = supabase
      .channel(`orders:${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as OrderRow;
            if (initialLoadDone.current) {
              if (soundEnabledRef.current) {
                playOrderChime();
              }
              setNewOrderFlash(true);
              setTimeout(() => setNewOrderFlash(false), 2000);
              toast("New order received!", {
                description: newOrder.customer_name
                  ? `From ${newOrder.customer_name}${newOrder.table_number ? ` · Table ${newOrder.table_number}` : ""}`
                  : "A customer just placed an order",
                icon: "🛎️",
                duration: 6000,
              });
              // First-order upgrade nudge for free/trial users
              if ((plan === "free" || plan === "trial") && restaurantId) {
                const nudgeKey = `first-order-nudge-${restaurantId}`;
                if (!localStorage.getItem(nudgeKey)) {
                  localStorage.setItem(nudgeKey, "1");
                  setTimeout(() => {
                    toast("Your first order just came in!", {
                      description: "Keep the momentum — upgrade to Pro to unlock AI Waiter and full analytics.",
                      duration: 12000,
                      action: {
                        label: "Upgrade to Pro",
                        onClick: () => router.push("/dashboard/settings"),
                      },
                    });
                  }, 3000);
                }
              }
            }
            setOrders((prev) => [newOrder, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? (payload.new as OrderRow) : o))
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    // Realtime Broadcast Assistance Channel
    const requestChannel = supabase
      .channel(`table_requests:${restaurantId}`)
      .on("broadcast", { event: "new_request" }, (payload) => {
        const newReq = payload.payload as TableRequest;
        
        if (soundEnabledRef.current) {
          playRequestChime();
        }

        toast(`Assistance Request: Table ${newReq.tableNumber}`, {
          description: newReq.type === "bill" 
            ? "Requested the bill 💵" 
            : newReq.type === "water" 
            ? "Requested water 🥛" 
            : newReq.message || "Requested waiter service 🛎️",
          icon: "🛎️",
          duration: 8000,
        });

        setTableRequests((prev) => [newReq, ...prev]);
      })
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        supabase.removeChannel(orderChannel);
        supabase.removeChannel(requestChannel);
        fetchOrders();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(requestChannel);
      setIsLive(false);
    };
  }, [restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (orderId: string, newStatus: OrderRow["status"]) => {
    const previousOrder = orders.find(o => o.id === orderId);
    const previousStatus = previousOrder?.status;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("updateStatus failed:", { orderId, newStatus, code: error.code, message: error.message, details: error.details });
      toast.error("Failed to update order status.", { description: error.message });
      fetchOrdersRefresh();
    } else {
      const labels: Record<OrderRow["status"], string> = { confirmed: "ready", cancelled: "declined", pending: "restored", preparing: "preparing" };
      toast.success(`Order ${labels[newStatus]}.`, {
        duration: 4000,
        action: previousStatus ? {
          label: "Undo",
          onClick: async () => {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: previousStatus } : o));
            await supabase.from("orders").update({ status: previousStatus }).eq("id", orderId);
          },
        } : undefined,
      });
    }
  };

  const fetchOrdersRefresh = async () => {
    if (!restaurantId) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    if (data) setOrders(data as OrderRow[]);
  };

  const confirmOrder = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "confirmed" } : o))
    );

    try {
      const res = await fetch("/api/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, restaurantId }),
      });

      if (!res.ok) throw new Error("API error");
      toast.success("Order is ready!");
    } catch {
      toast.error("Failed to confirm order.");
      fetchOrdersRefresh();
    }
  };

  const handleResolveRequest = (id: string) => {
    setTableRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success("Table request marked as resolved.");
  };

  const getWaitMinutes = (createdAt: string) =>
    Math.floor((now - new Date(createdAt).getTime()) / 60_000);

  const urgencyClass = (order: OrderRow) => {
    if (order.status !== "pending" && order.status !== "preparing") return null;
    const m = getWaitMinutes(order.created_at);
    if (m >= 15) return { chip: "bg-red-500/10 text-red-600", label: `${m}m ⚠️` };
    if (m >= 5) return { chip: "bg-amber-500/10 text-amber-600", label: `${m}m` };
    return null;
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter((o) => new Date(o.created_at) >= todayStart);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  // Browser tab badge shows pending count
  useEffect(() => {
    const base = "Staff Panel — MENUZA AI";
    document.title = pendingCount > 0 ? `(${pendingCount}) ${base}` : base;
    return () => { document.title = "MENUZA AI"; };
  }, [pendingCount]);
  const todayRevenue = todayOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  const hourlyData = Array.from({ length: 24 }).map((_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    revenue: 0,
  }));
  
  todayOrders.forEach(o => {
    if (o.status !== "cancelled") {
      const h = new Date(o.created_at).getHours();
      hourlyData[h].revenue += o.total;
    }
  });

  const aiWaiterOrderCount = orders.filter((o) => o.source === "ai_waiter").length;

  const filtered = orders.filter((o) => {
    const matchesStatus = filter === "all" || o.status === filter;
    if (!matchesStatus) return false;
    const matchesSource = sourceFilter === "all" || o.source === sourceFilter || (sourceFilter === "whatsapp" && (!o.source || o.source === "whatsapp"));
    if (!matchesSource) return false;
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      (o.customer_name ?? "").toLowerCase().includes(q) ||
      (o.table_number ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12 max-w-7xl mx-auto">
      {/* Permission prompt banner */}
      {showPermissionPrompt && notifPermission === "default" && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[22px]">notifications</span>
            <div>
              <p className="font-bold text-sm text-on-surface">Enable push notifications</p>
              <p className="text-xs text-secondary">Get alerts even when this tab isn&apos;t focused — never miss an order.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={enableNotifications}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors">
              Enable
            </button>
            <button type="button" onClick={() => setShowPermissionPrompt(false)}
              className="p-2 text-secondary hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">
            Real-Time Staff Panel
          </h1>
          <p className="text-secondary text-sm">Monitor live customer orders and instant table service notifications</p>
        </div>
        
        <div className="flex items-center gap-3">
          {notifPermission !== null && notifPermission !== "granted" && (
            <button
              type="button"
              onClick={enableNotifications}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
              title="Enable push notifications for new orders"
            >
              <span className="material-symbols-outlined text-sm">notifications</span>
              <span className="hidden sm:inline">Enable Alerts</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer ${
              soundEnabled ? "bg-primary/10 text-primary" : "bg-surface-container text-secondary"
            }`}
            title={soundEnabled ? "Mute sound" : "Enable sound"}
          >
            <span className="material-symbols-outlined text-lg">
              {soundEnabled ? "volume_up" : "volume_off"}
            </span>
          </button>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${isLive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-surface-container text-secondary"}`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-secondary"}`} />
            {isLive ? "Live Sync Active" : "Connecting..."}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface-container-lowest rounded-3xl p-5 border border-surface-container/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary icon-fill text-lg">today</span>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Today&apos;s Orders</p>
          </div>
          <p className="text-2xl font-extrabold">{todayOrders.length}</p>
          <p className="text-[10px] text-secondary mt-0.5">orders processed today</p>
        </div>
        <div className={`rounded-3xl p-5 border transition-all duration-300 ${newOrderFlash ? "bg-amber-50 border-amber-400 scale-[1.02] shadow-lg shadow-amber-200/50 dark:bg-amber-950/30 dark:border-amber-500" : "bg-surface-container-lowest border-surface-container/50"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`material-symbols-outlined text-amber-500 icon-fill text-lg ${newOrderFlash ? "animate-bounce" : ""}`}>pending</span>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Pending Action</p>
          </div>
          <p className="text-2xl font-extrabold text-amber-500">{pendingCount}</p>
          <p className="text-[10px] text-secondary mt-0.5">require immediate attention</p>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl p-5 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-violet-500 icon-fill text-lg">robot_2</span>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">AI Waiter Orders</p>
          </div>
          <p className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">{aiWaiterOrderCount}</p>
          <p className="text-[10px] text-secondary mt-0.5">
            {todayOrders.filter((o) => o.source === "ai_waiter").length > 0
              ? `${todayOrders.filter((o) => o.source === "ai_waiter").length} today`
              : "placed via chat"}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl p-5 border border-surface-container/50 relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-emerald-500 icon-fill text-lg">payments</span>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Today&apos;s Revenue</p>
            </div>
            <p className="text-2xl font-extrabold leading-none text-emerald-600 dark:text-emerald-400">{formatPrice(todayRevenue, currency)}</p>
            <p className="text-[10px] text-secondary mt-0.5">excluding cancelled orders</p>
          </div>
          {todayRevenue > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-16 opacity-20 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Orders (Left) vs Table Pager (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Orders list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4 border-b border-surface-container pb-4">
            <div className="flex items-center justify-between">
              <h2 className="font-[var(--font-headline)] font-bold text-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Orders List
              </h2>
              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[16px]">search</span>
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by name, table…"
                  className="bg-surface-container rounded-xl pl-8 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 w-44 sm:w-56 transition-all"
                />
              </div>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_TABS.map((tab) => {
                const count = tab.value === "all" ? orders.length : orders.filter((o) => o.status === tab.value).length;
                const isSelected = filter === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFilter(tab.value)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected ? "bg-primary text-white" : "bg-surface-container hover:bg-surface-container-high text-secondary"
                    }`}
                  >
                    {tab.label.split(" ")[0]}
                    {count > 0 && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-surface-container-high text-secondary"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Source filter — AI Waiter vs WhatsApp */}
            {aiWaiterOrderCount > 0 && (
              <div className="flex gap-1.5 flex-wrap items-center">
                <span className="text-[9px] font-bold text-secondary uppercase tracking-[0.15em] mr-1">Source:</span>
                {([
                  { value: "all" as SourceFilter, label: "All" },
                  { value: "ai_waiter" as SourceFilter, label: "🤖 AI Waiter" },
                  { value: "whatsapp" as SourceFilter, label: "💬 WhatsApp" },
                ]).map((s) => {
                  const isSelected = sourceFilter === s.value;
                  const cnt = s.value === "all" ? orders.length : s.value === "ai_waiter" ? aiWaiterOrderCount : orders.length - aiWaiterOrderCount;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSourceFilter(s.value)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-surface-container hover:bg-surface-container-high text-secondary"
                      }`}
                    >
                      {s.label}
                      {cnt > 0 && <span className={`text-[8px] px-1 py-0.5 rounded-full ${isSelected ? "bg-primary/20" : "bg-surface-container-high"}`}>{cnt}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonOrder key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-surface-container-lowest rounded-3xl border border-surface-container/50">
              <div className="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center mb-4 text-secondary">
                <span className="material-symbols-outlined text-3xl">receipt_long</span>
              </div>
              <h3 className="text-lg font-bold mb-1">No orders found</h3>
              <p className="text-secondary text-xs max-w-xs">
                {filter === "all" ? "Incoming customer orders will appear here automatically." : `There are currently no "${filter}" orders.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-max">
              {filtered.map((order) => {
                const s = STATUS_STYLE[order.status];
                const isNew = now - new Date(order.created_at).getTime() < 60_000;

                return (
                  <div
                    key={order.id}
                    className={`bg-surface-container-lowest rounded-[2rem] p-6 border shadow-sm flex flex-col transition-all ${
                      order.status === "pending" && isNew
                        ? "border-primary ring-2 ring-primary/10 shadow-md"
                        : "border-surface-container/50 hover:shadow-md"
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {order.table_number && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-xl bg-primary/10 text-primary shrink-0">
                              <span className="material-symbols-outlined text-[12px]">table_restaurant</span>
                              Table {order.table_number}
                            </span>
                          )}
                          {order.source === "ai_waiter" && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
                              <span className="material-symbols-outlined text-[11px]">robot_2</span>
                              AI Waiter
                            </span>
                          )}
                          <h3 className="font-[var(--font-headline)] font-bold text-base leading-tight truncate">
                            {order.customer_name || "Guest"}
                          </h3>
                          {isNew && order.status === "pending" && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-primary text-white px-2 py-0.5 rounded-full shrink-0">NEW</span>
                          )}
                          {(() => { const u = urgencyClass(order); return u ? (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${u.chip}`}>{u.label}</span>
                          ) : null; })()}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-secondary">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          <span>{formatTimeOnly(order.created_at)}</span>
                          <span className="text-outline-variant">·</span>
                          <span>{formatRelativeTime(order.created_at)}</span>
                          {order.customer_email && (
                            <>
                              <span className="text-outline-variant">·</span>
                              <span className="truncate max-w-[120px]">{order.customer_email}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${s.badge}`}>
                          <span className={`w-1 h-1 rounded-full ${s.dot}`} />
                          {order.status}
                        </span>
                        {order.status !== "pending" && (
                          <button
                            type="button"
                            onClick={() => setPrintingOrder(order)}
                            className="text-secondary hover:text-primary transition-colors p-1 flex items-center gap-1 opacity-70 hover:opacity-100 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">print</span>
                            <span className="text-[9px] font-bold uppercase">Print</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="flex-1 space-y-2 mb-5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-baseline text-xs">
                          <div className="flex gap-2 min-w-0">
                            <span className="font-extrabold text-primary shrink-0">{item.quantity}×</span>
                            <span className="truncate text-on-surface-variant">{item.name}</span>
                          </div>
                          <span className="font-semibold text-secondary shrink-0 ml-4">
                            {formatPrice(item.price * item.quantity, currency)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="border-t border-surface-container pt-4 mb-5 flex justify-between items-center">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em]">Total Amount</span>
                      <span className="font-[var(--font-headline)] font-extrabold text-lg text-primary">
                        {formatPrice(order.total, currency)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      {order.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateStatus(order.id, "cancelled")}
                            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-error/10 text-error hover:bg-error/20 transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(order.id, "preparing")}
                            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-primary text-white shadow-md shadow-primary/10 hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">skillet</span>
                            Accept
                          </button>
                        </>
                      )}
                      {order.status === "preparing" && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateStatus(order.id, "cancelled")}
                            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-surface-container text-secondary hover:bg-error/10 hover:text-error transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmOrder(order.id)}
                            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/10 hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">check</span>
                            Mark Ready
                          </button>
                        </>
                      )}
                      {order.status === "confirmed" && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateStatus(order.id, "cancelled")}
                            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-surface-container text-secondary hover:bg-error/10 hover:text-error transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <div className="py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                            <span className="material-symbols-outlined text-sm icon-fill">check_circle</span>
                            Served
                          </div>
                        </>
                      )}
                      {order.status === "cancelled" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order.id, "pending")}
                          className="col-span-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-surface-container hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">undo</span>
                          Restore to Pending
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Real-Time Table service pager */}
        <div className="space-y-6">
          <div className="border-b border-surface-container pb-4">
            <h2 className="font-[var(--font-headline)] font-bold text-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-primary icon-fill">notifications_active</span>
              Table Pager
            </h2>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-surface-container/50 shadow-sm space-y-6">
            <div>
              <h3 className="font-[var(--font-headline)] font-bold text-sm">Live Service Calls</h3>
              <p className="text-secondary text-[11px] mt-0.5">Real-time waiter calls from customers browsing the QR menus</p>
            </div>

            {tableRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12 bg-surface-container-low/50 rounded-2xl border border-dashed border-outline-variant/20">
                <div className="w-12 h-12 bg-surface-container-lowest rounded-xl flex items-center justify-center mb-3 text-secondary shadow-sm">
                  <span className="material-symbols-outlined text-xl">concierge</span>
                </div>
                <p className="font-bold text-xs">No pending table requests</p>
                <p className="text-secondary text-[10px] max-w-[180px] mt-0.5">Incoming requests from QR menu customers will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {tableRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col justify-between gap-3 relative overflow-hidden transition-all hover:bg-surface-container"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {req.tableNumber}
                        </div>
                        <div>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            req.type === "bill" 
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                              : req.type === "water" 
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                              : "bg-primary/10 text-primary"
                          }`}>
                            {req.type === "bill" ? "Bill 💵" : req.type === "water" ? "Water 🥛" : "Waiter 🛎️"}
                          </span>
                          <p className="text-[10px] text-secondary mt-1">{formatTimeOnly(req.created_at)}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleResolveRequest(req.id)}
                        className="text-secondary hover:text-emerald-500 p-1 transition-colors cursor-pointer shrink-0"
                        title="Mark as Resolved"
                      >
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </button>
                    </div>

                    {req.message && (
                      <p className="text-xs font-semibold leading-relaxed text-on-surface bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/5">
                        &quot;{req.message}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 text-[10px] text-secondary flex items-start gap-2.5 leading-relaxed">
              <span className="material-symbols-outlined text-primary text-sm shrink-0">help_outline</span>
              <span>Customers tap a bell icon on their phone to trigger these alerts. They emit immediate chimes and toast highlights for staff.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Receipt Block */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible;
            }
            #printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              padding: 0;
              margin: 0;
            }
          }
        `
      }} />
      <div id="printable-receipt" className="hidden print:block bg-white text-black p-4 z-[9999]">
        {printingOrder && (
          <div className="font-mono text-sm">
            <div className="text-center mb-4">
              <h2 className="font-bold text-xl uppercase mb-1">{restaurantName || "MENUZA AI"}</h2>
              <p className="text-xs">Receipt / Kitchen Ticket</p>
            </div>
            
            <div className="border-t border-b border-black border-dashed py-2 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(printingOrder.created_at).toLocaleDateString()} {formatTimeOnly(printingOrder.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span>{printingOrder.id.split("-")[0]}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{printingOrder.customer_name || "Guest"}</span>
              </div>
              {printingOrder.table_number && (
                <div className="flex justify-between font-bold text-sm mt-1">
                  <span>Table:</span>
                  <span>{printingOrder.table_number}</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left pb-1">Qty</th>
                    <th className="text-left pb-1">Item</th>
                    <th className="text-right pb-1">Amt</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {printingOrder.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-300 border-dotted last:border-0">
                      <td className="py-2 pr-2 font-bold">{item.quantity}</td>
                      <td className="py-2 pr-2">{item.name}</td>
                      <td className="py-2 text-right whitespace-nowrap">{formatPrice(item.price * item.quantity, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-black pt-2 mb-6">
              <div className="flex justify-between font-bold text-base">
                <span>TOTAL</span>
                <span>{formatPrice(printingOrder.total, currency)}</span>
              </div>
            </div>
            
            <div className="text-center text-xs pb-8">
              <p>Powered by MENUZA AI</p>
              <p>www.menuza.ai</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
