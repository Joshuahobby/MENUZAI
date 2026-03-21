"use client";
import NextImage from "next/image";
import { useMenu } from "@/context/MenuContext";
import { useState, useEffect, useRef } from "react";

export default function MenuEditorPage() {
  const { 
    categories, 
    menuItems, 
    menuStyle, 
    setMenuStyle, 
    addCategory, 
    addItem, 
    updateItem, 
    removeItem 
  } = useMenu();

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState(categories[2]?.id || categories[0]?.id);

  useEffect(() => {
    if (containerRef.current) {
      const s = containerRef.current.style;
      s.setProperty('--primary-color', menuStyle.primaryColor);
      s.setProperty('--headline-font', menuStyle.headlineFont);
      s.setProperty('--body-font', menuStyle.bodyFont);
    }
  }, [menuStyle]);

  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const filteredItems = menuItems.filter(i => i.category === activeCategoryId);

  return (
    <div 
      ref={containerRef}
      className="h-[calc(100vh)] flex flex-col overflow-hidden theme-transition"
    >
      {/* Top Bar */}
      <header className="bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 h-16 border-b border-surface-container/50 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-[var(--font-headline)] font-bold text-sm">Menu Editor</span>
          <span className="text-xs text-secondary">• Signature Desserts</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-surface-container-highest rounded-xl font-bold text-sm text-on-surface hover:bg-surface-variant transition-all">
            Discard
          </button>
          <button className="px-6 py-2 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95">
            Publish Menu
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Menu Sections */}
        <aside className="w-72 bg-surface flex flex-col p-6 overflow-y-auto shrink-0 hidden lg:flex">
          <div className="mb-8">
            <h2 className="font-[var(--font-headline)] text-lg font-bold tracking-tight mb-2">Menu Sections</h2>
            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Digital Menu Structure</p>
          </div>
          <div className="space-y-4 mb-10">
            {categories.map((cat) => (
              <div key={cat.id} className="group cursor-grab active:cursor-grabbing" onClick={() => setActiveCategoryId(cat.id)}>
                <div className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer ${activeCategoryId === cat.id ? "bg-surface-container-low ring-2 ring-primary ring-offset-2" : "bg-surface-container-lowest shadow-sm hover:shadow-md border border-transparent hover:border-primary/10"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${activeCategoryId === cat.id ? "text-primary" : "text-secondary-container"}`}>
                      {activeCategoryId === cat.id ? "restaurant_menu" : "drag_indicator"}
                    </span>
                    <span className={`font-bold text-sm ${activeCategoryId === cat.id ? "text-primary" : ""}`}>{cat.name}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${activeCategoryId === cat.id ? "text-on-primary bg-primary-container" : "text-primary bg-primary-fixed"}`}>
                    {menuItems.filter(i => i.category === cat.id).length} items
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => {
              const name = prompt("Enter category name:");
              if (name) addCategory(name);
            }}
            className="w-full flex items-center justify-center gap-2 py-4 bg-surface-container-high rounded-2xl text-on-surface font-bold text-sm hover:bg-surface-container-highest transition-all group active:scale-95"
          >
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
            Add New Section
          </button>
          <div className="mt-auto pt-8 border-t border-outline-variant/20">
            <div className="bg-primary-container/5 rounded-3xl p-5 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-sm icon-fill">restaurant_menu</span>
                <span className="font-[var(--font-headline)] font-bold text-sm text-primary">AI Suggestions</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">Based on current trends, your &apos;Dessert&apos; category could benefit from a seasonal pairing.</p>
            </div>
          </div>
        </aside>

        {/* Center: Live Preview */}
        <section className="flex-1 bg-surface-container-low p-6 lg:p-10 flex flex-col items-center editor-canvas relative overflow-auto">
          {/* Smart Feature Chips */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { icon: "star", label: "Highlight Best Seller", color: "primary" },
              { icon: "trending_up", label: "Price Optimization (+10%)", color: "tertiary" },
              { icon: "error_outline", label: "Low performing item alert", color: "error" },
            ].map((chip) => (
              <div key={chip.label} className={`flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-${chip.color}/10 hover:scale-105 transition-transform cursor-pointer`}>
                <span className={`material-symbols-outlined text-${chip.color} text-lg ${chip.icon === "star" ? "icon-fill" : ""}`}>{chip.icon}</span>
                <span className={`text-xs font-bold ${chip.color !== "primary" ? `text-${chip.color}` : ""}`}>{chip.label}</span>
              </div>
            ))}
          </div>

          {/* Phone Frame Preview */}
          <div className="w-full max-w-[420px] bg-white rounded-[3rem] shadow-2xl overflow-y-auto border-[12px] border-on-surface flex flex-col min-h-[600px]">
            <div className="w-full h-56 relative overflow-hidden shrink-0">
              <NextImage 
                alt="Menu Header" 
                className="object-cover" 
                src="https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=300&fit=crop" 
                fill 
                sizes="(max-width: 420px) 100vw, 420px"
                priority 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20 z-10"></div>
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <h1 className="text-white font-[var(--font-headline)] text-3xl font-black tracking-tight drop-shadow-lg">Signature Desserts</h1>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="relative group cursor-pointer hover:bg-surface-container-low -mx-2 px-2 py-3 rounded-2xl transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <input 
                        className="font-[var(--headline-font)] font-extrabold text-lg bg-transparent border-none p-0 focus:ring-0 w-full"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        title="Item Name"
                        placeholder="Item Name"
                      />
                      {item.badge === "bestseller" && (
                        <span className="bg-[var(--primary-color)]/10 text-[var(--primary-color)] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Bestseller</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-[var(--headline-font)] font-bold text-[var(--primary-color)] text-lg">$</span>
                      <input 
                        type="number"
                        step="0.01"
                        className="font-[var(--headline-font)] font-bold text-[var(--primary-color)] text-lg bg-transparent border-none p-0 focus:ring-0 w-16 text-right"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                        title="Item Price"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <textarea 
                    className="text-sm text-on-surface-variant font-medium leading-relaxed italic bg-transparent border-none p-0 focus:ring-0 w-full resize-none h-auto overflow-hidden font-[var(--body-font)]"
                    value={item.description}
                    rows={2}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    title="Item Description"
                    placeholder="Description..."
                  />
                  {item.tags.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className="bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">{tag}</span>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-error hover:bg-error/10 rounded-full transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
              <div 
                onClick={() => addItem(activeCategoryId!)}
                className="border-2 border-dashed border-outline-variant/40 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-primary text-3xl">add_circle</span>
                <span className="text-sm font-bold text-on-surface-variant">Add item to {activeCategory?.name}</span>
              </div>
            </div>
          </div>

          {/* Viewport Controls */}
          <div className="mt-6 flex items-center gap-1 bg-surface-container-highest p-1 rounded-full shadow-lg">
            <button className="p-3 rounded-full bg-white shadow-sm text-primary"><span className="material-symbols-outlined">smartphone</span></button>
            <button className="p-3 rounded-full text-on-surface-variant hover:bg-white/50 transition-all"><span className="material-symbols-outlined">tablet</span></button>
            <button className="p-3 rounded-full text-on-surface-variant hover:bg-white/50 transition-all"><span className="material-symbols-outlined">desktop_windows</span></button>
          </div>
        </section>

        {/* Right Panel: Style Settings */}
        <aside className="w-72 bg-surface flex flex-col p-6 overflow-y-auto shrink-0 hidden xl:flex">
          <div className="mb-8">
            <h2 className="font-[var(--font-headline)] text-lg font-bold tracking-tight mb-2">Style Editor</h2>
            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Global Brand Identity</p>
          </div>
          <div className="space-y-8">
            {/* Typography */}
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Typography</label>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-2 block" htmlFor="headline-font">Headlines</label>
                  <select 
                    id="headline-font" 
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    value={menuStyle.headlineFont}
                    onChange={(e) => setMenuStyle({ ...menuStyle, headlineFont: e.target.value })}
                    title="Select Headline Typography" aria-label="Select Headline Typography"
                  >
                    <option>Plus Jakarta Sans</option>
                    <option>Poppins</option>
                    <option>Playfair Display</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-2 block" htmlFor="body-font">Body Text</label>
                  <select 
                    id="body-font" 
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    value={menuStyle.bodyFont}
                    onChange={(e) => setMenuStyle({ ...menuStyle, bodyFont: e.target.value })}
                    title="Select Body Typography" aria-label="Select Body Typography"
                  >
                    <option>Inter</option>
                    <option>Montserrat</option>
                    <option>Open Sans</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Colors */}
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Color Palette</label>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { name: "Orange", hex: "#FF6B00" },
                  { name: "Black", hex: "#1E1E1E" },
                  { name: "Green", hex: "#00C853" },
                  { name: "Blue", hex: "#0070F3" },
                  { name: "Purple", hex: "#7928CA" }
                ].map((color) => (
                  <button 
                    key={color.hex}
                    className={`w-full aspect-square rounded-full flex items-center justify-center transition-all ${menuStyle.primaryColor === color.hex ? "ring-4 ring-primary/20 ring-offset-2 scale-110" : "hover:scale-110"} ${
                      color.hex === "#FF6B00" ? "bg-[#FF6B00]" :
                      color.hex === "#1E1E1E" ? "bg-[#1E1E1E]" :
                      color.hex === "#00C853" ? "bg-[#00C853]" :
                      color.hex === "#0070F3" ? "bg-[#0070F3]" :
                      "bg-[#7928CA]"
                    }`}
                    onClick={() => setMenuStyle({ ...menuStyle, primaryColor: color.hex })}
                    title={color.name}
                  >
                    {menuStyle.primaryColor === color.hex && <span className="material-symbols-outlined text-white text-xs">check</span>}
                  </button>
                ))}
              </div>
            </div>
            {/* Presets */}
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Style Presets</label>
              <div className="grid grid-cols-2 gap-2">
                <button className="h-12 bg-primary/10 text-primary border-2 border-primary/20 rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all">Editorial</button>
                <button className="h-12 bg-surface-container-low text-on-surface-variant rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-high active:scale-95 transition-all">Minimal</button>
              </div>
            </div>
            {/* Layout */}
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Layout Grid</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-container-high rounded-xl flex flex-col items-center gap-2 cursor-pointer border-2 border-primary">
                  <span className="material-symbols-outlined text-primary">view_stream</span>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Single Column</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl flex flex-col items-center gap-2 cursor-pointer hover:bg-surface-container-high transition-all">
                  <span className="material-symbols-outlined text-secondary">view_module</span>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Two Column</span>
                </div>
              </div>
            </div>
            {/* Density Slider */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em]" htmlFor="density-slider">Density</label>
                <span className="text-xs font-bold text-primary">Relaxed</span>
              </div>
              <input id="density-slider" type="range" className="w-full h-1.5 bg-surface-container-low rounded-full appearance-none cursor-pointer accent-primary" 
                title="Layout Density" aria-label="Layout Density" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
