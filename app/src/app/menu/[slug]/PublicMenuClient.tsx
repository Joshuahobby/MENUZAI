"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { trackMenuView, trackItemView, trackOrderClick, trackQRScan } from "@/lib/analytics";
import type { MenuItem, MenuCategory, MenuStyle, CartItem } from "@/types/menu";
import { defaultStyle } from "@/store/menuStore";
import { formatPrice, getOptimizedImageUrl } from "@/lib/utils";

interface PublicMenuClientProps {
  menuId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantPhone: string;
  restaurantLogoUrl: string;
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

export default function PublicMenuClient(props: PublicMenuClientProps) {
  const {
    menuId,
    restaurantId,
    restaurantName,
    restaurantPhone,
    restaurantLogoUrl,
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [assistantMessages]);

  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim() || isAssistantLoading) return;

    const userMsg = assistantInput.trim();
    setAssistantInput("");
    setAssistantMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsAssistantLoading(true);

    // Add an empty assistant message placeholder that we will stream into
    setAssistantMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai-waiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...assistantMessages, { role: "user", content: userMsg }].slice(-5),
          menuItems: items.map(i => ({ name: i.name, description: i.description, price: i.price, tags: i.tags })),
          restaurantName,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream unavailable");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Append each chunk to the last assistant message in-place
        setAssistantMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      }
    } catch {
      setAssistantMessages(prev => {
        const next = [...prev];
        // Replace the empty placeholder with the fallback message
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

  // Track menu view once per session
  useEffect(() => {
    trackMenuView(menuId, restaurantId);
    if (searchParams.get("src") === "qr") {
      trackQRScan(menuId, restaurantId);
    }
  }, [menuId, restaurantId, searchParams]);

  // Real-time synchronization
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
          
          if (updated.status === 'draft') {
            // If menu is unpublished while customer is viewing, we could redirect or show a message
            // For now, we'll just stop updating
            return;
          }

          if (updated.categories) setCategories(updated.categories.filter((c: MenuCategory) => !c.hidden));
          if (updated.items) setItems(updated.items);
          if (updated.style) setStyleProp(updated.style);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [menuId]);

  useEffect(() => {
    if (containerRef.current) {
      const canvasStyle = containerRef.current.style;
      canvasStyle.setProperty("--primary-color", menuStyle.primaryColor);
      canvasStyle.setProperty("--font-headline", menuStyle.headlineFont);
      canvasStyle.setProperty("--font-body", menuStyle.bodyFont);
      canvasStyle.setProperty("--border-radius", menuStyle.borderRadius);
    }
  }, [menuStyle]);

  const visibleCategoryIds = new Set(categories.map(c => c.id));
  const filtered = items.filter((i) => {
    // 1. Category check
    const matchesCategory = searchQuery.trim()
      ? visibleCategoryIds.has(i.category)
      : i.category === activeCategory;

    // 2. Search check
    const matchesSearch = !searchQuery.trim() ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase());

    // 3. Tags check
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(selTag => 
        i.tags && i.tags.some(itemTag => itemTag.toLowerCase().trim() === selTag.toLowerCase().trim())
      );

    return matchesCategory && matchesSearch && matchesTags;
  });
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

  const router = useRouter();

  const handleOrderClick = () => {
    trackOrderClick(menuId, restaurantId, totalPrice);
    const query = new URLSearchParams({
      items: encodeURIComponent(JSON.stringify(cart)),
      phone: restaurantPhone,
      menuId,
      restaurantId,
      currency: menuStyle.currency ?? "RWF",
      table: tableFromUrl,
    }).toString();
    router.push(`/menu/${slug}/order?${query}`);
  };

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
        {/* Search bar — slides in */}
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
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2.5 font-[var(--font-headline)] font-bold text-sm whitespace-nowrap transition-all duration-300 rounded-[var(--border-radius)] ${activeCategory === cat.id
                ? "text-white shadow-lg bg-[var(--primary-color)]"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Dietary Filters horizontal scroll */}
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

      <main className="px-6 pt-4 space-y-8">
        {/* Hero Banner for first category */}
        {activeCategory === categories[0]?.id && filtered[0] && (
          <section className="relative h-48 overflow-hidden group rounded-[var(--border-radius)]">
            <NextImage
              alt="Featured Dish"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              src={getOptimizedImageUrl(filtered[0].image || "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&h=400&fit=crop", 800)}
              fill
              sizes="(max-width: 1024px) 100vw, 800px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 z-10">
              <h2 className="text-white font-[var(--font-headline)] text-2xl font-extrabold tracking-tight">{filtered[0].name}</h2>
              <p className="text-white/80 text-xs mt-1 italic">{filtered[0].description}</p>
            </div>
          </section>
        )}

        {/* Menu Items */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-[var(--font-headline)] text-xl font-extrabold tracking-tight capitalize">
              {searchQuery.trim()
                ? `Results for "${searchQuery}"`
                : categories.find(c => c.id === activeCategory)?.name || activeCategory}
            </h3>
            {searchQuery.trim() && (
              <span className="text-xs text-secondary font-bold">{filtered.length} found</span>
            )}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-secondary">
              <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">search_off</span>
              <p className="font-bold">No dishes found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}
          {/* Grid layout driven by layoutDensity:
               compact    → 2-col on md, 3-col on lg (small cards)
               comfortable → single column, max-w-2xl (standard)
               spacious   → single column, max-w-xl, extra card padding */}
          <div className={
            menuStyle.layoutDensity === "compact"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : menuStyle.layoutDensity === "spacious"
              ? "grid grid-cols-1 gap-8 max-w-xl mx-auto"
              : "grid grid-cols-1 gap-6 max-w-2xl mx-auto"
          }>
            {filtered.map((item) => (
              <div key={item.id} className={`bg-surface-container-lowest overflow-hidden flex flex-col shadow-sm border border-outline-variant/10 rounded-[var(--border-radius)] relative ${item.available === false ? "opacity-60" : ""}`}>
                {/* Image — shorter in compact mode */}
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
                  {/* Gallery Indicator */}
                  {item.gallery && item.gallery.length > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 z-20">
                      <span className="material-symbols-outlined text-[12px]">collections</span>
                      <span>+{item.gallery.length}</span>
                    </div>
                  )}
                </div>

                {/* Extra Gallery Photos (Horizontal Scroll) */}
                {item.gallery && item.gallery.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-surface-container-low hide-scrollbar">
                    {item.gallery.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-outline-variant/10">
                        <NextImage src={url} alt={`${item.name} gallery ${idx}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Body — less padding in compact, more in spacious */}
                <div className={`flex flex-col ${menuStyle.layoutDensity === "compact" ? "p-4" : menuStyle.layoutDensity === "spacious" ? "p-8" : "p-6"}`}>
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
                  {/* Dietary Tags for the item */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3.5 mt-1">
                      {item.tags.map((tag) => {
                        const meta = getTagMeta(tag);
                        return (
                          <span 
                            key={tag} 
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${meta.color}`}
                          >
                            <span className="material-symbols-outlined text-[11px]">{meta.icon}</span>
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {/* Hide description in compact mode to save space */}
                  {menuStyle.layoutDensity !== "compact" && (
                    <p className="text-on-surface-variant text-sm leading-relaxed mb-6 font-medium opacity-80 font-[var(--font-body)]">{item.description}</p>
                  )}
                  <button
                    onClick={() => item.available !== false && addToCart(item)}
                    disabled={item.available === false}
                    className={`w-full text-white font-[var(--font-headline)] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:opacity-90 bg-[var(--primary-color)] rounded-[var(--border-radius)] premium-shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${menuStyle.layoutDensity === "compact" ? "py-2.5 text-sm mt-2" : "py-4 mt-auto"}`}
                  >
                    {item.available === false ? "Sold Out" : "Add to Cart"}
                    {item.available !== false && <span className="material-symbols-outlined text-lg">add_circle</span>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* AI Assistant FAB */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all animate-bounce-slow"
        title="Ask the AI Waiter"
      >
        <span className="material-symbols-outlined text-2xl icon-fill">robot_2</span>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-tertiary rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* AI Assistant Modal */}
      {isAssistantOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface w-full max-w-lg sm:rounded-[2.5rem] shadow-2xl flex flex-col h-[80vh] sm:h-[600px] overflow-hidden animate-in slide-in-from-bottom duration-500">
            {/* Header */}
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

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-container-lowest custom-scrollbar"
            >
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

            {/* Input */}
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

      {/* Floating Cart / WhatsApp CTA */}
      <div className="fixed bottom-0 left-0 w-full p-6 z-50 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          {totalItems > 0 ? (
            <div className="flex flex-col gap-3">
              {/* Simple Upsell Strip */}
              {(() => {
                // Find 3 items from different categories than active one (usually sides/drinks)
                const upsellItems = items.filter(i => i.category !== activeCategory && !cart.some(c => c.id === i.id)).slice(0, 3);
                if (upsellItems.length === 0) return null;
                return (
                  <div className="bg-surface/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-500">
                    <span className="text-[10px] font-black uppercase text-secondary tracking-widest shrink-0">Pairs well with</span>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                      {upsellItems.map(ui => (
                        <button 
                          key={ui.id}
                          onClick={() => addToCart(ui)}
                          className="flex items-center gap-2 bg-surface-container-highest px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-primary/10 transition-colors group"
                        >
                          <span className="text-[10px] font-bold">{ui.name}</span>
                          <span className="material-symbols-outlined text-[14px] text-primary group-hover:scale-110 transition-transform">add_circle</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}

              <button
                onClick={handleOrderClick}
                className="w-full h-16 bg-whatsapp hover:bg-whatsapp-dark text-white flex items-center justify-center gap-3 shadow-[0_12px_40px_rgba(37,211,102,0.4)] active:scale-95 transition-all rounded-[var(--border-radius)]"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span className="font-[var(--font-headline)] font-extrabold tracking-tight uppercase text-sm">
                  Review Order ({totalItems}) — {formatPrice(totalPrice, menuStyle.currency ?? "RWF")}
                </span>
              </button>
            </div>
          ) : (
            <div className="w-full h-16 bg-whatsapp/60 text-white rounded-full flex items-center justify-center gap-3 shadow-lg">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span className="font-[var(--font-headline)] font-extrabold tracking-tight uppercase text-sm">Order via WhatsApp</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
