"use client";

import NextImage from "next/image";
import type { MenuItem, MenuStyle } from "@/types/menu";
import { formatPrice, getOptimizedImageUrl, getTagMeta } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  menuStyle: MenuStyle;
  onSelect: () => void;
  onAddToCart: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  cartQty: number;
}

export default function MenuItemCard({
  item,
  menuStyle,
  onSelect,
  onAddToCart,
  onIncrement,
  onDecrement,
  cartQty,
}: MenuItemCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`bg-surface-container-lowest overflow-hidden flex flex-col shadow-sm border border-outline-variant/10 rounded-[var(--border-radius)] relative cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${item.available === false ? "opacity-60" : ""}`}
    >
      <div className={`relative ${menuStyle.layoutDensity === "compact" ? "h-36" : "h-52"}`}>
        <NextImage
          alt={item.name}
          className="object-cover"
          src={getOptimizedImageUrl(item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop", 600)}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
        />
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 z-10 shadow-sm rounded-[calc(var(--border-radius)/2)]">
          <span className="font-[var(--font-headline)] font-extrabold text-lg text-[var(--primary-color)]">{formatPrice(item.price, menuStyle.currency ?? "RWF")}</span>
        </div>
        {item.available === false && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <span className="bg-error text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">Sold Out</span>
          </div>
        )}
        {item.gallery && item.gallery.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 z-20">
            <span className="material-symbols-outlined text-[12px]">collections</span>
            <span>+{item.gallery.length}</span>
          </div>
        )}
      </div>

      <div className={`flex flex-col flex-1 ${menuStyle.layoutDensity === "compact" ? "p-4" : menuStyle.layoutDensity === "spacious" ? "p-8" : "p-6"}`}>
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
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3.5 mt-1">
            {item.tags.map((tag) => {
              const meta = getTagMeta(tag);
              return (
                <span key={tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${meta.color}`}>
                  <span className="material-symbols-outlined text-[11px]">{meta.icon}</span>
                  {tag}
                </span>
              );
            })}
          </div>
        )}
        {menuStyle.layoutDensity !== "compact" && (
          <p className="text-on-surface-variant text-sm leading-relaxed mb-6 font-medium opacity-80 font-[var(--font-body)] line-clamp-2">{item.description}</p>
        )}
        {item.available === false ? (
          <div className={`w-full flex items-center justify-center bg-surface-container text-secondary font-bold rounded-[var(--border-radius)] cursor-not-allowed ${menuStyle.layoutDensity === "compact" ? "py-2.5 text-sm mt-auto" : "py-4 mt-auto"}`}>
            Sold Out
          </div>
        ) : cartQty > 0 ? (
          <div
            className={`w-full flex items-center justify-between bg-[var(--primary-color)]/10 rounded-[var(--border-radius)] mt-auto ${menuStyle.layoutDensity === "compact" ? "py-1" : "py-1.5"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDecrement(); }}
              className="w-10 h-10 flex items-center justify-center text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-[var(--border-radius)] transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">{cartQty === 1 ? "delete" : "remove"}</span>
            </button>
            <span className="font-[var(--font-headline)] font-black text-[var(--primary-color)] text-base min-w-[2ch] text-center">{cartQty}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onIncrement(); }}
              className="w-10 h-10 flex items-center justify-center text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-[var(--border-radius)] transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className={`w-full text-white font-[var(--font-headline)] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:opacity-90 bg-[var(--primary-color)] rounded-[var(--border-radius)] premium-shadow ${menuStyle.layoutDensity === "compact" ? "py-2.5 text-sm mt-auto" : "py-4 mt-auto"}`}
          >
            Add to Cart
            <span className="material-symbols-outlined text-lg">add_circle</span>
          </button>
        )}
      </div>
    </div>
  );
}
