"use client";
import NextImage from "next/image";
import { useMenu } from "@/context/MenuContext";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { StyleEditorSidebar } from "./StyleEditorSidebar";
import { MenuSectionsSidebar } from "./MenuSectionsSidebar";
import { prompt, confirm } from "@/components/Modals";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PrintView } from "../templates/PrintView";
import { DEMO_DATA, type TplData } from "../templates/TemplatePreview";

type Viewport = "mobile" | "tablet" | "desktop";

const VIEWPORT_CONFIG: Record<Viewport, { width: string; rounded: string; border: string }> = {
  mobile:  { width: "max-w-[390px]",  rounded: "rounded-[2.5rem]", border: "border-[10px] border-on-surface/90" },
  tablet:  { width: "max-w-[680px]",  rounded: "rounded-[1.75rem]", border: "border-[7px] border-on-surface/60" },
  desktop: { width: "max-w-[920px]",  rounded: "rounded-xl",        border: "border border-surface-container" },
};

const BADGES = ["bestseller", "popular", "healthy", "chefs-pick", "new"] as const;

export default function MenuEditorPage() {
  const {
    categories,
    menuItems,
    setMenuItems,
    menuStyle,
    addItem,
    addCategory,
    updateItem,
    removeItem,
    duplicateItem,
    renameCategory,
    removeCategory,
    toggleCategoryVisibility,
    publishMenu,
    unpublishMenu,
    renameMenu,
    menuStatus,
    menuSlug,
    activeMenuId,
    activeMenuName,
    isSyncing,
    isLoading,
    user,
    restaurantName,
  } = useMenu();

  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const userId = user?.id ?? null;
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("mobile");
  const [isStyleSidebarOpen, setIsStyleSidebarOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);

  // Drag state for item reordering
  const dragItemIdRef = useRef<string | null>(null);

  // Per-item image file input refs
  const imgInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  const handleItemImageUpload = useCallback(async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB."); return; }
    const ext = file.name.split(".").pop();
    const path = `${userId}/items/${Date.now()}.${ext}`;
    setUploadingItemId(itemId);
    const t = toast.loading("Uploading photo…");
    const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
    toast.dismiss(t);
    if (error) { toast.error("Upload failed. Try again."); setUploadingItemId(null); return; }
    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    updateItem(itemId, { image: data.publicUrl });
    toast.success("Photo updated!");
    setUploadingItemId(null);
    if (imgInputRefs.current[itemId]) imgInputRefs.current[itemId]!.value = "";
  }, [userId, updateItem]);

  // Mobile category action sheet state
  const [catActionSheet, setCatActionSheet] = useState<{ id: string; name: string; hidden?: boolean } | null>(null);

  // Print overlay state
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const printData: TplData = useMemo(() => {
    if (categories.length === 0) return { ...DEMO_DATA, restaurantName: restaurantName || DEMO_DATA.restaurantName };
    return {
      restaurantName: restaurantName || DEMO_DATA.restaurantName,
      currency: menuStyle.currency,
      categories: categories
        .filter(c => !c.hidden)
        .map(cat => ({
          name: cat.name,
          items: menuItems
            .filter(i => i.category === cat.id)
            .map(i => ({ name: i.name, description: i.description, price: i.price })),
        })),
    };
  }, [categories, menuItems, restaurantName, menuStyle.currency]);

  // Keep activeCategoryId pointing to a valid category
  useEffect(() => {
    if (!activeCategoryId) {
      if (categories.length > 0) setActiveCategoryId(categories[0].id);
      return;
    }
    if (!categories.find((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(categories.length > 0 ? categories[0].id : undefined);
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

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId),
    [categories, activeCategoryId]
  );
  const filteredItems = useMemo(
    () => menuItems.filter((i) => i.category === activeCategoryId),
    [menuItems, activeCategoryId]
  );
  const vp = VIEWPORT_CONFIG[viewport];

  const handleRenameMenu = async () => {
    if (isSyncing || !isEditingName) return;
    const newName = tempName.trim();
    if (newName && newName !== activeMenuName && activeMenuId) {
      setIsEditingName(false);
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

  // Item drag-to-reorder handlers
  const handleItemDragStart = (id: string) => {
    dragItemIdRef.current = id;
    setExpandedItemId(null); // collapse expanded panel while dragging
  };

  const handleItemDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!dragItemIdRef.current || dragItemIdRef.current === overId) return;
    setMenuItems((prev) => {
      const from = prev.findIndex((i) => i.id === dragItemIdRef.current);
      const to = prev.findIndex((i) => i.id === overId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    dragItemIdRef.current = overId;
  };

  const handleItemDrop = () => {
    dragItemIdRef.current = null;
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
          {/* Viewport switcher — desktop only */}
          <div className="hidden lg:flex items-center gap-0.5 bg-surface-container-highest p-0.5 rounded-full ml-3">
            {(["mobile", "tablet", "desktop"] as Viewport[]).map((v) => {
              const icons: Record<Viewport, string> = { mobile: "smartphone", tablet: "tablet", desktop: "desktop_windows" };
              return (
                <button
                  key={v}
                  type="button"
                  title={v.charAt(0).toUpperCase() + v.slice(1)}
                  onClick={() => setViewport(v)}
                  className={`p-1.5 rounded-full transition-all ${viewport === v ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:bg-white/50"}`}
                >
                  <span className="material-symbols-outlined text-[18px]">{icons[v]}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {menuStatus === "published" && menuSlug && (
            <Link href={`/menu/${menuSlug}`} target="_blank" className="px-4 py-2 bg-tertiary-container/20 text-tertiary rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-tertiary-container/30 transition-all">
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              <span className="hidden sm:inline">View Menu</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsPrintOpen(true)}
            className="p-2 rounded-xl transition-all flex items-center gap-2 bg-surface-container-highest text-secondary hover:text-primary"
            title="Print Menu"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span className="text-xs font-bold hidden md:inline">Print</span>
          </button>

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
        {/* Left Panel — hidden on small screens, visible lg+ */}
        <MenuSectionsSidebar
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
        />

        {/* Center: Live Preview */}
        <section className="flex-1 flex flex-col overflow-hidden editor-canvas relative">

          {/* Mobile category tab strip — shown below lg breakpoint */}
          <div className="lg:hidden w-full sticky top-0 z-10 bg-surface-container-low/95 backdrop-blur-sm border-b border-surface-container px-4 py-2.5 flex gap-2 overflow-x-auto hide-scrollbar shrink-0">
            {categories.map((cat) => (
              <div key={cat.id} className="shrink-0 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${activeCategoryId === cat.id ? "bg-primary text-white shadow-sm" : cat.hidden ? "bg-surface-container text-secondary/50 line-through" : "bg-surface-container-high text-secondary hover:bg-surface-container-highest"}`}
                >
                  {cat.hidden && <span className="material-symbols-outlined text-[11px]">visibility_off</span>}
                  {cat.name}
                  <span className={`text-[10px] font-black ${activeCategoryId === cat.id ? "opacity-70" : "text-primary"}`}>
                    {menuItems.filter((i) => i.category === cat.id).length}
                  </span>
                </button>
                <button
                  type="button"
                  title="Section options"
                  onClick={() => setCatActionSheet({ id: cat.id, name: cat.name, hidden: cat.hidden })}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-highest transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">more_vert</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              title="Add section"
              onClick={async () => {
                const name = await prompt({ title: "New Section", placeholder: "e.g. Desserts", confirmLabel: "Add Section" });
                if (name) { addCategory(name); toast.success(`"${name}" section added.`); }
              }}
              className="shrink-0 w-8 h-8 rounded-full bg-surface-container-high text-primary hover:bg-primary/10 transition-all flex items-center justify-center border border-primary/20 my-auto"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>

          {/* Mobile category action sheet */}
          {catActionSheet && (
            <>
              <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setCatActionSheet(null)} />
              <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface rounded-t-[2rem] p-6 shadow-2xl">
                <div className="w-10 h-1 bg-surface-container-highest rounded-full mx-auto mb-6" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-1">Section</p>
                <p className="font-[var(--font-headline)] font-extrabold text-xl mb-6">{catActionSheet.name}</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setCatActionSheet(null);
                      const name = await prompt({ title: "Rename Section", defaultValue: catActionSheet.name, placeholder: "Section name", confirmLabel: "Rename" });
                      if (name && name !== catActionSheet.name) { renameCategory(catActionSheet.id, name); toast.success(`Renamed to "${name}"`); }
                    }}
                    className="w-full flex items-center gap-4 px-5 py-4 bg-surface-container-low hover:bg-surface-container-high rounded-2xl text-sm font-bold transition-all"
                  >
                    <span className="material-symbols-outlined text-primary">edit</span>
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCatActionSheet(null);
                      toggleCategoryVisibility(catActionSheet.id);
                      toast.success(catActionSheet.hidden ? `"${catActionSheet.name}" is now visible` : `"${catActionSheet.name}" hidden from public menu`);
                    }}
                    className="w-full flex items-center gap-4 px-5 py-4 bg-surface-container-low hover:bg-surface-container-high rounded-2xl text-sm font-bold transition-all"
                  >
                    <span className="material-symbols-outlined text-secondary">{catActionSheet.hidden ? "visibility" : "visibility_off"}</span>
                    {catActionSheet.hidden ? "Show on public menu" : "Hide from public menu"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setCatActionSheet(null);
                      const itemCount = menuItems.filter((i) => i.category === catActionSheet.id).length;
                      const ok = await confirm({
                        title: `Delete "${catActionSheet.name}"?`,
                        message: itemCount > 0 ? `This will permanently delete ${itemCount} item${itemCount !== 1 ? "s" : ""} in this section.` : "This section will be permanently removed.",
                        confirmLabel: "Delete",
                        danger: true,
                      });
                      if (ok) {
                        if (activeCategoryId === catActionSheet.id) setActiveCategoryId(undefined);
                        removeCategory(catActionSheet.id);
                        toast.success(`"${catActionSheet.name}" deleted.`);
                      }
                    }}
                    className="w-full flex items-center gap-4 px-5 py-4 bg-error/5 hover:bg-error/10 rounded-2xl text-sm font-bold text-error transition-all"
                  >
                    <span className="material-symbols-outlined">delete</span>
                    Delete Section
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCatActionSheet(null)}
                  className="w-full mt-4 py-4 rounded-2xl bg-surface-container-highest text-secondary font-bold text-sm"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* Canvas wrapper */}
          <div className="flex-1 overflow-auto flex flex-col items-center p-4 lg:p-8">

            {/* Phone / Tablet / Desktop Frame */}
            <div
              data-viewport={viewport}
              className={`device-frame w-full ${vp.width} ${vp.rounded} shadow-2xl shadow-black/20 overflow-hidden ${vp.border} flex flex-col transition-all duration-300 bg-[var(--bg-color)]`}
            >
              {/* Scrollable inner content — simulates device scroll */}
              <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">

              {/* Header image — uses category banner if set, else first item image, else default */}
              <div className="w-full h-56 relative overflow-hidden shrink-0">
                <NextImage
                  alt="Menu Header"
                  className="object-cover"
                  src={activeCategory?.image || filteredItems.find((i) => i.image)?.image || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=300&fit=crop"}
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

              {/* Items */}
              <div className="p-6 space-y-4">
                {filteredItems.map((item) => {
                  const isExpanded = expandedItemId === item.id;
                  const isUploading = uploadingItemId === item.id;

                  const cardWrap =
                    menuStyle.cardStyle === "elevated" ? "bg-white shadow-sm border border-surface-container/30 overflow-hidden" :
                    menuStyle.cardStyle === "glass" ? "bg-white/40 backdrop-blur-md border border-white/20 shadow-lg overflow-hidden" :
                    "bg-transparent border-b border-surface-container/50";

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleItemDragStart(item.id)}
                      onDragOver={(e) => handleItemDragOver(e, item.id)}
                      onDrop={handleItemDrop}
                      className={`relative group rounded-[var(--border-radius)] transition-all ${cardWrap} ${item.available === false ? "opacity-60" : "hover:scale-[1.01]"}`}
                    >
                      {/* ── Image banner — click to upload ── */}
                      <div
                        className="relative w-full h-44 cursor-pointer group/img shrink-0"
                        onClick={() => imgInputRefs.current[item.id]?.click()}
                        title={item.image ? "Click to change photo" : "Click to add photo"}
                      >
                        <NextImage
                          src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop"}
                          alt={item.name}
                          fill
                          sizes="(max-width: 420px) 100vw, 420px"
                          className="object-cover transition-transform duration-500 group-hover/img:scale-105"
                        />

                        {/* Upload hover overlay */}
                        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 transition-opacity ${isUploading ? "bg-black/60 opacity-100" : "bg-black/45 opacity-0 group-hover/img:opacity-100"}`}>
                          {isUploading ? (
                            <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-white text-3xl drop-shadow">add_photo_alternate</span>
                              <span className="text-white text-xs font-bold drop-shadow">{item.image ? "Change Photo" : "Add Photo"}</span>
                            </>
                          )}
                        </div>

                        {/* Price badge — top right */}
                        <div
                          className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="font-[var(--font-headline)] font-bold text-[var(--primary-color)] text-[10px] opacity-70">{menuStyle.currency ?? "RWF"}</span>
                          <input
                            type="number" step="1" min="0"
                            className="font-[var(--font-headline)] font-bold text-[var(--primary-color)] text-sm bg-transparent border-none p-0 focus:ring-0 w-16 text-right"
                            value={item.price}
                            onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) updateItem(item.id, { price: v }); }}
                            title="Item Price" placeholder="0"
                          />
                        </div>

                        {/* Badge chip — bottom left */}
                        {item.badge && (
                          <span className="absolute bottom-3 left-3 bg-[var(--primary-color)]/90 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-tighter">
                            {item.badge}
                          </span>
                        )}

                        {/* Sold out overlay */}
                        {item.available === false && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-error text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">Sold Out</span>
                          </div>
                        )}

                        {/* Drag handle — top left */}
                        <span className="absolute left-2 top-2 material-symbols-outlined text-[18px] text-white/80 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing select-none drop-shadow transition-opacity">
                          drag_indicator
                        </span>

                        {/* Hidden file input */}
                        <input
                          ref={(el) => { imgInputRefs.current[item.id] = el; }}
                          type="file"
                          title="Upload item photo"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => handleItemImageUpload(item.id, e)}
                        />
                      </div>

                      {/* ── Body ── */}
                      <div
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      >
                        <input
                          className="font-[var(--font-headline)] font-extrabold text-base bg-transparent border-none p-0 focus:ring-0 w-full"
                          value={item.name}
                          onChange={(e) => { e.stopPropagation(); updateItem(item.id, { name: e.target.value }); }}
                          onClick={(e) => e.stopPropagation()}
                          title="Item Name" placeholder="Item Name"
                        />
                        <textarea
                          className="text-sm font-medium leading-relaxed italic bg-transparent border-none p-0 focus:ring-0 w-full resize-none overflow-hidden font-[var(--font-body)] text-[var(--secondary-color)] mt-0.5"
                          value={item.description} rows={2}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          title="Item Description" placeholder="Description…"
                        />
                        {item.tags.length > 0 && (
                          <div className="mt-2 flex gap-1 flex-wrap">
                            {item.tags.map((tag) => (
                              <span key={tag} className="bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ── Expanded panel ── */}
                      {isExpanded && userId && (
                        <div className="mx-4 mb-4 border-t border-outline-variant/20 pt-4 space-y-5" onClick={(e) => e.stopPropagation()}>

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
                                  key={b} type="button"
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
                                  <button type="button" onClick={() => handleRemoveTag(item.id, tag)} className="hover:text-error transition-colors" title={`Remove ${tag}`}>
                                    <span className="material-symbols-outlined text-[10px]">close</span>
                                  </button>
                                </span>
                              ))}
                              <button type="button" onClick={() => handleAddTagPrompt(item.id)} className="flex items-center gap-0.5 text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-0.5 rounded-full transition-all">
                                <span className="material-symbols-outlined text-sm">add</span> Add tag
                              </button>
                            </div>
                          </div>

                          {/* Actions row */}
                          <div className="flex items-center justify-between pt-1 border-t border-outline-variant/10">
                            <button
                              type="button"
                              onClick={() => { duplicateItem(item.id); setExpandedItemId(null); toast.success("Item duplicated"); }}
                              className="flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">content_copy</span> Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await confirm({ title: `Delete "${item.name}"?`, message: "This item will be permanently removed.", confirmLabel: "Delete", danger: true });
                                if (ok) { removeItem(item.id); toast.success("Item deleted"); }
                              }}
                              className="flex items-center gap-1.5 text-xs font-bold text-error/70 hover:text-error transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span> Delete
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expand indicator */}
                      <span className={`absolute right-3 bottom-3 material-symbols-outlined text-sm text-secondary opacity-0 group-hover:opacity-70 transition-all pointer-events-none ${isExpanded ? "rotate-180" : ""}`}>
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
                ) : categories.length === 0 ? (
                  <div className="border-2 border-dashed border-outline-variant/20 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center">
                    <span className="material-symbols-outlined text-secondary text-5xl opacity-50">restaurant_menu</span>
                    <div>
                      <p className="text-sm font-bold text-on-surface mb-1">Your menu is empty</p>
                      <p className="text-xs text-secondary">Create a section to start adding items</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const name = await prompt({ title: "New Section", placeholder: "e.g. Starters, Mains, Drinks", confirmLabel: "Add Section" });
                        if (name) { addCategory(name); toast.success(`"${name}" section added.`); }
                      }}
                      className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                    >
                      Add First Section
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-outline-variant/20 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 text-center">
                    <span className="material-symbols-outlined text-secondary text-3xl">touch_app</span>
                    <span className="text-sm font-bold text-secondary">Tap a section above to add items</span>
                  </div>
                )}
              </div>
              </div>{/* end inner scrollable */}
            </div>
          </div>
        </section>

        {/* Right Panel */}
        {isStyleSidebarOpen && <StyleEditorSidebar onClose={() => setIsStyleSidebarOpen(false)} />}
      </div>

      {isPrintOpen && (
        <PrintView
          templateId="vintage-parchment"
          templateName="Print Menu"
          restaurantData={printData}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
}
