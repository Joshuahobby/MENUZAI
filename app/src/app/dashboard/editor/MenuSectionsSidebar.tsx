import { useMenu } from "@/context/MenuContext";
import { prompt, confirm } from "@/components/Modals";
import { toast } from "sonner";
import { useRef } from "react";

interface MenuSectionsSidebarProps {
  activeCategoryId: string | undefined;
  setActiveCategoryId: (id: string | undefined) => void;
}

export function MenuSectionsSidebar({ activeCategoryId, setActiveCategoryId }: MenuSectionsSidebarProps) {
  const { categories, menuItems, addCategory, renameCategory, removeCategory, setCategories } = useMenu();
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

  const handleRename = async (e: React.MouseEvent, catId: string, currentName: string) => {
    e.stopPropagation();
    const name = await prompt({
      title: "Rename Section",
      defaultValue: currentName,
      placeholder: "Section name",
      confirmLabel: "Rename",
    });
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
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`material-symbols-outlined shrink-0 ${activeCategoryId === cat.id ? "text-primary" : "text-secondary-container"}`}>
                  {activeCategoryId === cat.id ? "restaurant_menu" : "drag_indicator"}
                </span>
                <span className={`font-bold text-sm truncate ${activeCategoryId === cat.id ? "text-primary" : ""}`}>{cat.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Rename + delete — visible on hover */}
                <button
                  type="button"
                  title="Rename section"
                  onClick={(e) => handleRename(e, cat.id, cat.name)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-surface-container-high transition-all text-secondary hover:text-primary"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                </button>
                <button
                  type="button"
                  title="Delete section"
                  onClick={(e) => handleDelete(e, cat.id, cat.name)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-error/10 transition-all text-secondary hover:text-error"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                </button>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ml-1 ${activeCategoryId === cat.id ? "text-on-primary bg-primary-container" : "text-primary bg-primary-fixed"}`}>
                  {menuItems.filter((i) => i.category === cat.id).length}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
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
