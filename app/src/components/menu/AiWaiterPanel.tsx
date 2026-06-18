"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { buildWhatsAppMessage, buildWhatsAppURL } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import type { MenuItem, MenuStyle, CartItem } from "@/types/menu";

type ChatOrder = { items: CartItem[]; tableNumber: string; total: number };

interface AiWaiterPanelProps {
  restaurantId: string;
  menuId: string;
  restaurantName: string;
  restaurantPhone: string;
  currency: string;
  menuStyle: MenuStyle;
  items: MenuItem[];
  resolvedTableNumber: string;
  customerName: string;
  aiWaiterEnabled: boolean;
  onTableNumberChange: (val: string) => void;
  onOrderPlaced: (orderId: string | null, items: CartItem[], total: number) => void;
}

export default function AiWaiterPanel({
  restaurantId,
  menuId,
  restaurantName,
  restaurantPhone,
  currency,
  menuStyle,
  items,
  resolvedTableNumber,
  customerName,
  aiWaiterEnabled,
  onTableNumberChange,
  onOrderPlaced,
}: AiWaiterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: `Hello! I'm your digital server for ${restaurantName}. Anything I can help you find on our menu today? ✨` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRetryCount = useRef(0);
  const chatRetryMessages = useRef<typeof messages>([]);
  const chatRetryInput = useRef("");
  const [pendingOrder, setPendingOrder] = useState<ChatOrder | null>(null);
  const [isPlacingChatOrder, setIsPlacingChatOrder] = useState(false);
  const proactiveGreetingFired = useRef(false);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync table number from AI Waiter back to the UI state
  useEffect(() => {
    if (pendingOrder?.tableNumber) {
      onTableNumberChange(pendingOrder.tableNumber);
    }
  }, [pendingOrder?.tableNumber, onTableNumberChange]);

  // Proactive greeting: auto-open after 3s
  useEffect(() => {
    if (!aiWaiterEnabled || proactiveGreetingFired.current) return;
    const timer = setTimeout(() => {
      if (proactiveGreetingFired.current) return;
      proactiveGreetingFired.current = true;
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
      const greetingMap: Record<string, string> = {
        morning: `Good morning! ☀️ Ready to start your day deliciously? I'm your AI waiter for ${restaurantName}. Tell me what you're in the mood for and I'll guide you straight to the best dish.`,
        afternoon: `Good afternoon! 🌟 Welcome to ${restaurantName}. I'm your AI waiter — tap anything on the menu to add it to your order, or just ask me what to try and I'll recommend something great.`,
        evening: `Good evening! 🌙 Welcome to ${restaurantName}. I'm your AI waiter. Tonight's a great night to treat yourself — want me to suggest our most popular dishes?`,
      };
      setMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content: greetingMap[timeOfDay] },
      ]);
      setIsOpen(true);
    }, 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiWaiterEnabled]);

  const parseOrder = (text: string): { cleanText: string; order: ChatOrder | null } => {
    const MARKER = "__ORDER__:";
    const idx = text.indexOf(MARKER);
    if (idx === -1) return { cleanText: text, order: null };
    const cleanText = text.slice(0, idx).trim();
    try {
      const json = JSON.parse(text.slice(idx + MARKER.length).trim()) as {
        items: { name: string; qty: number }[];
        table: string;
      };
      const orderItems: CartItem[] = [];
      for (const entry of json.items) {
        const found = items.find(
          m =>
            m.name.toLowerCase().includes(entry.name.toLowerCase()) ||
            entry.name.toLowerCase().includes(m.name.toLowerCase())
        );
        if (found) {
          const existing = orderItems.find(o => o.id === found.id);
          if (existing) {
            existing.quantity += entry.qty;
          } else {
            orderItems.push({ ...found, quantity: entry.qty });
          }
        }
      }
      if (orderItems.length === 0) return { cleanText, order: null };
      const total = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
      return { cleanText, order: { items: orderItems, tableNumber: json.table ?? "", total } };
    } catch {
      return { cleanText, order: null };
    }
  };

  const confirmChatOrder = async () => {
    if (!pendingOrder || isPlacingChatOrder) return;
    setIsPlacingChatOrder(true);
    const { items: orderItems, tableNumber: chatTable, total } = pendingOrder;
    const resolvedTable = chatTable || resolvedTableNumber || null;
    let orderId: string | null = null;
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        menu_id: menuId,
        restaurant_id: restaurantId,
        items: orderItems,
        total,
        customer_name: customerName.trim() || null,
        table_number: resolvedTable,
        whatsapp_sent: true,
        status: "pending",
        source: "ai_waiter",
      }).select("id").single();
      if (error || !order) throw error || new Error("No order returned");
      orderId = order.id;
    } catch {
      toast.error("Failed to place order. Please try again.");
      setIsPlacingChatOrder(false);
      return;
    }

    onOrderPlaced(orderId, orderItems, total);

    const msg = buildWhatsAppMessage(orderItems, customerName.trim() || undefined, resolvedTable || undefined, currency);
    const waUrl = buildWhatsAppURL(restaurantPhone, msg);
    window.open(waUrl, "_blank", "noopener,noreferrer");

    fetch("/api/notifications/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId, items: orderItems, total,
        currency,
        customerName: customerName.trim() || undefined,
        tableNumber: resolvedTable,
      }),
    }).catch((e) => console.error("Order notification failed:", e));

    setPendingOrder(null);
    setIsPlacingChatOrder(false);
    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        content: `✅ Order confirmed${resolvedTable ? ` for table ${resolvedTable}` : ""}! Your food is on its way to the kitchen. WhatsApp is opening to keep you in the loop. Enjoy your meal! 🍽️`,
      },
    ]);
  };

  const rejectChatOrder = () => {
    setPendingOrder(null);
    setMessages(prev => [
      ...prev,
      { role: "assistant", content: "No problem at all! What would you like to change? 😊" },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent, retryUserMsg?: string) => {
    e?.preventDefault();
    const inputVal = retryUserMsg ?? input.trim();
    if (!inputVal || isLoading) return;
    setPendingOrder(null);
    const userMsg = inputVal;
    if (!retryUserMsg) {
      setInput("");
      setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    }
    setIsLoading(true);
    if (!retryUserMsg) {
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    }

    const maxRetries = 3;
    const attempt = async (retriesLeft: number): Promise<void> => {
      try {
        const msgs = retryUserMsg
          ? [...chatRetryMessages.current, { role: "user", content: userMsg }]
          : [...messages, { role: "user", content: userMsg }];
        const res = await fetch("/api/ai-waiter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: msgs.slice(-6),
            menuItems: items.map(i => ({ name: i.name, description: i.description, price: i.price, tags: i.tags })),
            restaurantName,
            restaurantId,
            tableNumber: resolvedTableNumber || "",
            aiWaiterSettings: {
              tone: menuStyle.aiWaiterTone,
              upsell: menuStyle.aiWaiterUpsell,
              instructions: menuStyle.aiWaiterInstructions,
            },
          }),
        });
        if (!res.ok || !res.body) throw new Error("Stream unavailable");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "assistant",
              content: next[next.length - 1].content + chunk,
            };
            return next;
          });
        }
        chatRetryCount.current = 0;
        chatRetryMessages.current = [];
        chatRetryInput.current = "";
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last.role === "assistant" && last.content.includes("__ORDER__:")) {
            const { cleanText, order } = parseOrder(last.content);
            next[next.length - 1] = { role: "assistant", content: cleanText };
            if (order) setPendingOrder(order);
          }
          return next;
        });
      } catch {
        if (retriesLeft > 0) {
          const delay = Math.pow(2, maxRetries - retriesLeft) * 500;
          await new Promise(r => setTimeout(r, delay));
          return attempt(retriesLeft - 1);
        }
        chatRetryMessages.current = messages;
        chatRetryInput.current = userMsg;
      }
    };
    await attempt(maxRetries);
    setIsLoading(false);
  };

  const handleRetryChat = () => {
    if (chatRetryInput.current && chatRetryMessages.current.length > 0) {
      const msgs = [...chatRetryMessages.current];
      setMessages([...msgs, { role: "assistant" as const, content: "" }]);
      chatRetryCount.current = 0;
      handleSubmit(undefined as unknown as React.FormEvent, chatRetryInput.current);
    }
  };

  if (!aiWaiterEnabled) return null;

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all animate-bounce-slow"
        title="Ask the AI Waiter"
      >
        <span className="material-symbols-outlined text-2xl icon-fill">robot_2</span>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-tertiary rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface w-full max-w-lg sm:rounded-[2.5rem] shadow-2xl flex flex-col h-[80vh] sm:h-[600px] overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl icon-fill font-bold">robot_2</span>
                </div>
                <div>
                  <h4 className="font-[var(--font-headline)] font-bold text-sm">AI Digital Waiter</h4>
                  <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">Powered by MENUZA</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Close chat"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-container-lowest custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-5 py-3 text-sm font-medium ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-3xl rounded-tr-none"
                      : "bg-surface-container-low text-on-surface rounded-3xl rounded-tl-none shadow-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {/* In-chat order confirmation card */}
              {pendingOrder && !isLoading && (
                <div className="bg-surface-container rounded-2xl p-4 border border-primary/25 space-y-3">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.18em]">Confirm your order</p>
                  <div className="space-y-2">
                    {pendingOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="font-medium text-on-surface">
                          {item.name}
                          <span className="text-secondary ml-1.5">×{item.quantity}</span>
                        </span>
                        <span className="font-bold text-primary">{formatPrice(item.price * item.quantity, currency)}</span>
                      </div>
                    ))}
                  </div>
                  {(pendingOrder.tableNumber || resolvedTableNumber) && (
                    <div className="flex items-center gap-1 text-xs text-secondary">
                      <span className="material-symbols-outlined text-[13px]">table_restaurant</span>
                      Table {pendingOrder.tableNumber || resolvedTableNumber}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-outline-variant/10">
                    <span className="text-sm font-bold">Total</span>
                    <span className="text-base font-extrabold text-primary">{formatPrice(pendingOrder.total, currency)}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={confirmChatOrder}
                      disabled={isPlacingChatOrder}
                      className="flex-1 py-3 bg-primary text-white font-[var(--font-headline)] font-bold rounded-xl text-sm active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isPlacingChatOrder ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Placing…</>
                      ) : (
                        <><span className="material-symbols-outlined text-[16px]">check_circle</span>Place Order</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={rejectChatOrder}
                      className="px-4 py-3 text-secondary text-sm font-bold hover:text-on-surface transition-colors rounded-xl hover:bg-surface-container-low"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {chatRetryInput.current && !isLoading && (
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={handleRetryChat}
                    className="bg-error/10 text-error text-xs font-bold px-4 py-2 rounded-full hover:bg-error/20 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    Tap to retry
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface-container-low px-5 py-3 rounded-3xl rounded-tl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-4 bg-surface border-t border-surface-container/50 flex gap-2">
              <input
                type="text"
                placeholder="Ask me anything about the menu..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
                className="flex-1 bg-surface-container-low rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-[20px] font-bold">send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
