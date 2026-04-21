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
  backgroundColor?: string;
  headlineFont?: string;
  bodyFont?: string;
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
function VintageParchment({ data }: TplProps) {
  const half = Math.ceil(data.categories.length / 2);
  const left = data.categories.slice(0, half);
  const right = data.categories.slice(half);
  const cur = data.currency ?? "$";

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAF0DC", fontFamily: "'Playfair Display', Georgia, serif", padding: "48px 44px", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
      {/* Aged-paper vignette */}
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 80px rgba(90,55,10,0.28)", pointerEvents: "none", zIndex: 10 }} />
      {/* Top burn */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: "linear-gradient(180deg,rgba(90,55,10,0.35) 0%,transparent 100%)", zIndex: 11 }} />
      {/* Bottom burn */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 14, background: "linear-gradient(0deg,rgba(90,55,10,0.4) 0%,transparent 100%)", zIndex: 11 }} />

      {/* Header */}
      <p style={{ fontSize: 14, letterSpacing: 3, color: "#7A5630", marginBottom: 6, textTransform: "lowercase", fontStyle: "italic" }}>{data.restaurantName}</p>
      <h1 style={{ fontSize: 82, lineHeight: 0.9, fontWeight: 900, color: "#1A1009", marginBottom: 26, letterSpacing: -1 }}>
        COFFEE<br />MENU
      </h1>

      {/* Full-width divider */}
      <div style={{ height: 1, background: "#B89060", marginBottom: 24 }} />

      {/* 2-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 0, height: "calc(100% - 280px)" }}>
        <div style={{ paddingRight: 24 }}>
          {left.map((cat) => (
            <div key={cat.name} style={{ marginBottom: 26 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 5, borderBottom: "1px solid #C4A06A" }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{cat.icon ?? "🍽️"}</span>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: "#3D2410" }}>{cat.name}</span>
              </div>
              {cat.items.slice(0, 5).map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#4A3318" }}>
                  <span>{item.name}</span>
                  <span style={{ fontWeight: 700 }}>{cur}{item.price}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Vertical divider */}
        <div style={{ background: "#C4A06A" }} />

        <div style={{ paddingLeft: 24 }}>
          {right.map((cat) => (
            <div key={cat.name} style={{ marginBottom: 26 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 5, borderBottom: "1px solid #C4A06A" }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{cat.icon ?? "🍽️"}</span>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: "#3D2410" }}>{cat.name}</span>
              </div>
              {cat.items.slice(0, 5).map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#4A3318" }}>
                  <span>{item.name}</span>
                  <span style={{ fontWeight: 700 }}>{cur}{item.price}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 28, left: 44, right: 44, textAlign: "center", fontSize: 11, color: "#6B4F31", letterSpacing: 3, borderTop: "1px solid #C4A06A", paddingTop: 12, zIndex: 9 }}>
        {data.website ?? "www.yourwebsite.com"}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   TEMPLATE 2: Dark Chalkboard
   Near-black bg, white text, 2-col, bold categories
───────────────────────────────────────────────────── */
function DarkChalkboard({ data }: TplProps) {
  const half = Math.ceil(data.categories.length / 2);
  const left = data.categories.slice(0, half);
  const right = data.categories.slice(half);
  const cur = data.currency ?? "$";

  return (
    <div style={{ width: "100%", height: "100%", background: "#1C1C1C", fontFamily: "'Oswald', Impact, sans-serif", padding: "48px 44px", boxSizing: "border-box", color: "#EFEFEF", position: "relative", overflow: "hidden" }}>
      {/* Subtle texture overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none" }} />

      {/* Header */}
      <p style={{ fontSize: 12, letterSpacing: 4, color: "#888", marginBottom: 8, textTransform: "uppercase", fontFamily: "Inter,sans-serif" }}>{data.restaurantName}</p>
      <h1 style={{ fontSize: 84, lineHeight: 0.88, fontWeight: 700, color: "#FFFFFF", marginBottom: 28, letterSpacing: 2 }}>
        COFFEE<br />MENU
      </h1>

      {/* Divider */}
      <div style={{ height: 2, background: "#3A3A3A", marginBottom: 22 }} />

      {/* 2-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 0, height: "calc(100% - 300px)" }}>
        <div style={{ paddingRight: 24 }}>
          {left.map((cat) => (
            <div key={cat.name} style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{cat.icon ?? "🍽️"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#FFFFFF" }}>{cat.name}</span>
              </div>
              {cat.items.slice(0, 5).map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5, color: "#CACACA", fontFamily: "Inter,sans-serif", fontWeight: 400 }}>
                  <span>{item.name}</span>
                  <span>{cur}{item.price}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ background: "#3A3A3A" }} />
        <div style={{ paddingLeft: 24 }}>
          {right.map((cat) => (
            <div key={cat.name} style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{cat.icon ?? "🍽️"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#FFFFFF" }}>{cat.name}</span>
              </div>
              {cat.items.slice(0, 5).map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5, color: "#CACACA", fontFamily: "Inter,sans-serif", fontWeight: 400 }}>
                  <span>{item.name}</span>
                  <span>{cur}{item.price}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 24, left: 44, right: 44, textAlign: "center", fontSize: 11, color: "#555", letterSpacing: 3, fontFamily: "Inter,sans-serif" }}>
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
  const accent = style?.primaryColor ?? "#FF6B00";
  const cur = data.currency ?? "$";
  const FOOD_EMOJIS = ["🥩", "🍗", "🍜", "🌮", "🍕", "🧆"];

  return (
    <div style={{ width: "100%", height: "100%", background: "#191919", fontFamily: "'Bebas Neue', Impact, sans-serif", boxSizing: "border-box", color: "#FFFFFF", position: "relative", overflow: "hidden" }}>
      {/* Accent blob / paint stroke */}
      <div style={{ position: "absolute", top: 0, right: 0, width: 260, height: BASE_H * 0.65, background: accent, clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 15% 100%, 0% 55%)", opacity: 0.92, zIndex: 0 }} />

      {/* Logo line */}
      <div style={{ position: "relative", zIndex: 2, padding: "36px 40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🍽️</div>
          <span style={{ fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.7)", fontFamily: "Inter,sans-serif" }}>{data.restaurantName}</span>
        </div>
        {/* Big Title */}
        <h1 style={{ fontSize: 96, lineHeight: 0.88, fontWeight: 700, color: "#FFFFFF", letterSpacing: 3, margin: 0 }}>
          FOOD<br />MENU
        </h1>
      </div>

      {/* Food photo circles on right, over accent */}
      <div style={{ position: "absolute", top: 28, right: 30, zIndex: 3, display: "flex", flexDirection: "column", gap: 14 }}>
        {FOOD_EMOJIS.slice(0, 3).map((emoji, i) => (
          <div key={i} style={{ width: 170, height: 118, background: `rgba(0,0,0,0.35)`, borderRadius: 14, border: "2px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, backdropFilter: "blur(2px)" }}>
            {emoji}
          </div>
        ))}
      </div>

      {/* Menu sections left */}
      <div style={{ position: "absolute", top: 240, left: 40, width: 280, zIndex: 2 }}>
        {data.categories.slice(0, 3).map((cat) => (
          <div key={cat.name} style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: accent, margin: "0 0 8px 0" }}>{cat.name}</h3>
            {cat.items.slice(0, 4).map((item) => (
              <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: "#DDDDDD", fontFamily: "Inter,sans-serif" }}>
                <span>{item.name}</span>
                <span style={{ color: accent, fontWeight: 700 }}>{cur} {item.price}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, padding: "14px 40px", borderTop: "1px solid #333", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", fontFamily: "Inter,sans-serif", letterSpacing: 1 }}>
        <span>{data.phone ?? "123-456-7890"}</span>
        <span>{data.website ?? "www.yourwebsite.com"}</span>
        <span>123 Anywhere St.</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   TEMPLATE 4: Bistro Split
   Dark rich-brown sidebar | cream content panel
───────────────────────────────────────────────────── */
function BistroSplit({ data, style }: TplProps) {
  const gold = style?.primaryColor ?? "#C5A059";
  const cur = data.currency ?? "$";
  const EMOJIS = ["🥗", "🍤", "🍝", "🐟", "🍣", "🥩"];

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", fontFamily: "'Cormorant Garamond', Georgia, serif", overflow: "hidden" }}>
      {/* LEFT: dark sidebar */}
      <div style={{ width: "38%", background: "#3B1A0F", padding: "40px 22px", display: "flex", flexDirection: "column", color: "#FAF3E0", position: "relative" }}>
        {/* Logo/ornament */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>🍴</div>
          <p style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: gold, marginBottom: 4, fontFamily: "Inter,sans-serif" }}>{data.restaurantName}</p>
          <h2 style={{ fontSize: 19, lineHeight: 1.15, fontWeight: 700, color: "#FAF3E0", margin: "0 0 10px 0" }}>MODERN<br />FLAVORS,<br />TIMELESS<br />COMFORT.</h2>
          <div style={{ width: 40, height: 1, background: gold, margin: "0 auto 8px" }} />
          <p style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: gold, fontFamily: "Inter,sans-serif" }}>BEST MENU</p>
        </div>

        {/* Featured items with circle placeholders */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(data.categories[0]?.items ?? []).slice(0, 4).map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                width: 68, height: 68, borderRadius: "50%",
                background: `linear-gradient(135deg, ${["#FF6B35,#e67e22", "#27ae60,#1abc9c", "#3498db,#2980b9", "#e74c3c,#c0392b"][i % 4]})`,
                margin: "0 auto 6px", border: `2px solid ${gold}44`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
              }}>{EMOJIS[i % 6]}</div>
              <p style={{ fontSize: 7.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: gold, marginBottom: 2, fontFamily: "Inter,sans-serif" }}>{item.name}</p>
              <p style={{ fontSize: 6.5, color: "rgba(250,243,224,0.65)", lineHeight: 1.4, margin: 0 }}>Handcrafted with care</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${gold}44`, fontSize: 9, color: gold, letterSpacing: 1.5, textAlign: "center", fontFamily: "Inter,sans-serif" }}>
          📞 RESERVATION: {data.phone ?? "+123-456-7890"}
        </div>
      </div>

      {/* RIGHT: cream panel */}
      <div style={{ flex: 1, background: "#FAF3E0", padding: "28px 20px", overflow: "hidden", display: "flex", flexDirection: "column", gap: 0 }}>
        {data.categories.slice(1, 5).map((cat) => (
          <div key={cat.name} style={{ marginBottom: 14 }}>
            <div style={{ background: "#3B1A0F", color: "#FAF3E0", padding: "5px 12px", fontSize: 10, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, fontFamily: "Inter,sans-serif" }}>
              {cat.name}
            </div>
            {cat.items.slice(0, 3).map((item) => (
              <div key={item.name} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(59,26,15,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: gold }}>{item.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#3B1A0F" }}>{cur}{item.price}.00</span>
                </div>
                <p style={{ fontSize: 9, color: "#6B4F31", lineHeight: 1.4, margin: 0 }}>A delicious {item.name.toLowerCase()} prepared fresh daily.</p>
              </div>
            ))}
          </div>
        ))}
        {/* Photo grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: "auto" }}>
          {["🍛", "🥗", "🍕", "🥩"].map((emoji, i) => (
            <div key={i} style={{ height: 52, background: `linear-gradient(135deg,${i % 2 === 0 ? "#6B4F31,#3B1A0F" : "#8B6347,#5C3D2E"})`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{emoji}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   TEMPLATE 5: Photo Gallery
   Dark bg, 2-col food photo grid with overlay text, add-ons section
───────────────────────────────────────────────────── */
function PhotoGallery({ data, style }: TplProps) {
  const accent = style?.primaryColor ?? "#FFFFFF";
  const cur = data.currency ?? "$";
  const allItems = data.categories.flatMap((c) => c.items).slice(0, 6);
  const GRADIENTS = ["#FF6B35,#e74c3c", "#c0392b,#922b21", "#f39c12,#d68910", "#27ae60,#1e8449", "#2980b9,#1a5276", "#8e44ad,#6c3483"];
  const EMOJIS = ["🥐", "🥞", "🍳", "🧆", "🥗", "🎂"];

  return (
    <div style={{ width: "100%", height: "100%", background: "#0F0F0F", fontFamily: "'Outfit', Inter, sans-serif", color: "#FFFFFF", padding: "40px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 34, fontWeight: 300, marginBottom: 8, color: "#FFFFFF" }}>Restaurant<br />Menu</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: "italic", marginBottom: 12 }}>&quot;The sweet and smooth taste of the dessert to end your special meal&quot;</p>
        <div style={{ width: 44, height: 1, background: "#333" }} />
      </div>

      {/* 2-col photo grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, flex: 1 }}>
        {allItems.map((item, i) => (
          <div key={i}>
            <div style={{ height: 100, background: `linear-gradient(135deg,${GRADIENTS[i % 6]})`, borderRadius: 10, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
              {EMOJIS[i % 6]}
            </div>
            <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{item.name}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 3, lineHeight: 1.4 }}>A delicious dish made fresh with care</p>
            <span style={{ fontSize: 14, fontWeight: 800, color: accent }}>{cur}{item.price}</span>
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <div style={{ borderTop: "1px solid #2A2A2A", paddingTop: 16, marginTop: 16 }}>
        <h4 style={{ textAlign: "center", fontSize: 12, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", marginBottom: 10, color: "#FFFFFF" }}>ADD-ONS</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          {["Extra Ice", "Extra Syrup", "Extra Sugar", "Extra Honey"].map((name) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.6)", paddingBottom: 5 }}>
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
  const gold = style?.primaryColor ?? "#C5A059";
  const cur = data.currency ?? "$";

  return (
    <div style={{ width: "100%", height: "100%", background: "#0F0F0F", fontFamily: "'Cormorant Garamond', Georgia, serif", color: "#FDFCF0", padding: "54px 50px", boxSizing: "border-box", position: "relative" }}>
      {/* Header ornament */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 26, marginBottom: 10, color: gold }}>◈</div>
        <p style={{ fontSize: 9, letterSpacing: 6, textTransform: "uppercase", color: gold, marginBottom: 8, fontFamily: "Inter,sans-serif" }}>{data.restaurantName}</p>
        <h1 style={{ fontSize: 58, fontWeight: 300, letterSpacing: 8, textTransform: "uppercase", marginBottom: 10, color: "#FDFCF0" }}>Menu</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 0 }}>
          <div style={{ flex: 1, height: 1, background: gold }} />
          <div style={{ fontSize: 14, color: gold }}>◇</div>
          <div style={{ flex: 1, height: 1, background: gold }} />
        </div>
      </div>

      {/* Sections */}
      {data.categories.slice(0, 5).map((cat, ci) => (
        <div key={cat.name} style={{ marginBottom: ci < 4 ? 20 : 0 }}>
          <h3 style={{ fontSize: 10, letterSpacing: 5, textTransform: "uppercase", color: gold, marginBottom: 12, textAlign: "center", fontFamily: "Inter,sans-serif" }}>{cat.name}</h3>
          {cat.items.slice(0, 3).map((item) => (
            <div key={item.name} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{item.name}</span>
                <div style={{ flex: 1, borderBottom: "1px dotted rgba(197,160,89,0.3)", margin: "0 10px" }} />
                <span style={{ fontSize: 15, color: gold, fontWeight: 300 }}>{cur}{item.price}</span>
              </div>
              <p style={{ fontSize: 10, color: "rgba(253,252,240,0.45)", fontStyle: "italic", margin: "3px 0 0" }}>Premium quality, made to order</p>
            </div>
          ))}
          <div style={{ height: 1, background: "rgba(197,160,89,0.15)", marginTop: 14 }} />
        </div>
      ))}

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 28, left: 50, right: 50, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: gold, opacity: 0.4 }} />
          <div style={{ fontSize: 12, color: gold }}>◈</div>
          <div style={{ flex: 1, height: 1, background: gold, opacity: 0.4 }} />
        </div>
        <p style={{ fontSize: 9, letterSpacing: 3, color: gold, fontFamily: "Inter,sans-serif" }}>{data.website ?? "www.yourwebsite.com"}</p>
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
};

// Font imports for all template renderers
const TEMPLATE_FONTS = [
  "Playfair+Display:wght@400;700;900",
  "Oswald:wght@400;600;700",
  "Bebas+Neue",
  "Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400",
  "Outfit:wght@300;400;600;700;800",
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
  primaryColor?: string;
  backgroundColor?: string;
}

import React from "react";

export function TemplatePreview({ templateId, containerWidth = 400, clipHeight, data, primaryColor, backgroundColor }: TemplatePreviewProps) {
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
        <Renderer data={tplData} style={{ primaryColor, backgroundColor }} />
      </div>
    </div>
  );
}
