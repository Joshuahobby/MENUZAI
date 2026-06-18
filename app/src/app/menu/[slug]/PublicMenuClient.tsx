"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { trackMenuView, trackItemView, trackOrderClick, trackQRScan } from "@/lib/analytics";
import type { MenuItem, MenuCategory, MenuStyle, CartItem } from "@/types/menu";
import { defaultStyle } from "@/store/menuStore";
import { formatPrice, getOptimizedImageUrl, getTagMeta } from "@/lib/utils";
import { buildWhatsAppMessage, buildWhatsAppURL } from "@/lib/whatsapp";
import { toast } from "sonner";
import ItemDetailsModal from "@/components/menu/ItemDetailsModal";
import FoodPaymentModal from "@/components/menu/FoodPaymentModal";
import MenuItemCard from "@/components/menu/MenuItemCard";
import ServicePager from "@/components/menu/ServicePager";
import AiWaiterPanel from "@/components/menu/AiWaiterPanel";
import CartSheet from "@/components/menu/CartSheet";

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
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("menuza_cart");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (parsed.restaurantId !== restaurantId) return [];
      if (Date.now() - parsed.savedAt > 30 * 60 * 1000) return [];
      return parsed.items as CartItem[];
    } catch { return []; }
  });
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
  const [customerName, setCustomerName] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return JSON.parse(localStorage.getItem("menuza_customer_name") || '""'); } catch { return ""; }
  });
  const [orderTableNumber, setOrderTableNumber] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return JSON.parse(localStorage.getItem("menuza_table_number") || '""'); } catch { return ""; }
  });
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("menuza_customer_name", JSON.stringify(customerName)); } catch {}
  }, [customerName]);

  useEffect(() => {
    try { localStorage.setItem("menuza_table_number", JSON.stringify(orderTableNumber)); } catch {}
  }, [orderTableNumber]);

  useEffect(() => {
    try {
      const payload = { items: cart, restaurantId, savedAt: Date.now() };
      localStorage.setItem("menuza_cart", JSON.stringify(payload));
    } catch {}
  }, [cart, restaurantId]);

  const pushOrderToHistory = (id: string | null) => {
    if (!id) return;
    try {
      const raw = localStorage.getItem("menuza_order_history");
      const history: { id: string; restaurantId: string }[] = raw ? JSON.parse(raw) : [];
      const exists = history.some((e) => e.id === id);
      if (!exists) {
        history.unshift({ id, restaurantId });
        if (history.length > 20) history.length = 20;
        localStorage.setItem("menuza_order_history", JSON.stringify(history));
      }
    } catch {}
  };

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
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Back online!", { description: "You can now place orders again.", duration: 3000 });
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync table number from AI Waiter back to the UI state so it flows to cart, service pager, payment

  useEffect(() => {
    trackMenuView(menuId, restaurantId);
    if (searchParams.get("src") === "qr") {
      trackQRScan(menuId, restaurantId);
    }
  }, [menuId, restaurantId, searchParams]);

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

    let orderId: string | null = null;
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        menu_id: menuId,
        restaurant_id: restaurantId,
        items: cart,
        total: totalPrice,
        customer_name: customerName.trim() || null,
        table_number: resolvedTableNumber || null,
        whatsapp_sent: true,
        status: "pending",
      }).select("id").single();

      if (error || !order) throw error || new Error("No order returned");
      orderId = order.id;
    } catch {
      toast.error("Failed to place order. Please try again.");
      setIsPlacingOrder(false);
      return;
    }

    setLastOrderId(orderId);
    pushOrderToHistory(orderId);

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
    }).catch((e) => console.error("Order notification failed:", e));

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

  const handleCancelOrder = async () => {
    if (!lastOrderId || isCancelling) return;
    setIsCancelling(true);
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: lastOrderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Your order has been cancelled.");
      setLastOrderId(null);
      setOrderedSnapshot(null);
      setOrderPlaced(false);
    } catch {
      toast.error("Failed to cancel order. Please ask your server.");
    } finally {
      setIsCancelling(false);
    }
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

        {/* Empty menu state — no items in any category */}
        {!searchQuery.trim() && items.length === 0 && categories.length > 0 && (
          <div className="text-center py-20 px-6">
            <span className="material-symbols-outlined text-6xl text-surface-container-highest block mb-4">restaurant_menu</span>
            <h3 className="font-[var(--font-headline)] font-extrabold text-xl text-on-surface mb-2">No menu items yet</h3>
            <p className="text-secondary text-sm max-w-xs mx-auto">The restaurant hasn&apos;t added any items to this menu yet. Check back soon!</p>
          </div>
        )}

        {!searchQuery.trim() && categories.length === 0 && (
          <div className="text-center py-20 px-6">
            <span className="material-symbols-outlined text-6xl text-surface-container-highest block mb-4">menu_book</span>
            <h3 className="font-[var(--font-headline)] font-extrabold text-xl text-on-surface mb-2">Menu not available</h3>
            <p className="text-secondary text-sm max-w-xs mx-auto">This menu is still being set up. Please check again later.</p>
          </div>
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
          onSuccess={(orderId) => {
            setShowPaymentModal(false);
            if (orderId) {
              setLastOrderId(orderId);
              pushOrderToHistory(orderId);
            }
            setOrderedSnapshot({ cart: [...cart], total: totalPrice });
            setCart([]);
            setOrderPlaced(true);
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* AI Waiter */}
      <AiWaiterPanel
        restaurantId={restaurantId}
        menuId={menuId}
        restaurantName={restaurantName}
        restaurantPhone={restaurantPhone}
        currency={menuStyle.currency ?? "RWF"}
        menuStyle={menuStyle}
        items={items}
        resolvedTableNumber={resolvedTableNumber}
        customerName={customerName}
        aiWaiterEnabled={aiWaiterEnabled}
        onTableNumberChange={setOrderTableNumber}
        onOrderPlaced={(orderId, cartItems, total) => {
          setLastOrderId(orderId);
          pushOrderToHistory(orderId);
          setOrderedSnapshot({ cart: cartItems, total });
          setOrderPlaced(true);
          setIsCartOpen(true);
        }}
      />

      {/* Service Pager */}
      <ServicePager
        restaurantId={restaurantId}
        resolvedTableNumber={resolvedTableNumber}
        orderTableNumber={orderTableNumber}
        onOrderTableNumberChange={setOrderTableNumber}
      />

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
              <svg className="fill-current w-5 h-5" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="font-[var(--font-headline)] font-bold tracking-tight text-sm opacity-90">Order via WhatsApp</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Cart Sheet ── */}
      <CartSheet
        isOpen={isCartOpen}
        cart={cart}
        totalItems={totalItems}
        totalPrice={totalPrice}
        orderPlaced={orderPlaced}
        orderedSnapshot={orderedSnapshot}
        resolvedTableNumber={resolvedTableNumber}
        customerName={customerName}
        orderTableNumber={orderTableNumber}
        currency={menuStyle.currency ?? "RWF"}
        menuStyle={menuStyle}
        paymentsEnabled={paymentsEnabled}
        isPlacingOrder={isPlacingOrder}
        isOffline={isOffline}
        lastWhatsAppUrl={lastWhatsAppUrl}
        lastOrderId={lastOrderId}
        isCancelling={isCancelling}
        upsellItems={upsellItems}
        slug={slug}
        tableFromUrl={tableFromUrl}
        onClose={closeCart}
        onPlaceOrder={placeOrder}
        onCancelOrder={handleCancelOrder}
        onIncrementQty={incrementQty}
        onDecrementQty={decrementQty}
        onAddToCart={addToCart}
        onCustomerNameChange={setCustomerName}
        onOrderTableNumberChange={setOrderTableNumber}
        orderNote={orderNote}
        showNoteField={showNoteField}
        onOrderNoteChange={setOrderNote}
        onShowNoteFieldChange={setShowNoteField}
        onShowPaymentModal={setShowPaymentModal}
        onTrackOrderClick={() => trackOrderClick(menuId, restaurantId, totalPrice)}
        rating={rating}
        hoverRating={hoverRating}
        reviewComment={reviewComment}
        reviewSubmitted={reviewSubmitted}
        isSubmittingReview={isSubmittingReview}
        onRatingChange={setRating}
        onHoverRatingChange={setHoverRating}
        onReviewCommentChange={setReviewComment}
        onSubmitReview={handleSubmitReview}
      />
    </div>
  );
}

