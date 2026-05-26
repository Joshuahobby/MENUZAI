import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MENUZA AI Live Demo — Try it before you sign up";
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
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,110,42,0.12) 0%, transparent 70%)",
          bottom: -200, right: -100,
        }} />

        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.08)", borderRadius: 999,
          padding: "8px 20px", marginBottom: 28,
          border: "1px solid rgba(255,255,255,0.12)",
        }}>
          <span style={{ fontSize: 16 }}>▶</span>
          <span style={{ color: "rgba(255,255,255,0.80)", fontSize: 15, fontWeight: 700 }}>
            No account needed
          </span>
        </div>

        <div style={{
          color: "#ffffff", fontSize: 68, fontWeight: 900,
          lineHeight: 1.0, letterSpacing: "-2px", textAlign: "center", marginBottom: 20,
        }}>
          See MENUZA AI<br />
          <span style={{ color: "#FF6B00" }}>in action</span>
        </div>

        <div style={{ color: "rgba(255,255,255,0.50)", fontSize: 22, textAlign: "center", marginBottom: 48 }}>
          Try the customer menu, owner dashboard, and staff panel live
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {[
            { icon: "👤", label: "Customer View"   },
            { icon: "🏪", label: "Owner Dashboard" },
            { icon: "🏷️", label: "Staff Panel"     },
          ].map((r) => (
            <div key={r.label} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.07)", borderRadius: 12,
              padding: "14px 22px", border: "1px solid rgba(255,255,255,0.09)",
            }}>
              <span style={{ fontSize: 22 }}>{r.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.80)", fontSize: 16, fontWeight: 700 }}>
                {r.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          position: "absolute", bottom: 28,
          color: "rgba(255,255,255,0.25)", fontSize: 16, fontWeight: 500,
        }}>
          menuzaai.com/demo
        </div>
      </div>
    ),
    { ...size }
  );
}
