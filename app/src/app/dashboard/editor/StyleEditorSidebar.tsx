"use client";
import { useEffect, useRef } from "react";
import { useMenu } from "@/context/MenuContext";

const DENSITY_VALUES: Array<"compact" | "comfortable" | "spacious"> = ["compact", "comfortable", "spacious"];
const DENSITY_LABELS: Record<string, string> = { compact: "Compact", comfortable: "Relaxed", spacious: "Spacious" };

const HEADLINE_FONTS = ["Plus Jakarta Sans", "Poppins", "Playfair Display", "Montserrat", "Lora"];
const BODY_FONTS = ["Inter", "Montserrat", "Open Sans", "Lato", "Source Sans 3"];

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

import { templates } from "@/data/mockData";

// 6 curated quick-apply presets from the template gallery
const PRESET_IDS = ["t1", "t2", "t3", "t4", "t7", "t9"];
const PRESETS = PRESET_IDS.map((id) => templates.find((t) => t.id === id)!).filter(Boolean);

export function StyleEditorSidebar() {
  const { menuStyle, setMenuStyle, applyTemplate } = useMenu();
  const loadedFontsRef = useRef<Set<string>>(new Set());

  const densityIndex = DENSITY_VALUES.indexOf(menuStyle.layoutDensity);

  // Dynamically load Google Fonts when headline or body font changes
  useEffect(() => {
    const fonts = [menuStyle.headlineFont, menuStyle.bodyFont].filter(Boolean);
    fonts.forEach((font) => {
      if (loadedFontsRef.current.has(font)) return;
      loadedFontsRef.current.add(font);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@400;600;700;800&display=swap`;
      document.head.appendChild(link);
    });
  }, [menuStyle.headlineFont, menuStyle.bodyFont]);

  return (
    <aside className="w-72 bg-surface flex flex-col p-6 overflow-y-auto shrink-0 hidden xl:flex">
      <div className="mb-8">
        <h2 className="font-[var(--font-headline)] text-lg font-bold tracking-tight mb-2">Style Editor</h2>
        <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Brand Identity</p>
      </div>

      <div className="space-y-8">

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
        <div>
          <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Color Palette</label>
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
          {/* Custom color picker */}
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
            <span className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">Custom color</span>
            <span className="text-[10px] font-mono text-secondary ml-auto">{menuStyle.primaryColor}</span>
          </label>
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

        {/* Layout */}
        <div>
          <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Layout</label>
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

          {/* Density slider */}
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
  );
}
