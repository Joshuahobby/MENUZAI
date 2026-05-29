import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring } from "remotion";
import { BRAND, MOCK_ORDERS } from "../constants";
import { fontHeadline, fontBody } from "../utils/fonts";
import { StatCard } from "../components/dashboard/StatCard";
import { OrderCard } from "../components/dashboard/OrderCard";
import { LivePulse } from "../components/dashboard/LivePulse";
import { AnimatedCounter } from "../components/ui/AnimatedCounter";
import { PaymentsIcon, PendingIcon, RestaurantIcon, RobotIcon } from "../components/ui/Icons";
import { stagger, fadeIn } from "../utils/springs";

export function Scene04Dashboard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header
  const headerOpacity = fadeIn(frame, 0, 30);
  const headerY = interpolate(frame, [0, 30], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Stat cards stagger
  const STAT_START = 60;
  const stats = [0,1,2,3].map(i => stagger(frame, STAT_START, i, fps, 20));

  // Order cards stagger
  const ORDER_START = 250;
  const orders = [0,1,2].map(i => stagger(frame, ORDER_START, i, fps, 50));

  // New order flash at fr 540
  const flashProgress = interpolate(frame, [540, 560, 620, 640], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const toastY = interpolate(frame, [540, 570, 640, 660], [-60, 0, 0, -60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const toastOpacity = interpolate(frame, [540, 560, 640, 660], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Outro text
  const outroOpacity = fadeIn(frame, 680, 30);

  const isPendingFlash = frame >= 540 && frame <= 660;

  return (
    <AbsoluteFill style={{ background: BRAND.surface, padding: "0 60px" }}>
      {/* Header */}
      <div style={{ paddingTop: 48, paddingBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", opacity: headerOpacity, transform: `translateY(${headerY}px)` }}>
        <div>
          <div style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 11, color: BRAND.secondary, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
            Staff Dashboard
          </div>
          <div style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 38, color: BRAND.onSurface, letterSpacing: "-0.02em" }}>
            Real-Time Staff Panel
          </div>
          <div style={{ fontFamily: fontBody, fontSize: 15, color: BRAND.secondary, marginTop: 4 }}>
            Monitor live customer orders and instant table service
          </div>
        </div>
        <LivePulse frame={frame} />
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        <StatCard
          icon={<RestaurantIcon size={18} color={BRAND.primaryContainer} />}
          label="Today's Orders"
          value={<AnimatedCounter target={24} startFrame={STAT_START} fontSize={28} color={BRAND.onSurface} />}
          sub="orders processed today"
          iconColor={BRAND.primaryContainer}
          opacity={stats[0].opacity} translateY={stats[0].translateY}
        />
        <StatCard
          icon={<PendingIcon size={18} color={BRAND.amber500} />}
          label="Pending Action"
          value={<span style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 28, color: BRAND.amber500 }}>{isPendingFlash ? "4" : "3"}</span>}
          sub="require immediate attention"
          iconColor={BRAND.amber500}
          opacity={stats[1].opacity} translateY={stats[1].translateY}
          scale={isPendingFlash ? 1 + flashProgress * 0.02 : 1}
          highlight={isPendingFlash}
        />
        <StatCard
          icon={<RobotIcon size={18} color="#8b5cf6" />}
          label="AI Waiter Orders"
          value={<AnimatedCounter target={8} startFrame={STAT_START + 40} fontSize={28} color="#8b5cf6" />}
          sub="placed via chat"
          iconColor="#8b5cf6"
          opacity={stats[2].opacity} translateY={stats[2].translateY}
        />
        <StatCard
          icon={<PaymentsIcon size={18} color={BRAND.tertiaryContainer} />}
          label="Today's Revenue"
          value={<AnimatedCounter target={892000} startFrame={STAT_START + 60} fontSize={22} color={BRAND.tertiaryContainer} prefix="RWF " />}
          sub="total revenue today"
          iconColor={BRAND.tertiaryContainer}
          opacity={stats[3].opacity} translateY={stats[3].translateY}
        />
      </div>

      {/* Order cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {MOCK_ORDERS.map((order, i) => (
          <OrderCard
            key={order.id}
            {...order}
            isNew={i === 0}
            opacity={orders[i].opacity}
            translateY={orders[i].translateY}
            scale={orders[i].scale}
          />
        ))}
      </div>

      {/* New order toast */}
      {frame >= 540 && (
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 60,
            background: BRAND.onSurface,
            borderRadius: 16,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            transform: `translateY(${toastY}px)`,
            opacity: toastOpacity,
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 12, background: BRAND.primaryContainer, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RestaurantIcon size={18} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: fontHeadline, fontWeight: 700, fontSize: 14, color: "white" }}>New order received!</div>
            <div style={{ fontFamily: fontBody, fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>From Keza N. Â· Table 5</div>
          </div>
        </div>
      )}

      {/* Outro copy */}
      {frame >= 680 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${BRAND.surface}e0`,
            opacity: outroOpacity,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 56, color: BRAND.onSurface, letterSpacing: "-0.02em" }}>
              Zero missed orders.
            </div>
            <div style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 56, color: BRAND.primaryContainer, letterSpacing: "-0.02em" }}>
              Zero confusion.
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}

