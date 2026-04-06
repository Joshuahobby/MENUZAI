import { useMenu } from "@/context/MenuContext";
import { prompt } from "@/components/Modals";
import { toast } from "sonner";
import { useRef } from "react";

interface MenuSectionsSidebarProps {
  activeCategoryId: string | undefined;
  setActiveCategoryId: (id: string) => void;
}

export function MenuSectionsSidebar({ activeCategoryId, setActiveCategoryId }: MenuSectionsSidebarProps) {
  const { categories, menuItems, addCategory, setCategories } = useMenu();
  const dragIdRef = useRef<string | null>(null);

  const handleDragStart = (id: string) => {
    dragIdRef.current = id;
  };

  const handleDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
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
  };

  return (
    <aside className="w-72 bg-surface flex flex-col p-6 overflow-y-auto shrink-0 hidden lg:flex">
      <div className="mb-8">
        <h2 className="font-[var(--font-headline)] text-lg font-bold tracking-tight mb-2">Menu Sections</h2>
        <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Drag to reorder</p>
      </div>
      <div className="space-y-4 mb-10">
        {categories.map((cat) => (
          <div
            key={cat.id}
            draggable
            onDragStart={() => handleDragStart(cat.id)}
            onDragOver={(e) => handleDragOver(e, cat.id)}
            onDrop={handleDrop}
            className="group cursor-grab active:cursor-grabbing"
            onClick={() => setActiveCategoryId(cat.id)}
          >
            <div className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer ${activeCategoryId === cat.id ? "bg-surface-container-low ring-2 ring-primary ring-offset-2" : "bg-surface-container-lowest shadow-sm hover:shadow-md border border-transparent hover:border-primary/10"}`}>
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${activeCategoryId === cat.id ? "text-primary" : "text-secondary-container"}`}>
                  {activeCategoryId === cat.id ? "restaurant_menu" : "drag_indicator"}
                </span>
                <span className={`font-bold text-sm ${activeCategoryId === cat.id ? "text-primary" : ""}`}>{cat.name}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${activeCategoryId === cat.id ? "text-on-primary bg-primary-container" : "text-primary bg-primary-fixed"}`}>
                {menuItems.filter(i => i.category === cat.id).length} items
              </span>
            </div>
          </div>
        ))}
      </div>
      <button 
        onClick={async () => {
          const name = await prompt({
            title: "New Section",
            placeholder: "e.g. Desserts",
            confirmLabel: "Add Section",
          });
          if (name) {
            addCategory(name);
            toast.success(`"${name}" section added.`);
          }
        }}
        className="w-full flex items-center justify-center gap-2 py-4 bg-surface-container-high rounded-2xl text-on-surface font-bold text-sm hover:bg-surface-container-highest transition-all group active:scale-95"
      >
        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
        Add New Section
      </button>
      <div className="mt-auto pt-8 border-t border-outline-variant/20">
        <div className="bg-primary-container/5 rounded-3xl p-5 border border-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-sm icon-fill">restaurant_menu</span>
            <span className="font-[var(--font-headline)] font-bold text-sm text-primary">AI Suggestions</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">Based on current trends, your &apos;Dessert&apos; category could benefit from a seasonal pairing.</p>
        </div>
      </div>
    </aside>
  );
}
