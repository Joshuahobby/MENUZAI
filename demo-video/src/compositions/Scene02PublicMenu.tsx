import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring } from "remotion";
import { BRAND, MOCK_ITEMS } from "../constants";
import { fontHeadline, fontBody } from "../utils/fonts";
import { PhoneFrame } from "../components/ui/PhoneFrame";
import { MenuHeader } from "../components/menu/MenuHeader";
import { CategoryPills } from "../components/menu/CategoryPills";
import { FoodItemCard } from "../components/menu/FoodItemCard";
import { AIFab } from "../components/menu/AIFab";
import { AnimatedCounter } from "../components/ui/AnimatedCounter";
import { stagger, fadeIn, entranceY, scaleIn } from "../utils/springs";

const PHONE_WIDTH = 360;

export function Scene02PublicMenu() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone entrance
  const phoneSpring = spring({ fps, frame: Math.max(0, frame - 0), config: { damping: 18, stiffness: 90, mass: 1 } });
  const phoneY = interpolate(phoneSpring, [0, 1], [300, 0]);
  const phoneOpacity = fadeIn(frame, 0, 20);

  // Header slides in
  const headerY = entranceY(frame, 30, fps, -40);
  const headerOpacity = fadeIn(frame, 30, 20);

  // Fab
  const fabScale = scaleIn(frame, 330, fps, 0);
  const fabOpacity = fadeIn(frame, 330, 20);
  const showTooltip = frame >= 380 && frame <= 560;

  // Counter start
  const counterStart = 450;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${BRAND.surface} 0%, ${BRAND.surfaceContainerLow} 100%)` }}>
      {/* Background blobs */}
      <div style={{ position: "absolute", top: -100, right: 100, width: 500, height: 500, borderRadius: "50%", background: `${BRAND.primaryContainer}08` }} />
      <div style={{ position: "absolute", bottom: -50, left: 200, width: 300, height: 300, borderRadius: "50%", background: `${BRAND.tertiaryContainer}08` }} />

      {/* Left: phone */}
      <div
        style={{
          position: "absolute",
          left: 160,
          top: "50%",
          transform: `translate(0, calc(-50% + ${phoneY}px))`,
          opacity: phoneOpacity,
        }}
      >
        <PhoneFrame width={PHONE_WIDTH}>
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: BRAND.surface, overflow: "hidden" }}>
            <MenuHeader opacity={headerOpacity} translateY={headerY} />
            <CategoryPills frame={frame} startFrame={60} />

            {/* Scrollable items */}
            <div style={{ flex: 1, overflowY: "hidden", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
              {MOCK_ITEMS.map((item, i) => {
                const { opacity, translateY } = stagger(frame, 130, i, fps, 30);
                return <FoodItemCard key={item.id} item={item} opacity={opacity} translateY={translateY} />;
              })}
            </div>

            {/* FAB pinned bottom-right */}
            <div style={{ position: "absolute", bottom: 24, right: 16, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0 }}>
              <AIFab frame={frame} scale={fabScale} opacity={fabOpacity} showTooltip={showTooltip} />
            </div>
          </div>
        </PhoneFrame>
      </div>

      {/* Right: context copy */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: "50%",
          transform: "translateY(-50%)",
          width: 420,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Label */}
        <div style={{ opacity: fadeIn(frame, 80, 25) }}>
          <div style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 12, color: BRAND.primaryContainer, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
            Your Digital Menu
          </div>
          <div style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 48, color: BRAND.onSurface, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Beautiful.<br />
            <span style={{ color: BRAND.primaryContainer }}>Instant.</span>
          </div>
          <div style={{ fontFamily: fontBody, fontSize: 18, color: BRAND.secondary, marginTop: 16, lineHeight: 1.6 }}>
            Upload your menu â€” our AI extracts every item. Share a QR code. Customers order from their phone.
          </div>
        </div>

        {/* Stats */}
        <div style={{ opacity: fadeIn(frame, counterStart - 30, 30), display: "flex", gap: 32 }}>
          <div>
            <AnimatedCounter target={60} startFrame={counterStart} suffix="s" fontSize={40} color={BRAND.primaryContainer} />
            <div style={{ fontFamily: fontBody, fontSize: 13, color: BRAND.secondary, marginTop: 4 }}>setup time</div>
          </div>
          <div style={{ width: 1, background: BRAND.outlineVariant }} />
          <div>
            <AnimatedCounter target={8} startFrame={counterStart + 30} suffix=" templates" fontSize={40} color={BRAND.primaryContainer} />
            <div style={{ fontFamily: fontBody, fontSize: 13, color: BRAND.secondary, marginTop: 4 }}>to choose from</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

