"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { useMenu } from "@/context/MenuContext";
import { ImageUpload } from "@/components/ImageUpload";
import { prompt, confirm } from "@/components/Modals";
import { toast } from "sonner";

interface MenuSectionsSidebarProps {
  activeCategoryId: string | undefined;
  setActiveCategoryId: (id: string | undefined) => void;
}

export function MenuSectionsSidebar({ activeCategoryId, setActiveCategoryId }: MenuSectionsSidebarProps) {
  const { categories, menuItems, addCategory, renameCategory, removeCategory, toggleCategoryVisibility, setCategories, user } = useMenu();
  const dragIdRef = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [bannerEditId, setBannerEditId] = useState<string | null>(null);

  const userId = user?.id ?? null;

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
    <aside className="w-72 bg-surface flex flex-col p-5 overflow-y-auto shrink-0 hidden lg:flex border-r border-outline-variant/10">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-[var(--font-headline)] text-base font-extrabold tracking-tight text-on-surface">Menu Sections</h2>
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
                  relative rounded-2xl border transition-all duration-150 overflow-hidden cursor-pointer select-none
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
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
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${isBannerOpen ? "bg-primary text-white" : "bg-surface-container text-secondary hover:bg-primary/10 hover:text-primary"}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">image</span>
                    Banner
                  </button>
                  <button
                    type="button"
                    title="Rename section"
                    onClick={(e) => handleRename(e, cat.id, cat.name)}
                    className="p-1.5 rounded-lg text-secondary hover:bg-surface-container hover:text-primary transition-all"
                  >
                    <span className="material-symbols-outlined text-[13px]">edit</span>
                  </button>
                  <button
                    type="button"
                    title={cat.hidden ? "Show on public menu" : "Hide from public menu"}
                    onClick={(e) => { e.stopPropagation(); toggleCategoryVisibility(cat.id); }}
                    className="p-1.5 rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface transition-all"
                  >
                    <span className="material-symbols-outlined text-[13px]">{cat.hidden ? "visibility_off" : "visibility"}</span>
                  </button>
                  <button
                    type="button"
                    title="Delete section"
                    onClick={(e) => handleDelete(e, cat.id, cat.name)}
                    className="p-1.5 rounded-lg text-secondary hover:bg-error/10 hover:text-error transition-all ml-auto"
                  >
                    <span className="material-symbols-outlined text-[13px]">delete</span>
                  </button>
                </div>
              </div>

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
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-surface-container rounded-2xl text-on-surface font-bold text-sm hover:bg-surface-container-high transition-all group active:scale-95 border border-outline-variant/20 hover:border-primary/20"
      >
        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform text-primary">add</span>
        Add New Section
      </button>

      {/* Bottom links */}
      <div className="mt-auto pt-6 border-t border-outline-variant/20 space-y-3">
        <Link
          href="/upload"
          className="w-full flex items-center gap-3 p-4 bg-primary/5 hover:bg-primary/10 rounded-2xl border border-primary/10 hover:border-primary/20 transition-all group"
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
        <div className="bg-primary-container/5 rounded-3xl p-4 border border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-sm icon-fill">tips_and_updates</span>
            <span className="font-[var(--font-headline)] font-bold text-sm text-primary">Editor Tips</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Click any item to expand it — set availability, upload a photo, add tags, and assign a badge.
          </p>
        </div>
      </div>
    </aside>
  );
}
