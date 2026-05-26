import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MENUZA AI Pricing — Start free, grow with your restaurant";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex",
        background: "linear-gradient(135deg, #0f0e0d 0%, #1a1714 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        alignItems: "center", justifyContent: "center",
        flexDirection: "column", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(160,65,0,0.15) 0%, transparent 70%)",
          top: -300, left: "50%", transform: "translateX(-50%)",
        }} />

        <div style={{ color: "#FF6B00", fontSize: 14, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20 }}>
          MENUZA AI · Pricing
        </div>

        <div style={{
          color: "#ffffff", fontSize: 66, fontWeight: 900,
          lineHeight: 1.05, letterSpacing: "-2px", textAlign: "center", marginBottom: 16,
        }}>
          Simple, honest pricing
        </div>

        <div style={{ color: "rgba(255,255,255,0.50)", fontSize: 22, marginBottom: 48 }}>
          Start free. Upgrade when you're ready.
        </div>

        {/* 3 plan cards */}
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { name: "Free",     price: "0",       unit: "RWF / mo", highlight: false },
            { name: "Pro",      price: "29,000",   unit: "RWF / mo", highlight: true  },
            { name: "Business", price: "79,000",   unit: "RWF / mo", highlight: false },
          ].map((plan) => (
            <div key={plan.name} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              background: plan.highlight ? "#a04100" : "rgba(255,255,255,0.06)",
              border: plan.highlight ? "2px solid #FF6B00" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: "24px 36px", minWidth: 200,
            }}>
              <span style={{ color: plan.highlight ? "#fff" : "rgba(255,255,255,0.60)", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                {plan.name}
              </span>
              <span style={{ color: "#ffffff", fontSize: 36, fontWeight: 900, letterSpacing: "-1px" }}>
                {plan.price}
              </span>
              <span style={{ color: plan.highlight ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>
                {plan.unit}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          position: "absolute", bottom: 28,
          color: "rgba(255,255,255,0.25)", fontSize: 16, fontWeight: 500,
        }}>
          menuzaai.com/pricing
        </div>
      </div>
    ),
    { ...size }
  );
}
