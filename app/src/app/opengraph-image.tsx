import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MENUZA AI — Smart Digital Menus for African Restaurants";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0e0d 0%, #1a1714 60%, #0f0e0d 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div style={{
          position: "absolute", width: 600, height: 600,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(160,65,0,0.18) 0%, transparent 70%)",
          top: -200, right: -100,
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.10) 0%, transparent 70%)",
          bottom: -150, left: -50,
        }} />

        {/* Logo mark */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16, marginBottom: 32,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "#a04100", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30,
          }}>
            🍽️
          </div>
          <span style={{ color: "#ffffff", fontSize: 36, fontWeight: 900, letterSpacing: "-1px" }}>
            MENUZA <span style={{ color: "#FF6B00" }}>AI</span>
          </span>
        </div>

        {/* Headline */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          fontSize: 64, fontWeight: 900,
          lineHeight: 1.05, letterSpacing: "-2px", textAlign: "center",
          maxWidth: 900, marginBottom: 20,
        }}>
          <span style={{ color: "#ffffff" }}>Turn Your Menu Into a</span>
          <span style={{ color: "#FF6B00" }}>Revenue Engine</span>
        </div>

        {/* Subline */}
        <div style={{
          color: "rgba(255,255,255,0.55)", fontSize: 24, fontWeight: 500,
          textAlign: "center", maxWidth: 700, marginBottom: 40,
        }}>
          AI-powered digital menus with WhatsApp ordering — built for African restaurants
        </div>

        {/* Pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {["Free to start", "No app needed", "QR Code included"].map((t) => (
            <div key={t} style={{
              background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)",
              borderRadius: 999, padding: "8px 18px", fontSize: 16, fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.10)",
            }}>
              {t}
            </div>
          ))}
        </div>

        {/* Bottom domain */}
        <div style={{
          position: "absolute", bottom: 28, color: "rgba(255,255,255,0.25)",
          fontSize: 16, fontWeight: 500,
        }}>
          menuzaai.com
        </div>
      </div>
    ),
    { ...size }
  );
}
