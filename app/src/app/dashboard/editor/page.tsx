"use client";
import NextImage from "next/image";
import { useMenu } from "@/context/MenuContext";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { StyleEditorSidebar } from "./StyleEditorSidebar";
import { MenuSectionsSidebar } from "./MenuSectionsSidebar";
import { ImageUpload } from "@/components/ImageUpload";
import { prompt } from "@/components/Modals";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Viewport = "mobile" | "tablet" | "desktop";

const VIEWPORT_CONFIG: Record<Viewport, { width: string; rounded: string; border: string; minH: string }> = {
  mobile:  { width: "max-w-[420px]",  rounded: "rounded-[3rem]", border: "border-[12px] border-on-surface", minH: "min-h-[600px]" },
  tablet:  { width: "max-w-[680px]",  rounded: "rounded-[2rem]", border: "border-[8px] border-on-surface/60",  minH: "min-h-[500px]" },
  desktop: { width: "max-w-[900px]",  rounded: "rounded-xl",     border: "border border-surface-container",    minH: "min-h-[500px]" },
};

const BADGES = ["bestseller", "popular", "healthy", "chefs-pick", "new"] as const;

export default function MenuEditorPage() {
  const {
    categories,
    menuItems,
    menuStyle,
    addItem,
    updateItem,
    removeItem,
    duplicateItem,
    publishMenu,
    unpublishMenu,
    renameMenu,
    menuStatus,
    menuSlug,
    activeMenuId,
    activeMenuName,
    isSyncing,
    isLoading,
  } = useMenu();

  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("mobile");
  const [isStyleSidebarOpen, setIsStyleSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);

  // Default to first category once loaded
  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setTimeout(() => setActiveCategoryId(categories[0]?.id), 0);
    }
  }, [categories, activeCategoryId]);

  // If active category was deleted, fall back to first
  useEffect(() => {
    if (activeCategoryId && !categories.find((c) => c.id === activeCategoryId)) {
      setTimeout(() => setActiveCategoryId(categories[0]?.id), 0);
    }
  }, [categories, activeCategoryId]);

  // Apply CSS vars for live style preview
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.style.setProperty("--primary-color", menuStyle.primaryColor);
      el.style.setProperty("--secondary-color", menuStyle.secondaryColor);
      el.style.setProperty("--bg-color", menuStyle.backgroundColor);
      el.style.setProperty("--font-headline", menuStyle.headlineFont);
      el.style.setProperty("--font-body", menuStyle.bodyFont);
      el.style.setProperty("--border-radius", menuStyle.borderRadius);
    }
  }, [menuStyle]);

  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const filteredItems = menuItems.filter((i) => i.category === activeCategoryId);
  const vp = VIEWPORT_CONFIG[viewport];

  const handleRenameMenu = async () => {
    if (isSyncing || !isEditingName) return;
    const newName = tempName.trim();
    if (newName && newName !== activeMenuName && activeMenuId) {
      setIsEditingName(false); // Hide input immediately
      await renameMenu(activeMenuId, newName);
    } else {
      setIsEditingName(false);
    }
  };

  const handleRemoveTag = (itemId: string, tag: string) => {
    const item = menuItems.find((i) => i.id === itemId);
    if (item) updateItem(itemId, { tags: item.tags.filter((t) => t !== tag) });
  };

  const handleAddTagPrompt = async (itemId: string) => {
    const tag = await prompt({ title: "Add Tag", placeholder: "e.g. Vegan, Spicy, Gluten-Free", confirmLabel: "Add" });
    if (tag) {
      const item = menuItems.find((i) => i.id === itemId);
      if (item && !item.tags.includes(tag)) {
        updateItem(itemId, { tags: [...item.tags, tag] });
        toast.success(`Tag "${tag}" added`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-bold text-secondary animate-pulse">Loading Editor…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh)] flex flex-col overflow-hidden"
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
                title="Menu name"
                placeholder="Menu name"
                className="font-[var(--font-headline)] font-bold text-sm bg-surface-container-low border-none rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20 w-48"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleRenameMenu}
                onKeyDown={(e) => e.key === "Enter" && handleRenameMenu()}
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
          <span className="text-xs text-secondary hidden sm:inline">• {activeCategory?.name || "No Section Selected"}</span>
          {isSyncing && (
            <span 
              data-testid="sync-indicator"
              className="text-[10px] text-secondary animate-pulse"
            >
              Saving…
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {menuStatus === "published" && menuSlug && (
            <Link href={`/menu/${menuSlug}`} target="_blank" className="px-4 py-2 bg-tertiary-container/20 text-tertiary rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-tertiary-container/30 transition-all">
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              /menu/{menuSlug}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsStyleSidebarOpen(!isStyleSidebarOpen)}
            className={`p-2 rounded-xl transition-all flex items-center gap-2 ${isStyleSidebarOpen ? "bg-primary text-white shadow-lg" : "bg-surface-container-highest text-secondary hover:text-primary"}`}
            title="Toggle Style Editor"
          >
            <span className="material-symbols-outlined text-sm">palette</span>
            <span className="text-xs font-bold hidden md:inline">Design</span>
          </button>

          {publishedSlug && (
            <span className="text-xs text-tertiary font-bold animate-pulse">Published!</span>
          )}
          {menuStatus === "published" ? (
            <button
              type="button"
              onClick={async () => { await unpublishMenu(); setPublishedSlug(null); }}
              disabled={isSyncing}
              className="px-4 py-2 bg-surface-container-highest rounded-xl font-bold text-sm text-on-surface hover:bg-surface-variant transition-all disabled:opacity-60"
            >
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const slug = await publishMenu();
                if (slug) { setPublishedSlug(slug); setTimeout(() => setPublishedSlug(null), 3000); }
              }}
              disabled={isSyncing}
              className="px-6 py-2 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-60"
            >
              Publish Menu
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <MenuSectionsSidebar
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
        />

        {/* Center: Live Preview */}
        <section className="flex-1 bg-surface-container-low p-6 lg:p-10 flex flex-col items-center editor-canvas relative overflow-auto">

          {/* Phone / Tablet / Desktop Frame */}
          <div 
            className={`w-full ${vp.width} ${vp.rounded} shadow-2xl overflow-y-auto ${vp.border} flex flex-col ${vp.minH} transition-all duration-300`}
            style={{ backgroundColor: "var(--bg-color)" }}
          >
            <div className="w-full h-56 relative overflow-hidden shrink-0">
              <NextImage
                alt="Menu Header"
                className="object-cover"
                src={filteredItems.find((i) => i.image)?.image || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=300&fit=crop"}
                fill
                sizes="(max-width: 900px) 100vw, 900px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20 z-10" />
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <h1 className="text-white font-[var(--font-headline)] text-3xl font-black tracking-tight drop-shadow-lg">
                  {activeCategory?.name || "Select a Category"}
                </h1>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {filteredItems.map((item) => {
                const isExpanded = expandedItemId === item.id;
                
                // Determine card classes based on cardStyle
                const cardClasses = 
                  menuStyle.cardStyle === "elevated" ? "bg-white shadow-sm border border-surface-container/30" :
                  menuStyle.cardStyle === "glass" ? "bg-white/40 backdrop-blur-md border border-white/20 shadow-lg" :
                  "bg-transparent border-b border-surface-container/50 rounded-none";

                return (
                  <div
                    key={item.id}
                    className={`relative group cursor-pointer -mx-2 px-4 py-4 rounded-[var(--border-radius)] transition-all ${cardClasses} ${item.available === false ? "opacity-60" : "hover:scale-[1.01]"}`}
                  >
                    {/* Header row */}
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
                        <div className="flex gap-1 flex-wrap mt-0.5">
                          {item.badge && (
                            <span className="bg-[var(--primary-color)]/10 text-[var(--primary-color)] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                              {item.badge}
                            </span>
                          )}
                          {item.available === false && (
                            <span className="bg-error/10 text-error text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Sold Out</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <span className="font-[var(--font-headline)] font-bold text-[var(--primary-color)] text-xs opacity-70">{menuStyle.currency ?? "RWF"}</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="font-[var(--font-headline)] font-bold text-[var(--primary-color)] text-lg bg-transparent border-none p-0 focus:ring-0 w-20 text-right"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                          title="Item Price"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <textarea
                      className="text-sm font-medium leading-relaxed italic bg-transparent border-none p-0 focus:ring-0 w-full resize-none overflow-hidden font-[var(--font-body)]"
                      style={{ color: "var(--secondary-color)" }}
                      value={item.description}
                      rows={2}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      title="Item Description"
                      placeholder="Description…"
                    />

                    {/* Tags display */}
                    {item.tags.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {item.tags.map((tag) => (
                          <span key={tag} className="bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Expanded panel */}
                    {isExpanded && userId && (
                      <div className="mt-4 border-t border-outline-variant/20 pt-4 space-y-5" onClick={(e) => e.stopPropagation()}>

                        {/* Availability */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-secondary">Availability</p>
                            <p className="text-[10px] text-secondary opacity-70">{item.available === false ? "Hidden from customers" : "Visible on menu"}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { available: item.available === false ? true : false })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${item.available === false ? "bg-error/10 text-error" : "bg-tertiary/10 text-tertiary"}`}
                          >
                            {item.available === false ? "Mark Available" : "Mark Sold Out"}
                          </button>
                        </div>

                        {/* Badge picker */}
                        <div>
                          <p className="text-xs font-bold text-secondary mb-2">Badge</p>
                          <div className="flex flex-wrap gap-1.5">
                            {BADGES.map((b) => (
                              <button
                                key={b}
                                type="button"
                                onClick={() => updateItem(item.id, { badge: item.badge === b ? undefined : b })}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize transition-all ${item.badge === b ? "bg-primary text-white" : "bg-surface-container-high text-secondary hover:bg-surface-container-highest"}`}
                              >
                                {b}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tags editor */}
                        <div>
                          <p className="text-xs font-bold text-secondary mb-2">Tags</p>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {item.tags.map((tag) => (
                              <span key={tag} className="flex items-center gap-1 bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(item.id, tag)}
                                  className="hover:text-error transition-colors"
                                  title={`Remove ${tag}`}
                                >
                                  <span className="material-symbols-outlined text-[10px]">close</span>
                                </button>
                              </span>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddTagPrompt(item.id)}
                              className="flex items-center gap-0.5 text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-0.5 rounded-full transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">add</span> Add tag
                            </button>
                          </div>
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

                        {/* Duplicate item */}
                        <button
                          type="button"
                          onClick={() => { duplicateItem(item.id); setExpandedItemId(null); toast.success("Item duplicated"); }}
                          className="flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">content_copy</span> Duplicate item
                        </button>
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
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
            {(["mobile", "tablet", "desktop"] as Viewport[]).map((v) => {
              const icons = { mobile: "smartphone", tablet: "tablet", desktop: "desktop_windows" };
              const isActive = viewport === v;
              return (
                <button
                  key={v}
                  type="button"
                  title={v.charAt(0).toUpperCase() + v.slice(1)}
                  onClick={() => setViewport(v)}
                  className={`p-3 rounded-full transition-all ${isActive ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:bg-white/50"}`}
                >
                  <span className="material-symbols-outlined">{icons[v]}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right Panel */}
        {isStyleSidebarOpen && <StyleEditorSidebar />}
      </div>
    </div>
  );
}
