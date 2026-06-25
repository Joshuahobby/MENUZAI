"use client";

import { useState } from "react";
import type { MenuItem, MenuCategory } from "@/types/menu";

interface StockManagerModalProps {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  updateItem: (id: string, updates: Partial<MenuItem>) => void;
  onClose: () => void;
}

export function StockManagerModal({ categories, menuItems, updateItem, onClose }: StockManagerModalProps) {
  // Local edits buffer — committed to context on blur
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const visibleCategories = categories.filter(c => !c.hidden);

  const commitDraft = (item: MenuItem, raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "-") {
      updateItem(item.id, { stock_count: undefined });
    } else {
      const n = parseInt(trimmed, 10);
      if (!isNaN(n) && n >= 0) updateItem(item.id, { stock_count: n });
    }
    setDrafts(prev => { const next = { ...prev }; delete next[item.id]; return next; });
  };

  const clearAll = () => {
    menuItems.forEach(item => {
      if (item.stock_count !== undefined) updateItem(item.id, { stock_count: undefined });
    });
    setDrafts({});
  };

  const stockedCount = menuItems.filter(i => i.stock_count !== undefined).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/10 shrink-0">
          <div>
            <h2 className="font-headline text-xl font-extrabold text-on-surface tracking-tight">Manage Stock</h2>
            <p className="text-xs text-secondary mt-0.5">Items go sold out automatically when stock hits 0. Leave blank for unlimited.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/6 text-secondary hover:text-on-surface transition-colors"
            aria-label="Close stock manager"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {visibleCategories.map(cat => {
            const catItems = menuItems.filter(i => i.category === cat.id);
            if (catItems.length === 0) return null;
            return (
              <div key={cat.id}>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2 px-1">{cat.name}</h3>
                <div className="bg-surface-container-lowest border border-black/6 rounded-2xl overflow-hidden">
                  {catItems.map((item, idx) => {
                    const isSoldOut = item.available === false;
                    const draftVal = item.id in drafts ? drafts[item.id] : (item.stock_count !== undefined ? String(item.stock_count) : "");
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 px-4 py-3 ${idx < catItems.length - 1 ? "border-b border-black/5" : ""}`}
                      >
                        {/* Availability dot */}
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isSoldOut ? "bg-error" : "bg-tertiary"}`} title={isSoldOut ? "Sold out" : "Available"} />

                        {/* Item name */}
                        <span className="flex-1 text-sm font-medium text-on-surface truncate">{item.name}</span>

                        {/* Price */}
                        <span className="text-xs text-secondary shrink-0 hidden sm:inline">{item.price.toLocaleString()}</span>

                        {/* Stock count input */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            title="Decrement stock"
                            disabled={!draftVal || draftVal === "" || parseInt(draftVal) <= 0}
                            onClick={() => {
                              const cur = parseInt(draftVal || "0");
                              const next = Math.max(0, cur - 1);
                              setDrafts(prev => ({ ...prev, [item.id]: String(next) }));
                              updateItem(item.id, { stock_count: next });
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container text-secondary hover:bg-surface-container-highest hover:text-on-surface transition-colors disabled:opacity-30"
                          >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={draftVal}
                            placeholder="∞"
                            onChange={e => setDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onBlur={e => commitDraft(item, e.target.value)}
                            onKeyDown={e => e.key === "Enter" && commitDraft(item, (e.target as HTMLInputElement).value)}
                            className="w-16 text-center text-sm font-bold bg-surface-container rounded-xl px-2 py-1.5 border-none outline-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-secondary/30"
                            aria-label={`Stock count for ${item.name}`}
                          />
                          <button
                            type="button"
                            title="Increment stock"
                            onClick={() => {
                              const cur = parseInt(draftVal || "0");
                              const next = cur + 1;
                              setDrafts(prev => ({ ...prev, [item.id]: String(next) }));
                              updateItem(item.id, { stock_count: next });
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container text-secondary hover:bg-surface-container-highest hover:text-on-surface transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                        </div>

                        {/* Clear button */}
                        {item.stock_count !== undefined && !(item.id in drafts) && (
                          <button
                            type="button"
                            title="Set to unlimited"
                            onClick={() => updateItem(item.id, { stock_count: undefined })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-secondary/50 hover:text-error hover:bg-error/8 transition-colors shrink-0"
                            aria-label={`Remove stock limit for ${item.name}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        )}
                        {(item.stock_count === undefined && !(item.id in drafts)) && (
                          <div className="w-7 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {menuItems.length === 0 && (
            <div className="text-center py-12 text-secondary">
              <span className="material-symbols-outlined text-4xl opacity-30 block mb-3">inventory_2</span>
              <p className="text-sm font-medium">No items yet. Add items in the Build tab.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10 shrink-0 gap-3">
          <div className="text-xs text-secondary">
            {stockedCount > 0 ? (
              <span><span className="font-bold text-on-surface">{stockedCount}</span> item{stockedCount !== 1 ? "s" : ""} with stock limits</span>
            ) : (
              <span>No stock limits set — all items are unlimited</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {stockedCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="px-4 py-2 text-xs font-bold text-error bg-error/8 hover:bg-error/12 rounded-xl transition-colors"
              >
                Reset All to Unlimited
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold bg-primary text-white rounded-[2rem] hover:bg-[#a04100] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
