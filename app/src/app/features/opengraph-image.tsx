import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MENUZA AI Features — Everything your restaurant needs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FEATURES = [
  { icon: "✨", label: "AI Menu Extraction" },
  { icon: "🤖", label: "AI Digital Waiter"  },
  { icon: "💬", label: "WhatsApp Orders"    },
  { icon: "📊", label: "Live Analytics"     },
  { icon: "🎨", label: "8 Templates"        },
  { icon: "📱", label: "QR Poster"          },
];

export default function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex",
        background: "linear-gradient(135deg, #0f0e0d 0%, #1a1714 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Left content */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "0 72px",
        }}>
          <div style={{
            color: "#FF6B00", fontSize: 14, fontWeight: 800,
            letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16,
          }}>
            MENUZA AI · Features
          </div>
          <div style={{
            color: "#ffffff", fontSize: 56, fontWeight: 900,
            lineHeight: 1.08, letterSpacing: "-1.5px", marginBottom: 20,
          }}>
            Everything your restaurant needs to go digital
          </div>
          <div style={{ color: "rgba(255,255,255,0.50)", fontSize: 20, fontWeight: 500 }}>
            From AI menu scanning to real-time WhatsApp orders
          </div>
        </div>

        {/* Right: feature grid */}
        <div style={{
          width: 380, display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "0 40px 0 0", gap: 12,
        }}>
          {FEATURES.map((f) => (
            <div key={f.label} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "rgba(255,255,255,0.06)", borderRadius: 12,
              padding: "14px 20px", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <span style={{ fontSize: 24 }}>{f.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 17, fontWeight: 700 }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          position: "absolute", bottom: 28, left: 72,
          color: "rgba(255,255,255,0.25)", fontSize: 16, fontWeight: 500,
        }}>
          menuzaai.com/features
        </div>
      </div>
    ),
    { ...size }
  );
}
