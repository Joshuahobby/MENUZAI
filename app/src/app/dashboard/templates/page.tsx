"use client";

import { templates, type Template, type TemplateCategory } from "@/data/mockData";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import { toast } from "sonner";
import { TemplatePreview, DEMO_DATA, type TplData } from "./TemplatePreview";
import { PrintView } from "./PrintView";

const CATEGORY_LABELS: Record<"all" | TemplateCategory, string> = {
  all: "All",
  casual: "Casual",
  "fine-dining": "Fine Dining",
  cafe: "Café",
  bar: "Bar",
  "fast-food": "Fast Food",
};

export default function TemplatesPage() {
  const router = useRouter();
  const { applyTemplate, plan, restaurantName, categories, menuItems, menuStyle, userRole, isLoading } = useMenu();
  const [tierFilter, setTierFilter] = useState<"all" | "free" | "pro">("all");
  const [catFilter, setCatFilter] = useState<"all" | TemplateCategory>("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);

  const filtered = templates.filter((t) => {
    const tierMatch = tierFilter === "all" || t.tier === tierFilter;
    const catMatch = catFilter === "all" || t.category === catFilter;
    return tierMatch && catMatch;
  });

  const preview = templates.find((t) => t.id === previewId);
  const printTpl = templates.find((t) => t.id === printId);

  // Prepare data for the preview
  const tplData: TplData = useMemo(() => {
    const hasCats = categories.length > 0;
    return {
      ...DEMO_DATA,
      restaurantName: restaurantName || DEMO_DATA.restaurantName,
      currency: menuStyle.currency || DEMO_DATA.currency,
      ...(hasCats && {
        categories: categories
          .filter(c => !c.hidden)
          .map(cat => ({
            name: cat.name,
            items: menuItems
              .filter(i => i.category === cat.id)
              .map(i => ({ name: i.name, description: i.description, price: i.price })),
          })),
      }),
    };
  }, [restaurantName, categories, menuItems, menuStyle.currency]);

  const applyAndGo = (t: Template) => {
    if (t.tier === "pro" && plan === "free") {
      toast.error("This template requires a Pro plan.", { description: "Upgrade to unlock all premium templates." });
      return;
    }
    applyTemplate(t.config);
    toast.success(`"${t.name}" applied to your menu.`);
    router.push("/dashboard/editor");
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole !== "owner") {
    return (
      <div className="p-6 lg:p-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container-high/50 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-error/5 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>

          <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-3xl icon-fill">gpp_maybe</span>
          </div>
          <h2 className="text-xl font-[var(--font-headline)] font-extrabold tracking-tight mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-secondary mb-6 leading-relaxed">
            Only the Restaurant Owner can browse and apply custom menu design templates.
          </p>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-center block w-full"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

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
            {/* Live Preview Thumbnail */}
            <div className="relative h-64 overflow-hidden bg-surface-container-low">
              <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-500 origin-top">
                  <TemplatePreview 
                    templateId={t.id} 
                    containerWidth={400} 
                    data={tplData}
                    style={{ primaryColor: t.config.primaryColor, backgroundColor: t.config.backgroundColor }}
                  />
              </div>
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

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
                className="absolute bottom-0 left-0 right-0 h-1.5 z-10"
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
            className="bg-surface-container-lowest rounded-[2rem] max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Large Live Preview */}
            <div className="w-full md:w-[450px] h-[400px] md:h-auto bg-surface-container-low overflow-hidden relative border-r border-surface-container-high shrink-0">
               <div className="absolute inset-0">
                  <TemplatePreview 
                    templateId={preview.id} 
                    containerWidth={450} 
                    data={tplData}
                    style={{ primaryColor: preview.config.primaryColor, backgroundColor: preview.config.backgroundColor }}
                  />
               </div>
               <button
                type="button"
                onClick={() => setPreviewId(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-colors z-20 md:hidden"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Right: Modal body */}
            <div className="flex-1 p-8 md:p-10 flex flex-col overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-secondary text-xs font-bold uppercase tracking-[0.2em] mb-2">{CATEGORY_LABELS[preview.category]}</p>
                  <h2 className="text-3xl font-[var(--font-headline)] font-extrabold leading-tight mb-2">{preview.name}</h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                        preview.tier === "pro" ? "bg-primary-container text-white" : "bg-tertiary-container text-white"
                      }`}
                    >
                      {preview.tier}
                    </span>
                    <span className="text-secondary/50 text-[10px]">•</span>
                    <span className="text-secondary text-[10px] font-bold uppercase tracking-widest">Premium Layout</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewId(null)}
                  className="hidden md:flex w-10 h-10 bg-surface-container-high rounded-full items-center justify-center hover:bg-surface-container-highest transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <p className="text-secondary text-base mb-8 leading-relaxed">{preview.description}</p>

              {/* Style meta */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-surface-container-low rounded-[1.5rem] p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl">font_download</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Typography</p>
                    <p className="text-sm font-bold text-on-surface">{preview.config.headlineFont}</p>
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-[1.5rem] p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary" style={{ backgroundColor: `${preview.config.primaryColor}22`, color: preview.config.primaryColor }}>
                    <span className="material-symbols-outlined text-xl">palette</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Theme Color</p>
                    <p className="text-sm font-bold text-on-surface uppercase">{preview.config.primaryColor}</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewId(null);
                    applyAndGo(preview);
                  }}
                  disabled={preview.tier === "pro" && plan === "free"}
                  className="w-full py-5 bg-gradient-to-br from-primary to-primary-container rounded-[2rem] font-bold text-white shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {preview.tier === "pro" && plan === "free" ? (
                    <>
                      <span className="material-symbols-outlined text-xl">lock</span> 
                      Upgrade to unlock Template
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">edit</span>
                      Start Customizing
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setPreviewId(null);
                    setPrintId(preview.id);
                  }}
                  className="w-full py-5 bg-surface-container-high rounded-[2rem] font-bold text-on-surface hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">print</span>
                  Print Preview / Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Overlay */}
      {printTpl && (
        <PrintView
          templateId={printTpl.id}
          templateName={printTpl.name}
          restaurantData={tplData}
          onClose={() => setPrintId(null)}
        />
      )}
    </div>
  );
}
