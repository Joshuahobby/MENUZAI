"use client";

import { useMenu } from "@/context/MenuContext";
import { toast } from "sonner";

interface MobileBottomBarProps {
  mobileSheet: "build" | "design" | null;
  setMobileSheet: (v: "build" | "design" | null) => void;
  setPublishedSlug: (slug: string | null) => void;
  activeCategoryId: string | undefined;
}

export function MobileBottomBar({
  mobileSheet,
  setMobileSheet,
  setPublishedSlug,
  activeCategoryId,
}: MobileBottomBarProps) {
  const { addItem, menuStatus, isSyncing, publishMenu, unpublishMenu } = useMenu();

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden z-30 bg-white border-t border-black/6 flex h-14">
      {/* Sections */}
      <button
        type="button"
        onClick={() => setMobileSheet(mobileSheet === "build" ? null : "build")}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
          mobileSheet === "build" ? "text-primary" : "text-secondary"
        }`}
      >
        <span className={`material-symbols-outlined text-[22px] ${mobileSheet === "build" ? "icon-fill" : ""}`}>
          menu_book
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wide">Sections</span>
      </button>

      {/* Add Item */}
      <button
        type="button"
        onClick={() => {
          if (activeCategoryId) {
            addItem(activeCategoryId);
            setMobileSheet("build");
            toast.success("Item added — tap to edit");
          } else {
            setMobileSheet("build");
            toast("Select a section first");
          }
        }}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-secondary"
      >
        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center -mt-2 shadow-md shadow-primary/20">
          <span className="material-symbols-outlined text-white text-[20px]">add</span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wide mt-0.5">Add Item</span>
      </button>

      {/* Design */}
      <button
        type="button"
        onClick={() => setMobileSheet(mobileSheet === "design" ? null : "design")}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
          mobileSheet === "design" ? "text-primary" : "text-secondary"
        }`}
      >
        <span className={`material-symbols-outlined text-[22px] ${mobileSheet === "design" ? "icon-fill" : ""}`}>
          palette
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wide">Design</span>
      </button>

      {/* Publish */}
      <button
        type="button"
        disabled={isSyncing}
        onClick={async () => {
          if (menuStatus === "published") {
            await unpublishMenu();
            setPublishedSlug(null);
            toast.success("Menu unpublished");
          } else {
            const slug = await publishMenu();
            if (slug) {
              setPublishedSlug(slug);
              setTimeout(() => setPublishedSlug(null), 3000);
              toast.success("Menu published!");
            }
          }
        }}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors disabled:opacity-60 ${
          menuStatus === "published" ? "text-tertiary" : "text-primary"
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">
          {menuStatus === "published" ? "cloud_done" : "publish"}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wide">
          {menuStatus === "published" ? "Live" : "Publish"}
        </span>
      </button>
    </div>
  );
}
