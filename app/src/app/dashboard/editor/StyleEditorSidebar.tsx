"use client";
import { useEffect } from "react";
import { useMenu } from "@/context/MenuContext";

interface StyleEditorSidebarProps {
  onClose: () => void;
}

const DENSITY_VALUES: Array<"compact" | "comfortable" | "spacious"> = ["compact", "comfortable", "spacious"];
const DENSITY_LABELS: Record<string, string> = { compact: "Compact", comfortable: "Relaxed", spacious: "Spacious" };

const HEADLINE_FONTS = [
  "Plus Jakarta Sans",
  "Poppins",
  "Playfair Display",
  "Montserrat",
  "Lora",
  "Cormorant Garamond",
  "Outfit",
  "Bebas Neue",
  "Fraunces",
  "Jost",
];
const BODY_FONTS = [
  "Inter",
  "Montserrat",
  "Open Sans",
  "Lato",
  "Source Sans 3",
  "Outfit",
  "Work Sans",
  "Jost",
  "Lora",
];

const CURRENCIES = [
  { code: "RWF", name: "Rwandan Franc" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "ZAR", name: "South African Rand" },
  { code: "ETB", name: "Ethiopian Birr" },
  { code: "XOF", name: "West African CFA" },
  { code: "XAF", name: "Central African CFA" },
];

const PRESET_COLORS = [
  { name: "Orange",  hex: "#FF6B00" },
  { name: "Onyx",   hex: "#1E1E1E" },
  { name: "Green",  hex: "#00C853" },
  { name: "Blue",   hex: "#0070F3" },
  { name: "Purple", hex: "#7928CA" },
  { name: "Rose",   hex: "#E11D48" },
];

const RADIUS_PRESETS = [
  { label: "Sharp", value: "0" },
  { label: "Soft",  value: "0.75rem" },
  { label: "Round", value: "1.5rem" },
  { label: "Pill",  value: "2rem" },
];

import { templates } from "@/data/mockData";

const PRESET_IDS = ["t1", "t2", "t3", "t4", "t7", "t9", "t10", "t11", "t12"];
const PRESETS = PRESET_IDS.map((id) => templates.find((t) => t.id === id)!).filter(Boolean);

export function StyleEditorSidebar({ onClose }: StyleEditorSidebarProps) {
  const { menuStyle, setMenuStyle, applyTemplate } = useMenu();
  const densityIndex = DENSITY_VALUES.indexOf(menuStyle.layoutDensity);

  useEffect(() => {
    const fonts = [menuStyle.headlineFont, menuStyle.bodyFont].filter(Boolean);
    fonts.forEach((font) => {
      const id = `gfont-${font.replace(/ /g, "-").toLowerCase()}`;
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@400;600;700;800&display=swap`;
      document.head.appendChild(link);
    });
  }, [menuStyle.headlineFont, menuStyle.bodyFont]);

  return (
    <>
      {/* Backdrop — only on non-xl screens */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 xl:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside className="fixed xl:relative right-0 top-0 xl:top-auto h-full xl:h-auto w-80 xl:w-72 bg-surface flex flex-col overflow-y-auto shrink-0 z-50 xl:z-auto shadow-2xl xl:shadow-none">
        {/* Header */}
        <div className="sticky top-0 bg-surface z-10 px-6 pt-6 pb-4 border-b border-surface-container/50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-[var(--font-headline)] text-lg font-bold tracking-tight">Style Editor</h2>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest mt-1">Brand Identity</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-container transition-colors text-secondary hover:text-on-surface -mt-1 -mr-2"
              title="Close style editor"
              aria-label="Close style editor"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-8">

          {/* Typography */}
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Typography</label>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-2 block" htmlFor="headline-font">
                  Headlines
                </label>
                <select
                  id="headline-font"
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  value={menuStyle.headlineFont}
                  onChange={(e) => setMenuStyle({ ...menuStyle, headlineFont: e.target.value })}
                  style={{ fontFamily: menuStyle.headlineFont }}
                  title="Select headline font"
                  aria-label="Select headline font"
                >
                  {HEADLINE_FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-2 block" htmlFor="body-font">
                  Body Text
                </label>
                <select
                  id="body-font"
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  value={menuStyle.bodyFont}
                  onChange={(e) => setMenuStyle({ ...menuStyle, bodyFont: e.target.value })}
                  style={{ fontFamily: menuStyle.bodyFont }}
                  title="Select body font"
                  aria-label="Select body font"
                >
                  {BODY_FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Primary Accent</label>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {PRESET_COLORS.map((color) => {
                  const isActive = menuStyle.primaryColor.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      className={`w-full aspect-square rounded-full flex items-center justify-center transition-all ${isActive ? "ring-4 ring-primary/20 ring-offset-2 scale-110" : "hover:scale-110"}`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => setMenuStyle({ ...menuStyle, primaryColor: color.hex })}
                      title={color.name}
                      aria-label={color.name}
                    >
                      {isActive && <span className="material-symbols-outlined text-white text-xs">check</span>}
                    </button>
                  );
                })}
              </div>
              <label className="flex items-center gap-3 cursor-pointer group" title="Pick a custom color">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-outline-variant/30 group-hover:border-primary/40 transition-all shrink-0 shadow-sm">
                  <div className="absolute inset-0" style={{ backgroundColor: menuStyle.primaryColor }} />
                  <input
                    type="color"
                    value={menuStyle.primaryColor}
                    onChange={(e) => setMenuStyle({ ...menuStyle, primaryColor: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Pick custom color"
                    aria-label="Pick custom color"
                  />
                </div>
                <span className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">Custom accent</span>
                <span className="text-[10px] font-mono text-secondary ml-auto">{menuStyle.primaryColor}</span>
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Background</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {["#FFFFFF", "#F9F9FB", "#111111", "#FAF3E0"].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    className={`w-full h-8 rounded-lg border-2 transition-all ${menuStyle.backgroundColor.toLowerCase() === hex.toLowerCase() ? "border-primary" : "border-outline-variant/20"}`}
                    style={{ backgroundColor: hex }}
                    onClick={() => setMenuStyle({ ...menuStyle, backgroundColor: hex })}
                    title={hex}
                    aria-label={`Set background to ${hex}`}
                  />
                ))}
              </div>
              <label className="flex items-center gap-3 cursor-pointer group" title="Pick a custom background color">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-outline-variant/30 group-hover:border-primary/40 transition-all shrink-0 shadow-sm">
                  <div className="absolute inset-0" style={{ backgroundColor: menuStyle.backgroundColor }} />
                  <input
                    type="color"
                    value={menuStyle.backgroundColor}
                    onChange={(e) => setMenuStyle({ ...menuStyle, backgroundColor: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Pick custom background"
                    aria-label="Pick custom background"
                  />
                </div>
                <span className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">Surface color</span>
                <span className="text-[10px] font-mono text-secondary ml-auto">{menuStyle.backgroundColor}</span>
              </label>
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4" htmlFor="currency-select">Currency</label>
            <select
              id="currency-select"
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 cursor-pointer"
              value={menuStyle.currency ?? "RWF"}
              onChange={(e) => setMenuStyle({ ...menuStyle, currency: e.target.value })}
              title="Select menu currency"
              aria-label="Select menu currency"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          {/* Style Presets */}
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Style Presets</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((t) => {
                const isActive =
                  menuStyle.headlineFont === t.config?.headlineFont &&
                  menuStyle.primaryColor === t.config?.primaryColor;
                return (
                  <button
                    key={t.id}
                    type="button"
                    title={t.name}
                    aria-label={`Apply ${t.name} preset`}
                    onClick={() => applyTemplate(t.config || {})}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all border-2 overflow-hidden ${
                      isActive
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-container-high"
                    }`}
                  >
                    <div
                      className="w-4 h-1.5 rounded-full"
                      style={{ backgroundColor: t.config?.primaryColor ?? "#FF6B00" }}
                    />
                    {t.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Style */}
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Card Style</label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {(["flat", "elevated", "glass"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setMenuStyle({ ...menuStyle, cardStyle: style })}
                  className={`p-2 rounded-xl flex flex-col items-center gap-1 border-2 transition-all ${menuStyle.cardStyle === style ? "bg-primary/5 border-primary text-primary" : "bg-surface-container-low border-transparent text-secondary hover:bg-surface-container-high"}`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {style === "flat" ? "rectangle" : style === "elevated" ? "layers" : "opacity"}
                  </span>
                  <span className="text-[9px] font-bold uppercase">{style}</span>
                </button>
              ))}
            </div>

            {/* Corner Radius */}
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Corner Radius</label>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {RADIUS_PRESETS.map((opt) => {
                const isActive = menuStyle.borderRadius === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMenuStyle({ ...menuStyle, borderRadius: opt.value })}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1.5 border-2 transition-all ${isActive ? "bg-primary/5 border-primary text-primary" : "bg-surface-container-low border-transparent text-secondary hover:bg-surface-container-high"}`}
                  >
                    <div
                      className="w-5 h-4 border-2 border-current"
                      style={{ borderRadius: opt.value }}
                    />
                    <span className="text-[9px] font-bold uppercase leading-none">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Grid Layout */}
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Grid Layout</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setMenuStyle({ ...menuStyle, layoutDensity: "comfortable" })}
                className={`p-3 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${menuStyle.layoutDensity === "comfortable" ? "bg-surface-container-high border-primary" : "bg-surface-container-low border-transparent hover:bg-surface-container-high"}`}
              >
                <span className={`material-symbols-outlined ${menuStyle.layoutDensity === "comfortable" ? "text-primary" : "text-secondary"}`}>view_stream</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Single</span>
              </button>
              <button
                type="button"
                onClick={() => setMenuStyle({ ...menuStyle, layoutDensity: "compact" })}
                className={`p-3 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${menuStyle.layoutDensity === "compact" ? "bg-surface-container-high border-primary" : "bg-surface-container-low border-transparent hover:bg-surface-container-high"}`}
              >
                <span className={`material-symbols-outlined ${menuStyle.layoutDensity === "compact" ? "text-primary" : "text-secondary"}`}>view_module</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Compact</span>
              </button>
            </div>

            {/* Spacing slider */}
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]" htmlFor="density-slider">Spacing</label>
              <span className="text-xs font-bold text-primary">{DENSITY_LABELS[menuStyle.layoutDensity]}</span>
            </div>
            <input
              id="density-slider"
              type="range"
              min={0}
              max={2}
              step={1}
              value={densityIndex === -1 ? 1 : densityIndex}
              onChange={(e) => setMenuStyle({ ...menuStyle, layoutDensity: DENSITY_VALUES[parseInt(e.target.value)] })}
              className="w-full h-1.5 bg-surface-container-low rounded-full appearance-none cursor-pointer accent-primary"
              title="Layout spacing"
              aria-label="Layout spacing"
            />
          </div>

        </div>
      </aside>
    </>
  );
}
