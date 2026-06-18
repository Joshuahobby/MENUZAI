"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { trackMenuView, trackItemView, trackOrderClick, trackQRScan } from "@/lib/analytics";
import type { MenuItem, MenuCategory, MenuStyle, CartItem } from "@/types/menu";
import { defaultStyle } from "@/store/menuStore";
import { formatPrice, getOptimizedImageUrl } from "@/lib/utils";
import { buildWhatsAppMessage, buildWhatsAppURL } from "@/lib/whatsapp";
import { toast } from "sonner";
import ItemDetailsModal from "@/components/menu/ItemDetailsModal";
import FoodPaymentModal from "@/components/menu/FoodPaymentModal";

interface PublicMenuClientProps {
  menuId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantPhone: string;
  restaurantLogoUrl: string;
  aiWaiterEnabled?: boolean;
  branded?: boolean;
  paymentsEnabled?: boolean;
  slug: string;
  categories: MenuCategory[];
  items: MenuItem[];
  style: Partial<MenuStyle>;
}

const DIETARY_FILTERS = [
  { id: "vegan", label: "Vegan", icon: "eco" },
  { id: "vegetarian", label: "Vegetarian", icon: "spa" },
  { id: "gluten-free", label: "Gluten-Free", icon: "grass" },
  { id: "spicy", label: "Spicy", icon: "whatshot" },
  { id: "halal", label: "Halal", icon: "verified" },
];

const getTagMeta = (tag: string) => {
  const t = tag.toLowerCase().trim();
  if (t === "vegan") return { icon: "eco", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/10" };
  if (t === "vegetarian") return { icon: "spa", color: "text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400 border border-green-500/10" };
  if (t === "gluten-free" || t === "gluten free" || t === "gf") return { icon: "grass", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/10" };
  if (t === "spicy" || t === "hot") return { icon: "whatshot", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-500/10" };
  if (t === "halal") return { icon: "verified", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-500/10" };
  return { icon: "sell", color: "text-secondary bg-surface-container-high border border-outline-variant/10" };
};

type ChatOrder = { items: CartItem[]; tableNumber: string; total: number };

export default function PublicMenuClient(props: PublicMenuClientProps) {
  const {
    menuId,
    restaurantId,
    restaurantName,
    restaurantPhone,
    restaurantLogoUrl,
    aiWaiterEnabled = false,
    paymentsEnabled = false,
    slug,
  } = props;

  const [categories, setCategories] = useState<MenuCategory[]>(props.categories.filter(c => !c.hidden));
  const [items, setItems] = useState<MenuItem[]>(props.items);
  const [styleProp, setStyleProp] = useState<Partial<MenuStyle>>(props.style);

  const menuStyle: MenuStyle = React.useMemo(() => ({ ...defaultStyle, ...styleProp }), [styleProp]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const tableFromUrl = searchParams.get("table") || "";
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Cart sheet state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [showNoteField, setShowNoteField] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderedSnapshot, setOrderedSnapshot] = useState<{ cart: CartItem[]; total: number } | null>(null);
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [orderTableNumber, setOrderTableNumber] = useState("");

  const resolvedTableNumber = tableFromUrl || orderTableNumber;

  // Review state (inline after order)
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
            const tab = document.getElementById(`tab-${entry.target.id}`);
            if (tab) {
              tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
          }
        });
      },
      { rootMargin: "-120px 0px -70% 0px" }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories, searchQuery]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // AI Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: `Hello! I'm your digital server for ${restaurantName}. Anything I can help you find on our menu today? ✨` }
  ]);
  const [assistantInput, setAssistantInput] = useState("");
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // In-chat ordering state
  const [pendingChatOrder, setPendingChatOrder] = useState<ChatOrder | null>(null);
  const [isPlacingChatOrder, setIsPlacingChatOrder] = useState(false);

  // Sync table number from AI Waiter back to the UI state so it flows to cart, service pager, payment
  useEffect(() => {
    if (pendingChatOrder?.tableNumber) {
      setOrderTableNumber(pendingChatOrder.tableNumber);
    }
  }, [pendingChatOrder?.tableNumber]);

  // Table Service Pager State
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [serviceType, setServiceType] = useState<"call_waiter" | "bill" | "water" | "custom">("call_waiter");
  const [serviceMessage, setServiceMessage] = useState("");
  const [isSendingService, setIsSendingService] = useState(false);

  const handleSendServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const table = resolvedTableNumber;
    if (!table) {
      toast.error("Please enter your table number first.");
      return;
    }
    setIsSendingService(true);
    try {
      const channel = supabase.channel(`table_requests:${restaurantId}`);
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'new_request',
            payload: {
              id: crypto.randomUUID(),
              tableNumber: table,
              type: serviceType,
              message: serviceMessage.trim(),
              created_at: new Date().toISOString(),
              status: "pending"
            }
          });
          supabase.removeChannel(channel);
          toast.success("Assistance request sent to staff! 🛎️");
          setIsServiceOpen(false);
          setServiceMessage("");
        }
      });
    } catch (err) {
      console.error("Pager error:", err);
      toast.error("Failed to connect to waiter service.");
    } finally {
      setIsSendingService(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [assistantMessages]);

  // Parse __ORDER__: marker from AI response
  const parseChatOrder = (text: string): { cleanText: string; order: ChatOrder | null } => {
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
    if (!pendingChatOrder || isPlacingChatOrder) return;
    setIsPlacingChatOrder(true);

    const { items: orderItems, tableNumber: chatTable, total } = pendingChatOrder;
    const resolvedTable = chatTable || resolvedTableNumber || null;

    const { error } = await supabase.from("orders").insert({
      menu_id: menuId,
      restaurant_id: restaurantId,
      items: orderItems,
      total,
      customer_name: customerName.trim() || null,
      table_number: resolvedTable,
      whatsapp_sent: true,
      status: "pending",
      source: "ai_waiter",
    });

    if (error) {
      toast.error("Failed to place order. Please try again.");
      setIsPlacingChatOrder(false);
      return;
    }

    // Also open WhatsApp so the restaurant gets notified
    const msg = buildWhatsAppMessage(orderItems, customerName.trim() || undefined, resolvedTable || undefined, menuStyle.currency ?? "RWF");
    const waUrl = buildWhatsAppURL(restaurantPhone, msg);
    window.open(waUrl, "_blank", "noopener,noreferrer");

    fetch("/api/notifications/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId, items: orderItems, total,
        currency: menuStyle.currency,
        customerName: customerName.trim() || undefined,
        tableNumber: resolvedTable,
      }),
    }).catch(() => {});

    setPendingChatOrder(null);
    setIsPlacingChatOrder(false);

    setAssistantMessages(prev => [
      ...prev,
      {
        role: "assistant",
        content: `✅ Order confirmed${resolvedTable ? ` for table ${resolvedTable}` : ""}! Your food is on its way to the kitchen. WhatsApp is opening to keep you in the loop. Enjoy your meal! 🍽️`,
      },
    ]);

    // Trigger post-meal review flow via cart sheet
    setOrderedSnapshot({ cart: orderItems, total });
    setOrderPlaced(true);
    setIsCartOpen(true);
  };

  const rejectChatOrder = () => {
    setPendingChatOrder(null);
    setAssistantMessages(prev => [
      ...prev,
      { role: "assistant", content: "No problem at all! What would you like to change? 😊" },
    ]);
  };

  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim() || isAssistantLoading) return;

    setPendingChatOrder(null); // clear any stale pending order
    const userMsg = assistantInput.trim();
    setAssistantInput("");
    setAssistantMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsAssistantLoading(true);
    setAssistantMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai-waiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...assistantMessages, { role: "user", content: userMsg }].slice(-6),
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
        setAssistantMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      }

      // After streaming, detect and strip __ORDER__: marker
      setAssistantMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.role === "assistant" && last.content.includes("__ORDER__:")) {
          const { cleanText, order } = parseChatOrder(last.content);
          next[next.length - 1] = { role: "assistant", content: cleanText };
          if (order) setPendingChatOrder(order);
        }
        return next;
      });
    } catch {
      setAssistantMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "I'm having a little trouble connecting. Can I help you with something else?",
        };
        return next;
      });
    } finally {
      setIsAssistantLoading(false);
    }
  };

  useEffect(() => {
    trackMenuView(menuId, restaurantId);
    if (searchParams.get("src") === "qr") {
      trackQRScan(menuId, restaurantId);
    }
  }, [menuId, restaurantId, searchParams]);

  // ── Proactive greeting: auto-open AI Waiter after 3 s (Pro/Business only) ──
  const proactiveGreetingFired = useRef(false);
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
      setAssistantMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content: greetingMap[timeOfDay] },
      ]);
      setIsAssistantOpen(true);
    }, 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiWaiterEnabled]);

  // Real-time menu sync
  useEffect(() => {
    if (!menuId) return;

    const channel = supabase
      .channel(`public-menu:${menuId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "menus",
          filter: `id=eq.${menuId}`,
        },
        (payload) => {
          const updated = payload.new as {
            categories?: MenuCategory[];
            items?: MenuItem[];
            style?: Partial<MenuStyle>;
            status?: string;
          };
          if (updated.status === 'draft') return;
          if (updated.categories) setCategories(updated.categories.filter((c: MenuCategory) => !c.hidden));
          if (updated.items) setItems(updated.items);
          if (updated.style) setStyleProp(updated.style);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [menuId]);

  useEffect(() => {
    if (containerRef.current) {
      const s = containerRef.current.style;
      s.setProperty("--primary-color", menuStyle.primaryColor);
      s.setProperty("--font-headline", menuStyle.headlineFont);
      s.setProperty("--font-body", menuStyle.bodyFont);
      s.setProperty("--border-radius", menuStyle.borderRadius);
    }
  }, [menuStyle]);

  const visibleCategoryIds = useMemo(() => new Set(categories.map(c => c.id)), [categories]);
  const filtered = useMemo(() => items.filter((i) => {
    const matchesCategory = searchQuery.trim()
      ? visibleCategoryIds.has(i.category)
      : i.category === activeCategory;
    const matchesSearch = !searchQuery.trim() ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(selTag =>
        i.tags && i.tags.some(itemTag => itemTag.toLowerCase().trim() === selTag.toLowerCase().trim())
      );
    return matchesCategory && matchesSearch && matchesTags;
  }), [items, searchQuery, activeCategory, selectedTags, visibleCategoryIds]);

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToCart = (item: MenuItem) => {
    trackItemView(menuId, restaurantId, item.id, item.name);
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const incrementQty = (id: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
  };

  const decrementQty = (id: string) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      if (item.quantity <= 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const placeOrder = async () => {
    if (cart.length === 0 || isPlacingOrder) return;
    if (!resolvedTableNumber) {
      toast.error("Please enter your table number before placing the order.");
      return;
    }
    setIsPlacingOrder(true);

    const snapshot = { cart: [...cart], total: totalPrice };

    const { error } = await supabase.from("orders").insert({
      menu_id: menuId,
      restaurant_id: restaurantId,
      items: cart,
      total: totalPrice,
      customer_name: customerName.trim() || null,
      table_number: resolvedTableNumber || null,
      whatsapp_sent: true,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to place order. Please try again.");
      setIsPlacingOrder(false);
      return;
    }

    const msg = buildWhatsAppMessage(cart, customerName.trim() || undefined, resolvedTableNumber || undefined, menuStyle.currency ?? "RWF", orderNote || undefined);
    const waUrl = buildWhatsAppURL(restaurantPhone, msg);
    setLastWhatsAppUrl(waUrl);
    window.open(waUrl, "_blank", "noopener,noreferrer");

    fetch("/api/notifications/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId, items: cart, total: totalPrice,
        currency: menuStyle.currency,
        customerName: customerName.trim() || undefined,
        tableNumber: resolvedTableNumber || undefined,
        note: orderNote || undefined,
      }),
    }).catch(() => {});

    setOrderedSnapshot(snapshot);
    setCart([]);
    setOrderNote("");
    setShowNoteField(false);
    setOrderPlaced(true);
    setIsPlacingOrder(false);
  };

  const handleSubmitReview = async () => {
    if (rating === 0 || !restaurantId) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          rating,
          customerName: "Guest",
          comment: reviewComment,
          orderId: null,
        }),
      });
      if (res.ok) {
        setReviewSubmitted(true);
        toast.success("Thank you for your feedback! ❤️");
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    } catch {
      toast.error("An error occurred while submitting feedback.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const closeCart = () => {
    if (orderPlaced) {
      setRating(0);
      setHoverRating(0);
      setReviewComment("");
      setReviewSubmitted(false);
      setOrderPlaced(false);
      setOrderedSnapshot(null);
      setLastWhatsAppUrl(null);
    }
    setShowNoteField(false);
    setIsCartOpen(false);
  };

  // Upsell items for the cart sheet (items not in cart, from different categories)
  const upsellItems = items
    .filter(i => !cart.some(c => c.id === i.id) && i.available !== false)
    .slice(0, 3);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-surface text-on-surface pb-32 theme-transition"
    >
      {/* Header */}
      <header className="w-full sticky top-0 z-50 bg-surface/95 backdrop-blur-xl flex flex-col">
        <div className="flex justify-between items-center px-6 h-20">
          <div className="flex items-center gap-3">
            {restaurantLogoUrl ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-outline-variant/20">
                <NextImage src={restaurantLogoUrl} alt={restaurantName} width={40} height={40} className="object-cover w-full h-full" />
              </div>
            ) : null}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-[var(--font-headline)] font-black tracking-tight text-on-surface leading-tight">{restaurantName}</span>
                {isOffline && (
                  <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" title="Viewing Offline" />
                )}
                {!isOffline && (
                  <div className="flex items-center gap-1 bg-tertiary/10 px-1.5 py-0.5 rounded-full" title="Menu Saved Offline">
                    <span className="material-symbols-outlined text-[10px] text-tertiary font-bold">offline_pin</span>
                  </div>
                )}
              </div>
              <Link href="/" className="text-[9px] font-bold uppercase tracking-widest text-[var(--primary-color)] -mt-0.5 font-[var(--font-body)]">Powered by MENUZA AI</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(""); }}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${searchOpen ? "bg-primary/10 text-primary" : "hover:bg-surface-container-low text-on-surface-variant"}`}
            >
              <span className="material-symbols-outlined">{searchOpen ? "close" : "search"}</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-sm">person</span>
            </div>
          </div>
        </div>
        {searchOpen && (
          <div className="px-6 pb-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-sm">search</span>
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="w-full bg-surface-container-low rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>
          </div>
        )}
      </header>

      {/* Category Tabs & Dietary Filters */}
      <nav className="sticky top-20 z-40 bg-surface/95 backdrop-blur-sm pt-4 pb-2.5 overflow-x-auto hide-scrollbar border-b border-outline-variant/5">
        <div className="flex px-6 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`tab-${cat.id}`}
              onClick={() => {
                setActiveCategory(cat.id);
                const el = sectionRefs.current[cat.id];
                if (el) {
                  const y = el.getBoundingClientRect().top + window.scrollY - 180;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className={`px-6 py-2.5 font-[var(--font-headline)] font-bold text-sm whitespace-nowrap transition-all duration-300 rounded-[var(--border-radius)] cursor-pointer ${activeCategory === cat.id
                ? "text-white shadow-lg bg-[var(--primary-color)]"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex px-6 gap-2 mt-3 overflow-x-auto hide-scrollbar">
          {DIETARY_FILTERS.map((filter) => {
            const isSelected = selectedTags.includes(filter.id);
            let activeClass = "";
            if (isSelected) {
              if (filter.id === "vegan") activeClass = "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10";
              else if (filter.id === "vegetarian") activeClass = "bg-green-600 text-white border-green-600 shadow-md shadow-green-600/10";
              else if (filter.id === "gluten-free") activeClass = "bg-amber-50 text-white border-amber-50 shadow-md shadow-amber-50/10";
              else if (filter.id === "spicy") activeClass = "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/10";
              else if (filter.id === "halal") activeClass = "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10";
            } else {
              activeClass = "bg-surface-container-low/60 text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/10";
            }
            return (
              <button
                key={filter.id}
                onClick={() => {
                  setSelectedTags(prev =>
                    prev.includes(filter.id)
                      ? prev.filter(t => t !== filter.id)
                      : [...prev, filter.id]
                  );
                }}
                className={`px-4 py-2 font-[var(--font-headline)] font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-all duration-300 rounded-full cursor-pointer select-none active:scale-95 ${activeClass}`}
              >
                <span className="material-symbols-outlined text-[16px]">{filter.icon}</span>
                {filter.label}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="px-3 py-2 font-[var(--font-headline)] font-bold text-xs flex items-center gap-1 whitespace-nowrap transition-all duration-300 rounded-full cursor-pointer select-none text-error bg-error/10 hover:bg-error/15 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">clear_all</span>
              Clear
            </button>
          )}
        </div>
      </nav>

      <main className="px-6 pt-4 pb-12 space-y-8">
        {!searchQuery.trim() && (
          <section className="relative h-40 sm:h-56 overflow-hidden rounded-[var(--border-radius)] shadow-lg group">
            <NextImage
              alt={restaurantName}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              src={getOptimizedImageUrl(restaurantLogoUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=600&fit=crop", 1200)}
              fill
              sizes="(max-width: 1024px) 100vw, 1200px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 z-10">
              <h1 className="text-white font-[var(--font-headline)] text-3xl font-black tracking-tight drop-shadow-md">{restaurantName}</h1>
              <p className="text-white/90 text-sm mt-1 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">restaurant</span>
                Welcome to our digital menu
              </p>
            </div>
          </section>
        )}

        {/* Menu Items */}
        {searchQuery.trim() ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-[var(--font-headline)] text-xl font-extrabold tracking-tight capitalize">
                Results for &quot;{searchQuery}&quot;
              </h3>
              <span className="text-xs text-secondary font-bold">{filtered.length} found</span>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-secondary">
                <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">search_off</span>
                <p className="font-bold">No dishes found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            )}
            <div className={
              menuStyle.layoutDensity === "compact"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : menuStyle.layoutDensity === "spacious"
                ? "grid grid-cols-1 gap-8 max-w-xl mx-auto"
                : "grid grid-cols-1 gap-6 max-w-2xl mx-auto"
            }>
              {filtered.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  menuStyle={menuStyle}
                  onSelect={() => setSelectedItem(item)}
                  onAddToCart={() => addToCart(item)}
                  onIncrement={() => incrementQty(item.id)}
                  onDecrement={() => decrementQty(item.id)}
                  cartQty={cart.find(c => c.id === item.id)?.quantity ?? 0}
                />
              ))}
            </div>
          </section>
        ) : (
          categories.map(cat => {
            const catItems = filtered.filter(i => i.category === cat.id);
            if (catItems.length === 0) return null;
            return (
              <section
                key={cat.id}
                id={cat.id}
                ref={el => { sectionRefs.current[cat.id] = el; }}
                className="space-y-6 pt-4"
              >
                <h3 className="font-[var(--font-headline)] text-2xl font-extrabold tracking-tight capitalize sticky top-[152px] z-30 bg-surface/90 backdrop-blur-md py-2 border-b border-outline-variant/10">
                  {cat.name}
                </h3>
                <div className={
                  menuStyle.layoutDensity === "compact"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    : menuStyle.layoutDensity === "spacious"
                    ? "grid grid-cols-1 gap-8 max-w-xl mx-auto"
                    : "grid grid-cols-1 gap-6 max-w-2xl mx-auto"
                }>
                  {catItems.map(item => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      menuStyle={menuStyle}
                      onSelect={() => setSelectedItem(item)}
                      onAddToCart={() => addToCart(item)}
                      onIncrement={() => incrementQty(item.id)}
                      onDecrement={() => decrementQty(item.id)}
                      cartQty={cart.find(c => c.id === item.id)?.quantity ?? 0}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      {/* Free Lite branding footer */}
      {props.branded && (
        <div className="py-6 text-center border-t border-outline-variant/10 mt-8">
          <a
            href="https://menuzaai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-secondary opacity-50 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            Powered by MENUZA AI
          </a>
        </div>
      )}
      </main>

      {/* Item Details Modal */}
      <ItemDetailsModal
        item={selectedItem}
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        onAddToCart={(item, qty) => {
          for (let i = 0; i < qty; i++) addToCart(item);
        }}
        currency={menuStyle.currency ?? "RWF"}
      />

      {/* Food Payment Modal */}
      {showPaymentModal && (
        <FoodPaymentModal
          restaurantId={restaurantId}
          menuId={menuId}
          items={cart}
          total={totalPrice}
          currency={menuStyle.currency ?? "RWF"}
          tableNumber={resolvedTableNumber || null}
          customerName={customerName.trim() || null}
          onSuccess={() => {
            setShowPaymentModal(false);
            setOrderedSnapshot({ cart: [...cart], total: totalPrice });
            setCart([]);
            setOrderPlaced(true);
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* AI Assistant FAB — Pro plan only */}
      {aiWaiterEnabled && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all animate-bounce-slow"
          title="Ask the AI Waiter"
        >
          <span className="material-symbols-outlined text-2xl icon-fill">robot_2</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-tertiary rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* AI Assistant Modal */}
      {isAssistantOpen && aiWaiterEnabled && (
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
                onClick={() => setIsAssistantOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Close chat"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-container-lowest custom-scrollbar">
              {assistantMessages.map((msg, i) => (
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
              {/* ── In-chat order confirmation card ── */}
              {pendingChatOrder && !isAssistantLoading && (
                <div className="bg-surface-container rounded-2xl p-4 border border-primary/25 space-y-3">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.18em]">Confirm your order</p>
                  <div className="space-y-2">
                    {pendingChatOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="font-medium text-on-surface">
                          {item.name}
                          <span className="text-secondary ml-1.5">×{item.quantity}</span>
                        </span>
                        <span className="font-bold text-primary">{formatPrice(item.price * item.quantity, menuStyle.currency ?? "RWF")}</span>
                      </div>
                    ))}
                  </div>
                  {(pendingChatOrder.tableNumber || resolvedTableNumber) && (
                    <div className="flex items-center gap-1 text-xs text-secondary">
                      <span className="material-symbols-outlined text-[13px]">table_restaurant</span>
                      Table {pendingChatOrder.tableNumber || resolvedTableNumber}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-outline-variant/10">
                    <span className="text-sm font-bold">Total</span>
                    <span className="text-base font-extrabold text-primary">{formatPrice(pendingChatOrder.total, menuStyle.currency ?? "RWF")}</span>
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

              {isAssistantLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface-container-low px-5 py-3 rounded-3xl rounded-tl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleAssistantSubmit} className="p-4 bg-surface border-t border-surface-container/50 flex gap-2">
              <input
                type="text"
                placeholder="Ask me anything about the menu..."
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                autoFocus
                className="flex-1 bg-surface-container-low rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
              <button
                type="submit"
                disabled={!assistantInput.trim() || isAssistantLoading}
                className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-[20px] font-bold">send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Service Pager FAB */}
      <button
        onClick={() => setIsServiceOpen(true)}
        className="fixed bottom-40 right-6 w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all animate-bounce-slow cursor-pointer"
        title="Call Waiter / Request Service"
      >
        <span className="material-symbols-outlined text-2xl icon-fill font-bold">concierge</span>
      </button>

      {/* Service Pager Modal */}
      {isServiceOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface w-full max-w-md sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl icon-fill font-bold">concierge</span>
                </div>
                <div>
                  <h4 className="font-[var(--font-headline)] font-bold text-sm">Table Assistance</h4>
                  <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">Table {resolvedTableNumber || "—"}</p>
                </div>
              </div>
              <button
                onClick={() => setIsServiceOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                title="Close pager"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <form onSubmit={handleSendServiceRequest} className="p-6 space-y-6">
              <div>
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-3 block">What do you need?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "call_waiter", name: "Call Waiter", icon: "concierge", sub: "Request assistance" },
                    { id: "bill", name: "Request Bill", icon: "payments", sub: "Ready to pay" },
                    { id: "water", name: "Need Water", icon: "local_drinking_water", sub: "Bring water" },
                    { id: "custom", name: "Custom Call", icon: "chat_bubble", sub: "Type request" }
                  ].map((opt) => {
                    const isSelected = serviceType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setServiceType(opt.id as "call_waiter" | "bill" | "water" | "custom")}
                        className={`flex flex-col p-4 rounded-2xl border text-left transition-all cursor-pointer ${isSelected ? "border-amber-500 bg-amber-500/5 text-amber-600 ring-2 ring-amber-500/10 font-bold" : "border-outline-variant/15 hover:bg-surface-container-low text-secondary"}`}
                      >
                        <span className="material-symbols-outlined text-xl mb-2">{opt.icon}</span>
                        <span className="text-xs font-bold block">{opt.name}</span>
                        <span className="text-[9px] opacity-75 font-normal block mt-0.5">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {!resolvedTableNumber && (
                <div>
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 block" htmlFor="service-table">Your Table Number</label>
                  <input
                    id="service-table"
                    type="text"
                    value={orderTableNumber}
                    onChange={(e) => setOrderTableNumber(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 block" htmlFor="service-message">Additional details (Optional)</label>
                <textarea
                  id="service-message"
                  rows={3}
                  value={serviceMessage}
                  onChange={(e) => setServiceMessage(e.target.value)}
                  placeholder={serviceType === "custom" ? "Type details here, e.g. Extra napkins, clean glass, fork..." : "Any extra details..."}
                  className="w-full bg-surface-container-low border-none rounded-2xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-amber-500/20 leading-relaxed custom-scrollbar resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSendingService}
                className="w-full py-4 bg-gradient-to-tr from-amber-500 to-amber-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-500/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSendingService ? "Sending Request..." : "Send Call Alert"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Floating Cart CTA ── */}
      <div className="fixed bottom-0 left-0 w-full p-5 z-50 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          {totalItems > 0 ? (
            <button
              onClick={() => { trackOrderClick(menuId, restaurantId, totalPrice); setIsCartOpen(true); }}
              className="w-full h-16 bg-whatsapp hover:bg-whatsapp-dark text-white flex items-center justify-between px-5 gap-3 shadow-[0_12px_40px_rgba(37,211,102,0.4)] active:scale-[0.98] transition-all rounded-[var(--border-radius)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="font-[var(--font-headline)] font-black text-sm leading-none">{totalItems}</span>
                </div>
                <span className="font-[var(--font-headline)] font-extrabold tracking-tight uppercase text-sm">View Order</span>
              </div>
              <span className="font-[var(--font-headline)] font-extrabold text-sm">{formatPrice(totalPrice, menuStyle.currency ?? "RWF")}</span>
            </button>
          ) : (
            <div className="w-full h-14 bg-whatsapp/50 text-white rounded-[var(--border-radius)] flex items-center justify-center gap-2.5 shadow-sm">
              <WhatsAppIcon className="w-5 h-5" />
              <span className="font-[var(--font-headline)] font-bold tracking-tight text-sm opacity-90">Order via WhatsApp</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Cart Sheet ── */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={closeCart}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-surface rounded-t-[2.5rem] shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Drag handle */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-black/10 rounded-full" />
            </div>

            {orderPlaced && orderedSnapshot ? (
              /* ── Confirmation View ── */
              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col items-center space-y-6 pb-10">
                <div className="w-20 h-20 bg-tertiary/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary text-4xl icon-fill">check_circle</span>
                </div>
                <div className="text-center">
                  <h2 className="font-[var(--font-headline)] font-extrabold text-2xl tracking-tight">Order Sent!</h2>
                  <p className="text-secondary text-sm mt-1">WhatsApp is opening to confirm with the restaurant.</p>
                  {resolvedTableNumber && (
                    <div className="inline-flex items-center gap-1.5 mt-2 bg-surface-container px-3 py-1.5 rounded-full">
                      <span className="material-symbols-outlined text-[14px] text-secondary">table_restaurant</span>
                      <span className="text-xs font-bold text-secondary">Table {resolvedTableNumber}</span>
                    </div>
                  )}
                  {customerName.trim() && (
                    <div className="inline-flex items-center gap-1.5 mt-1 bg-surface-container px-3 py-1.5 rounded-full">
                      <span className="material-symbols-outlined text-[14px] text-secondary">person</span>
                      <span className="text-xs font-bold text-secondary">{customerName.trim()}</span>
                    </div>
                  )}
                  {lastWhatsAppUrl && (
                    <a
                      href={lastWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-whatsapp hover:underline"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      WhatsApp didn&apos;t open? Tap here
                    </a>
                  )}
                </div>

                {/* Order summary */}
                <div className="w-full bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50 space-y-2.5">
                  {orderedSnapshot.cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="font-medium text-on-surface">
                        {item.name}
                        <span className="text-secondary ml-1.5">×{item.quantity}</span>
                      </span>
                      <span className="font-bold text-primary">{formatPrice(item.price * item.quantity, menuStyle.currency ?? "RWF")}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-surface-container flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(orderedSnapshot.total, menuStyle.currency ?? "RWF")}</span>
                  </div>
                </div>

                {/* Review widget */}
                <div className="w-full bg-surface-container-lowest rounded-2xl p-5 border border-surface-container/50 space-y-4">
                  <h3 className="font-[var(--font-headline)] font-black text-center text-sm">Rate your experience</h3>
                  {reviewSubmitted ? (
                    <div className="text-center py-2 space-y-1">
                      <span className="material-symbols-outlined text-emerald-500 text-4xl block">celebration</span>
                      <p className="text-sm font-bold text-emerald-600">Thanks for the feedback! ❤️</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isActive = (hoverRating || rating) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className={`transition-all duration-150 hover:scale-125 active:scale-110 border-none bg-transparent cursor-pointer ${isActive ? "text-amber-500" : "text-surface-container-highest"}`}
                            >
                              <span className="material-symbols-outlined text-[32px] icon-fill select-none">star</span>
                            </button>
                          );
                        })}
                      </div>
                      {rating > 0 && (
                        <div className="space-y-2.5">
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="What did you love? (optional)"
                            className="w-full bg-surface-container-low border-none rounded-2xl py-3 px-4 text-xs focus:ring-2 focus:ring-primary/20 resize-none h-16 outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSubmitReview}
                            disabled={isSubmittingReview}
                            className="w-full py-3 bg-primary text-white font-[var(--font-headline)] font-bold rounded-2xl text-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer hover:opacity-90"
                          >
                            {isSubmittingReview ? "Submitting..." : "Submit Review"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={closeCart}
                  className="w-full py-4 bg-surface-container-lowest border border-surface-container rounded-2xl font-bold text-sm hover:bg-surface-container-low transition-all"
                >
                  Back to Menu
                </button>
              </div>
            ) : (
              /* ── Cart View ── */
              <>
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-outline-variant/10">
                  <div>
                    <h2 className="font-[var(--font-headline)] font-extrabold text-xl tracking-tight">Your Order</h2>
                    {resolvedTableNumber && (
                      <p className="text-xs text-secondary font-bold flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">table_restaurant</span>
                        Table {resolvedTableNumber}
                      </p>
                    )}
                    {customerName.trim() && (
                      <p className="text-[10px] text-secondary flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[11px]">person</span>
                        {customerName.trim()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={closeCart}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-secondary hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Scrollable items */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-5xl text-secondary/30 block mb-2">shopping_bag</span>
                      <p className="text-secondary font-bold text-sm">Your cart is empty</p>
                      <button onClick={closeCart} className="text-primary font-bold text-sm mt-2">Browse menu</button>
                    </div>
                  ) : (
                    <>
                      {cart.map((item) => (
                        <div key={item.id} className="flex gap-3 items-center py-1">
                          {/* Thumbnail */}
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-surface-container relative">
                            {item.image ? (
                              <NextImage src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-secondary/40 text-2xl absolute inset-0 flex items-center justify-center">restaurant</span>
                            )}
                          </div>

                          {/* Name + unit price */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-on-surface truncate">{item.name}</p>
                            <p className="text-xs text-primary font-bold mt-0.5">{formatPrice(item.price, menuStyle.currency ?? "RWF")}</p>
                          </div>

                          {/* Qty controls */}
                          <div className="flex items-center gap-0 bg-surface-container rounded-xl overflow-hidden shrink-0">
                            <button
                              type="button"
                              onClick={() => decrementQty(item.id)}
                              className="w-9 h-9 flex items-center justify-center text-secondary hover:text-error hover:bg-error/5 transition-colors active:scale-90"
                            >
                              <span className="material-symbols-outlined text-[18px]">{item.quantity === 1 ? "delete" : "remove"}</span>
                            </button>
                            <span className="w-8 text-center font-black text-sm text-on-surface">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => incrementQty(item.id)}
                              className="w-9 h-9 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors active:scale-90"
                            >
                              <span className="material-symbols-outlined text-[18px]">add</span>
                            </button>
                          </div>

                          {/* Line total */}
                          <div className="min-w-[4.5rem] text-right shrink-0">
                            <p className="font-[var(--font-headline)] font-extrabold text-sm text-primary">{formatPrice(item.price * item.quantity, menuStyle.currency ?? "RWF")}</p>
                          </div>
                        </div>
                      ))}

                      {/* Upsell strip */}
                      {upsellItems.length > 0 && (
                        <div className="pt-2 pb-1">
                          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.18em] mb-2">Pairs well with</p>
                          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                            {upsellItems.map(ui => (
                              <button
                                key={ui.id}
                                type="button"
                                onClick={() => addToCart(ui)}
                                className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-xl whitespace-nowrap hover:bg-primary/10 transition-colors group shrink-0"
                              >
                                <span className="text-xs font-bold text-on-surface">{ui.name}</span>
                                <span className="text-[10px] text-primary font-bold">{formatPrice(ui.price, menuStyle.currency ?? "RWF")}</span>
                                <span className="material-symbols-outlined text-[14px] text-primary group-hover:scale-110 transition-transform">add_circle</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Customer details */}
                      <div className="pt-2 space-y-3 border-t border-outline-variant/10">
                        <div>
                          <label className="text-[10px] font-black text-secondary uppercase tracking-[0.18em] mb-1.5 block">Your Name (Optional)</label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="e.g. Alice"
                            className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        {!tableFromUrl && (
                          <div>
                            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.18em] mb-1.5 block">Table Number (Required)</label>
                            <input
                              type="text"
                              value={orderTableNumber}
                              onChange={(e) => setOrderTableNumber(e.target.value)}
                              placeholder="e.g. 5"
                              className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        )}
                      </div>

                      {/* Note field */}
                      {showNoteField ? (
                        <div className="pt-1">
                          <textarea
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            placeholder="e.g. No onions, extra sauce, allergies..."
                            rows={2}
                            autoFocus
                            className="w-full bg-surface-container-low rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowNoteField(true)}
                          className="w-full flex items-center gap-2 py-3 text-secondary hover:text-primary transition-colors text-sm font-bold"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit_note</span>
                          Add special request
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Sticky footer */}
                {cart.length > 0 && (
                  <div className="px-6 py-5 bg-surface border-t border-outline-variant/10 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-[var(--font-headline)] font-bold text-lg text-secondary">Total</span>
                      <span className="font-[var(--font-headline)] font-extrabold text-2xl text-primary">
                        {formatPrice(totalPrice, menuStyle.currency ?? "RWF")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={placeOrder}
                        disabled={isPlacingOrder}
                        className="w-full h-14 bg-whatsapp hover:bg-whatsapp-dark text-white rounded-2xl flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(37,211,102,0.35)] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed font-[var(--font-headline)] font-extrabold tracking-tight uppercase text-sm"
                      >
                        {isPlacingOrder ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Placing Order…
                          </>
                        ) : (
                          <>
                            <WhatsAppIcon className="w-5 h-5" />
                            Order via WhatsApp
                          </>
                        )}
                      </button>
                      {paymentsEnabled && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!resolvedTableNumber) {
                              toast.error("Please enter your table number first.");
                              return;
                            }
                            setShowPaymentModal(true);
                          }}
                          disabled={isPlacingOrder}
                          className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 font-bold text-sm"
                        >
                          <span className="material-symbols-outlined text-[18px]">payments</span>
                          Pay with Mobile Money
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Extracted item card to eliminate duplicated JSX ──
function MenuItemCard({
  item,
  menuStyle,
  onSelect,
  onAddToCart,
  onIncrement,
  onDecrement,
  cartQty,
}: {
  item: MenuItem;
  menuStyle: MenuStyle;
  onSelect: () => void;
  onAddToCart: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  cartQty: number;
}) {
  return (
    <div
      onClick={onSelect}
      className={`bg-surface-container-lowest overflow-hidden flex flex-col shadow-sm border border-outline-variant/10 rounded-[var(--border-radius)] relative cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${item.available === false ? "opacity-60" : ""}`}
    >
      <div className={`relative ${menuStyle.layoutDensity === "compact" ? "h-36" : "h-52"}`}>
        <NextImage
          alt={item.name}
          className="object-cover"
          src={getOptimizedImageUrl(item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop", 600)}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
        />
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 z-10 shadow-sm rounded-[calc(var(--border-radius)/2)]">
          <span className="font-[var(--font-headline)] font-extrabold text-lg text-[var(--primary-color)]">{formatPrice(item.price, menuStyle.currency ?? "RWF")}</span>
        </div>
        {item.available === false && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <span className="bg-error text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">Sold Out</span>
          </div>
        )}
        {item.gallery && item.gallery.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 z-20">
            <span className="material-symbols-outlined text-[12px]">collections</span>
            <span>+{item.gallery.length}</span>
          </div>
        )}
      </div>

      <div className={`flex flex-col flex-1 ${menuStyle.layoutDensity === "compact" ? "p-4" : menuStyle.layoutDensity === "spacious" ? "p-8" : "p-6"}`}>
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-[var(--font-headline)] text-lg font-extrabold">{item.name}</h4>
          {item.badge && (
            <div className={`flex items-center gap-1 ${item.badge === "healthy" ? "text-tertiary" : "text-[var(--primary-color)]"}`}>
              <span className="material-symbols-outlined icon-fill">
                {item.badge === "healthy" ? "eco" : item.badge === "popular" ? "local_fire_department" : "star"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-tighter capitalize">{item.badge}</span>
            </div>
          )}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3.5 mt-1">
            {item.tags.map((tag) => {
              const meta = getTagMeta(tag);
              return (
                <span key={tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${meta.color}`}>
                  <span className="material-symbols-outlined text-[11px]">{meta.icon}</span>
                  {tag}
                </span>
              );
            })}
          </div>
        )}
        {menuStyle.layoutDensity !== "compact" && (
          <p className="text-on-surface-variant text-sm leading-relaxed mb-6 font-medium opacity-80 font-[var(--font-body)] line-clamp-2">{item.description}</p>
        )}
        {item.available === false ? (
          <div className={`w-full flex items-center justify-center bg-surface-container text-secondary font-bold rounded-[var(--border-radius)] cursor-not-allowed ${menuStyle.layoutDensity === "compact" ? "py-2.5 text-sm mt-auto" : "py-4 mt-auto"}`}>
            Sold Out
          </div>
        ) : cartQty > 0 ? (
          <div
            className={`w-full flex items-center justify-between bg-[var(--primary-color)]/10 rounded-[var(--border-radius)] mt-auto ${menuStyle.layoutDensity === "compact" ? "py-1" : "py-1.5"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDecrement(); }}
              className="w-10 h-10 flex items-center justify-center text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-[var(--border-radius)] transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">{cartQty === 1 ? "delete" : "remove"}</span>
            </button>
            <span className="font-[var(--font-headline)] font-black text-[var(--primary-color)] text-base min-w-[2ch] text-center">{cartQty}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onIncrement(); }}
              className="w-10 h-10 flex items-center justify-center text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-[var(--border-radius)] transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className={`w-full text-white font-[var(--font-headline)] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:opacity-90 bg-[var(--primary-color)] rounded-[var(--border-radius)] premium-shadow ${menuStyle.layoutDensity === "compact" ? "py-2.5 text-sm mt-auto" : "py-4 mt-auto"}`}
          >
            Add to Cart
            <span className="material-symbols-outlined text-lg">add_circle</span>
          </button>
        )}
      </div>
    </div>
  );
}

function WhatsAppIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={`fill-current ${className}`} viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
