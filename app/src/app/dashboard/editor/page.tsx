"use client";
import NextImage from "next/image";
import { useMenu } from "@/context/MenuContext";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { StyleEditorSidebar } from "./StyleEditorSidebar";
import { MenuSectionsSidebar } from "./MenuSectionsSidebar";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/lib/supabase";

export default function MenuEditorPage() {
  const {
    categories,
    menuItems,
    menuStyle,
    setMenuStyle,
    addCategory,
    addItem,
    updateItem,
    removeItem,
    menuStatus,
    menuSlug,
    activeMenuId,
    activeMenuName,
    publishMenu,
    unpublishMenu,
    renameMenu,
    isSyncing,
  } = useMenu();

  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  // C4: use string | undefined, keep in sync when categories load
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);

  // C4: once categories are available, default-select the first/third one
  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[2]?.id || categories[0]?.id);
    }
  }, [categories, activeCategoryId]);

  useEffect(() => {
    if (containerRef.current) {
      const s = containerRef.current.style;
      s.setProperty('--primary-color', menuStyle.primaryColor);
      s.setProperty('--font-headline', menuStyle.headlineFont);
      s.setProperty('--font-body', menuStyle.bodyFont);
    }
  }, [menuStyle]);

  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const filteredItems = menuItems.filter(i => i.category === activeCategoryId);

  const handleRenameMenu = async () => {
    if (tempName.trim() && tempName !== activeMenuName && activeMenuId) {
      await renameMenu(activeMenuId, tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div 
      ref={containerRef}
      className="h-[calc(100vh)] flex flex-col overflow-hidden theme-transition"
    >
      {/* Top Bar */}
      <header className="bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 h-16 border-b border-surface-container/50 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/menus" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors text-secondary hover:text-primary">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="flex items-center gap-2 group relative">
            {isEditingName ? (
              <input
                autoFocus
                className="font-[var(--font-headline)] font-bold text-sm bg-surface-container-low border-none rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20 w-48"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleRenameMenu}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameMenu()}
              />
            ) : (
              <span 
                className="font-[var(--font-headline)] font-bold text-sm cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                onClick={() => { setTempName(activeMenuName); setIsEditingName(true); }}
                title="Click to rename menu"
              >
                {activeMenuName}
                <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
              </span>
            )}
          </div>
          <span className="text-xs text-secondary hidden sm:inline">• {activeCategory?.name || "No Selection"}</span>
        </div>
        <div className="flex items-center gap-3">
          {menuStatus === "published" && menuSlug && (
            <Link href={`/menu/${menuSlug}`} target="_blank" className="px-4 py-2 bg-tertiary-container/20 text-tertiary rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-tertiary-container/30 transition-all">
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              /menu/{menuSlug}
            </Link>
          )}
          {publishedSlug && (
            <span className="text-xs text-tertiary font-bold animate-pulse">Published!</span>
          )}
          {menuStatus === "published" ? (
            <button
              onClick={async () => { await unpublishMenu(); setPublishedSlug(null); }}
              disabled={isSyncing}
              className="px-4 py-2 bg-surface-container-highest rounded-xl font-bold text-sm text-on-surface hover:bg-surface-variant transition-all disabled:opacity-60">
              Unpublish
            </button>
          ) : (
            <button
              onClick={async () => {
                const slug = await publishMenu();
                if (slug) { setPublishedSlug(slug); setTimeout(() => setPublishedSlug(null), 3000); }
              }}
              disabled={isSyncing}
              className="px-6 py-2 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-60">
              Publish Menu
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Menu Sections */}
        <MenuSectionsSidebar 
          activeCategoryId={activeCategoryId} 
          setActiveCategoryId={setActiveCategoryId} 
        />

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
                src={filteredItems.find(i => i.image)?.image || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=300&fit=crop"} 
                fill 
                sizes="(max-width: 420px) 100vw, 420px"
                priority 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20 z-10"></div>
              <div className="absolute bottom-6 left-6 right-6 z-20">
                {/* H2: show real active category name */}
                <h1 className="text-white font-[var(--font-headline)] text-3xl font-black tracking-tight drop-shadow-lg">
                  {activeCategory?.name || "Select a Category"}
                </h1>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {filteredItems.map((item) => {
                const isExpanded = expandedItemId === item.id;
                return (
                  <div key={item.id} className={`relative group cursor-pointer -mx-2 px-2 py-3 rounded-2xl transition-all ${item.available === false ? "opacity-60 bg-surface-container-low" : "hover:bg-surface-container-low"}`}>
                    {/* Click header row to expand/collapse */}
                    <div
                      className="flex justify-between items-start mb-1"
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    >
                      <div className="flex-1">
                        <input 
                          className="font-[var(--font-headline)] font-extrabold text-lg bg-transparent border-none p-0 focus:ring-0 w-full"
                          value={item.name}
                          onChange={(e) => { e.stopPropagation(); updateItem(item.id, { name: e.target.value }); }}
                          onClick={(e) => e.stopPropagation()}
                          title="Item Name"
                          placeholder="Item Name"
                        />
                        {item.badge === "bestseller" && (
                          <span className="bg-[var(--primary-color)]/10 text-[var(--primary-color)] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Bestseller</span>
                        )}
                        {item.available === false && (
                          <span className="bg-error/10 text-error text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Sold Out</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <span className="font-[var(--font-headline)] font-bold text-[var(--primary-color)] text-lg">$</span>
                        <input 
                          type="number"
                          step="0.01"
                          className="font-[var(--font-headline)] font-bold text-[var(--primary-color)] text-lg bg-transparent border-none p-0 focus:ring-0 w-16 text-right"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                          title="Item Price"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <textarea 
                      className="text-sm text-on-surface-variant font-medium leading-relaxed italic bg-transparent border-none p-0 focus:ring-0 w-full resize-none h-auto overflow-hidden font-[var(--font-body)]"
                      value={item.description}
                      rows={2}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
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

                    {/* Expanded: availability toggle + image upload panel */}
                    {isExpanded && userId && (
                      <div className="mt-4 border-t border-outline-variant/20 pt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                        {/* Availability toggle */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-secondary">Availability</p>
                            <p className="text-[10px] text-secondary opacity-70">{item.available === false ? "Hidden from customers" : "Visible on menu"}</p>
                          </div>
                          <button
                            onClick={() => updateItem(item.id, { available: item.available === false ? true : false })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${item.available === false ? "bg-error/10 text-error" : "bg-tertiary/10 text-tertiary"}`}
                          >
                            {item.available === false ? "Mark Available" : "Mark Sold Out"}
                          </button>
                        </div>
                        {/* Image upload */}
                        <div>
                          <p className="text-xs font-bold text-secondary mb-2">Item Photo</p>
                          <ImageUpload
                            currentUrl={item.image || ""}
                            userId={userId}
                            folder="items"
                            onUpload={(url) => updateItem(item.id, { image: url })}
                          />
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                      className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-error hover:bg-error/10 rounded-full transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>

                    {/* Expand indicator */}
                    <span className={`absolute right-6 top-3 material-symbols-outlined text-sm text-secondary opacity-0 group-hover:opacity-100 transition-all ${isExpanded ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </div>
                );
              })}
              {/* C4: only show add button if a category is selected */}
              {activeCategoryId ? (
                <div 
                  onClick={() => addItem(activeCategoryId)}
                  className="border-2 border-dashed border-outline-variant/40 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary text-3xl">add_circle</span>
                  <span className="text-sm font-bold text-on-surface-variant">Add item to {activeCategory?.name}</span>
                </div>
              ) : (
                <div className="border-2 border-dashed border-outline-variant/20 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 text-center">
                  <span className="material-symbols-outlined text-secondary text-3xl">category</span>
                  <span className="text-sm font-bold text-secondary">Select a category to add items</span>
                </div>
              )}
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
        <StyleEditorSidebar />
      </div>
    </div>
  );
}
