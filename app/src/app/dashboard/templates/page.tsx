"use client";

import NextImage from "next/image";
import { templates, type Template, type TemplateCategory } from "@/data/mockData";
import { useState } from "react";
import { useMenu } from "@/context/MenuContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<"all" | TemplateCategory, string> = {
  all: "All",
  casual: "Casual",
  "fine-dining": "Fine Dining",
  cafe: "Café",
  bar: "Bar",
  "fast-food": "Fast Food",
};

export default function TemplatesPage() {
  const { applyTemplate, plan } = useMenu();
  const router = useRouter();
  const [tierFilter, setTierFilter] = useState<"all" | "free" | "pro">("all");
  const [catFilter, setCatFilter] = useState<"all" | TemplateCategory>("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = templates.filter((t) => {
    const tierMatch = tierFilter === "all" || t.tier === tierFilter;
    const catMatch = catFilter === "all" || t.category === catFilter;
    return tierMatch && catMatch;
  });

  const preview = templates.find((t) => t.id === previewId);

  const applyAndGo = (t: Template) => {
    if (t.tier === "pro" && plan === "free") {
      toast.error("This template requires a Pro plan.", { description: "Upgrade to unlock all premium templates." });
      return;
    }
    applyTemplate(t.config);
    toast.success(`"${t.name}" applied to your menu.`);
    router.push("/dashboard/editor");
  };

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Template Gallery</h1>
        <p className="text-secondary">Browse professionally designed restaurant menu templates</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(CATEGORY_LABELS) as Array<"all" | TemplateCategory>).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCatFilter(cat)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                catFilter === cat
                  ? "bg-primary/10 text-primary"
                  : "text-secondary hover:bg-surface-container-low"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Tier toggle */}
        <div className="flex gap-2 sm:ml-auto">
          {(["all", "free", "pro"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTierFilter(f)}
              className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all ${
                tierFilter === f
                  ? f === "pro"
                    ? "bg-primary-container/20 text-primary-container"
                    : f === "free"
                    ? "bg-tertiary/10 text-tertiary"
                    : "bg-surface-container-high text-on-surface"
                  : "text-secondary hover:bg-surface-container-low"
              }`}
            >
              {f === "all" ? "All Plans" : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-secondary font-bold mb-6">
        {filtered.length} template{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((t) => (
          <div
            key={t.id}
            onClick={() => {
              if (t.tier === "pro" && plan === "free") {
                toast.error("This template requires a Pro plan.", { description: "Upgrade to unlock all premium templates." });
                return;
              }
              setPreviewId(t.id);
            }}
            className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-primary/10"
          >
            {/* Thumbnail */}
            <div className="relative h-48 overflow-hidden">
              <NextImage
                alt={t.name}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                src={t.image}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={t.id === "t1"}
              />
              {/* Tier badge */}
              <div className="absolute top-4 right-4 z-10">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                    t.tier === "pro"
                      ? "bg-primary-container text-white"
                      : "bg-tertiary-container text-white"
                  }`}
                >
                  {t.tier}
                </span>
              </div>
              {/* Lock overlay */}
              {t.tier === "pro" && plan === "free" && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                  <span className="material-symbols-outlined text-white text-4xl">lock</span>
                </div>
              )}
              {/* Color accent strip */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 z-10"
                style={{ backgroundColor: t.config.primaryColor ?? "#FF6B00" }}
              />
            </div>

            {/* Card body */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-[var(--font-headline)] font-bold text-lg leading-tight">{t.name}</h3>
                <div
                  className="w-5 h-5 rounded-full shrink-0 mt-0.5 ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: t.config.primaryColor ?? "#FF6B00" }}
                />
              </div>
              <p className="text-secondary text-sm mb-4 leading-relaxed">{t.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-primary bg-primary-fixed px-3 py-1 rounded-lg">{t.label}</span>
                <span className="text-[10px] font-mono text-secondary">{t.config.headlineFont}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-24 text-secondary">
          <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">style</span>
          <p className="font-bold">No templates match this filter</p>
          <p className="text-sm mt-1">Try a different category or plan</p>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
          onClick={() => setPreviewId(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal image */}
            <div className="relative h-64 overflow-hidden rounded-t-[2rem]">
              <NextImage
                alt={preview.name}
                className="object-cover"
                src={preview.image}
                fill
                sizes="(max-width: 1200px) 100vw, 800px"
                priority
              />
              <button
                type="button"
                onClick={() => setPreviewId(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-colors z-20"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="absolute top-4 left-4 z-20">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                    preview.tier === "pro" ? "bg-primary-container text-white" : "bg-tertiary-container text-white"
                  }`}
                >
                  {preview.tier}
                </span>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1.5 z-10"
                style={{ backgroundColor: preview.config.primaryColor ?? "#FF6B00" }}
              />
            </div>

            {/* Modal body */}
            <div className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-10 h-10 rounded-full ring-4 ring-outline-variant/20 shadow-md shrink-0"
                  style={{ backgroundColor: preview.config.primaryColor ?? "#FF6B00" }}
                />
                <div>
                  <h2 className="text-2xl font-[var(--font-headline)] font-extrabold leading-tight">{preview.name}</h2>
                  <p className="text-secondary text-xs font-bold uppercase tracking-widest">{CATEGORY_LABELS[preview.category]}</p>
                </div>
              </div>

              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">{preview.description}</p>

              {/* Style meta */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-surface-container-low rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Headline</p>
                  <p className="text-xs font-bold text-on-surface">{preview.config.headlineFont}</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Body</p>
                  <p className="text-xs font-bold text-on-surface">{preview.config.bodyFont}</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Layout</p>
                  <p className="text-xs font-bold text-on-surface capitalize">{preview.config.layoutDensity}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewId(null);
                    applyAndGo(preview);
                  }}
                  disabled={preview.tier === "pro" && plan === "free"}
                  className="flex-1 py-4 bg-gradient-to-br from-primary to-primary-container rounded-2xl font-bold text-white shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {preview.tier === "pro" && plan === "free" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">lock</span> Upgrade to Pro
                    </span>
                  ) : (
                    "Use This Template"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewId(null)}
                  className="py-4 px-6 bg-surface-container-highest rounded-2xl font-bold text-on-surface hover:bg-surface-variant transition-all"
                >
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
