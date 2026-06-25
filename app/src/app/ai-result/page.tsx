"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMenu } from "@/context/MenuContext";
import { confirm } from "@/components/Modals";

export default function AIResultPage() {
  const router = useRouter();
  const { menuItems, menuStyle, updateItem, removeItem } = useMenu();
  const currency = menuStyle?.currency ?? "RWF";

  const grouped = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  if (menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <header className="w-full sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container/50 px-4 sm:px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-white icon-fill text-lg">restaurant_menu</span>
            </div>
            <span className="font-headline font-black text-lg tracking-tight text-on-surface">
              MENUZA <span className="text-primary">AI</span>
            </span>
          </Link>
        </header>
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 text-center">
          <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-secondary">search_off</span>
          </div>
          <h2 className="text-2xl font-headline font-bold mb-3">No items extracted</h2>
          <p className="text-secondary text-sm max-w-sm mb-8">
            The AI couldn&apos;t find any menu items in your image. Try a clearer photo or one with more visible text.
          </p>
          <div className="flex gap-4">
            <Link href="/upload" className="px-6 py-3 bg-linear-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-colors">
              Try Again
            </Link>
            <Link href="/dashboard/editor" className="px-6 py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors">
              Go to Editor
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="w-full sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container/50 px-4 sm:px-6 h-16 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-white icon-fill text-lg">restaurant_menu</span>
          </div>
          <span className="font-headline font-black text-lg tracking-tight text-on-surface">
            MENUZA <span className="text-primary">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-tertiary font-bold flex items-center gap-1.5 bg-tertiary/10 px-3 py-1.5 rounded-xl">
            <span className="material-symbols-outlined text-sm icon-fill">check_circle</span>
            {menuItems.length} items extracted
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-headline font-extrabold tracking-tight mb-2">Review Extracted Menu</h1>
          <p className="text-secondary">Edit any field inline. Remove items that don&apos;t look right. When done, continue to the editor.</p>
          <p className="text-[10px] text-secondary/50 mt-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">sync</span>
            Changes save automatically
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories panel */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="font-headline font-bold text-lg mb-4">Categories</h2>
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="p-4 bg-surface-container-lowest rounded-2xl flex items-center justify-between border border-transparent hover:border-primary/10 hover:shadow-sm transition-colors">
                <span className="font-bold text-sm capitalize">{cat}</span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{items.length} items</span>
              </div>
            ))}
            <div className="mt-6 p-4 bg-surface-container-lowest rounded-2xl border border-surface-container/50 text-xs text-secondary leading-relaxed">
              <span className="material-symbols-outlined text-sm text-primary align-middle mr-1">info</span>
              These are AI suggestions. You can rename, edit prices, or delete items before saving to your menu.
            </div>
          </div>

          {/* Items panel */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-headline font-bold text-lg mb-4">
              Items <span className="text-secondary font-normal text-base">({menuItems.length})</span>
            </h2>
            {menuItems.map((item) => (
              <div key={item.id} className="group p-6 bg-surface-container-lowest rounded-2xl hover:shadow-md transition-colors border border-transparent hover:border-primary/10 relative">
                {/* Delete — always visible at reduced opacity so it's tappable on mobile */}
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: `Remove "${item.name}"?`,
                      message: "This item will be removed from the extracted list.",
                      confirmLabel: "Remove",
                      danger: true,
                    });
                    if (ok) removeItem(item.id);
                  }}
                  title="Remove item"
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-error/10 text-error flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity hover:bg-error/20"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>

                <div className="flex justify-between items-start mb-3 pr-8 gap-3">
                  <input
                    className="font-headline font-bold text-lg bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 -mx-2 flex-1 min-w-0"
                    value={item.name}
                    title="Item name"
                    placeholder="Item Name"
                    aria-label="Item name"
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-bold text-secondary">{currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="font-bold text-primary text-base bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 w-24 text-right"
                      value={item.price === 0 ? "" : item.price}
                      title="Item price"
                      placeholder="0"
                      aria-label="Item price"
                      onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <input
                  className="text-sm text-secondary bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 -mx-2 w-full"
                  value={item.description}
                  title="Item description"
                  placeholder="Add a description…"
                  aria-label="Item description"
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                />

                {item.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-surface-container pt-8">
          <Link href="/upload" className="text-sm font-bold text-secondary hover:text-primary flex items-center gap-1.5 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Upload different images
          </Link>
          <button
            type="button"
            onClick={() => {
              toast.success("Menu saved! Opening editor…");
              router.push("/dashboard/editor");
            }}
            className="px-4 sm:px-8 py-4 bg-linear-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-colors text-base sm:text-lg flex items-center gap-2"
          >
            <span className="hidden sm:inline">Save & Continue to Editor</span>
            <span className="sm:hidden">Continue to Editor</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </main>
    </div>
  );
}
