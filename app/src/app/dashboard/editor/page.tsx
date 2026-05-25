"use client";
import NextImage from "next/image";
import { useMenu } from "@/context/MenuContext";
import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { EditorSidebar } from "./EditorSidebar";
import { EditorItemCard } from "./EditorItemCard";
import { prompt, confirm } from "@/components/Modals";
import { toast } from "sonner";
import { PrintView } from "../templates/PrintView";
import { DEMO_DATA, type TplData } from "../templates/TemplatePreview";
import { QRCodeModal } from "@/components/QRCodeModal";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";

type Viewport = "mobile" | "tablet" | "desktop";

const VIEWPORT_CONFIG: Record<Viewport, { width: string; rounded: string; border: string }> = {
  mobile:  { width: "max-w-[390px]",  rounded: "rounded-[2.5rem]", border: "border-[10px] border-on-surface/90" },
  tablet:  { width: "max-w-[680px]",  rounded: "rounded-[1.75rem]", border: "border-[7px] border-on-surface/60" },
  desktop: { width: "max-w-[920px]",  rounded: "rounded-xl",        border: "border border-surface-container" },
};

export default function MenuEditorPage() {
  const {
    categories,
    menuItems,
    setMenuItems,
    menuStyle,
    addItem,
    addCategory,
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
    userRole,
  } = useMenu();

  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("mobile");

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);

  // Drag state for item reordering
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mobile category action sheet state
  const [catActionSheet, setCatActionSheet] = useState<{ id: string; name: string; hidden?: boolean } | null>(null);

  // Print overlay state
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

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
    if (!categories.length) {
      if (activeCategoryId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveCategoryId(undefined);
      }
      return;
    }
    const currentIsValid = categories.some(c => c.id === activeCategoryId);
    if (!activeCategoryId || !currentIsValid) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  // Apply CSS vars for live style preview
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.style.setProperty("--bg-color", menuStyle.backgroundColor);
      el.style.setProperty("--title-color", menuStyle.titleColor ?? "#1A1009");
      el.style.setProperty("--section-title-color", menuStyle.sectionTitleColor ?? "#3D2410");
      el.style.setProperty("--item-text-color", menuStyle.itemTextColor ?? "#4A3318");
      el.style.setProperty("--price-text-color", menuStyle.priceTextColor ?? menuStyle.primaryColor);
      el.style.setProperty("--divider-color", menuStyle.dividerColor ?? "#B89060");
      el.style.setProperty("--font-headline", menuStyle.headlineFont);
      el.style.setProperty("--font-body", menuStyle.bodyFont);
      el.style.setProperty("--border-radius", menuStyle.borderRadius);
      el.style.setProperty("--page-padding", `${menuStyle.pagePadding ?? 44}px`);
      el.style.setProperty("--item-spacing", `${menuStyle.itemSpacing ?? 26}px`);
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


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setMenuItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const next = arrayMove(prev, oldIndex, newIndex);
      return next;
    });
    toast.success("Order updated");
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

  if (userRole === "staff") {
    return (
      <div className="p-6 lg:p-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container-high/50 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-error/5 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>

          <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-3xl icon-fill">gpp_maybe</span>
          </div>
          <h2 className="text-xl font-[var(--font-headline)] font-extrabold tracking-tight mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-secondary mb-6 leading-relaxed">
            Staff accounts are restricted to viewing and managing live orders only. Menu customization requires Manager or Owner permissions.
          </p>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-center block w-full"
          >
            Return to Dashboard
          </a>
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
            <div className="flex items-center gap-1.5">
              <Link href={`/menu/${menuSlug}`} target="_blank" className="px-4 py-2 bg-tertiary-container/20 text-tertiary rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-tertiary-container/30 transition-all">
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                <span className="hidden sm:inline">View Menu</span>
              </Link>
              <button 
                onClick={() => setIsQRModalOpen(true)}
                className="p-2 bg-tertiary-container/20 text-tertiary rounded-xl hover:bg-tertiary-container/30 transition-all"
                title="Share QR Code"
              >
                <span className="material-symbols-outlined text-sm">qr_code_2</span>
              </button>
            </div>
          )}

          {/* Print Action */}
          <button
            onClick={() => setIsPrintOpen(true)}
            className="flex items-center justify-center gap-2 px-6 h-11 rounded-full bg-on-surface text-surface hover:bg-on-surface/90 transition-all font-bold text-sm shadow-lg shadow-on-surface/10 group"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">visibility</span>
            <span>Preview & Print</span>
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
        <EditorSidebar
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
          selectedItemId={expandedItemId}
          setSelectedItemId={setExpandedItemId}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 z-10" />
                <div className="absolute bottom-0 left-0 right-0 z-20 bg-[var(--primary-color)] px-6 py-3.5">
                  <h1 className="text-white font-[var(--font-headline)] text-2xl font-black tracking-tight leading-tight">
                    {activeCategory?.name || "Select a Category"}
                  </h1>
                </div>
              </div>

              {/* Items */}
              <div className="p-6 space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                >
                  <SortableContext
                    items={filteredItems.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredItems.map((item) => (
                      <EditorItemCard
                        key={item.id}
                        item={item}
                        menuStyle={menuStyle}
                        isSelected={expandedItemId === item.id}
                        onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

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


      </div>

      {isPrintOpen && (
        <PrintView
          templateId={menuStyle.templateId ?? "vintage-parchment"}
          templateName="Print Menu"
          restaurantData={printData}
          onClose={() => setIsPrintOpen(false)}
        />
      )}

      {isQRModalOpen && menuSlug && (
        <QRCodeModal 
          url={`${window.location.origin}/menu/${menuSlug}?src=qr`}
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
        />
      )}
    </div>
  );
}
