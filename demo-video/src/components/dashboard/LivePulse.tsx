import { BRAND } from "../../constants";
import { fontBody } from "../../utils/fonts";
import { pulse } from "../../utils/springs";

export function LivePulse({ frame }: { frame: number }) {
  const dotScale = pulse(frame, 0.4, 0.1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 14, background: "#d1fae520", border: "1px solid #10b98130" }}>
      <div style={{ width: 8, height: 8, borderRadius: 4, background: BRAND.tertiaryContainer, transform: `scale(${dotScale})` }} />
      <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 11, color: "#065f46" }}>Live Sync Active</span>
    </div>
  );
}

