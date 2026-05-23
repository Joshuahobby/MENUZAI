"use client";

import React, { useState, useEffect } from "react";
import NextImage from "next/image";
import { formatPrice, getOptimizedImageUrl } from "@/lib/utils";
import type { MenuItem } from "@/types/menu";

interface ItemDetailsModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number) => void;
  currency: string;
}

const getTagMeta = (tag: string) => {
  const t = tag.toLowerCase().trim();
  if (t === "vegan") return { icon: "eco", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/10" };
  if (t === "vegetarian") return { icon: "spa", color: "text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400 border border-green-500/10" };
  if (t === "gluten-free" || t === "gluten free" || t === "gf") return { icon: "grass", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/10" };
  if (t === "spicy" || t === "hot") return { icon: "whatshot", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-500/10" };
  if (t === "halal") return { icon: "verified", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-500/10" };
  return { icon: "sell", color: "text-secondary bg-surface-container-high border border-outline-variant/10" };
};

export default function ItemDetailsModal({ item, isOpen, onClose, onAddToCart, currency }: ItemDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);

  // Reset quantity when modal opens
  useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleAdd = () => {
    onAddToCart(item, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 z-0" 
        onClick={onClose} 
      />
      
      <div className="bg-surface w-full max-w-lg sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-500 relative z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md rounded-full flex items-center justify-center z-20 transition-all"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Hero Image */}
        <div className="relative w-full h-64 sm:h-72 shrink-0 bg-surface-container-low">
          <NextImage
            src={getOptimizedImageUrl(item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop", 800)}
            alt={item.name}
            fill
            className="object-cover"
            priority
          />
          {item.available === false && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-error text-white font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-xl">Sold Out</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div>
            <div className="flex justify-between items-start gap-4 mb-2">
              <h3 className="font-[var(--font-headline)] text-2xl font-extrabold text-on-surface leading-tight">
                {item.name}
              </h3>
              <span className="font-[var(--font-headline)] text-xl font-black text-[var(--primary-color)] shrink-0">
                {formatPrice(item.price, currency)}
              </span>
            </div>

            {/* Badges & Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {item.badge && (
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  item.badge === "healthy" ? "bg-tertiary/10 text-tertiary" : 
                  item.badge === "popular" ? "bg-rose-500/10 text-rose-600" : 
                  "bg-primary/10 text-primary"
                }`}>
                  <span className="material-symbols-outlined text-[14px] icon-fill">
                    {item.badge === "healthy" ? "eco" : item.badge === "popular" ? "local_fire_department" : "star"}
                  </span>
                  {item.badge}
                </div>
              )}
              {item.tags?.map(tag => {
                const meta = getTagMeta(tag);
                return (
                  <span key={tag} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>
                    <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
                    {tag}
                  </span>
                );
              })}
            </div>

            <p className="text-on-surface-variant font-[var(--font-body)] text-sm leading-relaxed font-medium">
              {item.description || "A delicious item prepared with care."}
            </p>
          </div>

          {/* Optional: Gallery preview if multiple images exist */}
          {item.gallery && item.gallery.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-secondary">More Photos</h4>
              <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {item.gallery.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-outline-variant/20 shadow-sm">
                    <NextImage src={getOptimizedImageUrl(url, 400)} alt={`Gallery ${idx}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-surface border-t border-surface-container/50 pb-8 sm:pb-6 flex items-center gap-4">
          <div className="flex items-center bg-surface-container-low rounded-2xl h-14 p-1">
            <button 
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={item.available === false || quantity <= 1}
              className="w-12 h-full rounded-xl flex items-center justify-center text-secondary hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="w-10 text-center font-bold text-on-surface">{quantity}</span>
            <button 
              onClick={() => setQuantity(q => q + 1)}
              disabled={item.available === false}
              className="w-12 h-full rounded-xl flex items-center justify-center text-secondary hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>

          <button
            onClick={handleAdd}
            disabled={item.available === false}
            className="flex-1 h-14 bg-[var(--primary-color)] hover:opacity-90 text-white rounded-2xl font-[var(--font-headline)] font-bold text-lg premium-shadow flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            Add {formatPrice(item.price * quantity, currency)}
          </button>
        </div>
      </div>
    </div>
  );
}
