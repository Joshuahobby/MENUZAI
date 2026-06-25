"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { useMenu } from "@/context/MenuContext";
import { ImageUpload } from "@/components/ImageUpload";
import { prompt, confirm } from "@/components/Modals";
import { toast } from "sonner";

import { EditorItemForm } from "./EditorItemForm";

interface BuildSidebarContentProps {
  activeCategoryId: string | undefined;
  setActiveCategoryId: (id: string | undefined) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

export function BuildSidebarContent({
  activeCategoryId,
  setActiveCategoryId,
  selectedItemId,
  setSelectedItemId,
}: BuildSidebarContentProps) {
  const {
    categories,
    menuItems,
    menuStyle,
    addCategory,
    renameCategory,
    removeCategory,
    toggleCategoryVisibility,
    setCategories,
    setMenuItems,
    addItem,
    updateItem,
    duplicateItem,
    removeItem,
    user,
    plan,
  } = useMenu();
  const dragIdRef = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [bannerEditId, setBannerEditId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const aiInputRef = useRef<HTMLTextAreaElement | null>(null);

  const userId = user?.id ?? null;

  const handleGenerateItems = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    if (!activeCategoryId) {
      toast.error("Please select a section first");
      return;
    }
    setIsGenerating(true);
    const toastId = toast.loading("AI is generating items...");
    try {
      const res = await fetch("/api/ai/generate-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          categoryId: activeCategoryId,
          currency: menuStyle.currency ?? "RWF",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate items");
      // Bulk-add all generated items in one state update
      const newItems = Array.isArray(data.items) ? data.items : [];
      setMenuItems((prev: import("@/types/menu").MenuItem[]) => [...prev, ...newItems]);
      toast.success(`✨ Added ${newItems.length} items to your menu!`, { id: toastId });
      setAiPrompt("");
      setShowAiPanel(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Generation failed", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  }, [aiPrompt, activeCategoryId, menuStyle.currency, setMenuItems]);

  if (selectedItemId) {
    const selectedItem = menuItems.find((i) => i.id === selectedItemId);
    if (selectedItem) {
      return (
        <EditorItemForm
          item={selectedItem}
          menuStyle={menuStyle}
          isUploading={isUploading}
          userId={userId}
          plan={plan}
          onClose={() => setSelectedItemId(null)}
          onUpdateItem={updateItem}
          onDuplicateItem={(id: string) => {
            duplicateItem(id);
            setSelectedItemId(null);
          }}
          onRemoveItem={(id: string) => {
            removeItem(id);
            setSelectedItemId(null);
          }}
          onUploadStart={() => setIsUploading(true)}
          onUploadEnd={() => setIsUploading(false)}
        />
      );
    }
  }

  const handleDragStart = (id: string) => {
    dragIdRef.current = id;
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    setDragOverId(overId);
    if (dragIdRef.current === null || dragIdRef.current === overId) return;
    setCategories((prev) => {
      const from = prev.findIndex((c) => c.id === dragIdRef.current);
      const to = prev.findIndex((c) => c.id === overId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    dragIdRef.current = overId;
  };

  const handleDrop = () => {
    dragIdRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    dragIdRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleRename = async (e: React.MouseEvent, catId: string, currentName: string) => {
    e.stopPropagation();
    const name = await prompt({ title: "Rename Section", defaultValue: currentName, placeholder: "Section name", confirmLabel: "Rename" });
    if (name && name !== currentName) {
      renameCategory(catId, name);
      toast.success(`Renamed to "${name}"`);
    }
  };

  const handleDelete = async (e: React.MouseEvent, catId: string, catName: string) => {
    e.stopPropagation();
    const itemCount = menuItems.filter((i) => i.category === catId).length;
    const ok = await confirm({
      title: `Delete "${catName}"?`,
      message: itemCount > 0
        ? `This will permanently delete ${itemCount} item${itemCount !== 1 ? "s" : ""} in this section.`
        : "This section will be permanently removed.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (ok) {
      if (activeCategoryId === catId) setActiveCategoryId(undefined);
      removeCategory(catId);
      toast.success(`"${catName}" deleted.`);
    }
  };

  const handleSetCategoryImage = (catId: string, url: string) => {
    setCategories((prev) => prev.map((c) => c.id === catId ? { ...c, image: url } : c));
    setBannerEditId(null);
    toast.success("Category banner updated");
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 py-5">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-headline text-base font-extrabold tracking-tight text-on-surface">Menu Sections</h2>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="material-symbols-outlined text-[13px] text-primary">swap_vert</span>
          <p className="text-[10px] text-primary font-bold uppercase tracking-[0.18em]">Drag to reorder</p>
        </div>
      </div>

      {/* Category list */}
      <div className="space-y-2 mb-8">
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          const isDragging = draggingId === cat.id;
          const isDragOver = dragOverId === cat.id && draggingId !== cat.id;
          const isBannerOpen = bannerEditId === cat.id;
          const count = menuItems.filter((i) => i.category === cat.id).length;

          return (
            <div key={cat.id} className="group">
              <div
                draggable
                onDragStart={() => handleDragStart(cat.id)}
                onDragOver={(e) => handleDragOver(e, cat.id)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`
                  relative rounded-2xl border transition-colors duration-150 overflow-hidden cursor-pointer select-none
                  ${isDragging ? "opacity-40 scale-95 shadow-inner" : ""}
                  ${isDragOver ? "ring-2 ring-primary ring-offset-1 border-primary/30 shadow-lg shadow-primary/10" : ""}
                  ${isActive && !isDragOver
                    ? "bg-primary/5 border-primary/25 shadow-sm"
                    : !isDragOver
                    ? "bg-surface border-outline-variant/20 hover:border-primary/20 hover:shadow-sm"
                    : ""}
                  ${cat.hidden ? "opacity-60" : ""}
                `}
              >
                {/* Category banner thumbnail strip */}
                {cat.image && (
                  <div className="h-10 w-full relative overflow-hidden">
                    <NextImage src={cat.image} alt={cat.name} fill sizes="288px" className="object-cover" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
                  </div>
                )}

                {/* Main row */}
                <div className="flex items-center gap-2 px-3 py-3">
                  {/* Drag handle — always visible */}
                  <div
                    className="shrink-0 flex flex-col gap-[3px] px-0.5 cursor-grab active:cursor-grabbing group/drag"
                    title="Drag to reorder"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <span className={`block w-3.5 h-0.5 rounded-full transition-colors ${isActive ? "bg-primary/50" : "bg-secondary/30 group-hover:bg-secondary/60"}`} />
                    <span className={`block w-3.5 h-0.5 rounded-full transition-colors ${isActive ? "bg-primary/50" : "bg-secondary/30 group-hover:bg-secondary/60"}`} />
                    <span className={`block w-2.5 h-0.5 rounded-full transition-colors ${isActive ? "bg-primary/50" : "bg-secondary/30 group-hover:bg-secondary/60"}`} />
                  </div>

                  {/* Name — always fully visible */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm leading-tight ${isActive ? "text-primary" : "text-on-surface"}`}>
                      {cat.name}
                    </p>
                    {cat.hidden && (
                      <p className="text-[9px] font-bold uppercase tracking-widest text-secondary mt-0.5">Hidden</p>
                    )}
                  </div>

                  {/* Count badge */}
                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg shrink-0 ${isActive ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
                    {count}
                  </span>
                </div>

                {/* Action row — visible on hover */}
                <div className="flex items-center gap-0.5 px-3 pb-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title="Set category banner"
                    onClick={(e) => { e.stopPropagation(); setBannerEditId(isBannerOpen ? null : cat.id); }}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${isBannerOpen ? "bg-primary text-white" : "bg-surface-container text-secondary hover:bg-primary/10 hover:text-primary"}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">image</span>
                    Banner
                  </button>
                  <button
                    type="button"
                    title="Rename section"
                    onClick={(e) => handleRename(e, cat.id, cat.name)}
                    className="p-1.5 rounded-lg text-secondary hover:bg-surface-container hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[13px]">edit</span>
                  </button>
                  <button
                    type="button"
                    title={cat.hidden ? "Show on public menu" : "Hide from public menu"}
                    onClick={(e) => { e.stopPropagation(); toggleCategoryVisibility(cat.id); }}
                    className="p-1.5 rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[13px]">{cat.hidden ? "visibility_off" : "visibility"}</span>
                  </button>
                  <button
                    type="button"
                    title="Delete section"
                    onClick={(e) => handleDelete(e, cat.id, cat.name)}
                    className="p-1.5 rounded-lg text-secondary hover:bg-error/10 hover:text-error transition-colors ml-auto"
                  >
                    <span className="material-symbols-outlined text-[13px]">delete</span>
                  </button>
                </div>
              </div>

              {/* Items in Category */}
              {isActive && (
                <div className="mt-2 mb-4 ml-4 space-y-1.5 border-l-2 border-surface-container pl-2">
                  {menuItems
                    .filter((i) => i.category === cat.id)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className="group/item flex items-center gap-2 p-2 rounded-xl hover:bg-surface-container-low cursor-pointer transition-colors"
                      >
                        {item.image ? (
                          <div className="w-8 h-8 rounded bg-surface-container overflow-hidden shrink-0 relative">
                            <NextImage src={item.image} alt={item.name} fill sizes="32px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-secondary text-[14px]">restaurant_menu</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-on-surface truncate">{item.name}</p>
                          <p className="text-[10px] text-primary font-bold">{menuStyle.currency ?? "RWF"} {item.price}</p>
                        </div>
                        <span className="material-symbols-outlined text-secondary text-[14px] opacity-0 group-hover/item:opacity-100 transition-opacity">
                          chevron_right
                        </span>
                      </div>
                    ))}
                  <button
                    type="button"
                    onClick={() => addItem(cat.id)}
                    className="w-full flex items-center gap-1.5 p-2 mt-1 rounded-xl text-[10px] font-bold text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span> Add Item
                  </button>
                </div>
              )}

              {/* Inline banner image editor */}
              {isBannerOpen && userId && (
                <div className="mt-1 mb-1 p-3 bg-surface-container-low rounded-2xl border border-primary/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Category Banner</p>
                  <ImageUpload
                    currentUrl={cat.image || ""}
                    userId={userId}
                    folder="banners"
                    onUpload={(url) => handleSetCategoryImage(cat.id, url)}
                  />
                  <button
                    type="button"
                    onClick={() => setBannerEditId(null)}
                    className="w-full mt-2 text-xs font-bold text-secondary hover:text-on-surface transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add section button */}
      <button
        type="button"
        onClick={async () => {
          const name = await prompt({ title: "New Section", placeholder: "e.g. Desserts", confirmLabel: "Add Section" });
          if (name) { addCategory(name); toast.success(`"${name}" section added.`); }
        }}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-surface-container rounded-2xl text-on-surface font-bold text-sm hover:bg-surface-container-high transition-colors group active:scale-95 border border-outline-variant/20 hover:border-primary/20"
      >
        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform text-primary">add</span>
        Add New Section
      </button>

      {/* AI Generator Panel */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => { setShowAiPanel(v => !v); setTimeout(() => aiInputRef.current?.focus(), 50); }}
          className="w-full flex items-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-colors group active:scale-95 border bg-accent-saffron/10 border-accent-saffron/30 text-amber-700 hover:bg-accent-saffron/20"
        >
          <span className={`material-symbols-outlined text-lg ml-3 transition-transform ${showAiPanel ? "rotate-180" : ""}`}>auto_awesome</span>
          <span className="flex-1 text-left">Generate Items with AI</span>
          <span className={`material-symbols-outlined text-base mr-3 transition-transform ${showAiPanel ? "rotate-180" : ""}`}>expand_more</span>
        </button>

        {showAiPanel && (
          <div className="mt-2 p-4 bg-accent-saffron/10 rounded-2xl border border-accent-saffron/30/60 space-y-3">
            {!activeCategoryId && (
              <div className="flex items-center gap-2 p-2 bg-accent-saffron/15 rounded-xl">
                <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
                <p className="text-[10px] font-bold text-amber-700">Select a section above first</p>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5 block">What do you want to add?</label>
              <textarea
                ref={aiInputRef}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerateItems(); }}
                placeholder={`e.g. "Add 5 popular cocktails with RWF prices" or "3 vegan desserts"`}
                rows={3}
                className="w-full bg-surface-container-low rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-secondary/50"
              />
              <p className="text-[9px] text-secondary mt-1 text-right">Tip: Ctrl+Enter to generate</p>
            </div>

            {/* Quick suggestions */}
            <div>
              <p className="text-[9px] font-bold text-secondary uppercase tracking-wider mb-1.5">Quick ideas:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "5 popular cocktails",
                  "3 vegan options",
                  "Signature pasta dishes",
                  "Kids menu items",
                  "Fresh salads",
                ].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAiPrompt(s)}
                    className="text-[10px] font-bold px-2 py-1 rounded-full bg-surface-container hover:bg-accent-saffron/15 text-secondary hover:text-amber-700 transition-colors border border-outline-variant/20 hover:border-amber-500/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateItems}
              disabled={isGenerating || !aiPrompt.trim() || !activeCategoryId}
              className="w-full py-3 rounded-[2rem] font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white shadow-md shadow-primary/20 cursor-pointer"
            >
              {isGenerating ? (
                <><span className="material-symbols-outlined text-base animate-spin">sync</span> Generating...</>
              ) : (
                <><span className="material-symbols-outlined text-base">auto_awesome</span> Generate Items</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom links */}
      <div className="mt-auto pt-6 border-t border-outline-variant/20 space-y-3">
        <Link
          href="/upload"
          className="w-full flex items-center gap-3 p-4 bg-primary/5 hover:bg-primary/10 rounded-2xl border border-primary/10 hover:border-primary/20 transition-colors group"
        >
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-primary text-lg icon-fill">auto_awesome</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-on-surface">Import from Photo</p>
            <p className="text-[10px] text-secondary leading-tight">AI extracts items from a menu image</p>
          </div>
          <span className="material-symbols-outlined text-secondary text-sm ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
