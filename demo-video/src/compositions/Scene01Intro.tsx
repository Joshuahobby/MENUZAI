import { useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill } from "remotion";
import { BRAND } from "../constants";
import { fontHeadline, fontBody } from "../utils/fonts";
import { BrandLogo } from "../components/ui/BrandLogo";
import { scaleIn, fadeIn, streamText } from "../utils/springs";

const TAGLINE = "The AI Waiter for Every Restaurant";

export function Scene01Intro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = fadeIn(frame, 0, 30);
  const logoScale = scaleIn(frame, 10, fps, 0.5);
  const logoOpacity = fadeIn(frame, 10, 25);
  const tagline = streamText(frame, 50, 110, TAGLINE);
  const taglineOpacity = fadeIn(frame, 50, 20);
  const subOpacity = fadeIn(frame, 115, 20);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #1b1b1c 0%, ${BRAND.primary}cc 50%, #1b1b1c 100%)`,
        opacity: bgOpacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: `${BRAND.primaryContainer}18`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -150, left: -150, width: 400, height: 400, borderRadius: "50%", background: `${BRAND.tertiary}15`, pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ transform: `scale(${logoScale})`, opacity: logoOpacity }}>
        <BrandLogo size="xl" light />
      </div>

      {/* Tagline */}
      <div style={{ opacity: taglineOpacity, textAlign: "center" }}>
        <div
          style={{
            fontFamily: fontHeadline,
            fontWeight: 700,
            fontSize: 36,
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "-0.01em",
            minHeight: 44,
          }}
        >
          {tagline}
          <span style={{ opacity: frame % 30 < 15 ? 1 : 0, color: BRAND.primaryContainer }}>|</span>
        </div>
      </div>

      {/* Sub */}
      <div style={{ opacity: subOpacity, display: "flex", alignItems: "center", gap: 16 }}>
        {["AI Ordering", "Real-Time Dashboard", "QR Menus"].map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {i > 0 && <div style={{ width: 4, height: 4, borderRadius: 2, background: BRAND.primaryContainer }} />}
            <span style={{ fontFamily: fontBody, fontSize: 16, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{t}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

