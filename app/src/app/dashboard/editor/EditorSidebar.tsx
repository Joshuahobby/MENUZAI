"use client";

import { useState } from "react";
import { StyleEditorSidebarContent } from "./StyleEditorSidebarContent";
import { BuildSidebarContent } from "./BuildSidebarContent";

interface EditorSidebarProps {
  activeCategoryId: string | undefined;
  setActiveCategoryId: (id: string | undefined) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  onClose?: () => void;
}

export function EditorSidebar({
  activeCategoryId,
  setActiveCategoryId,
  selectedItemId,
  setSelectedItemId,
  onClose
}: EditorSidebarProps) {
  const [tab, setTab] = useState<"build" | "design">("build");

  return (
    <aside className="hidden lg:flex lg:flex-col w-80 h-full bg-[#faf8f6] border-r border-black/6 shrink-0">
      {/* Tabs */}
      <div className="flex items-center border-b border-black/6 bg-[#faf8f6] shrink-0">
        <button
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${tab === "build" ? "text-primary bg-primary/10" : "text-secondary hover:bg-black/3 hover:text-on-surface"}`}
          onClick={() => setTab("build")}
        >
          Build
        </button>
        <button
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${tab === "design" ? "text-primary bg-primary/10" : "text-secondary hover:bg-black/3 hover:text-on-surface"}`}
          onClick={() => setTab("design")}
        >
          Design
        </button>
        {onClose && (
          <button onClick={onClose} className="p-4 lg:hidden text-secondary hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#faf8f6]">
        {tab === "build" && (
          <BuildSidebarContent
            activeCategoryId={activeCategoryId}
            setActiveCategoryId={setActiveCategoryId}
            selectedItemId={selectedItemId}
            setSelectedItemId={setSelectedItemId}
          />
        )}
        {tab === "design" && <StyleEditorSidebarContent />}
      </div>
    </aside>
  );
}
