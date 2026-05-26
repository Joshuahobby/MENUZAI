"use client";

import { useMenu } from "@/context/MenuContext";
import { prompt, confirm } from "@/components/Modals";
import { toast } from "sonner";

interface CatSheet { id: string; name: string; hidden?: boolean }

interface CategoryActionSheetProps {
  catActionSheet: CatSheet | null;
  setCatActionSheet: (v: CatSheet | null) => void;
  activeCategoryId: string | undefined;
  setActiveCategoryId: (id: string | undefined) => void;
}

export function CategoryActionSheet({
  catActionSheet,
  setCatActionSheet,
  activeCategoryId,
  setActiveCategoryId,
}: CategoryActionSheetProps) {
  const { menuItems, renameCategory, removeCategory, toggleCategoryVisibility } = useMenu();

  if (!catActionSheet) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        onClick={() => setCatActionSheet(null)}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden bg-white rounded-t-3xl p-6 shadow-2xl">
        <div className="w-10 h-1 bg-black/10 rounded-full mx-auto mb-6" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-1">Section</p>
        <p className="font-bold text-xl mb-6">{catActionSheet.name}</p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={async () => {
              setCatActionSheet(null);
              const name = await prompt({
                title: "Rename Section",
                defaultValue: catActionSheet.name,
                placeholder: "Section name",
                confirmLabel: "Rename",
              });
              if (name && name !== catActionSheet.name) {
                renameCategory(catActionSheet.id, name);
                toast.success(`Renamed to "${name}"`);
              }
            }}
            className="w-full flex items-center gap-4 px-5 py-4 bg-black/3 hover:bg-black/6 rounded-2xl text-sm font-bold transition-all"
          >
            <span className="material-symbols-outlined text-primary">edit</span>
            Rename
          </button>
          <button
            type="button"
            onClick={() => {
              setCatActionSheet(null);
              toggleCategoryVisibility(catActionSheet.id);
              toast.success(
                catActionSheet.hidden
                  ? `"${catActionSheet.name}" is now visible`
                  : `"${catActionSheet.name}" hidden from public menu`
              );
            }}
            className="w-full flex items-center gap-4 px-5 py-4 bg-black/3 hover:bg-black/6 rounded-2xl text-sm font-bold transition-all"
          >
            <span className="material-symbols-outlined text-secondary">
              {catActionSheet.hidden ? "visibility" : "visibility_off"}
            </span>
            {catActionSheet.hidden ? "Show on public menu" : "Hide from public menu"}
          </button>
          <button
            type="button"
            onClick={async () => {
              setCatActionSheet(null);
              const itemCount = menuItems.filter((i) => i.category === catActionSheet.id).length;
              const ok = await confirm({
                title: `Delete "${catActionSheet.name}"?`,
                message:
                  itemCount > 0
                    ? `This will permanently delete ${itemCount} item${itemCount !== 1 ? "s" : ""} in this section.`
                    : "This section will be permanently removed.",
                confirmLabel: "Delete",
                danger: true,
              });
              if (ok) {
                if (activeCategoryId === catActionSheet.id) setActiveCategoryId(undefined);
                removeCategory(catActionSheet.id);
                toast.success(`"${catActionSheet.name}" deleted.`);
              }
            }}
            className="w-full flex items-center gap-4 px-5 py-4 bg-red-50 hover:bg-red-100 rounded-2xl text-sm font-bold text-red-600 transition-all"
          >
            <span className="material-symbols-outlined">delete</span>
            Delete Section
          </button>
        </div>
        <button
          type="button"
          onClick={() => setCatActionSheet(null)}
          className="w-full mt-4 py-4 rounded-2xl bg-black/5 text-secondary font-bold text-sm"
        >
          Cancel
        </button>
      </div>
    </>
  );
}
