"use client";

import { useMenu, MenuItem } from "@/context/MenuContext";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { DemoBanner } from "@/components/DemoBanner";

interface CartItem { id: string; name: string; price: number; quantity: number; }

export default function CustomerMenuPage() {
  const { menuItems, categories, menuStyle, restaurantName, restaurantPhone } = useMenu();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "specials");
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      const canvasStyle = containerRef.current.style;
      canvasStyle.setProperty('--primary-color', menuStyle.primaryColor);
      canvasStyle.setProperty('--font-headline', menuStyle.headlineFont);
      canvasStyle.setProperty('--font-body', menuStyle.bodyFont);
      canvasStyle.setProperty('--border-radius', menuStyle.borderRadius);
    }
  }, [menuStyle]);

  const filtered = menuItems.filter((i) => i.category === activeCategory);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const router = useRouter();

  const handleOrderClick = () => {
    const query = new URLSearchParams({
      items: encodeURIComponent(JSON.stringify(cart)),
      phone: restaurantPhone || "250780000000",
      menuId: "demo",
      restaurantId: "demo",
      currency: menuStyle.currency ?? "RWF",
      table: "",
    }).toString();
    router.push(`/menu/demo/order?${query}`);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-surface text-on-surface pb-32 theme-transition"
    >
      <DemoBanner role="customer" restaurantName={restaurantName || "Le Bistro Demo"} />

      {/* Header */}
      <header className="w-full sticky top-0 z-50 bg-surface/95 backdrop-blur-xl flex justify-between items-center px-6 h-20">
        <div className="flex flex-col">
          <Link href="/" className="text-2xl font-[var(--font-headline)] font-black tracking-tighter text-[var(--primary-color)]">MENUZA AI</Link>
          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary -mt-1 font-[var(--font-body)]">{restaurantName}</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-sm">person</span>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <nav className="sticky top-20 z-40 bg-surface/95 backdrop-blur-sm py-4 overflow-x-auto hide-scrollbar">
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
      </nav>

      <main className="px-6 pt-4 space-y-8">
        {/* Hero Banner (Only shown for first category as 'Specials') */}
        {activeCategory === categories[0]?.id && (
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
              <h2 className="text-white font-[var(--font-headline)] text-2xl font-extrabold tracking-tight">Truffle Ribeye Steak</h2>
              <p className="text-white/80 text-xs mt-1 italic">Limited availability for dinner service</p>
            </div>
          </section>
        )}

        {/* Menu Items */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-[var(--font-headline)] text-xl font-extrabold tracking-tight capitalize">{categories.find(c => c.id === activeCategory)?.name || activeCategory}</h3>
            <span className="text-[var(--primary-color)] font-[var(--font-headline)] text-xs font-bold uppercase tracking-widest">See All</span>
          </div>
          <div className={
            menuStyle.layoutDensity === "compact"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : menuStyle.layoutDensity === "spacious"
              ? "grid grid-cols-1 gap-8 max-w-xl mx-auto"
              : "grid grid-cols-1 gap-6 max-w-2xl mx-auto"
          }>
            {filtered.map((item) => (
              <div key={item.id} className="bg-surface-container-lowest overflow-hidden flex flex-col shadow-sm border border-outline-variant/10 rounded-[var(--border-radius)]">
                <div className={`relative ${menuStyle.layoutDensity === "compact" ? "h-36" : "h-52"}`}>
                  <NextImage alt={item.name} className="object-cover" src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop"} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px" />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 z-10 shadow-sm rounded-[calc(var(--border-radius)/2)]">
                    <span className="font-[var(--font-headline)] font-extrabold text-lg text-[var(--primary-color)]">{formatPrice(item.price, menuStyle.currency ?? "RWF")}</span>
                  </div>
                </div>
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
                  {menuStyle.layoutDensity !== "compact" && (
                    <p className="text-on-surface-variant text-sm leading-relaxed mb-6 font-medium opacity-80 font-[var(--font-body)]">{item.description}</p>
                  )}
                  <button
                    onClick={() => addToCart(item)}
                    className={`w-full text-white font-[var(--font-headline)] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:opacity-90 bg-[var(--primary-color)] rounded-[var(--border-radius)] premium-shadow ${menuStyle.layoutDensity === "compact" ? "py-2.5 text-sm mt-2" : "py-4 mt-auto"}`}
                  >
                    Add to Cart
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Floating Cart / WhatsApp CTA */}
      <div className="fixed bottom-0 left-0 w-full p-6 z-50 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          {totalItems > 0 ? (
            <button onClick={handleOrderClick}
              className="w-full h-16 bg-whatsapp hover:bg-whatsapp-dark text-white flex items-center justify-center gap-3 shadow-[0_12px_40px_rgba(37,211,102,0.4)] active:scale-95 transition-all rounded-[var(--border-radius)]"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span className="font-[var(--font-headline)] font-extrabold tracking-tight uppercase text-sm">
                Order via WhatsApp ({totalItems}) — {formatPrice(totalPrice, menuStyle.currency ?? "RWF")}
              </span>
            </button>
          ) : (
            <button className="w-full h-16 bg-whatsapp hover:bg-whatsapp-dark text-white rounded-full flex items-center justify-center gap-3 shadow-[0_12px_40px_rgba(37,211,102,0.4)] active:scale-95 transition-all opacity-60">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.71 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span className="font-[var(--font-headline)] font-extrabold tracking-tight uppercase text-sm">Order via WhatsApp</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
