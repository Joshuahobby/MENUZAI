"use client";
import { useEffect } from "react";
import { useMenu } from "@/context/MenuContext";
import { MenuStyle } from "@/types/menu";
import { templates } from "@/data/mockData";


interface MagicVibe {
  name: string;
  icon: string;
  config: Partial<MenuStyle>;
}


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

const RADIUS_PRESETS = [
  { label: "Sharp", value: "0" },
  { label: "Soft",  value: "0.75rem" },
  { label: "Round", value: "1.5rem" },
  { label: "Pill",  value: "2rem" },
];

const LAYOUTS = [
  { id: "vintage-parchment", name: "Vintage", icon: "menu_book" },
  { id: "dark-chalkboard",    name: "Bistro",  icon: "restaurant" },
  { id: "bold-street",       name: "Street",  icon: "fastfood" },
  { id: "bistro-split",      name: "Split",   icon: "view_sidebar" },
  { id: "photo-gallery",     name: "Gallery", icon: "photo_library" },
  { id: "luxury-gold",       name: "Luxury",  icon: "star" },
  { id: "organic-clean",     name: "Organic", icon: "eco" },
  { id: "midnight-luxe",     name: "Midnight",icon: "dark_mode" },
];

const MAGIC_VIBES: MagicVibe[] = [
  {
    name: "Luxe Gold",
    icon: "workspace_premium",
    config: {
      primaryColor: "#C5A059",
      backgroundColor: "#0F0F0F",
      titleColor: "#FFFFFF",
      sectionTitleColor: "#C5A059",
      itemTextColor: "#AAAAAA",
      priceTextColor: "#C5A059",
      dividerColor: "#2A2A2A",
      headlineFont: "Playfair Display",
      bodyFont: "Inter",
      cardStyle: "glass",
      borderRadius: "0.5rem",
      templateId: "luxury-gold"
    }
  },
  {
    name: "Neon Night",
    icon: "nightlight",
    config: {
      primaryColor: "#FF007A",
      backgroundColor: "#050505",
      titleColor: "#00FFF0",
      sectionTitleColor: "#FF007A",
      itemTextColor: "#E0E0E0",
      priceTextColor: "#00FFF0",
      dividerColor: "#222222",
      headlineFont: "Bebas Neue",
      bodyFont: "Montserrat",
      cardStyle: "elevated",
      borderRadius: "0",
      templateId: "neon-modern"
    }
  },
  {
    name: "Organic",
    icon: "eco",
    config: {
      primaryColor: "#4C6B5E",
      backgroundColor: "#FDFBF7",
      titleColor: "#2D3E36",
      sectionTitleColor: "#4C6B5E",
      itemTextColor: "#5C5C5C",
      priceTextColor: "#4C6B5E",
      dividerColor: "#E2DED0",
      headlineFont: "Fraunces",
      bodyFont: "Work Sans",
      cardStyle: "glass",
      borderRadius: "2rem",
      templateId: "organic-clean"
    }
  },
  {
    name: "Classic",
    icon: "restaurant",
    config: {
      primaryColor: "#FF6B00",
      backgroundColor: "#FFFFFF",
      titleColor: "#1A1009",
      sectionTitleColor: "#3D2410",
      itemTextColor: "#4A3318",
      priceTextColor: "#FF6B00",
      dividerColor: "#B89060",
      headlineFont: "Plus Jakarta Sans",
      bodyFont: "Inter",
      cardStyle: "elevated",
      borderRadius: "2rem",
      templateId: "vintage-parchment"
    }
  }
];

export function StyleEditorSidebarContent() {
  const { menuStyle, setMenuStyle, applyTemplate } = useMenu();

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
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-surface">
          
          {/* Design Assistant Tip */}
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Design Tip</p>
                <p className="text-xs text-secondary leading-relaxed mt-1">Try one of our <b>Magic Themes</b> to instantly transform your menu with curated font & color pairs.</p>
              </div>
            </div>
          </div>

          {/* Magic Vibes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Magic Themes</label>
              <button 
                onClick={() => {
                  const vibes = ["#FF6B00", "#00C853", "#0070F3", "#7928CA", "#E11D48", "#C5A059"];
                  const fonts = ["Playfair Display", "Bebas Neue", "Fraunces", "Plus Jakarta Sans", "Montserrat"];
                  setMenuStyle({
                    ...menuStyle,
                    primaryColor: vibes[Math.floor(Math.random() * vibes.length)],
                    headlineFont: fonts[Math.floor(Math.random() * fonts.length)],
                    borderRadius: ["0", "0.75rem", "1.5rem", "2rem"][Math.floor(Math.random() * 4)]
                  });
                }}
                className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                Randomize
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MAGIC_VIBES.map((vibe) => (
                <button
                  key={vibe.name}
                  onClick={() => applyTemplate(vibe.config)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-high transition-all group"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary bg-primary/10 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">{vibe.icon}</span>
                  </div>
                  <span className="text-[11px] font-bold text-secondary">{vibe.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Print Layouts */}
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Print Layouts</label>
            <div className="grid grid-cols-4 gap-2">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setMenuStyle({ ...menuStyle, templateId: layout.id })}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${menuStyle.templateId === layout.id ? "bg-primary text-white" : "bg-surface-container-low text-secondary hover:bg-surface-container-high border border-outline-variant/20"}`}
                  title={layout.name}
                >
                  <span className="material-symbols-outlined text-[18px]">{layout.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider">{layout.name}</span>
                </button>
              ))}
            </div>
          </div>

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
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-[10px] font-bold text-secondary uppercase">Size</span>
                  <input
                    type="range"
                    min={20}
                    max={120}
                    value={menuStyle.titleSize ?? 82}
                    onChange={(e) => setMenuStyle({ ...menuStyle, titleSize: parseInt(e.target.value) })}
                    title="Adjust Headline Font Size"
                    className="flex-1 h-1 bg-surface-container-low rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-xs font-mono font-bold text-primary w-8">{menuStyle.titleSize ?? 82}</span>
                </div>
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
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-[10px] font-bold text-secondary uppercase">Size</span>
                  <input
                    type="range"
                    min={8}
                    max={24}
                    value={menuStyle.itemTextSize ?? 13}
                    onChange={(e) => setMenuStyle({ ...menuStyle, itemTextSize: parseInt(e.target.value) })}
                    title="Adjust Body Text Size"
                    className="flex-1 h-1 bg-surface-container-low rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-xs font-mono font-bold text-primary w-8">{menuStyle.itemTextSize ?? 13}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Color Palette</label>
              <div className="space-y-3">
                {/* Primary Accent */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant">Accent</span>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-outline-variant/30 group-hover:border-primary/40 transition-all shrink-0 shadow-sm">
                      <div className="absolute inset-0" style={{ backgroundColor: menuStyle.primaryColor }} />
                      <input
                        type="color"
                        value={menuStyle.primaryColor}
                        onChange={(e) => setMenuStyle({ ...menuStyle, primaryColor: e.target.value, accentColor: e.target.value, priceTextColor: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-secondary">{menuStyle.primaryColor}</span>
                  </label>
                </div>

                {/* Title Color */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant">Title Text</span>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-outline-variant/30 group-hover:border-primary/40 transition-all shrink-0 shadow-sm">
                      <div className="absolute inset-0" style={{ backgroundColor: menuStyle.titleColor ?? "#1A1009" }} />
                      <input
                        type="color"
                        value={menuStyle.titleColor ?? "#1A1009"}
                        onChange={(e) => setMenuStyle({ ...menuStyle, titleColor: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-secondary">{menuStyle.titleColor ?? "#1A1009"}</span>
                  </label>
                </div>

                {/* Background */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant">Background</span>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-outline-variant/30 group-hover:border-primary/40 transition-all shrink-0 shadow-sm">
                      <div className="absolute inset-0" style={{ backgroundColor: menuStyle.backgroundColor }} />
                      <input
                        type="color"
                        value={menuStyle.backgroundColor}
                        onChange={(e) => setMenuStyle({ ...menuStyle, backgroundColor: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-secondary">{menuStyle.backgroundColor}</span>
                  </label>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant">Dividers</span>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-outline-variant/30 group-hover:border-primary/40 transition-all shrink-0 shadow-sm">
                      <div className="absolute inset-0" style={{ backgroundColor: menuStyle.dividerColor ?? "#B89060" }} />
                      <input
                        type="color"
                        value={menuStyle.dividerColor ?? "#B89060"}
                        onChange={(e) => setMenuStyle({ ...menuStyle, dividerColor: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-secondary">{menuStyle.dividerColor ?? "#B89060"}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Layout & Spacing */}
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Layout & Spacing</label>
              
              <div className="space-y-4">
                {/* Page Padding */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-on-surface-variant">Page Padding</span>
                    <span className="text-xs font-mono text-primary font-bold">{menuStyle.pagePadding ?? 44}px</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={menuStyle.pagePadding ?? 44}
                    onChange={(e) => setMenuStyle({ ...menuStyle, pagePadding: parseInt(e.target.value) })}
                    title="Adjust Page Padding"
                    className="w-full h-1 bg-surface-container-low rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Item Spacing */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-on-surface-variant">Item Spacing</span>
                    <span className="text-xs font-mono text-primary font-bold">{menuStyle.itemSpacing ?? 26}px</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    value={menuStyle.itemSpacing ?? 26}
                    onChange={(e) => setMenuStyle({ ...menuStyle, itemSpacing: parseInt(e.target.value) })}
                    title="Adjust Item Spacing"
                    className="w-full h-1 bg-surface-container-low rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Corner Radius */}
                <div>
                  <span className="text-xs font-bold text-on-surface-variant mb-2 block">Corner Radius</span>
                  <div className="grid grid-cols-4 gap-2">
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
                </div>

                {/* Show Images Toggle */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs font-bold text-on-surface-variant">Show Menu Photos</span>
                  <button
                    type="button"
                    onClick={() => setMenuStyle({ ...menuStyle, showImages: !menuStyle.showImages })}
                    title={menuStyle.showImages ? "Hide Menu Photos" : "Show Menu Photos"}
                    className={`w-10 h-6 rounded-full transition-all relative ${menuStyle.showImages ? "bg-primary" : "bg-surface-container-high"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${menuStyle.showImages ? "left-5" : "left-1"}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Layout Templates */}
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Print Layouts</label>
            <div className="grid grid-cols-2 gap-3">
              {templates.slice(0, 4).map((t) => {
                const isActive = menuStyle.templateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMenuStyle({ ...menuStyle, ...t.config, templateId: t.id })}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all group ${
                      isActive ? "border-primary ring-4 ring-primary/10 scale-95" : "border-outline-variant/30 hover:border-primary/40"
                    }`}
                  >
                    {/* Mock Layout Preview */}
                    <div className="absolute inset-0 bg-surface-container-low flex flex-col p-2 gap-1.5">
                       <div className="w-2/3 h-1.5 rounded-full bg-secondary/20" />
                       <div className="w-full h-1 rounded-full bg-secondary/10" />
                       <div className="w-full h-1 rounded-full bg-secondary/10" />
                       <div className="mt-auto flex justify-between">
                         <div className="w-8 h-8 rounded-lg bg-primary/20" />
                         <div className="w-8 h-8 rounded-lg bg-primary/20" />
                       </div>
                    </div>
                    
                    {/* Active Check */}
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="bg-primary text-white rounded-full p-1 shadow-lg">
                          <span className="material-symbols-outlined text-sm">check</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-md py-1.5 px-2">
                      <span className="text-[9px] font-bold text-white uppercase tracking-tighter truncate block">{t.name}</span>
                    </div>
                  </button>
                );
              })}
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

    </div>
  );
}
