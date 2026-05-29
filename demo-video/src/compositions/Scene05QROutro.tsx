import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring } from "remotion";
import { BRAND } from "../constants";
import { fontHeadline, fontBody } from "../utils/fonts";
import { QRPoster } from "../components/qr/QRPoster";
import { BrandLogo } from "../components/ui/BrandLogo";
import { RestaurantIcon, RobotIcon, QRCodeIcon } from "../components/ui/Icons";
import { stagger, fadeIn, scaleIn } from "../utils/springs";

const VALUE_PROPS = [
  { icon: <RestaurantIcon size={22} color={BRAND.primaryContainer} />, text: "AI-Powered Menu in Minutes" },
  { icon: <RobotIcon size={22} color={BRAND.primaryContainer} />,      text: "AI Waiter That Takes Orders" },
  { icon: <QRCodeIcon size={22} color={BRAND.primaryContainer} />,     text: "QR Posters, Real-Time Dashboard" },
];

export function Scene05QROutro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Poster entrance
  const posterSpring = spring({ fps, frame: Math.max(0, frame - 0), config: { damping: 16, stiffness: 80 } });
  const posterScale = interpolate(posterSpring, [0, 1], [0.65, 1]);
  const posterRotate = interpolate(posterSpring, [0, 1], [-4, 0]);
  const posterOpacity = fadeIn(frame, 0, 25);

  // Thumbnail posters
  const thumb1Opacity = fadeIn(frame, 90, 20);
  const thumb1X = interpolate(frame, [90, 120], [80, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const thumb2Opacity = fadeIn(frame, 120, 20);
  const thumb2X = interpolate(frame, [120, 150], [80, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Transition to brand outro
  const outroStart = 240;
  const posterOutOpacity = interpolate(frame, [outroStart, outroStart + 30], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outroOpacity = fadeIn(frame, outroStart + 10, 30);

  // Value props
  const VP_START = outroStart + 60;
  const vps = VALUE_PROPS.map((_, i) => stagger(frame, VP_START, i, fps, 15));

  // Logo
  const logoScale = scaleIn(frame, outroStart + 20, fps, 0.7);
  const logoOpacity = fadeIn(frame, outroStart + 20, 25);

  // CTA card
  const ctaScale = scaleIn(frame, VP_START + 60, fps, 0.85);
  const ctaOpacity = fadeIn(frame, VP_START + 60, 25);

  // Final fade to black
  const finalFade = interpolate(frame, [510, 540], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* QR Poster phase */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${BRAND.surface} 0%, ${BRAND.surfaceContainerLow} 100%)`,
          opacity: posterOutOpacity,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        {/* Left copy */}
        <div style={{ flex: 1, paddingLeft: 100, opacity: posterOpacity }}>
          <div style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 12, color: BRAND.primaryContainer, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
            Instant QR Menus
          </div>
          <div style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 48, color: BRAND.onSurface, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Print once.<br />
            <span style={{ color: BRAND.primaryContainer }}>Update anytime.</span>
          </div>
          <div style={{ fontFamily: fontBody, fontSize: 17, color: BRAND.secondary, marginTop: 16, lineHeight: 1.6 }}>
            Beautiful QR poster templates for every table. Change your menu online â€” no reprinting ever.
          </div>
        </div>

        {/* QR Poster */}
        <div style={{ flexShrink: 0 }}>
          <QRPoster width={280} opacity={posterOpacity} scale={posterScale} rotate={posterRotate} />
        </div>

        {/* Thumbnail variants */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingRight: 80 }}>
          <div style={{ opacity: thumb1Opacity, transform: `translateX(${thumb1X}px)` }}>
            <QRPoster width={110} opacity={0.65} />
          </div>
          <div style={{ opacity: thumb2Opacity, transform: `translateX(${thumb2X}px)` }}>
            <QRPoster width={110} opacity={0.45} />
          </div>
        </div>
      </AbsoluteFill>

      {/* Brand outro phase */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, #1b1b1c 0%, ${BRAND.primary}cc 50%, #1a2e1a 100%)`,
          opacity: outroOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        {/* Decorative */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: `${BRAND.primaryContainer}10` }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 350, height: 350, borderRadius: "50%", background: `${BRAND.tertiaryContainer}08` }} />

        {/* Logo */}
        <div style={{ transform: `scale(${logoScale})`, opacity: logoOpacity }}>
          <BrandLogo size="xl" light />
        </div>

        {/* Value props */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          {VALUE_PROPS.map((vp, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 28px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                opacity: vps[i].opacity,
                transform: `translateY(${vps[i].translateY}px)`,
              }}
            >
              {vp.icon}
              <span style={{ fontFamily: fontBody, fontWeight: 600, fontSize: 17, color: "rgba(255,255,255,0.85)" }}>
                {vp.text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA card */}
        <div
          style={{
            padding: "24px 48px",
            borderRadius: 24,
            background: BRAND.primaryContainer,
            boxShadow: `0 16px 48px ${BRAND.primaryContainer}50`,
            textAlign: "center",
            transform: `scale(${ctaScale})`,
            opacity: ctaOpacity,
          }}
        >
          <div style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 36, color: "white", letterSpacing: "-0.02em" }}>
            menuzai.com
          </div>
          <div style={{ fontFamily: fontBody, fontSize: 15, color: "rgba(255,255,255,0.8)", marginTop: 6 }}>
            Start free â€” no credit card required
          </div>
        </div>
      </AbsoluteFill>

      {/* Fade to black */}
      <AbsoluteFill style={{ background: "#000", opacity: finalFade, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
}

