"use client";

import NextImage from "next/image";
import type { MenuItem, MenuStyle } from "@/types/menu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface EditorItemCardProps {
  item: MenuItem;
  menuStyle: MenuStyle;
  isSelected: boolean;
  onClick: () => void;
}

export function EditorItemCard({
  item,
  menuStyle,
  isSelected,
  onClick,
}: EditorItemCardProps) {


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

  const cardWrap =
    menuStyle.cardStyle === "elevated"
      ? "bg-white shadow-sm border border-surface-container/30 overflow-hidden"
      : menuStyle.cardStyle === "glass"
      ? "bg-white/40 backdrop-blur-md border border-white/20 shadow-lg overflow-hidden"
      : "bg-transparent border-b border-surface-container/50";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`group relative rounded-3xl transition-all duration-300 ${cardWrap} cursor-pointer ${isSelected ? "ring-2 ring-primary bg-surface-container-low" : "hover:bg-surface-container-lowest"} ${isDragging ? "opacity-50 z-10" : "opacity-100 z-[1]"}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 right-3 opacity-20 group-hover:opacity-60 hover:opacity-100 transition-all cursor-grab active:cursor-grabbing z-20"
        title="Drag to reorder"
      >
        <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
      </div>

      {/* ── Image banner ── */}
      {item.image && (
        <div className="relative w-full h-44 group/img shrink-0 overflow-hidden">
          <NextImage
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 420px) 100vw, 420px"
            className="object-cover transition-transform duration-500 group-hover/img:scale-105"
          />
        </div>
      )}

      {/* Price tag */}
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1 z-10">
        <span className="font-[var(--font-headline)] font-bold text-[var(--primary-color)] text-[10px] opacity-70">
          {menuStyle.currency ?? "RWF"}
        </span>
        <span className="font-[var(--font-headline)] font-bold text-[var(--primary-color)] text-sm">{item.price}</span>
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



      <div className="px-4 py-3">
        <h3 className="font-[var(--font-headline)] font-extrabold text-base text-on-surface w-full">{item.name}</h3>
        {item.description && (
          <p className="text-sm font-medium leading-relaxed italic overflow-hidden font-[var(--font-body)] text-[var(--secondary-color)] mt-0.5">
            {item.description}
          </p>
        )}
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


    </div>
  );
}
