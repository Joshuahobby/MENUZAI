"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useMenu } from "@/context/MenuContext";
import { formatPrice, formatRelativeTime, formatTimeOnly } from "@/lib/utils";
import { toast } from "sonner";
import type { CartItem } from "@/types/menu";
import { Skeleton } from "@/components/Skeleton";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface OrderRow {
  id: string;
  customer_name: string | null;
  table_number: string | null;
  total: number;
  status: "pending" | "confirmed" | "preparing" | "cancelled";
  created_at: string;
  items: CartItem[];
  whatsapp_sent: boolean;
}

type StatusFilter = "all" | "pending" | "preparing" | "confirmed" | "cancelled";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "confirmed", label: "Ready" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLE = {
  pending:   { badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-400",   icon: "pending" },
  preparing: { badge: "bg-blue-100 text-blue-700",     dot: "bg-blue-400",    icon: "skillet" },
  confirmed: { badge: "bg-tertiary/10 text-tertiary",  dot: "bg-tertiary",    icon: "check_circle" },
  cancelled: { badge: "bg-error/10 text-error",        dot: "bg-error",       icon: "cancel" },
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
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="flex justify-between pt-2 border-t border-surface-container">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { restaurantId, menuStyle, restaurantName } = useMenu();
  const currency = menuStyle.currency ?? "RWF";

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [isLive, setIsLive] = useState(false);
  const [now, setNow] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<OrderRow | null>(null);
  const initialLoadDone = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (printingOrder) {
      const timer = setTimeout(() => {
        window.print();
        setPrintingOrder(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [printingOrder]);

  // Initialize 'now' and update periodically to refresh 'new' badges
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

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) {
      if (loading) {
        setTimeout(() => setLoading(false), 0);
      }
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

    // ── Realtime ───────────────────────────────────────────
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");

    const channel = supabase
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
            // Don't fire toast on first load
            if (initialLoadDone.current) {
              // Play notification sound
              if (soundEnabledRef.current) {
                audio.play().catch(() => {
                  console.log("Audio playback blocked by browser. User must interact with the page first.");
                });
              }

              toast("New order received!", {
                description: newOrder.customer_name
                  ? `From ${newOrder.customer_name}${newOrder.table_number ? ` · Table ${newOrder.table_number}` : ""}`
                  : "A customer just placed an order",
                icon: "🔔",
                duration: 6000,
              });
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

    return () => {
      supabase.removeChannel(channel);
      setIsLive(false);
    };
  }, [restaurantId, loading]);

  // ── Status update (optimistic) ─────────────────────────
  const updateStatus = async (orderId: string, newStatus: OrderRow["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status.");
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? (data as OrderRow) : o))
        );
      }
    } else {
      const labels = { confirmed: "ready", cancelled: "declined", pending: "restored", preparing: "preparing" };
      toast.success(`Order ${labels[newStatus]}.`);

      if (newStatus === "preparing") {
        const orderToPrint = orders.find(o => o.id === orderId);
        if (orderToPrint) {
          setPrintingOrder({ ...orderToPrint, status: "preparing" });
        }
      }
    }
  };

  // ── Confirm order — calls API to also decrement stock ──
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

      if (!res.ok) {
        throw new Error("API error");
      }
      toast.success("Order ready.");
    } catch {
      toast.error("Failed to confirm order.");
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? (data as OrderRow) : o))
        );
      }
    }
  };

  // ── Derived stats ──────────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter(
    (o) => new Date(o.created_at) >= todayStart
  );
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const todayRevenue = todayOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);

  // Sparkline data (hourly revenue for today)
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

  // ── Filter ─────────────────────────────────────────────
  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Orders</h1>
          <p className="text-secondary">Real-time view of incoming customer orders</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
              soundEnabled ? "bg-surface-container-high text-on-surface" : "bg-surface-container text-secondary"
            }`}
            title={soundEnabled ? "Mute notifications" : "Enable notifications"}
          >
            <span className="material-symbols-outlined text-lg">
              {soundEnabled ? "volume_up" : "volume_off"}
            </span>
          </button>
          
          {/* Live indicator */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${isLive ? "bg-tertiary/10 text-tertiary" : "bg-surface-container text-secondary"}`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-tertiary animate-pulse" : "bg-secondary"}`} />
            {isLive ? "Live" : "Connecting…"}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary icon-fill text-lg">today</span>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Today</p>
          </div>
          <p className="text-2xl font-extrabold">{todayOrders.length}</p>
          <p className="text-[10px] text-secondary mt-0.5">orders</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-amber-500 icon-fill text-lg">pending</span>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Pending</p>
          </div>
          <p className="text-2xl font-extrabold">{pendingCount}</p>
          <p className="text-[10px] text-secondary mt-0.5">need action</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary icon-fill text-lg">payments</span>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Revenue</p>
            </div>
            <p className="text-2xl font-extrabold leading-none">{formatPrice(todayRevenue, currency)}</p>
            <p className="text-[10px] text-secondary mt-0.5">today</p>
          </div>
          {todayRevenue > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-16 opacity-30 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-tertiary)" fill="var(--color-tertiary)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === "all"
              ? orders.length
              : orders.filter((o) => o.status === tab.value).length;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                filter === tab.value
                  ? "bg-primary/10 text-primary"
                  : "text-secondary hover:bg-surface-container-low"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  filter === tab.value ? "bg-primary/20" : "bg-surface-container-high"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonOrder key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24">
          <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-secondary">receipt_long</span>
          </div>
          <h2 className="text-xl font-[var(--font-headline)] font-bold mb-2">
            {filter === "all" ? "No orders yet" : `No ${filter} orders`}
          </h2>
          <p className="text-secondary text-sm max-w-sm">
            {filter === "all"
              ? "When customers place orders via your digital menu, they will appear here in real-time."
              : `Orders with status "${filter}" will appear here.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
          {filtered.map((order) => {
            const s = STATUS_STYLE[order.status];
            const isNew =
              now - new Date(order.created_at).getTime() < 60_000;

            return (
              <div
                key={order.id}
                className={`bg-surface-container-lowest rounded-[2rem] p-6 border shadow-sm flex flex-col transition-all ${
                  order.status === "pending" && isNew
                    ? "border-primary/40 shadow-primary/5"
                    : "border-surface-container/50"
                }`}
              >
                {/* Card header */}
                <div className="flex justify-between items-start mb-4 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-[var(--font-headline)] font-bold text-lg leading-tight">
                        {order.customer_name || "Guest"}
                      </h3>
                      {isNew && order.status === "pending" && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-primary text-white px-2 py-0.5 rounded-full">New</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-secondary mt-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>{formatTimeOnly(order.created_at)}</span>
                      <span className="text-outline-variant">·</span>
                      <span>{formatRelativeTime(order.created_at)}</span>
                      {order.table_number && (
                        <>
                          <span className="text-outline-variant">·</span>
                          <span className="font-bold text-on-surface">Table {order.table_number}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 ${s.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {order.status}
                    </span>
                    {order.status !== "pending" && (
                      <button
                        type="button"
                        onClick={() => setPrintingOrder(order)}
                        className="text-secondary hover:text-primary transition-colors p-1 flex items-center gap-1 opacity-60 hover:opacity-100"
                        title="Print Receipt"
                      >
                        <span className="material-symbols-outlined text-[16px]">print</span>
                        <span className="text-[10px] font-bold uppercase">Print</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="flex-1 space-y-2.5 mb-5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-baseline text-sm">
                      <div className="flex gap-2 min-w-0">
                        <span className="font-extrabold text-primary shrink-0">{item.quantity}×</span>
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="font-medium text-secondary shrink-0 ml-4">
                        {formatPrice(item.price * item.quantity, currency)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-surface-container pt-4 mb-5 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Total</span>
                  <span className="font-[var(--font-headline)] font-extrabold text-xl text-primary">
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
                        className="py-3 px-4 rounded-xl font-bold text-sm bg-error/10 text-error hover:bg-error/20 transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(order.id, "preparing")}
                        className="py-3 px-4 rounded-xl font-bold text-sm bg-tertiary/10 text-tertiary hover:bg-tertiary/20 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">skillet</span>
                        Prepare
                      </button>
                    </>
                  )}
                  {order.status === "preparing" && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStatus(order.id, "cancelled")}
                        className="py-3 px-4 rounded-xl font-bold text-sm bg-surface-container-high text-secondary hover:bg-error/10 hover:text-error transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmOrder(order.id)}
                        className="py-3 px-4 rounded-xl font-bold text-sm bg-tertiary/10 text-tertiary hover:bg-tertiary/20 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        Done
                      </button>
                    </>
                  )}
                  {order.status === "confirmed" && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStatus(order.id, "cancelled")}
                        className="py-3 px-4 rounded-xl font-bold text-sm bg-surface-container-high text-secondary hover:bg-error/10 hover:text-error transition-colors"
                      >
                        Cancel
                      </button>
                      <div className="py-3 px-4 rounded-xl font-bold text-sm bg-tertiary/10 text-tertiary flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-sm icon-fill">check_circle</span>
                        Ready
                      </div>
                    </>
                  )}
                  {order.status === "cancelled" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(order.id, "pending")}
                      className="col-span-2 py-3 px-4 rounded-xl font-bold text-sm bg-surface-container-high text-secondary hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center gap-2"
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

      {/* Printable Receipt */}
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
