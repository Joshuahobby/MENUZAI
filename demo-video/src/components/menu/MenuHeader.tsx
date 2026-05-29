import { BRAND, MOCK_RESTAURANT } from "../../constants";
import { fontHeadline, fontBody } from "../../utils/fonts";

interface MenuHeaderProps {
  opacity?: number;
  translateY?: number;
}

export function MenuHeader({ opacity = 1, translateY = 0 }: MenuHeaderProps) {
  return (
    <div
      style={{
        width: "100%",
        paddingTop: 52, // clear Dynamic Island
        paddingBottom: 12,
        paddingLeft: 20,
        paddingRight: 20,
        background: "rgba(252,249,248,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${BRAND.outlineVariant}30`,
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 18, color: BRAND.onSurface, letterSpacing: "-0.01em" }}>
          {MOCK_RESTAURANT.name}
        </div>
        <div style={{ fontFamily: fontBody, fontSize: 11, color: BRAND.primaryContainer, fontWeight: 600, marginTop: 1 }}>
          Powered by MENUZA AI
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: BRAND.primaryContainer, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "white", fontSize: 16, fontWeight: 800, fontFamily: fontHeadline }}>LB</span>
        </div>
      </div>
    </div>
  );
}

