"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  created_at: string;
  customer_name: string | null;
  table_number: string | null;
  source: string | null;
}

interface Props {
  restaurantId: string;
}

export default function OrderHistory({ restaurantId }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    const stored = localStorage.getItem("menuza_order_history");
    if (!stored) { setLoading(false); return; }
    try {
      const parsed = JSON.parse(stored) as { id: string; restaurantId: string }[];
      const ids = parsed.filter((e) => e.restaurantId === restaurantId).map((e) => e.id);
      if (ids.length === 0) { setLoading(false); return; }
      const res = await fetch("/api/orders/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data.orders ?? []);
    } catch {
      setError("Failed to load order history.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o));
    } catch {
      setError("Failed to cancel order. Please contact the restaurant.");
    } finally {
      setCancellingId(null);
    }
  };

  const statusLabel: Record<string, { label: string; color: string; icon: string }> = {
    pending_payment: { label: "Awaiting Payment", color: "text-amber-600", icon: "hourglass_bottom" },
    pending: { label: "Pending", color: "text-blue-600", icon: "pending" },
    preparing: { label: "Preparing", color: "text-purple-600", icon: "cooking" },
    confirmed: { label: "Ready", color: "text-emerald-600", icon: "check_circle" },
    cancelled: { label: "Cancelled", color: "text-secondary", icon: "cancel" },
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => window.history.back()} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-[var(--font-headline)] font-extrabold text-xl">Order History</h1>
        </div>

        {error && (
          <div className="bg-error/10 text-error text-sm rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
            <button
              type="button"
              onClick={loadOrders}
              className="text-xs font-bold underline underline-offset-2 hover:text-on-surface transition-colors"
            >
              Tap to retry
            </button>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <span className="material-symbols-outlined text-[64px] text-surface-container-highest">receipt_long</span>
            <p className="font-bold text-secondary">No orders yet</p>
            <p className="text-sm text-secondary">Your order history will appear here after you place an order.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const meta = statusLabel[order.status] ?? statusLabel.pending;
              const cancelling = order.status === "pending_payment" || order.status === "pending";
              const isItemArray = Array.isArray(order.items);
              return (
                <div key={order.id} className="bg-surface-container-lowest rounded-2xl border border-surface-container/50 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[18px] ${meta.color}`}>{meta.icon}</span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                    </div>
                    <span className="text-[10px] text-secondary">{new Date(order.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  {isItemArray && (
                    <div className="space-y-1">
                      {order.items.slice(0, 5).map((item: { id: string; name: string; price: number; quantity: number }) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-on-surface">{item.name} <span className="text-secondary">×{item.quantity}</span></span>
                          <span className="font-bold">{formatPrice(item.price * item.quantity, "RWF")}</span>
                        </div>
                      ))}
                      {order.items.length > 5 && (
                        <p className="text-xs text-secondary">+{order.items.length - 5} more items</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-surface-container">
                    <span className="font-extrabold text-base">Total</span>
                    <span className="font-extrabold text-primary">{formatPrice(order.total ?? 0, "RWF")}</span>
                  </div>

                  {cancelling && (
                    <button
                      type="button"
                      onClick={() => handleCancel(order.id)}
                      disabled={cancellingId === order.id}
                      className="w-full py-2.5 rounded-xl text-sm font-bold border border-error/30 text-error bg-transparent hover:bg-error/5 transition-all disabled:opacity-40"
                    >
                      {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
