"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useMenu } from "@/context/MenuContext";
import { formatPrice, formatRelativeTime, formatTimeOnly } from "@/lib/utils";
import { toast } from "sonner";
import type { CartItem } from "@/types/menu";
import { Skeleton } from "@/components/Skeleton";

interface OrderRow {
  id: string;
  customer_name: string | null;
  table_number: string | null;
  total: number;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
  items: CartItem[];
  whatsapp_sent: boolean;
}

type StatusFilter = "all" | "pending" | "confirmed" | "cancelled";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLE = {
  pending:   { badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-400",   icon: "pending" },
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
  const { restaurantId, menuStyle } = useMenu();
  const currency = menuStyle.currency ?? "RWF";

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [isLive, setIsLive] = useState(false);
  const [now, setNow] = useState(0);
  const initialLoadDone = useRef(false);

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
              audio.play().catch(() => {
                console.log("Audio playback blocked by browser. User must interact with the page first.");
              });

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
    // Optimistically update local state immediately
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status.");
      // Roll back
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
      const labels = { confirmed: "accepted", cancelled: "declined", pending: "restored" };
      toast.success(`Order ${labels[newStatus]}.`);
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
        {/* Live indicator */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${isLive ? "bg-tertiary/10 text-tertiary" : "bg-surface-container text-secondary"}`}>
          <span className={`w-2 h-2 rounded-full ${isLive ? "bg-tertiary animate-pulse" : "bg-secondary"}`} />
          {isLive ? "Live" : "Connecting…"}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
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
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-tertiary icon-fill text-lg">payments</span>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Revenue</p>
          </div>
          <p className="text-2xl font-extrabold leading-none">{formatPrice(todayRevenue, currency)}</p>
          <p className="text-[10px] text-secondary mt-0.5">today</p>
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
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 ${s.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {order.status}
                  </span>
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
                        onClick={() => updateStatus(order.id, "confirmed")}
                        className="py-3 px-4 rounded-xl font-bold text-sm bg-tertiary/10 text-tertiary hover:bg-tertiary/20 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        Accept
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
                        Accepted
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
    </div>
  );
}
