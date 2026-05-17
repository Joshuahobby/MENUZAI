"use client";

import NextImage from "next/image";
import { useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { prompt, confirm } from "@/components/Modals";
import type { MenuItem, MenuStyle } from "@/types/menu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const BADGES = ["bestseller", "popular", "healthy", "chefs-pick", "new"] as const;

const QUICK_DIETARY_TAGS = [
  { id: "vegan", label: "Vegan", icon: "eco", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-500/20" },
  { id: "vegetarian", label: "Vegetarian", icon: "spa", color: "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-500/20" },
  { id: "gluten-free", label: "Gluten-Free", icon: "grass", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-500/20" },
  { id: "spicy", label: "Spicy", icon: "whatshot", color: "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-500/20" },
  { id: "halal", label: "Halal", icon: "verified", color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-500/20" },
];

interface EditorItemCardProps {
  item: MenuItem;
  menuStyle: MenuStyle;
  isExpanded: boolean;
  isUploading: boolean;
  userId: string | null;
  onToggleExpand: () => void;
  onUpdateItem: (itemId: string, updates: Partial<MenuItem>) => void;
  onDuplicateItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onUploadStart: (itemId: string) => void;
  onUploadEnd: () => void;
}

export function EditorItemCard({
  item,
  menuStyle,
  isExpanded,
  isUploading,
  userId,
  onToggleExpand,
  onUpdateItem,
  onDuplicateItem,
  onRemoveItem,
  onUploadStart,
  onUploadEnd,
}: EditorItemCardProps) {
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleItemImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !userId) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5 MB.");
        return;
      }
      const ext = file.name.split(".").pop();
      const path = `${userId}/items/${Date.now()}.${ext}`;
      onUploadStart(item.id);
      const t = toast.loading("Uploading photo…");
      const { error } = await supabase.storage
        .from("menu-images")
        .upload(path, file, { upsert: true });
      toast.dismiss(t);
      if (error) {
        toast.error("Upload failed. Try again.");
        onUploadEnd();
        return;
      }
      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      onUpdateItem(item.id, { image: data.publicUrl });
      toast.success("Photo updated!");
      onUploadEnd();
      if (imgInputRef.current) imgInputRef.current.value = "";
    },
    [userId, item.id, onUpdateItem, onUploadStart, onUploadEnd]
  );

  const handleGalleryUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0 || !userId) return;
      
      onUploadStart(item.id);
      const t = toast.loading(`Uploading ${files.length} photos…`);
      
      const newUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${userId}/gallery/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { error } = await supabase.storage.from("menu-images").upload(path, file);
        if (!error) {
          const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
          newUrls.push(data.publicUrl);
        }
      }

      onUpdateItem(item.id, { gallery: [...(item.gallery || []), ...newUrls] });
      toast.dismiss(t);
      toast.success(`${newUrls.length} photos added to gallery!`);
      onUploadEnd();
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    },
    [userId, item.id, item.gallery, onUpdateItem, onUploadStart, onUploadEnd]
  );

  const handleRemoveTag = (tag: string) => {
    onUpdateItem(item.id, { tags: item.tags.filter((t) => t !== tag) });
  };

  const toggleDietaryTag = (tagId: string) => {
    const normId = tagId.toLowerCase().trim();
    const hasTag = item.tags.some(t => t.toLowerCase().trim() === normId);
    let newTags: string[];
    if (hasTag) {
      newTags = item.tags.filter(t => t.toLowerCase().trim() !== normId);
      toast.success(`Removed tag "${tagId}"`);
    } else {
      const properLabel = QUICK_DIETARY_TAGS.find(q => q.id === tagId)?.label || tagId;
      newTags = [...item.tags, properLabel];
      toast.success(`Added tag "${properLabel}"`);
    }
    onUpdateItem(item.id, { tags: newTags });
  };

  const handleAddTagPrompt = async () => {
    const tag = await prompt({
      title: "Add Tag",
      placeholder: "e.g. Vegan, Spicy, Gluten-Free",
      confirmLabel: "Add",
    });
    if (tag && !item.tags.includes(tag)) {
      onUpdateItem(item.id, { tags: [...item.tags, tag] });
      toast.success(`Tag "${tag}" added`);
    }
  };

  const cardWrap =
    menuStyle.cardStyle === "elevated"
      ? "bg-white shadow-sm border border-surface-container/30 overflow-hidden"
      : menuStyle.cardStyle === "glass"
      ? "bg-white/40 backdrop-blur-md border border-white/20 shadow-lg overflow-hidden"
      : "bg-transparent border-b border-surface-container/50";

  return (
    <div
      ref={setNodeRef}
      className={`group relative rounded-3xl transition-all duration-300 dnd-item-style ${cardWrap} ${isExpanded ? "ring-2 ring-primary bg-surface-container-low" : ""} ${isDragging ? "opacity-50 z-10" : "opacity-100 z-[1]"}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-40 hover:opacity-100 transition-all cursor-grab active:cursor-grabbing z-20"
        title="Drag to reorder"
      >
        <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
      </div>

      {/* ── Image banner — click to upload ── */}
      <div
        className="relative w-full h-44 cursor-pointer group/img shrink-0"
        onClick={() => imgInputRef.current?.click()}
        title={item.image ? "Click to change photo" : "Click to add photo"}
      >
        <NextImage
          src={
            item.image ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop"
          }
          alt={item.name}
          fill
          sizes="(max-width: 420px) 100vw, 420px"
          className="object-cover transition-transform duration-500 group-hover/img:scale-105"
        />

        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 transition-opacity ${
            isUploading
              ? "bg-black/60 opacity-100"
              : "bg-black/45 opacity-0 group-hover/img:opacity-100"
          }`}
        >
          {isUploading ? (
            <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="material-symbols-outlined text-white text-3xl drop-shadow">
                add_photo_alternate
              </span>
              <span className="text-white text-xs font-bold drop-shadow">
                {item.image ? "Change Photo" : "Add Photo"}
              </span>
            </>
          )}
        </div>

        <div
          className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-[var(--font-headline)] font-bold text-[var(--primary-color)] text-[10px] opacity-70">
            {menuStyle.currency ?? "RWF"}
          </span>
          <input
            type="number"
            step="1"
            min="0"
            className="font-[var(--font-headline)] font-bold text-[var(--primary-color)] text-sm bg-transparent border-none p-0 focus:ring-0 w-16 text-right"
            value={item.price}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v >= 0) onUpdateItem(item.id, { price: v });
            }}
            title="Item Price"
            placeholder="0"
          />
        </div>

        {item.badge && (
          <span className="absolute bottom-3 left-3 bg-[var(--primary-color)]/90 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-tighter">
            {item.badge}
          </span>
        )}

        {item.available === false && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-error text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">
              Sold Out
            </span>
          </div>
        )}

        <input
          ref={imgInputRef}
          type="file"
          title="Upload item photo"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleItemImageUpload}
        />
      </div>

      <div className="px-4 py-3 cursor-pointer" onClick={onToggleExpand}>
        <input
          className="font-[var(--font-headline)] font-extrabold text-base bg-transparent border-none p-0 focus:ring-0 w-full"
          value={item.name}
          onChange={(e) => {
            e.stopPropagation();
            onUpdateItem(item.id, { name: e.target.value });
          }}
          onClick={(e) => e.stopPropagation()}
          title="Item Name"
          placeholder="Item Name"
        />
        <textarea
          className="text-sm font-medium leading-relaxed italic bg-transparent border-none p-0 focus:ring-0 w-full resize-none overflow-hidden font-[var(--font-body)] text-[var(--secondary-color)] mt-0.5"
          value={item.description}
          rows={2}
          onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          title="Item Description"
          placeholder="Description…"
        />
        {item.tags.length > 0 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {isExpanded && userId && (
        <div
          className="mx-4 mb-4 border-t border-outline-variant/20 pt-4 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-secondary">Availability</p>
              <p className="text-[10px] text-secondary opacity-70">
                {item.available === false ? "Hidden from customers" : "Visible on menu"}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateItem(item.id, {
                  available: item.available === false ? true : false,
                })
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                item.available === false
                  ? "bg-error/10 text-error"
                  : "bg-tertiary/10 text-tertiary"
              }`}
            >
              {item.available === false ? "Mark Available" : "Mark Sold Out"}
            </button>
          </div>

          <div>
            <p className="text-xs font-bold text-secondary mb-2">Gallery</p>
            <div className="flex flex-wrap gap-2">
              {item.gallery?.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-surface-container">
                  <NextImage src={url} alt="Gallery" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => onUpdateItem(item.id, { gallery: item.gallery?.filter((_, idx) => idx !== i) })}
                    className="absolute top-0 right-0 p-0.5 bg-black/50 text-white"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-16 h-16 border-2 border-dashed border-outline-variant flex items-center justify-center rounded-lg text-secondary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
              <input ref={galleryInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryUpload} title="Upload gallery photos" />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-secondary mb-2">Badge</p>
            <div className="flex flex-wrap gap-1.5">
              {BADGES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() =>
                    onUpdateItem(item.id, {
                      badge: item.badge === b ? undefined : b,
                    })
                  }
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize transition-all ${
                    item.badge === b
                      ? "bg-primary text-white"
                      : "bg-surface-container-high text-secondary hover:bg-surface-container-highest"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Count */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-xs font-bold text-secondary">Stock Count</p>
                <p className="text-[10px] text-secondary opacity-70">
                  Leave empty for unlimited. Reaches 0 → auto Sold Out.
                </p>
              </div>
              {typeof item.stock_count === "number" && (
                <button
                  type="button"
                  onClick={() => onUpdateItem(item.id, { stock_count: null })}
                  className="text-[10px] font-bold text-secondary hover:text-error transition-colors"
                  title="Clear stock limit"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Unlimited"
              title="Stock Count"
              value={item.stock_count ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  onUpdateItem(item.id, { stock_count: null });
                } else {
                  const n = parseInt(v, 10);
                  if (!isNaN(n) && n >= 0) {
                    onUpdateItem(item.id, {
                      stock_count: n,
                      available: n > 0 ? true : false,
                    });
                  }
                }
              }}
              className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Quick Dietary Toggles */}
          <div>
            <p className="text-xs font-bold text-secondary mb-2">Dietary & Allergen Quick Toggles</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_DIETARY_TAGS.map((tag) => {
                const isActive = item.tags.some(
                  (t) => t.toLowerCase().trim() === tag.id
                );
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleDietaryTag(tag.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer active:scale-95 ${
                      isActive
                        ? `${tag.color} border-transparent shadow-sm font-extrabold`
                        : "bg-surface-container-low text-secondary border-outline-variant/20 hover:bg-surface-container-high"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {tag.icon}
                    </span>
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-secondary mb-2">Custom Tags</p>
            <div className="flex flex-wrap gap-1.5 items-center">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-error transition-colors"
                    title={`Remove ${tag}`}
                  >
                    <span className="material-symbols-outlined text-[10px]">close</span>
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={handleAddTagPrompt}
                className="flex items-center gap-0.5 text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-0.5 rounded-full transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span> Add tag
              </button>
            </div>
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between pt-1 border-t border-outline-variant/10">
            <button
              type="button"
              onClick={() => {
                onDuplicateItem(item.id);
                toast.success("Item duplicated");
              }}
              className="flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>{" "}
              Duplicate
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: `Delete "${item.name}"?`,
                  message: "This item will be permanently removed.",
                  confirmLabel: "Delete",
                  danger: true,
                });
                if (ok) {
                  onRemoveItem(item.id);
                  toast.success("Item deleted");
                }
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-error/70 hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete</span> Delete
            </button>
          </div>
        </div>
      )}

      {/* Expand indicator */}
      <span
        className={`absolute right-3 bottom-3 material-symbols-outlined text-sm text-secondary opacity-0 group-hover:opacity-70 transition-all pointer-events-none ${
          isExpanded ? "rotate-180" : ""
        }`}
      >
        expand_more
      </span>
      <style jsx>{`
        .dnd-item-style {
          transform: ${style.transform};
          transition: ${style.transition};
        }
      `}</style>
    </div>
  );
}
