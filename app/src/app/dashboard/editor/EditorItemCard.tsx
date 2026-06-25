"use client";

import NextImage from "next/image";
import type { MenuItem, MenuStyle } from "@/types/menu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatPrice } from "@/lib/utils";

interface EditorItemCardProps {
  item: MenuItem;
  menuStyle: MenuStyle;
  isSelected: boolean;
  onClick: () => void;
}

export function EditorItemCard({ item, menuStyle, isSelected, onClick }: EditorItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardWrap =
    menuStyle.cardStyle === "elevated"
      ? "bg-surface-container-lowest shadow-sm border border-surface-container/30 overflow-hidden"
      : menuStyle.cardStyle === "glass"
      ? "bg-white/40 backdrop-blur-md border border-white/20 shadow-lg overflow-hidden"
      : "bg-transparent border-b border-surface-container/50";

  const isSoldOut = item.available === false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`group relative rounded-3xl transition-colors duration-300 ${cardWrap} cursor-pointer ${
        isSelected ? "ring-2 ring-primary bg-surface-container-low" : "hover:bg-surface-container-lowest"
      } ${isDragging ? "opacity-50 z-10" : "opacity-100 z-[1]"}`}
    >
      {/* Drag handle — top-LEFT to avoid conflicting with price chip (top-right) */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-3 opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-colors cursor-grab active:cursor-grabbing z-20"
        title="Drag to reorder"
      >
        <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
      </div>

      {/* Image banner */}
      {item.image && (
        <div className="relative w-full h-44 shrink-0 overflow-hidden">
          <NextImage
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 420px) 100vw, 420px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}

      {/* Price chip — top-right, now unambiguous with drag handle on the left */}
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1 z-10">
        <span className="font-headline font-bold text-[var(--price-text-color)] text-sm">
          {formatPrice(item.price, menuStyle.currency ?? "RWF")}
        </span>
      </div>

      {/* Badge */}
      {item.badge && (
        <span className="absolute bottom-3 left-3 bg-[var(--primary-color)]/90 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-tighter z-10">
          {item.badge}
        </span>
      )}

      {/* Sold-out — translucent so name/price remain readable */}
      {isSoldOut && (
        <div className="absolute inset-0 bg-surface/55 backdrop-blur-[1.5px] flex items-center justify-center z-30 rounded-[inherit]">
          <span className="bg-error text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
            Sold Out
          </span>
        </div>
      )}

      {/* Text content */}
      <div className="px-4 pt-3 pb-2">
        {/* pl-6 when no image so text doesn't sit under the drag handle */}
        <h3 className={`font-headline font-extrabold text-base text-on-surface ${!item.image ? "pl-6" : ""}`}>
          {item.name}
        </h3>
        {item.description && (
          <p className={`text-sm font-medium leading-relaxed italic line-clamp-2 font-[var(--font-body)] text-[var(--item-text-color)] mt-0.5 ${!item.image ? "pl-6" : ""}`}>
            {item.description}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className={`mt-2 flex gap-1 flex-wrap ${!item.image ? "pl-6" : ""}`}>
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

        {/* "Tap to edit" affordance — subtle row at the bottom of each card */}
        <div className="mt-2 flex items-center justify-end">
          <span
            className={`text-[10px] flex items-center gap-0.5 transition-colors select-none ${
              isSelected
                ? "text-primary font-bold"
                : "text-on-surface/25 group-hover:text-on-surface/50"
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">{isSelected ? "edit" : "touch_app"}</span>
            <span className="hidden sm:inline">{isSelected ? "Editing" : "Tap to edit"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
