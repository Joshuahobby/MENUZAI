"use client";

import { useState } from "react";
import { StyleEditorSidebarContent } from "./StyleEditorSidebarContent";
import { BuildSidebarContent } from "./BuildSidebarContent";
import type { MenuItem } from "@/types/menu";

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
    <aside className="w-80 lg:w-96 bg-surface flex flex-col h-full border-l border-outline-variant/10 shrink-0 shadow-2xl lg:shadow-none z-50">
      {/* Tabs */}
      <div className="flex items-center border-b border-outline-variant/10 bg-surface-container-lowest shrink-0">
        <button
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${tab === "build" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-secondary hover:bg-surface-container-low hover:text-on-surface"}`}
          onClick={() => setTab("build")}
        >
          Build
        </button>
        <button
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${tab === "design" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-secondary hover:bg-surface-container-low hover:text-on-surface"}`}
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
      <div className="flex-1 overflow-hidden flex flex-col bg-surface">
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
