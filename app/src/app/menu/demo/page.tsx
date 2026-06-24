"use client";

import { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { DemoBanner } from "@/components/DemoBanner";
import { BackToTop } from "@/components/BackToTop";
import {
  menuItems as MOCK_ITEMS,
  categories as MOCK_CATEGORIES,
  restaurant as MOCK_RESTAURANT,
} from "@/data/mockData";
import type { MenuItem } from "@/types/menu";

interface CartItem { id: string; name: string; price: number; quantity: number; }
interface ChatMsg { role: "ai" | "user"; text: string; }

const DEMO_STYLE = {
  primaryColor:  "#a04100",
  headlineFont:  "Plus Jakarta Sans",
  bodyFont:      "Inter",
  borderRadius:  "1.5rem",
  layoutDensity: "comfortable" as const,
  currency:      "RWF",
};

// Convert USD prices from mockData to RWF for demo (×1000)
const ITEMS: MenuItem[] = MOCK_ITEMS.map(item => ({ ...item, price: item.price * 1000 }));

// Simple keyword-based AI Waiter responses for the demo (no API calls)
function getDemoAiReply(input: string): string {
  const q = input.toLowerCase();
  if (q.match(/popular|best|recommend|top/))
    return "Our most popular dish right now is the **Truffle Ribeye Steak** 🥩 — guests absolutely love it! The Menuza Royale burger is also a crowd favourite. Shall I add either to your cart?";
  if (q.match(/vegetarian|vegan|plant/))
    return "Great news — we have excellent plant-based options! The **Superfood Bowl** (quinoa, avocado, roasted chickpeas) and the **Garden Margherita** are both favourites. Would you like to try one?";
  if (q.match(/cheap|budget|affordable|price|cost/))
    return "Our most affordable options start from 8,000 RWF for beverages and 14,000 RWF for desserts. The **Molten Lava Cake** at 14,000 RWF is a steal — many guests order it even when full! 😄";
  if (q.match(/dessert|sweet|cake|chocolate/))
    return "For desserts, I highly recommend the **Molten Lava Cake** 🍫 — warm chocolate centre, vanilla ice cream on the side. Divine! The Yuzu Cheesecake is also very popular. Want me to add one?";
  if (q.match(/drink|beverage|water|wine|juice|cocktail/))
    return "We have a great selection! The **Summer Spritz** (Prosecco + Aperol) is our bestselling cocktail, and we also have still/sparkling water, fresh juices, and a curated wine list. What sounds good?";
  if (q.match(/order|add|want|take|get/))
    return "I'd be happy to help you order! 🛎️ Just tell me what you'd like and I'll guide you through it. You can also tap **Add to Cart** directly on any item below.";
  if (q.match(/hello|hi|hey|good|morning|evening|night/))
    return "Good evening! 🌙 Welcome to Le Bistro — I'm your AI Digital Waiter. I can help you choose dishes, answer questions about ingredients, or take your order. What are you in the mood for tonight?";
  if (q.match(/allergen|allergy|gluten|nut|dairy|lactose/))
    return "I take allergies seriously! Our **Superfood Bowl** and **Mediterranean Salmon** are gluten-free. Please mention any allergies when ordering and our kitchen will accommodate you. Want to see the full allergen list?";
  return "Great question! 🍽️ Our menu changes seasonally, but right now the **Truffle Ribeye** and **Mediterranean Salmon** are getting the most praise. Is there anything specific I can help you find?";
}

// Filter out hidden categories for the demo
const VISIBLE_CATEGORIES = MOCK_CATEGORIES.filter(c => !c.hidden);

export default function CustomerMenuPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState(VISIBLE_CATEGORIES[0]?.id ?? "");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: "ai", text: "Good evening! Welcome to Le Bistro 🍽️ I'm your AI Digital Waiter. Ask me anything — what dishes are popular, allergen info, or just tell me what you're in the mood for!" },
  ]);
  const [aiTyping, setAiTyping] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty("--primary-color", DEMO_STYLE.primaryColor);
      containerRef.current.style.setProperty("--font-headline", DEMO_STYLE.headlineFont);
      containerRef.current.style.setProperty("--font-body", DEMO_STYLE.bodyFont);
      containerRef.current.style.setProperty("--border-radius", DEMO_STYLE.borderRadius);
    }
  }, []);

  const filtered = ITEMS.filter(i => {
    if (i.category !== activeCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
  });
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const handleOrderClick = () => {
    const query = new URLSearchParams({
      items: encodeURIComponent(JSON.stringify(cart)),
      phone: MOCK_RESTAURANT.phone,
      menuId: "demo",
      restaurantId: "demo",
      currency: DEMO_STYLE.currency,
      table: "",
    }).toString();
    router.push(`/menu/demo/order?${query}`);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-surface text-on-surface pb-32 theme-transition"
    >
      <DemoBanner role="customer" restaurantName={MOCK_RESTAURANT.name} />

      {/* Header */}
      <header className="w-full sticky top-10 z-50 bg-surface/95 backdrop-blur-xl flex justify-between items-center px-6 h-20">
        <div className="flex flex-col">
          <span className="text-2xl font-[var(--font-headline)] font-black tracking-tighter text-[var(--primary-color)]">
            {MOCK_RESTAURANT.name}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary -mt-1 font-[var(--font-body)]">
            {MOCK_RESTAURANT.tagline}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(""); }}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${searchOpen ? "bg-primary/10 text-primary" : "hover:bg-surface-container-low text-on-surface-variant"}`}
            aria-label={searchOpen ? "Close search" : "Search menu"}
          >
            <span className="material-symbols-outlined">{searchOpen ? "close" : "search"}</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-sm">person</span>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="px-6 py-3 sticky top-[100px] z-50 bg-surface border-b border-surface-container">
          <div className="relative max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu items..."
              className="w-full bg-surface-container-low rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
              aria-label="Search menu items"
            />
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <nav className="sticky top-[120px] z-40 bg-surface/95 backdrop-blur-sm py-4 overflow-x-auto hide-scrollbar">
        <div className="flex px-6 gap-3">
          {VISIBLE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2.5 font-[var(--font-headline)] font-bold text-sm whitespace-nowrap transition-all duration-300 rounded-[var(--border-radius)] cursor-pointer ${
                activeCategory === cat.id
                  ? "text-white shadow-lg bg-[var(--primary-color)]"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-6 pt-4 space-y-8">
        {/* Hero Banner — first category */}
        {activeCategory === VISIBLE_CATEGORIES[0]?.id && (
          <section className="relative h-48 overflow-hidden group rounded-[var(--border-radius)]">
            <NextImage
              alt="Featured Dish"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              src="https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&h=400&fit=crop"
              fill
              sizes="(max-width: 1024px) 100vw, 800px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 z-10">
              <span className="inline-block px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 w-fit">
                Chef&apos;s Pick
              </span>
              <h2 className="text-white font-[var(--font-headline)] text-2xl font-extrabold tracking-tight">
                Truffle Ribeye Steak
              </h2>
              <p className="text-white/80 text-xs mt-1 italic">Limited availability for dinner service</p>
            </div>
          </section>
        )}

        {/* Menu Items */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-[var(--font-headline)] text-xl font-extrabold tracking-tight capitalize">
              {VISIBLE_CATEGORIES.find(c => c.id === activeCategory)?.name ?? activeCategory}
            </h3>
            <span className="text-[var(--primary-color)] font-[var(--font-headline)] text-xs font-bold uppercase tracking-widest">
              {filtered.length} items
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-secondary">
              <span className="material-symbols-outlined text-4xl mb-3 block text-secondary/30">menu_book</span>
              <p className="text-sm">No items in this category yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest overflow-hidden flex flex-col shadow-sm border border-outline-variant/10 rounded-[var(--border-radius)]"
                >
                  <div className="relative h-52">
                    <NextImage
                      alt={item.name}
                      className="object-cover"
                      src={item.image ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop"}
                      fill
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 z-10 shadow-sm rounded-xl">
                      <span className="font-[var(--font-headline)] font-extrabold text-lg text-[var(--primary-color)]">
                        {formatPrice(item.price, DEMO_STYLE.currency)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-[var(--font-headline)] text-lg font-extrabold">{item.name}</h4>
                      {item.badge && (
                        <div className={`flex items-center gap-1 ${item.badge === "healthy" ? "text-tertiary" : "text-[var(--primary-color)]"}`}>
                          <span className="material-symbols-outlined icon-fill text-[18px]">
                            {item.badge === "healthy" ? "eco" : item.badge === "popular" ? "local_fire_department" : "star"}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-tighter capitalize">{item.badge}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-on-surface-variant text-sm leading-relaxed mb-6 font-medium opacity-80">
                      {item.description}
                    </p>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-full text-white font-[var(--font-headline)] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:opacity-90 bg-[var(--primary-color)] rounded-[var(--border-radius)] premium-shadow py-4 mt-auto cursor-pointer"
                    >
                      Add to Cart
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BackToTop />

      {/* AI Waiter FAB */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-36 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all"
          title="Chat with AI Waiter"
        >
          <span className="material-symbols-outlined text-2xl icon-fill">robot_2</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-tertiary rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* AI Waiter Chat Panel */}
      {chatOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm sm:rounded-[2rem] shadow-2xl flex flex-col h-[70vh] sm:h-[520px] overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="bg-primary px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-lg icon-fill">robot_2</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">AI Digital Waiter</p>
                <p className="text-white/60 text-[9px] uppercase tracking-widest font-black">Le Bistro · Demo</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-white text-sm">close</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-lowest">
              {chatMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "items-end gap-2"}`}>
                  {m.role === "ai" && (
                    <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-xs icon-fill">robot_2</span>
                    </div>
                  )}
                  <div className={`max-w-[78%] px-4 py-3 text-xs leading-relaxed rounded-2xl ${m.role === "ai" ? "bg-surface-container rounded-bl-sm text-on-surface" : "bg-primary text-white rounded-br-sm"}`}>
                    {m.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                  </div>
                </div>
              ))}
              {aiTyping && (
                <div className="flex items-end gap-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-xs icon-fill">robot_2</span>
                  </div>
                  <div className="bg-surface-container px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                    {[0,1,2].map(d => <span key={d} className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-surface-container-lowest border-t border-surface-container flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key !== "Enter" || !chatInput.trim() || aiTyping) return;
                  const msg = chatInput.trim();
                  setChatInput("");
                  setChatMsgs(prev => [...prev, { role: "user", text: msg }]);
                  setAiTyping(true);
                  setTimeout(() => {
                    setChatMsgs(prev => [...prev, { role: "ai", text: getDemoAiReply(msg) }]);
                    setAiTyping(false);
                  }, 900 + Math.random() * 600);
                }}
                placeholder="Ask about the menu…"
                className="flex-1 bg-surface-container rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={() => {
                  if (!chatInput.trim() || aiTyping) return;
                  const msg = chatInput.trim();
                  setChatInput("");
                  setChatMsgs(prev => [...prev, { role: "user", text: msg }]);
                  setAiTyping(true);
                  setTimeout(() => {
                    setChatMsgs(prev => [...prev, { role: "ai", text: getDemoAiReply(msg) }]);
                    setAiTyping(false);
                  }, 900 + Math.random() * 600);
                }}
                className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0 hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-white text-sm">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart / WhatsApp CTA */}
      <div className="fixed bottom-0 left-0 w-full p-6 z-50 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          {totalItems > 0 ? (
            <button
              onClick={handleOrderClick}
              className="w-full h-16 bg-whatsapp hover:bg-whatsapp-dark text-white flex items-center justify-center gap-3 shadow-[0_12px_40px_rgba(37,211,102,0.4)] active:scale-95 transition-all rounded-[var(--border-radius)] cursor-pointer"
            >
              <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="font-[var(--font-headline)] font-extrabold tracking-tight uppercase text-sm">
                Order via WhatsApp ({totalItems}) — {formatPrice(totalPrice, DEMO_STYLE.currency)}
              </span>
            </button>
          ) : (
            <div className="w-full h-16 bg-surface-container-high border border-black/8 rounded-[var(--border-radius)] flex items-center justify-center">
              <p className="text-sm text-secondary font-medium">Add items to start your order</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
