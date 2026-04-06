"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useMenu } from "@/context/MenuContext";
import { formatTimeOnly } from "@/lib/utils";
import { toast } from "sonner";
import type { CartItem } from "@/types/menu";
import { SkeletonCard } from "@/components/Skeleton";

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

export default function OrdersPage() {
  const { restaurantId } = useMenu();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data as OrderRow[]);
      }
      setLoading(false);
    };

    fetchOrders();

    // Subscribe to new orders
    const subscription = supabase
      .channel("public:orders")
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
            setOrders((prev) => [payload.new as OrderRow, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? (payload.new as OrderRow) : o))
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [restaurantId]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status.");
    } else {
      toast.success(`Order ${newStatus}.`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-primary/10 text-primary";
      case "confirmed": return "bg-tertiary/10 text-tertiary";
      case "cancelled": return "bg-error/10 text-error";
      default: return "bg-surface-container-highest text-secondary";
    }
  };

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12 h-full flex flex-col">
      <div className="mb-10">
        <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Orders</h1>
        <p className="text-secondary">Track and manage incoming orders</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-secondary">receipt_long</span>
          </div>
          <h2 className="text-xl font-[var(--font-headline)] font-bold mb-2">No orders yet</h2>
          <p className="text-secondary max-w-md">When customers place orders via your digital menu, they will appear here in real-time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
          {orders.map((order) => (
            <div key={order.id} className="bg-surface-container-lowest rounded-[2rem] p-6 border border-surface-container/50 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-[var(--font-headline)] font-bold text-lg">
                    {order.customer_name || "Guest"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-secondary mt-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {formatTimeOnly(order.created_at)}
                    {order.table_number && (
                      <>
                        <span>•</span>
                        <span className="font-bold">Table {order.table_number}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto mb-6 space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div className="flex gap-2">
                      <span className="font-bold text-primary">{item.quantity}x</span>
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-surface-container pt-4 mb-6 flex justify-between items-center">
                <span className="font-bold text-secondary text-sm uppercase tracking-widest">Total</span>
                <span className="font-[var(--font-headline)] font-extrabold text-2xl text-primary">${order.total.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                {order.status === "pending" && (
                  <>
                    <button 
                      onClick={() => updateOrderStatus(order.id, "cancelled")}
                      className="py-3 px-4 rounded-xl font-bold text-sm bg-error/10 text-error hover:bg-error/20 transition-colors"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={() => updateOrderStatus(order.id, "confirmed")}
                      className="py-3 px-4 rounded-xl font-bold text-sm bg-tertiary/10 text-tertiary hover:bg-tertiary/20 transition-colors"
                    >
                      Accept
                    </button>
                  </>
                )}
                {order.status !== "pending" && (
                  <button 
                    disabled
                    className="col-span-2 py-3 px-4 rounded-xl font-bold text-sm bg-surface-container-high text-secondary cursor-not-allowed"
                  >
                    {order.status === "confirmed" ? "Order Accepted" : "Order Declined"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}