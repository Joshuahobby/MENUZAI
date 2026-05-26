"use client";

import { useMenu } from "@/context/MenuContext";
import { prompt } from "@/components/Modals";
import { toast } from "sonner";

interface CatSheet { id: string; name: string; hidden?: boolean }

interface CategoryTabStripProps {
  activeCategoryId: string | undefined;
  setActiveCategoryId: (id: string | undefined) => void;
  onCategoryOptions: (cat: CatSheet) => void;
}

export function CategoryTabStrip({ activeCategoryId, setActiveCategoryId, onCategoryOptions }: CategoryTabStripProps) {
  const { categories, menuItems, addCategory } = useMenu();

  return (
    <div className="lg:hidden w-full sticky top-0 z-10 bg-surface-container-low/95 backdrop-blur-sm border-b border-surface-container px-4 py-2.5 flex gap-2 overflow-x-auto hide-scrollbar shrink-0">
      {categories.map((cat) => (
        <div key={cat.id} className="shrink-0 flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setActiveCategoryId(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeCategoryId === cat.id
                ? "bg-primary text-white shadow-sm"
                : cat.hidden
                ? "bg-surface-container text-secondary/50 line-through"
                : "bg-surface-container-high text-secondary hover:bg-surface-container-highest"
            }`}
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
            onClick={() => onCategoryOptions({ id: cat.id, name: cat.name, hidden: cat.hidden })}
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
  );
}
