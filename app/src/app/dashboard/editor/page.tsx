"use client";
import NextImage from "next/image";
import { useMenu } from "@/context/MenuContext";
import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { EditorSidebar } from "./EditorSidebar";
import { BuildSidebarContent } from "./BuildSidebarContent";
import { StyleEditorSidebarContent } from "./StyleEditorSidebarContent";
import { EditorItemCard } from "./EditorItemCard";
import { CategoryTabStrip } from "./CategoryTabStrip";
import { CategoryActionSheet } from "./CategoryActionSheet";
import { MobileBottomBar } from "./MobileBottomBar";
import { prompt } from "@/components/Modals";
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
  const [mobileSheet, setMobileSheet] = useState<"build" | "design" | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [catActionSheet, setCatActionSheet] = useState<{ id: string; name: string; hidden?: boolean } | null>(null);
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

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.style.setProperty("--bg-color", menuStyle.backgroundColor);
      el.style.setProperty("--primary-color", menuStyle.primaryColor);
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
      <div className="h-screen flex items-center justify-center bg-[#faf8f6]">
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
        <div className="w-full max-w-md bg-white border border-black/6 p-10 rounded-3xl shadow-sm flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-400 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-2xl icon-fill">gpp_maybe</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">Access Restricted</h2>
          <p className="text-sm text-secondary mb-8 leading-relaxed max-w-xs">
            Staff accounts can only view and manage live orders. Menu editing requires Manager or Owner access.
          </p>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-primary rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity text-center block w-full"
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
      {/* ── Top Bar ── */}
      <header className="bg-white/90 backdrop-blur-xl flex justify-between items-center px-4 lg:px-6 h-14 border-b border-black/6 shrink-0 z-20">
        {/* Left side */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/menus" className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors text-secondary hover:text-on-surface shrink-0">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="flex items-center gap-2 group relative min-w-0">
            {isEditingName ? (
              <input
                autoFocus
                title="Menu name"
                placeholder="Menu name"
                className="font-bold text-sm bg-black/5 border-none rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20 w-40"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleRenameMenu}
                onKeyDown={(e) => e.key === "Enter" && handleRenameMenu()}
              />
            ) : (
              <span
                className="font-bold text-sm cursor-pointer hover:text-primary transition-colors flex items-center gap-1 truncate"
                onClick={() => { setTempName(activeMenuName); setIsEditingName(true); }}
                title="Click to rename menu"
              >
                <span className="truncate max-w-[120px] lg:max-w-none">{activeMenuName}</span>
                <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">edit</span>
              </span>
            )}
          </div>
          {isSyncing && (
            <span data-testid="sync-indicator" className="text-[10px] text-secondary animate-pulse hidden sm:inline shrink-0">
              Saving…
            </span>
          )}
          {/* Viewport switcher — desktop only */}
          <div className="hidden lg:flex items-center gap-0.5 bg-black/5 p-0.5 rounded-full ml-2">
            {(["mobile", "tablet", "desktop"] as Viewport[]).map((v) => {
              const icons: Record<Viewport, string> = { mobile: "smartphone", tablet: "tablet", desktop: "desktop_windows" };
              return (
                <button
                  key={v}
                  type="button"
                  title={v.charAt(0).toUpperCase() + v.slice(1)}
                  onClick={() => setViewport(v)}
                  className={`p-1.5 rounded-full transition-all ${viewport === v ? "bg-white shadow-sm text-primary" : "text-on-surface/40 hover:bg-white/50"}`}
                >
                  <span className="material-symbols-outlined text-[18px]">{icons[v]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop: full action buttons */}
          {menuStatus === "published" && menuSlug && (
            <div className="hidden lg:flex items-center gap-1.5">
              <Link
                href={`/menu/${menuSlug}`}
                target="_blank"
                className="px-3 py-1.5 bg-tertiary/10 text-tertiary rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-tertiary/15 transition-all"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                View Menu
              </Link>
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="p-2 bg-tertiary/10 text-tertiary rounded-lg hover:bg-tertiary/15 transition-all"
                title="QR Code"
              >
                <span className="material-symbols-outlined text-sm">qr_code_2</span>
              </button>
            </div>
          )}
          <button
            onClick={() => setIsPrintOpen(true)}
            className="hidden lg:flex items-center justify-center gap-2 px-5 h-9 rounded-xl bg-on-surface text-surface hover:bg-on-surface/90 transition-all font-bold text-xs shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Preview & Print
          </button>

          {/* Mobile: overflow menu */}
          <div className="relative lg:hidden">
            <button
              onClick={() => setShowMobileMenu(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/5 text-on-surface hover:bg-black/8 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
            {showMobileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                <div className="fixed top-14 right-4 z-50 bg-white rounded-2xl shadow-lg border border-black/8 py-1.5 min-w-[180px]">
                  {menuStatus === "published" && menuSlug && (
                    <>
                      <Link
                        href={`/menu/${menuSlug}`}
                        target="_blank"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-black/4 transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <span className="material-symbols-outlined text-sm text-tertiary">open_in_new</span>
                        View Menu
                      </Link>
                      <button
                        onClick={() => { setIsQRModalOpen(true); setShowMobileMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-black/4 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-sm text-tertiary">qr_code_2</span>
                        QR Code
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setIsPrintOpen(true); setShowMobileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-black/4 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    Preview & Print
                  </button>
                </div>
              </>
            )}
          </div>

          {publishedSlug && (
            <span className="text-xs text-tertiary font-bold animate-pulse hidden lg:inline">Published!</span>
          )}

          {/* Publish / Unpublish */}
          {menuStatus === "published" ? (
            <button
              type="button"
              onClick={async () => { await unpublishMenu(); setPublishedSlug(null); }}
              disabled={isSyncing}
              className="px-3 lg:px-4 py-2 bg-black/6 rounded-xl font-bold text-xs lg:text-sm text-on-surface hover:bg-black/10 transition-all disabled:opacity-60"
            >
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const slug = await publishMenu();
                if (slug) { setPublishedSlug(slug); setTimeout(() => setPublishedSlug(null), 3000); toast.success("Menu published!"); }
              }}
              disabled={isSyncing}
              className="px-3 lg:px-6 py-2 bg-primary rounded-xl font-bold text-xs lg:text-sm text-white shadow-md shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              Publish
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — desktop only (hidden on mobile via EditorSidebar) */}
        <EditorSidebar
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
          selectedItemId={expandedItemId}
          setSelectedItemId={setExpandedItemId}
        />

        {/* Center: Live Preview Canvas */}
        <section className="flex-1 flex flex-col overflow-hidden editor-canvas relative">

          {/* Mobile category tab strip */}
          <CategoryTabStrip
            activeCategoryId={activeCategoryId}
            setActiveCategoryId={setActiveCategoryId}
            onCategoryOptions={(cat) => setCatActionSheet(cat)}
          />

          {/* Mobile category action sheet */}
          <CategoryActionSheet
            catActionSheet={catActionSheet}
            setCatActionSheet={setCatActionSheet}
            activeCategoryId={activeCategoryId}
            setActiveCategoryId={setActiveCategoryId}
          />

          {/* Canvas wrapper */}
          <div className="flex-1 overflow-auto flex flex-col items-center p-3 pb-20 lg:p-8 lg:pb-8">
            <div
              data-viewport={viewport}
              className={`device-frame w-full ${vp.width} ${vp.rounded} shadow-2xl shadow-black/20 overflow-hidden ${vp.border} flex flex-col transition-all duration-300 bg-[var(--bg-color)]`}
            >
              <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
                {/* Header image */}
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
                          onClick={() => {
                            const newId = expandedItemId === item.id ? null : item.id;
                            setExpandedItemId(newId);
                            if (newId) setMobileSheet("build");
                          }}
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
                        className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
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
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <MobileBottomBar
        mobileSheet={mobileSheet}
        setMobileSheet={setMobileSheet}
        setExpandedItemId={setExpandedItemId}
        setPublishedSlug={setPublishedSlug}
        activeCategoryId={activeCategoryId}
      />

      {/* ── Mobile Bottom Sheet ── */}
      {mobileSheet && (
        <>
          <div
            className="fixed top-0 left-0 right-0 bottom-14 bg-black/40 z-40 lg:hidden"
            onClick={() => { setMobileSheet(null); setExpandedItemId(null); }}
          />
          <div className="fixed bottom-14 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[78vh] flex flex-col lg:hidden shadow-2xl">
            <div className="shrink-0 pt-3 pb-1 flex flex-col items-center">
              <div className="w-10 h-1 bg-black/10 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/6 shrink-0">
              <span className="font-bold text-sm text-on-surface truncate max-w-[220px]">
                {mobileSheet === "design"
                  ? "Design"
                  : expandedItemId
                  ? menuItems.find((i) => i.id === expandedItemId)?.name ?? "Edit Item"
                  : "Sections"}
              </span>
              <button
                onClick={() => { setMobileSheet(null); setExpandedItemId(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-secondary hover:bg-black/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {mobileSheet === "build" && (
                <BuildSidebarContent
                  activeCategoryId={activeCategoryId}
                  setActiveCategoryId={setActiveCategoryId}
                  selectedItemId={expandedItemId}
                  setSelectedItemId={setExpandedItemId}
                />
              )}
              {mobileSheet === "design" && <StyleEditorSidebarContent />}
            </div>
          </div>
        </>
      )}

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
