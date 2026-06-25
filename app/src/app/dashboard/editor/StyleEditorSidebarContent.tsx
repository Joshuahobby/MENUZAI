"use client";
import { useEffect, useState } from "react";
import { useMenu } from "@/context/MenuContext";
import { MenuStyle } from "@/types/menu";
import { templates } from "@/data/mockData";

interface MagicVibe {
  name: string;
  icon: string;
  accent: string;
  bg: string;
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
  { label: "Sharp", value: "0",     shape: "M2 2 H14 V12 H2 Z" },
  { label: "Soft",  value: "0.75rem", shape: "" },
  { label: "Round", value: "1.5rem",  shape: "" },
  { label: "Pill",  value: "2rem",    shape: "" },
];

const DIGITAL_LAYOUTS = [
  { id: "vintage-parchment", name: "Vintage",  icon: "menu_book" },
  { id: "dark-chalkboard",   name: "Bistro",   icon: "restaurant" },
  { id: "bold-street",       name: "Street",   icon: "fastfood" },
  { id: "bistro-split",      name: "Split",    icon: "view_sidebar" },
  { id: "photo-gallery",     name: "Gallery",  icon: "photo_library" },
  { id: "luxury-gold",       name: "Luxury",   icon: "star" },
  { id: "organic-clean",     name: "Organic",  icon: "eco" },
  { id: "midnight-luxe",     name: "Midnight", icon: "dark_mode" },
];

const MAGIC_VIBES: MagicVibe[] = [
  {
    name: "Luxe Gold",
    icon: "workspace_premium",
    accent: "#C5A059",
    bg: "#0F0F0F",
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
      templateId: "luxury-gold",
    },
  },
  {
    name: "Neon Night",
    icon: "nightlight",
    accent: "#FF007A",
    bg: "#050505",
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
      templateId: "neon-modern",
    },
  },
  {
    name: "Organic",
    icon: "eco",
    accent: "#4C6B5E",
    bg: "#FDFBF7",
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
      templateId: "organic-clean",
    },
  },
  {
    name: "Classic",
    icon: "restaurant",
    accent: "#FF6B00",
    bg: "#FFFFFF",
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
      templateId: "vintage-parchment",
    },
  },
  {
    name: "Ocean Blue",
    icon: "water",
    accent: "#0EA5E9",
    bg: "#0C1A2E",
    config: {
      primaryColor: "#0EA5E9",
      backgroundColor: "#0C1A2E",
      titleColor: "#E0F2FE",
      sectionTitleColor: "#38BDF8",
      itemTextColor: "#94A3B8",
      priceTextColor: "#0EA5E9",
      dividerColor: "#1E3A5F",
      headlineFont: "Montserrat",
      bodyFont: "Inter",
      cardStyle: "glass",
      borderRadius: "1.5rem",
      templateId: "midnight-luxe",
    },
  },
  {
    name: "Fresh Mint",
    icon: "local_florist",
    accent: "#10B981",
    bg: "#F0FDF4",
    config: {
      primaryColor: "#10B981",
      backgroundColor: "#F0FDF4",
      titleColor: "#064E3B",
      sectionTitleColor: "#059669",
      itemTextColor: "#374151",
      priceTextColor: "#10B981",
      dividerColor: "#D1FAE5",
      headlineFont: "Jost",
      bodyFont: "Work Sans",
      cardStyle: "elevated",
      borderRadius: "1.5rem",
      templateId: "organic-clean",
    },
  },
];

const COLOR_FIELDS = [
  { key: "primaryColor" as keyof MenuStyle,    label: "Accent",     description: "Buttons & prices" },
  { key: "titleColor" as keyof MenuStyle,       label: "Title Text", description: "Restaurant name" },
  { key: "backgroundColor" as keyof MenuStyle,  label: "Background", description: "Page background" },
  { key: "dividerColor" as keyof MenuStyle,     label: "Dividers",   description: "Section borders" },
] as const;

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[9px] font-black text-secondary uppercase tracking-[0.22em] whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-outline-variant/20" />
    </div>
  );
}

export function StyleEditorSidebarContent() {
  const { menuStyle, setMenuStyle, applyTemplate } = useMenu();
  const [activeTab, setActiveTab] = useState<"theme" | "color" | "type" | "layout">("theme");

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
    <div className="flex-1 overflow-y-auto bg-surface">

      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 px-4 pt-4 pb-0">
        <div className="flex gap-1 bg-surface-container-low rounded-xl p-1">
          {[
            { id: "theme",  icon: "auto_awesome",  label: "Theme"  },
            { id: "color",  icon: "palette",        label: "Colors" },
            { id: "type",   icon: "title",          label: "Fonts"  },
            { id: "layout", icon: "grid_view",      label: "Layout" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="h-3" />
      </div>

      <div className="px-5 py-5 space-y-6">

        {/* ── THEME TAB ── */}
        {activeTab === "theme" && (
          <>
            {/* Randomize */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-on-surface">Magic Themes</p>
              <button
                type="button"
                onClick={() => {
                  const vibes = ["#FF6B00", "#00C853", "#0070F3", "#7928CA", "#E11D48", "#C5A059", "#10B981", "#0EA5E9"];
                  const fonts = ["Playfair Display", "Bebas Neue", "Fraunces", "Plus Jakarta Sans", "Montserrat", "Jost"];
                  setMenuStyle({
                    ...menuStyle,
                    primaryColor: vibes[Math.floor(Math.random() * vibes.length)],
                    headlineFont: fonts[Math.floor(Math.random() * fonts.length)],
                    borderRadius: ["0", "0.75rem", "1.5rem", "2rem"][Math.floor(Math.random() * 4)],
                  });
                }}
                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/70 transition-colors"
              >
                <span className="material-symbols-outlined text-[13px]">refresh</span>
                Shuffle
              </button>
            </div>

            {/* Magic Vibe Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {MAGIC_VIBES.map((vibe) => {
                const isActive = menuStyle.primaryColor === vibe.accent && menuStyle.backgroundColor === vibe.bg;
                return (
                  <button
                    key={vibe.name}
                    type="button"
                    onClick={() => applyTemplate(vibe.config)}
                    className={`relative overflow-hidden rounded-2xl transition-colors group active:scale-95 ${
                      isActive ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: vibe.bg }}
                  >
                    {/* Color palette strip */}
                    <div className="h-10 flex">
                      <div className="flex-1" style={{ backgroundColor: vibe.accent }} />
                      <div className="flex-1" style={{ backgroundColor: vibe.bg, filter: "brightness(1.3)" }} />
                      <div className="w-6" style={{ backgroundColor: vibe.accent, opacity: 0.4 }} />
                    </div>
                    {/* Label */}
                    <div className="px-3 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-black leading-tight" style={{ color: vibe.accent }}>{vibe.name}</p>
                        <p className="text-[9px] opacity-60 leading-none mt-0.5" style={{ color: vibe.accent }}>
                          {(vibe.config.headlineFont ?? "").split(" ")[0]}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-[16px]" style={{ color: vibe.accent }}>
                        {isActive ? "check_circle" : vibe.icon}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <SectionDivider label="Currency" />
            <div>
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

            <SectionDivider label="Show Photos" />
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-bold text-on-surface">Menu Item Photos</p>
                <p className="text-[10px] text-secondary">Display images on your public menu</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuStyle({ ...menuStyle, showImages: !menuStyle.showImages })}
                title={menuStyle.showImages ? "Hide Menu Photos" : "Show Menu Photos"}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${menuStyle.showImages ? "bg-primary" : "bg-surface-container-high"}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-colors ${menuStyle.showImages ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </>
        )}

        {/* ── COLORS TAB ── */}
        {activeTab === "color" && (
          <>
            <p className="text-xs font-bold text-on-surface">Color Palette</p>

            <div className="space-y-3">
              {COLOR_FIELDS.map(({ key, label, description }) => {
                const value = (menuStyle[key] as string) ?? "#FF6B00";
                return (
                  <label
                    key={key}
                    className="flex items-center gap-4 p-3.5 bg-surface-container-low rounded-2xl cursor-pointer group hover:bg-surface-container transition-colors"
                  >
                    {/* Large swatch */}
                    <div
                      className="w-12 h-12 rounded-xl shrink-0 border-2 border-white/10 shadow-md relative overflow-hidden"
                      style={{ backgroundColor: value }}
                    >
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => {
                          const updates: Partial<MenuStyle> = { [key]: e.target.value };
                          if (key === "primaryColor") {
                            updates.accentColor = e.target.value;
                            updates.priceTextColor = e.target.value;
                          }
                          setMenuStyle({ ...menuStyle, ...updates });
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface">{label}</p>
                      <p className="text-[10px] text-secondary">{description}</p>
                      <p className="text-[10px] font-mono text-primary mt-1">{value.toUpperCase()}</p>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                  </label>
                );
              })}
            </div>

            {/* Quick Palette Presets */}
            <SectionDivider label="Quick Palettes" />
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: "Fire",    colors: ["#FF6B00", "#1A1009", "#FFFFFF", "#B89060"] },
                { name: "Night",   colors: ["#C5A059", "#0F0F0F", "#1A1A1A", "#2A2A2A"] },
                { name: "Neon",    colors: ["#FF007A", "#050505", "#111111", "#222222"] },
                { name: "Mint",    colors: ["#10B981", "#F0FDF4", "#FFFFFF", "#D1FAE5"] },
                { name: "Ocean",   colors: ["#0EA5E9", "#0C1A2E", "#1E3A5F", "#112240"] },
                { name: "Rose",    colors: ["#E11D48", "#FFF1F2", "#FFFFFF", "#FFE4E6"] },
                { name: "Purple",  colors: ["#7928CA", "#0D0D1A", "#1A1A2E", "#2A1A4A"] },
                { name: "Slate",   colors: ["#64748B", "#F8FAFC", "#FFFFFF", "#E2E8F0"] },
              ].map((palette) => (
                <button
                  key={palette.name}
                  type="button"
                  onClick={() => setMenuStyle({
                    ...menuStyle,
                    primaryColor: palette.colors[0],
                    accentColor: palette.colors[0],
                    priceTextColor: palette.colors[0],
                    titleColor: palette.colors[2],
                    backgroundColor: palette.colors[1],
                    dividerColor: palette.colors[3],
                  })}
                  className="flex flex-col items-center gap-1.5 group"
                  title={palette.name}
                >
                  <div className="w-full h-8 rounded-xl overflow-hidden flex border border-outline-variant/20 group-hover:border-primary/40 transition-colors">
                    {palette.colors.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-secondary group-hover:text-on-surface transition-colors">{palette.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── FONTS TAB ── */}
        {activeTab === "type" && (
          <>
            <p className="text-xs font-bold text-on-surface">Typography</p>

            {/* Headline Font */}
            <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider">Headline Font</p>
              </div>
              {/* Live preview */}
              <p
                className="text-2xl font-black text-on-surface leading-tight"
                style={{ fontFamily: menuStyle.headlineFont }}
              >
                Aa — {menuStyle.headlineFont}
              </p>
              <select
                id="headline-font"
                className="w-full bg-surface border-none rounded-xl py-2.5 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 cursor-pointer"
                value={menuStyle.headlineFont}
                onChange={(e) => setMenuStyle({ ...menuStyle, headlineFont: e.target.value })}
                style={{ fontFamily: menuStyle.headlineFont }}
                title="Select headline font"
                aria-label="Select headline font"
              >
                {HEADLINE_FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-secondary uppercase shrink-0">Size</span>
                <input
                  type="range" min={20} max={120}
                  value={menuStyle.titleSize ?? 82}
                  onChange={(e) => setMenuStyle({ ...menuStyle, titleSize: parseInt(e.target.value) })}
                  title="Adjust Headline Font Size"
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                />
                <span className="text-xs font-mono font-bold text-primary w-8 text-right">{menuStyle.titleSize ?? 82}</span>
              </div>
            </div>

            {/* Body Font */}
            <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-secondary uppercase tracking-wider">Body Font</p>
              <p
                className="text-sm text-secondary leading-relaxed"
                style={{ fontFamily: menuStyle.bodyFont }}
              >
                Savory dishes crafted with love — {menuStyle.bodyFont}
              </p>
              <select
                id="body-font"
                className="w-full bg-surface border-none rounded-xl py-2.5 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 cursor-pointer"
                value={menuStyle.bodyFont}
                onChange={(e) => setMenuStyle({ ...menuStyle, bodyFont: e.target.value })}
                style={{ fontFamily: menuStyle.bodyFont }}
                title="Select body font"
                aria-label="Select body font"
              >
                {BODY_FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-secondary uppercase shrink-0">Size</span>
                <input
                  type="range" min={8} max={24}
                  value={menuStyle.itemTextSize ?? 13}
                  onChange={(e) => setMenuStyle({ ...menuStyle, itemTextSize: parseInt(e.target.value) })}
                  title="Adjust Body Text Size"
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                />
                <span className="text-xs font-mono font-bold text-primary w-8 text-right">{menuStyle.itemTextSize ?? 13}</span>
              </div>
            </div>

            {/* Font pair suggestions */}
            <SectionDivider label="Font Pairs" />
            <div className="space-y-2">
              {[
                { head: "Playfair Display", body: "Inter",       label: "Elegant" },
                { head: "Bebas Neue",       body: "Montserrat",  label: "Bold Street" },
                { head: "Fraunces",         body: "Work Sans",   label: "Artisan" },
                { head: "Outfit",           body: "Outfit",      label: "Modern Clean" },
                { head: "Cormorant Garamond", body: "Lato",     label: "Fine Dining" },
              ].map((pair) => (
                <button
                  key={pair.label}
                  type="button"
                  onClick={() => setMenuStyle({ ...menuStyle, headlineFont: pair.head, bodyFont: pair.body })}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-colors text-left group ${
                    menuStyle.headlineFont === pair.head && menuStyle.bodyFont === pair.body
                      ? "border-primary/40 bg-primary/5"
                      : "border-outline-variant/20 hover:border-primary/20 hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-on-surface truncate" style={{ fontFamily: pair.head }}>{pair.head}</p>
                    <p className="text-[10px] text-secondary" style={{ fontFamily: pair.body }}>{pair.body}</p>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-surface-container text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors">{pair.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── LAYOUT TAB ── */}
        {activeTab === "layout" && (
          <>
            <p className="text-xs font-bold text-on-surface">Digital Layout Style</p>

            {/* Layout icon grid */}
            <div className="grid grid-cols-4 gap-2">
              {DIGITAL_LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => setMenuStyle({ ...menuStyle, templateId: layout.id })}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors active:scale-95 ${
                    menuStyle.templateId === layout.id
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-surface-container-low text-secondary hover:bg-surface-container-high border border-outline-variant/20"
                  }`}
                  title={layout.name}
                >
                  <span className="material-symbols-outlined text-[20px]">{layout.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider leading-none">{layout.name}</span>
                </button>
              ))}
            </div>

            <SectionDivider label="Template Presets" />

            {/* Visual Template cards */}
            <div className="grid grid-cols-2 gap-3">
              {templates.slice(0, 6).map((t) => {
                const isActive = menuStyle.templateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMenuStyle({ ...menuStyle, ...t.config, templateId: t.id })}
                    className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-colors group active:scale-95 ${
                      isActive ? "border-primary ring-4 ring-primary/15 scale-[0.97]" : "border-outline-variant/30 hover:border-primary/40"
                    }`}
                  >
                    {/* Mock Layout Preview */}
                    <div className="absolute inset-0 flex flex-col p-2.5 gap-2" style={{ backgroundColor: (t.config as Partial<MenuStyle>).backgroundColor ?? "#FFFFFF" }}>
                      <div className="w-2/3 h-2 rounded-full opacity-60" style={{ backgroundColor: (t.config as Partial<MenuStyle>).primaryColor ?? "#FF6B00" }} />
                      <div className="w-full h-1 rounded-full bg-current opacity-10" />
                      <div className="w-4/5 h-1 rounded-full bg-current opacity-10" />
                      <div className="h-px w-full opacity-20" style={{ backgroundColor: (t.config as Partial<MenuStyle>).dividerColor ?? "#ccc" }} />
                      <div className="flex gap-1.5 mt-auto">
                        <div className="w-8 h-8 rounded-lg opacity-30" style={{ backgroundColor: (t.config as Partial<MenuStyle>).primaryColor ?? "#FF6B00" }} />
                        <div className="flex-1 space-y-1 pt-1">
                          <div className="h-1 rounded w-3/4 opacity-20 bg-current" />
                          <div className="h-1 rounded w-1/2 opacity-10 bg-current" />
                        </div>
                      </div>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="bg-primary text-white rounded-full p-1.5 shadow-lg shadow-primary/30">
                          <span className="material-symbols-outlined text-sm">check</span>
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm py-2 px-2.5">
                      <span className="text-[9px] font-black text-white uppercase tracking-tight truncate block">{t.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <SectionDivider label="Spacing & Radius" />

            {/* Page Padding */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-on-surface-variant">Page Padding</span>
                  <span className="text-xs font-mono text-primary font-bold">{menuStyle.pagePadding ?? 44}px</span>
                </div>
                <input
                  type="range" min={20} max={100}
                  value={menuStyle.pagePadding ?? 44}
                  onChange={(e) => setMenuStyle({ ...menuStyle, pagePadding: parseInt(e.target.value) })}
                  title="Adjust Page Padding"
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-on-surface-variant">Item Spacing</span>
                  <span className="text-xs font-mono text-primary font-bold">{menuStyle.itemSpacing ?? 26}px</span>
                </div>
                <input
                  type="range" min={10} max={60}
                  value={menuStyle.itemSpacing ?? 26}
                  onChange={(e) => setMenuStyle({ ...menuStyle, itemSpacing: parseInt(e.target.value) })}
                  title="Adjust Item Spacing"
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Corner Radius */}
              <div>
                <span className="text-xs font-bold text-on-surface-variant mb-3 block">Corner Radius</span>
                <div className="grid grid-cols-4 gap-2">
                  {RADIUS_PRESETS.map((opt) => {
                    const isActive = menuStyle.borderRadius === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMenuStyle({ ...menuStyle, borderRadius: opt.value })}
                        className={`p-2.5 rounded-xl flex flex-col items-center gap-2 border-2 transition-colors active:scale-95 ${
                          isActive ? "bg-primary/5 border-primary text-primary" : "bg-surface-container-low border-transparent text-secondary hover:bg-surface-container-high"
                        }`}
                      >
                        <div className="w-6 h-5 border-2 border-current" style={{ borderRadius: opt.value }} />
                        <span className="text-[9px] font-bold uppercase leading-none">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
