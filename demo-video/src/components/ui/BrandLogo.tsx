import { BRAND } from "../../constants";
import { fontHeadline } from "../../utils/fonts";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  light?: boolean;
}

const SIZES = {
  sm: { icon: 28, text: 18, gap: 10 },
  md: { icon: 40, text: 26, gap: 14 },
  lg: { icon: 56, text: 36, gap: 18 },
  xl: { icon: 80, text: 52, gap: 24 },
};

export function BrandLogo({ size = "md", light = false }: BrandLogoProps) {
  const s = SIZES[size];
  const textColor = light ? "#ffffff" : BRAND.onSurface;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: s.gap }}>
      {/* Icon mark */}
      <div
        style={{
          width: s.icon,
          height: s.icon,
          borderRadius: s.icon * 0.28,
          background: BRAND.primaryContainer,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 16px ${BRAND.primaryContainer}40`,
        }}
      >
        {/* Simple QR/restaurant mark */}
        <svg viewBox="0 0 24 24" width={s.icon * 0.6} height={s.icon * 0.6}>
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill="white" />
        </svg>
      </div>

      {/* Wordmark */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: s.text, color: textColor, letterSpacing: "-0.02em" }}>
          MENUZA
        </span>
        <span style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: s.text, color: BRAND.primaryContainer, letterSpacing: "-0.02em" }}>
          {" "}AI
        </span>
      </div>
    </div>
  );
}

