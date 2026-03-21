"use client";

import NextImage from "next/image";
import { templates } from "@/data/mockData";
import { useState } from "react";
import { useMenu, MenuStyle } from "@/context/MenuContext";
import { useRouter } from "next/navigation";

export default function TemplatesPage() {
  const { applyTemplate } = useMenu();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "free" | "pro">("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const filtered = filter === "all" ? templates : templates.filter((t) => t.tier === filter);
  const preview = templates.find((t) => t.id === previewId);

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Template Gallery</h1>
          <p className="text-secondary">Browse professionally designed restaurant menu templates</p>
        </div>
        <div className="flex gap-2">
          {(["all", "free", "pro"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all ${filter === f ? "bg-primary/10 text-primary" : "text-secondary hover:bg-surface-container-low"}`}>
              {f === "all" ? "All Templates" : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((t) => (
          <div key={t.id} onClick={() => setPreviewId(t.id)}
            className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-primary/10">
            <div className="relative h-48 overflow-hidden">
              <NextImage 
                alt={t.name} 
                className="object-cover group-hover:scale-105 transition-transform duration-500" 
                src={t.image} 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={t.id === "t1"}
              />
              <div className="absolute top-4 right-4 z-10">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${t.tier === "pro" ? "bg-primary-container text-white" : "bg-tertiary-container text-white"}`}>
                  {t.tier}
                </span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-[var(--font-headline)] font-bold text-lg mb-1">{t.name}</h3>
              <p className="text-secondary text-sm mb-4">{t.description}</p>
              <span className="text-xs font-bold text-primary bg-primary-fixed px-3 py-1 rounded-lg">{t.style}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm" onClick={() => setPreviewId(null)}>
          <div className="bg-surface-container-lowest rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-64 overflow-hidden rounded-t-[2rem]">
              <NextImage 
                alt={preview.name} 
                className="object-cover" 
                src={preview.image} 
                fill 
                sizes="(max-width: 1200px) 100vw, 800px"
                priority
              />
              <button onClick={() => setPreviewId(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-colors z-20">
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="absolute top-4 left-4 z-20">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${preview.tier === "pro" ? "bg-primary-container text-white" : "bg-tertiary-container text-white"}`}>
                  {preview.tier}
                </span>
              </div>
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-[var(--font-headline)] font-extrabold mb-2">{preview.name}</h2>
              <p className="text-secondary mb-1">Style: {preview.style}</p>
              <p className="text-on-surface-variant text-sm mb-8">{preview.description}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    const styleMap: Record<string, Partial<MenuStyle>> = {
                      "Luxury Gold": { primaryColor: "#C5A059", secondaryColor: "#1E1E1E", headlineFont: "Playfair Display", bodyFont: "Inter", borderRadius: "2rem" },
                      "Modern Minimalist": { primaryColor: "#1E1E1E", secondaryColor: "#FFFFFF", headlineFont: "Plus Jakarta Sans", bodyFont: "Inter", borderRadius: "0.5rem" },
                      "Tropical Bistro": { primaryColor: "#00C853", secondaryColor: "#351000", headlineFont: "Poppins", bodyFont: "Montserrat", borderRadius: "3rem" }
                    };
                    const style = styleMap[preview.name] || {};
                    applyTemplate(style);
                    router.push("/dashboard/editor");
                  }}
                  className="flex-1 py-4 bg-gradient-to-br from-primary to-primary-container rounded-2xl font-bold text-white shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  Use This Template
                </button>
                <button onClick={() => setPreviewId(null)}
                  className="py-4 px-6 bg-surface-container-highest rounded-2xl font-bold text-on-surface hover:bg-surface-variant transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
