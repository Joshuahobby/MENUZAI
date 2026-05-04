"use client";

import { useEffect } from "react";

/* ─────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────── */
export interface TplItem {
  name: string;
  description?: string;
  price: number;
  image?: string;
}
export interface TplCategory { name: string; icon?: string; items: TplItem[]; }
export interface TplData {
  restaurantName: string;
  website?: string;
  phone?: string;
  currency?: string;
  categories: TplCategory[];
}
export interface TplStyle {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  accentColor?: string;
  titleColor?: string;
  sectionTitleColor?: string;
  itemTextColor?: string;
  priceTextColor?: string;
  dividerColor?: string;
  headlineFont?: string;
  bodyFont?: string;
  titleSize?: number;
  sectionTitleSize?: number;
  itemTextSize?: number;
  borderRadius?: string;
  layoutDensity?: "compact" | "comfortable" | "spacious";
  pagePadding?: number;
  itemSpacing?: number;
  showImages?: boolean;
}
interface TplProps { data: TplData; style?: TplStyle; }

/* ─────────────────────────────────────────────────────
   Canvas dimensions
───────────────────────────────────────────────────── */
export const BASE_W = 700;
export const BASE_H = 990;

/* ─────────────────────────────────────────────────────
   Demo data (shown when restaurant has no real items)
───────────────────────────────────────────────────── */
export const DEMO_DATA: TplData = {
  restaurantName: "Warner & Spencer",
  website: "www.yourwebsite.com",
  phone: "123-456-7890",
  currency: "$",
  categories: [
    { name: "Coffee", icon: "☕", items: [{ name: "Espresso", price: 9 }, { name: "Americano", price: 9 }, { name: "Latte", price: 8 }, { name: "Cappuccino", price: 9 }, { name: "Mocha", price: 8 }] },
    { name: "Teas", icon: "🍵", items: [{ name: "Lemon Tea", price: 9 }, { name: "Green Tea", price: 9 }, { name: "Jasmine Tea", price: 8 }, { name: "Earl Grey", price: 9 }, { name: "Raspberry Tea", price: 8 }] },
    { name: "Fresh Drinks", icon: "🥤", items: [{ name: "Hot Chocolate", price: 9 }, { name: "Milkshake", price: 9 }, { name: "Smoothie", price: 8 }, { name: "Lemonade", price: 9 }, { name: "Vanilla Milkshake", price: 8 }] },
    { name: "Desserts", icon: "🍰", items: [{ name: "Chocolate Cake", price: 9 }, { name: "Carrot Cake", price: 9 }, { name: "Cheesecake", price: 8 }, { name: "Pumpkin Pie", price: 9 }, { name: "Pecan Pie", price: 8 }] },
    { name: "Frappe", icon: "🧋", items: [{ name: "Hot Chocolate", price: 9 }, { name: "Milkshake", price: 9 }, { name: "Smoothie", price: 8 }, { name: "Lemonade", price: 9 }, { name: "Vanilla Milkshake", price: 8 }] },
    { name: "Snacks", icon: "🍟", items: [{ name: "French Fries", price: 9 }, { name: "Buffalo Wings", price: 9 }, { name: "Beef Sliders", price: 8 }, { name: "Spaghetti Carbonara", price: 9 }, { name: "Pizza", price: 8 }] },
  ],
};

/* ─────────────────────────────────────────────────────
   TEMPLATE 1: Vintage Parchment
   Warm cream/beige aged-paper look, 2-col, serif dotted-leader items
───────────────────────────────────────────────────── */
function VintageParchment({ data, style }: TplProps) {
  const half = Math.ceil(data.categories.length / 2);
  const left = data.categories.slice(0, half);
  const right = data.categories.slice(half);
  const cur = data.currency ?? "$";

  // Dynamic Styles
  const primary = style?.primaryColor ?? "#FF6B00";
  const bg = style?.backgroundColor ?? "#FAF0DC";
  const headlineFont = style?.headlineFont ?? "'Playfair Display', Georgia, serif";
  const bodyFont = style?.bodyFont ?? "Inter, sans-serif";
  const titleColor = style?.titleColor ?? "#1A1009";
  const titleSize = style?.titleSize ?? 82;
  const sectionTitleColor = style?.sectionTitleColor ?? "#3D2410";
  const itemTextColor = style?.itemTextColor ?? "#4A3318";
  const priceTextColor = style?.priceTextColor ?? "#4A3318";
  const dividerColor = style?.dividerColor ?? "#B89060";
  const padding = style?.pagePadding ?? 44;
  const spacing = style?.itemSpacing ?? 26;
  const itemTextSize = style?.itemTextSize ?? 13;

  return (
    <div style={{ width: "100%", height: "100%", background: bg, fontFamily: bodyFont, padding: `48px ${padding}px`, boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
      {/* Aged-paper vignette */}
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 80px rgba(90,55,10,0.15)", pointerEvents: "none", zIndex: 10 }} />
      {/* Top burn */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: "linear-gradient(180deg,rgba(90,55,10,0.2) 0%,transparent 100%)", zIndex: 11 }} />
      
      {/* Header */}
      <p style={{ fontSize: 14, letterSpacing: 3, color: primary, marginBottom: 6, textTransform: "lowercase", fontStyle: "italic", fontFamily: headlineFont }}>{data.restaurantName}</p>
      <h1 style={{ fontSize: titleSize, lineHeight: 0.9, fontWeight: 900, color: titleColor, marginBottom: 26, letterSpacing: -1, fontFamily: headlineFont }}>
        COFFEE<br />MENU
      </h1>

      {/* Full-width divider */}
      <div style={{ height: 1, background: dividerColor, marginBottom: 24 }} />

      {/* 2-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 0, height: "calc(100% - 280px)" }}>
        <div style={{ paddingRight: 24 }}>
          {left.map((cat) => (
            <div key={cat.name} style={{ marginBottom: spacing }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 5, borderBottom: `1px solid ${dividerColor}88` }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{cat.icon ?? "🍽️"}</span>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: sectionTitleColor, fontFamily: headlineFont }}>{cat.name}</span>
              </div>
              {cat.items.slice(0, 5).map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: itemTextSize, marginBottom: 6, color: itemTextColor }}>
                  <span>{item.name}</span>
                  <span style={{ fontWeight: 700, color: priceTextColor }}>{cur}{item.price}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Vertical divider */}
        <div style={{ background: `${dividerColor}88` }} />

        <div style={{ paddingLeft: 24 }}>
          {right.map((cat) => (
            <div key={cat.name} style={{ marginBottom: spacing }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 5, borderBottom: `1px solid ${dividerColor}88` }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{cat.icon ?? "🍽️"}</span>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: sectionTitleColor, fontFamily: headlineFont }}>{cat.name}</span>
              </div>
              {cat.items.slice(0, 5).map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: itemTextSize, marginBottom: 6, color: itemTextColor }}>
                  <span>{item.name}</span>
                  <span style={{ fontWeight: 700, color: priceTextColor }}>{cur}{item.price}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 28, left: 44, right: 44, textAlign: "center", fontSize: 11, color: itemTextColor, opacity: 0.7, letterSpacing: 3, borderTop: `1px solid ${dividerColor}88`, paddingTop: 12, zIndex: 9 }}>
        {data.website ?? "www.yourwebsite.com"}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   TEMPLATE 2: Dark Chalkboard
   Near-black bg, white text, 2-col, bold categories
───────────────────────────────────────────────────── */
function DarkChalkboard({ data, style }: TplProps) {
  const half = Math.ceil(data.categories.length / 2);
  const left = data.categories.slice(0, half);
  const right = data.categories.slice(half);
  const cur = data.currency ?? "$";

  // Dynamic Styles
  const primary = style?.primaryColor ?? "#FFFFFF";
  const bg = style?.backgroundColor ?? "#1C1C1C";
  const headlineFont = style?.headlineFont ?? "'Oswald', Impact, sans-serif";
  const bodyFont = style?.bodyFont ?? "Inter, sans-serif";
  const titleColor = style?.titleColor ?? "#FFFFFF";
  const titleSize = style?.titleSize ?? 84;
  const sectionTitleColor = style?.sectionTitleColor ?? "#FFFFFF";
  const itemTextColor = style?.itemTextColor ?? "#CACACA";
  const priceTextColor = style?.priceTextColor ?? "#FFFFFF";
  const dividerColor = style?.dividerColor ?? "#3A3A3A";
  const padding = style?.pagePadding ?? 44;
  const spacing = style?.itemSpacing ?? 22;
  const itemTextSize = style?.itemTextSize ?? 13;

  return (
    <div style={{ width: "100%", height: "100%", background: bg, fontFamily: headlineFont, padding: `48px ${padding}px`, boxSizing: "border-box", color: itemTextColor, position: "relative", overflow: "hidden" }}>
      {/* Subtle texture overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none" }} />

      {/* Header */}
      <p style={{ fontSize: 12, letterSpacing: 4, color: primary, marginBottom: 8, textTransform: "uppercase", fontFamily: bodyFont }}>{data.restaurantName}</p>
      <h1 style={{ fontSize: titleSize, lineHeight: 0.88, fontWeight: 700, color: titleColor, marginBottom: 28, letterSpacing: 2, fontFamily: headlineFont }}>
        COFFEE<br />MENU
      </h1>

      {/* Divider */}
      <div style={{ height: 2, background: dividerColor, marginBottom: 22 }} />

      {/* 2-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 0, height: "calc(100% - 300px)" }}>
        <div style={{ paddingRight: 24 }}>
          {left.map((cat) => (
            <div key={cat.name} style={{ marginBottom: spacing }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{cat.icon ?? "🍽️"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: sectionTitleColor, fontFamily: headlineFont }}>{cat.name}</span>
              </div>
              {cat.items.slice(0, 5).map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: itemTextSize, marginBottom: 5, color: itemTextColor, fontFamily: bodyFont, fontWeight: 400 }}>
                  <span>{item.name}</span>
                  <span style={{ color: priceTextColor }}>{cur}{item.price}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ background: dividerColor }} />
        <div style={{ paddingLeft: 24 }}>
          {right.map((cat) => (
            <div key={cat.name} style={{ marginBottom: spacing }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{cat.icon ?? "🍽️"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: sectionTitleColor, fontFamily: headlineFont }}>{cat.name}</span>
              </div>
              {cat.items.slice(0, 5).map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: itemTextSize, marginBottom: 5, color: itemTextColor, fontFamily: bodyFont, fontWeight: 400 }}>
                  <span>{item.name}</span>
                  <span style={{ color: priceTextColor }}>{cur}{item.price}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 24, left: 44, right: 44, textAlign: "center", fontSize: 11, color: primary, opacity: 0.5, letterSpacing: 3, fontFamily: bodyFont }}>
        {data.website ?? "www.yourwebsite.com"}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   TEMPLATE 3: Bold Street
   Dark bg, bold title, color accent "splash" shape, food-image circles
───────────────────────────────────────────────────── */
function BoldStreet({ data, style }: TplProps) {
  const primary = style?.primaryColor ?? "#FF6B00";
  const bg = style?.backgroundColor ?? "#191919";
  const headlineFont = style?.headlineFont ?? "'Bebas Neue', Impact, sans-serif";
  const bodyFont = style?.bodyFont ?? "Inter, sans-serif";
  const titleColor = style?.titleColor ?? "#FFFFFF";
  const titleSize = style?.titleSize ?? 96;
  const sectionTitleColor = style?.sectionTitleColor ?? primary;
  const itemTextColor = style?.itemTextColor ?? "#DDDDDD";
  const priceTextColor = style?.priceTextColor ?? primary;
  const dividerColor = style?.dividerColor ?? "#333333";
  const padding = style?.pagePadding ?? 40;
  const spacing = style?.itemSpacing ?? 22;
  const itemTextSize = style?.itemTextSize ?? 13;
  const showImages = style?.showImages ?? true;

  const cur = data.currency ?? "$";
  const FOOD_EMOJIS = ["🥩", "🍗", "🍜", "🌮", "🍕", "🧆"];

  return (
    <div style={{ width: "100%", height: "100%", background: bg, fontFamily: headlineFont, boxSizing: "border-box", color: titleColor, position: "relative", overflow: "hidden" }}>
      {/* Accent blob / paint stroke */}
      <div style={{ position: "absolute", top: 0, right: 0, width: 260, height: BASE_H * 0.65, background: primary, clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 15% 100%, 0% 55%)", opacity: 0.92, zIndex: 0 }} />

      {/* Logo line */}
      <div style={{ position: "relative", zIndex: 2, padding: `36px ${padding}px 0` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🍽️</div>
          <span style={{ fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.7)", fontFamily: bodyFont }}>{data.restaurantName}</span>
        </div>
        {/* Big Title */}
        <h1 style={{ fontSize: titleSize, lineHeight: 0.88, fontWeight: 700, color: titleColor, letterSpacing: 3, margin: 0, fontFamily: headlineFont }}>
          FOOD<br />MENU
        </h1>
      </div>

      {/* Food photo circles on right, over accent */}
      {showImages && (
        <div style={{ position: "absolute", top: 28, right: 30, zIndex: 3, display: "flex", flexDirection: "column", gap: 14 }}>
          {FOOD_EMOJIS.slice(0, 3).map((emoji, i) => (
            <div key={i} style={{ width: 170, height: 118, background: `rgba(0,0,0,0.35)`, borderRadius: 14, border: "2px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, backdropFilter: "blur(2px)" }}>
              {emoji}
            </div>
          ))}
        </div>
      )}

      {/* Menu sections left */}
      <div style={{ position: "absolute", top: 240, left: padding, width: 280, zIndex: 2 }}>
        {data.categories.slice(0, 3).map((cat) => (
          <div key={cat.name} style={{ marginBottom: spacing }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: sectionTitleColor, margin: "0 0 8px 0", fontFamily: headlineFont }}>{cat.name}</h3>
            {cat.items.slice(0, 4).map((item) => (
              <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: itemTextSize, marginBottom: 4, color: itemTextColor, fontFamily: bodyFont }}>
                <span>{item.name}</span>
                <span style={{ color: priceTextColor, fontWeight: 700 }}>{cur} {item.price}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, padding: `14px ${padding}px`, borderTop: `1px solid ${dividerColor}`, display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: bodyFont, letterSpacing: 1 }}>
        <span>{data.phone ?? "123-456-7890"}</span>
        <span>{data.website ?? "www.yourwebsite.com"}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   TEMPLATE 4: Bistro Split
   Dark rich-brown sidebar | cream content panel
───────────────────────────────────────────────────── */
function BistroSplit({ data, style }: TplProps) {
  const primary = style?.primaryColor ?? "#C5A059";
  const bg = style?.backgroundColor ?? "#FAF3E0";
  const headlineFont = style?.headlineFont ?? "'Cormorant Garamond', Georgia, serif";
  const bodyFont = style?.bodyFont ?? "Inter, sans-serif";
  const titleColor = style?.titleColor ?? "#FAF3E0";
  const sectionTitleColor = style?.sectionTitleColor ?? primary;
  const itemTextColor = style?.itemTextColor ?? "#6B4F31";
  const priceTextColor = style?.priceTextColor ?? "#3B1A0F";
  const dividerColor = style?.dividerColor ?? "rgba(59,26,15,0.15)";
  const padding = style?.pagePadding ?? 20;
  const spacing = style?.itemSpacing ?? 14;
  const itemTextSize = style?.itemTextSize ?? 11;
  const showImages = style?.showImages ?? true;

  const cur = data.currency ?? "$";
  const EMOJIS = ["🥗", "🍤", "🍝", "🐟", "🍣", "🥩"];

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: bg, fontFamily: bodyFont, overflow: "hidden" }}>
      {/* LEFT: dark panel */}
      <div style={{ width: "40%", background: "#3B1A0F", color: primary, padding: `28px ${padding}px`, position: "relative", display: "flex", flexDirection: "column", borderRight: `1px solid ${primary}33` }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: `radial-gradient(circle at 2px 2px, ${primary} 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        
        <div style={{ position: "relative", zIndex: 1, marginBottom: 40 }}>
          <p style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>{data.restaurantName}</p>
          <h1 style={{ fontSize: 40, fontWeight: 900, textTransform: "uppercase", letterSpacing: -1, lineHeight: 0.9, color: titleColor, fontFamily: headlineFont }}>
            {data.restaurantName.split(" ")[0]}<br />
            <span style={{ color: primary }}>SELECTS</span>
          </h1>
        </div>

        {/* Featured items with circle placeholders */}
        {showImages && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, position: "relative", zIndex: 1 }}>
            {(data.categories[0]?.items ?? []).slice(0, 4).map((item, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  width: 68, height: 68, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${primary}aa, ${primary})`,
                  margin: "0 auto 6px", border: `2px solid ${primary}44`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                  boxShadow: `0 10px 20px ${primary}22`
                }}>{EMOJIS[i % 6]}</div>
                <p style={{ fontSize: 7.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: primary, marginBottom: 2, fontFamily: bodyFont }}>{item.name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${primary}44`, fontSize: 9, color: primary, letterSpacing: 1.5, textAlign: "center", fontFamily: bodyFont, position: "relative", zIndex: 1 }}>
          RESERVATION: {data.phone ?? "+123-456-7890"}
        </div>
      </div>

      {/* RIGHT: content panel */}
      <div style={{ flex: 1, padding: `32px ${padding}px`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {data.categories.slice(1, 5).map((cat) => (
          <div key={cat.name} style={{ marginBottom: spacing }}>
            <div style={{ background: "#3B1A0F", color: sectionTitleColor, padding: "5px 12px", fontSize: 10, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, fontFamily: bodyFont }}>
              {cat.name}
            </div>
            {cat.items.slice(0, 3).map((item) => (
              <div key={item.name} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${dividerColor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: itemTextSize, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#3B1A0F" }}>{item.name}</span>
                  <span style={{ fontSize: itemTextSize, fontWeight: 700, color: priceTextColor }}>{cur}{item.price}.00</span>
                </div>
                <p style={{ fontSize: 9, color: itemTextColor, opacity: 0.8, lineHeight: 1.4, margin: 0 }}>Prepared fresh daily with premium ingredients.</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   TEMPLATE 5: Photo Gallery
   Dark bg, 2-col food photo grid with overlay text, add-ons section
───────────────────────────────────────────────────── */
function PhotoGallery({ data, style }: TplProps) {
  const primary = style?.primaryColor ?? "#FFFFFF";
  const bg = style?.backgroundColor ?? "#0F0F0F";
  const headlineFont = style?.headlineFont ?? "'Outfit', Inter, sans-serif";
  const bodyFont = style?.bodyFont ?? "Inter, sans-serif";
  const titleColor = style?.titleColor ?? "#FFFFFF";
  const titleSize = style?.titleSize ?? 34;
  const sectionTitleColor = style?.sectionTitleColor ?? "#FFFFFF";
  const itemTextColor = style?.itemTextColor ?? "#FFFFFF";
  const priceTextColor = style?.priceTextColor ?? primary;
  const dividerColor = style?.dividerColor ?? "#2A2A2A";
  const padding = style?.pagePadding ?? 40;
  const spacing = style?.itemSpacing ?? 18;
  const itemTextSize = style?.itemTextSize ?? 12;
  const showImages = style?.showImages ?? true;

  const cur = data.currency ?? "$";
  const allItems = data.categories.flatMap((c) => c.items).slice(0, 6);
  const GRADIENTS = ["#FF6B35,#e74c3c", "#c0392b,#922b21", "#f39c12,#d68910", "#27ae60,#1e8449", "#2980b9,#1a5276", "#8e44ad,#6c3483"];
  const EMOJIS = ["🥐", "🥞", "🍳", "🧆", "🥗", "🎂"];

  return (
    <div style={{ width: "100%", height: "100%", background: bg, fontFamily: headlineFont, color: titleColor, padding: `${padding}px`, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: titleSize, fontWeight: 300, marginBottom: 8, color: titleColor }}>Restaurant<br />Menu</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: "italic", marginBottom: 12, fontFamily: bodyFont }}>&quot;The sweet and smooth taste of the dessert to end your special meal&quot;</p>
        <div style={{ width: 44, height: 1, background: dividerColor }} />
      </div>

      {/* 2-col photo grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing, flex: 1 }}>
        {allItems.map((item, i) => (
          <div key={i}>
            {showImages && (
              <div style={{ height: 100, background: `linear-gradient(135deg,${GRADIENTS[i % 6]})`, borderRadius: 10, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
                {EMOJIS[i % 6]}
              </div>
            )}
            <p style={{ fontSize: itemTextSize, fontWeight: 700, marginBottom: 3, color: itemTextColor }}>{item.name}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 3, lineHeight: 1.4, fontFamily: bodyFont }}>Prepared fresh with care</p>
            <span style={{ fontSize: 14, fontWeight: 800, color: priceTextColor }}>{cur}{item.price}</span>
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <div style={{ borderTop: `1px solid ${dividerColor}`, paddingTop: 16, marginTop: 16 }}>
        <h4 style={{ textAlign: "center", fontSize: 12, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", marginBottom: 10, color: sectionTitleColor }}>ADD-ONS</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          {["Extra Ice", "Extra Syrup", "Extra Sugar", "Extra Honey"].map((name) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.6)", paddingBottom: 5, fontFamily: bodyFont }}>
              <span>{name}</span><span>{cur}15</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   TEMPLATE 6: Luxury Gold
   Near-black with gold ornamental dividers, spacious serif
───────────────────────────────────────────────────── */
function LuxuryGold({ data, style }: TplProps) {
  const primary = style?.primaryColor ?? "#C5A059";
  const bg = style?.backgroundColor ?? "#0F0F0F";
  const headlineFont = style?.headlineFont ?? "'Cormorant Garamond', Georgia, serif";
  const bodyFont = style?.bodyFont ?? "Inter, sans-serif";
  const titleColor = style?.titleColor ?? "#FDFCF0";
  const titleSize = style?.titleSize ?? 58;
  const sectionTitleColor = style?.sectionTitleColor ?? primary;
  const itemTextColor = style?.itemTextColor ?? "#FDFCF0";
  const priceTextColor = style?.priceTextColor ?? primary;
  const dividerColor = style?.dividerColor ?? primary;
  const padding = style?.pagePadding ?? 50;
  const spacing = style?.itemSpacing ?? 20;
  const itemTextSize = style?.itemTextSize ?? 16;

  const cur = data.currency ?? "$";

  return (
    <div style={{ width: "100%", height: "100%", background: bg, fontFamily: headlineFont, color: titleColor, padding: `54px ${padding}px`, boxSizing: "border-box", position: "relative" }}>
      {/* Header ornament */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 26, marginBottom: 10, color: primary }}>◈</div>
        <p style={{ fontSize: 9, letterSpacing: 6, textTransform: "uppercase", color: primary, marginBottom: 8, fontFamily: bodyFont }}>{data.restaurantName}</p>
        <h1 style={{ fontSize: titleSize, fontWeight: 300, letterSpacing: 8, textTransform: "uppercase", marginBottom: 10, color: titleColor }}>Menu</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 0 }}>
          <div style={{ flex: 1, height: 1, background: dividerColor }} />
          <div style={{ fontSize: 14, color: primary }}>◇</div>
          <div style={{ flex: 1, height: 1, background: dividerColor }} />
        </div>
      </div>

      {/* Sections */}
      {data.categories.slice(0, 5).map((cat, ci) => (
        <div key={cat.name} style={{ marginBottom: ci < 4 ? spacing : 0 }}>
          <h3 style={{ fontSize: 10, letterSpacing: 5, textTransform: "uppercase", color: sectionTitleColor, marginBottom: 12, textAlign: "center", fontFamily: bodyFont }}>{cat.name}</h3>
          {cat.items.slice(0, 3).map((item) => (
            <div key={item.name} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: itemTextSize, fontWeight: 600, color: itemTextColor }}>{item.name}</span>
                <div style={{ flex: 1, borderBottom: `1px dotted ${dividerColor}44`, margin: "0 10px" }} />
                <span style={{ fontSize: itemTextSize - 1, color: priceTextColor, fontWeight: 300 }}>{cur}{item.price}</span>
              </div>
              <p style={{ fontSize: 10, color: itemTextColor, opacity: 0.45, fontStyle: "italic", margin: "3px 0 0", fontFamily: bodyFont }}>Premium quality, made to order</p>
            </div>
          ))}
          <div style={{ height: 1, background: `${dividerColor}26`, marginTop: 14 }} />
        </div>
      ))}

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 28, left: 50, right: 50, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: primary, opacity: 0.4 }} />
          <div style={{ fontSize: 12, color: primary }}>◈</div>
          <div style={{ flex: 1, height: 1, background: primary, opacity: 0.4 }} />
        </div>
        <p style={{ fontSize: 9, letterSpacing: 3, color: primary, fontFamily: bodyFont }}>{data.website ?? "www.yourwebsite.com"}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   TEMPLATE 7: Organic Clean
   Light cream with botanical accents, elegant serif
   Ideal for farm-to-table, vegan, or garden restaurants.
───────────────────────────────────────────────────── */
function OrganicClean({ data, style }: TplProps) {
  const primary = style?.primaryColor ?? "#4C6B5E";
  const bg = style?.backgroundColor ?? "#FDFBF7";
  const headlineFont = style?.headlineFont ?? "'Fraunces', serif";
  const bodyFont = style?.bodyFont ?? "'Work Sans', sans-serif";
  const titleColor = style?.titleColor ?? "#2D3E36";
  const titleSize = style?.titleSize ?? 56;
  const sectionTitleColor = style?.sectionTitleColor ?? "#4C6B5E";
  const itemTextColor = style?.itemTextColor ?? "#5C5C5C";
  const priceTextColor = style?.priceTextColor ?? primary;
  const dividerColor = style?.dividerColor ?? "#E2DED0";
  const padding = style?.pagePadding ?? 44;
  const spacing = style?.itemSpacing ?? 32;
  const itemTextSize = style?.itemTextSize ?? 13;

  const cur = data.currency ?? "$";

  return (
    <div style={{ width: "100%", height: "100%", background: bg, color: itemTextColor, fontFamily: bodyFont, padding: `60px ${padding}px`, boxSizing: "border-box", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Decorative Botanical Element */}
      <div style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, background: `${primary}08`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, opacity: 0.4 }}>🌿</div>
      
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontFamily: headlineFont, fontSize: titleSize, color: titleColor, marginBottom: 8, fontWeight: 400 }}>{data.restaurantName}</h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 40, height: 1, background: dividerColor }} />
          <span style={{ fontSize: 10, letterSpacing: 3, fontWeight: 700, color: primary, textTransform: "uppercase" }}>NATURAL • FRESH • ORGANIC</span>
          <div style={{ width: 40, height: 1, background: dividerColor }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px 60px" }}>
        {data.categories.slice(0, 4).map((cat) => (
          <div key={cat.name}>
            <h3 style={{ fontFamily: headlineFont, fontSize: 20, color: sectionTitleColor, borderBottom: `2px solid ${primary}22`, paddingBottom: 8, marginBottom: 20, fontStyle: "italic" }}>
              {cat.name}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing / 2 }}>
              {cat.items.slice(0, 4).map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: itemTextSize, fontWeight: 700, color: titleColor, marginBottom: 2 }}>{item.name}</p>
                    <p style={{ fontSize: 10, color: itemTextColor, opacity: 0.8, fontStyle: "italic", margin: 0 }}>Farm-to-table selection.</p>
                  </div>
                  <span style={{ fontSize: itemTextSize, fontWeight: 700, color: priceTextColor }}>{cur}{item.price}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", textAlign: "center", fontSize: 10, color: primary, fontWeight: 600, letterSpacing: 1 }}>
        WWW.MENUZAI.COM
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   TEMPLATE 8: Midnight Luxe
   Deep black with high-contrast accents, modern sans
───────────────────────────────────────────────────── */
function MidnightLuxe({ data, style }: TplProps) {
  const primary = style?.primaryColor ?? "#0070F3";
  const bg = style?.backgroundColor ?? "#000000";
  const headlineFont = style?.headlineFont ?? "'Outfit', sans-serif";
  const bodyFont = style?.bodyFont ?? "Inter, sans-serif";
  const titleColor = style?.titleColor ?? "#FFFFFF";
  const titleSize = style?.titleSize ?? 72;
  const sectionTitleColor = style?.sectionTitleColor ?? primary;
  const itemTextColor = style?.itemTextColor ?? "#A0A0A0";
  const priceTextColor = style?.priceTextColor ?? "#FFFFFF";
  const dividerColor = style?.dividerColor ?? "#1A1A1A";
  const padding = style?.pagePadding ?? 60;
  const spacing = style?.itemSpacing ?? 24;

  const cur = data.currency ?? "$";

  return (
    <div style={{ width: "100%", height: "100%", background: bg, color: itemTextColor, fontFamily: bodyFont, padding: `80px ${padding}px`, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 60 }}>
        <p style={{ color: primary, fontWeight: 900, letterSpacing: 8, fontSize: 12, marginBottom: 12 }}>EST. 2024</p>
        <h1 style={{ fontFamily: headlineFont, fontSize: titleSize, fontWeight: 900, color: titleColor, letterSpacing: -3, lineHeight: 0.8, textTransform: "uppercase" }}>
          {data.restaurantName}
        </h1>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 40 }}>
        {data.categories.slice(0, 3).map((cat) => (
          <div key={cat.name}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
              <h2 style={{ color: sectionTitleColor, fontSize: 14, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", whiteSpace: "nowrap" }}>{cat.name}</h2>
              <div style={{ flex: 1, height: 1, background: dividerColor }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `20px ${spacing}px` }}>
              {cat.items.slice(0, 4).map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#E0E0E0" }}>{item.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: priceTextColor }}>{cur}{item.price}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 100, height: 2, background: primary }} />
        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4 }}>LUXURY DINING EXPERIENCE</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Registry
───────────────────────────────────────────────────── */
const RENDERERS: Record<string, React.FC<TplProps>> = {
  "vintage-parchment": VintageParchment,
  "dark-chalkboard": DarkChalkboard,
  "bold-street": BoldStreet,
  "bistro-split": BistroSplit,
  "photo-gallery": PhotoGallery,
  "luxury-gold": LuxuryGold,
  "organic-clean": OrganicClean,
  "midnight-luxe": MidnightLuxe,
};

// Font imports for all template renderers
const TEMPLATE_FONTS = [
  "Playfair+Display:wght@400;700;900",
  "Oswald:wght@400;600;700",
  "Bebas+Neue",
  "Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400",
  "Outfit:wght@300;400;600;700;800",
  "Fraunces:ital,wght@0,300;0,400;0,700;1,400",
  "Work+Sans:wght@300;400;700",
  "Montserrat:wght@400;700;900",
];

/* ─────────────────────────────────────────────────────
   Public TemplatePreview component
───────────────────────────────────────────────────── */
export interface TemplatePreviewProps {
  templateId: string;
  /** Width of the visible container — scale is derived from this vs BASE_W */
  containerWidth?: number;
  /** Clip height — defaults to showing the full scaled height */
  clipHeight?: number;
  /** Real data (uses DEMO_DATA as fallback) */
  data?: Partial<TplData>;
  style?: TplStyle;
}

import React from "react";

export function TemplatePreview({ templateId, containerWidth = 400, clipHeight, data, style }: TemplatePreviewProps) {
  const scale = containerWidth / BASE_W;
  const scaledH = BASE_H * scale;
  const Renderer = RENDERERS[templateId] ?? VintageParchment;
  const tplData: TplData = data && (data.categories?.length ?? 0) > 0
    ? (data as TplData)
    : DEMO_DATA;

  // Load Google Fonts for all template renderers
  useEffect(() => {
    TEMPLATE_FONTS.forEach((font) => {
      const id = `tpl-font-${font}`;
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${font}&display=swap`;
      document.head.appendChild(link);
    });
  }, []);

  return (
    <div style={{ width: containerWidth, height: clipHeight ?? scaledH, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <div style={{ width: BASE_W, height: BASE_H, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
        <Renderer data={tplData} style={style} />
      </div>
    </div>
  );
}
