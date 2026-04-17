"use client";

import Link from "next/link";
import { useMenu } from "@/context/MenuContext";
import { formatPrice } from "@/lib/utils";

export default function AIResultPage() {
  const { menuItems, menuStyle, updateItem } = useMenu();
  const currency = menuStyle.currency ?? "RWF";

  const grouped = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="w-full sticky top-0 z-50 bg-surface/80 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-[var(--font-headline)] font-black tracking-tight text-primary-container">MENUZA AI</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-tertiary font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm icon-fill">check_circle</span>
            AI Extraction Complete
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-2">Review Extracted Menu</h1>
          <p className="text-secondary">Click any field to edit. AI suggestions are highlighted.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Categories */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-[var(--font-headline)] font-bold text-lg mb-4">Categories</h2>
            {Object.keys(grouped).map((cat) => (
              <div key={cat} className="p-4 bg-surface-container-lowest rounded-2xl flex items-center justify-between hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-primary/10">
                <span className="font-bold text-sm capitalize">{cat}</span>
                <span className="text-xs font-bold text-primary bg-primary-fixed px-2 py-1 rounded-md">{grouped[cat].length} items</span>
              </div>
            ))}
          </div>

          {/* Right: Items */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-[var(--font-headline)] font-bold text-lg mb-4">Items</h2>
            {menuItems.map((item) => (
              <div key={item.id} className="p-6 bg-surface-container-lowest rounded-2xl hover:shadow-md transition-all border border-transparent hover:border-primary/10">
                <div className="flex justify-between items-start mb-2">
                  <input
                    className="font-[var(--font-headline)] font-bold text-lg bg-transparent border-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 -mx-2 w-full"
                    value={item.name}
                    title="Item Name"
                    placeholder="Item Name"
                    aria-label="Item Name"
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  />
                  <input
                    className="font-[var(--font-headline)] font-bold text-primary text-lg bg-transparent border-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 w-24 text-right"
                    value={formatPrice(item.price, currency)}
                    title="Item Price"
                    placeholder="Price"
                    aria-label="Item Price"
                    onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value.replace(/[^\d.]/g, "")) || 0 })}
                  />
                </div>
                <input
                  className="text-sm text-on-surface-variant bg-transparent border-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 -mx-2 w-full"
                  value={item.description}
                  title="Item Description"
                  placeholder="Item Description"
                  aria-label="Item Description"
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                />
                <div className="mt-3 flex gap-2 items-center">
                  {item.tags.map((tag) => (
                    <span key={tag} className="bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">{tag}</span>
                  ))}
                  <button className="text-[10px] font-bold text-primary flex items-center gap-1 ml-auto hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-sm icon-fill">auto_awesome</span> AI Suggest
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex justify-end">
          <Link href="/dashboard/editor" className="px-8 py-4 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all text-lg">
            Continue to Design →
          </Link>
        </div>
      </main>
    </div>
  );
}
