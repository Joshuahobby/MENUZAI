import { useVideoConfig, useCurrentFrame } from "remotion";
import { springProgress, SPRING_SLOW } from "../../utils/springs";
import { fontHeadline } from "../../utils/fonts";
import { BRAND } from "../../constants";

interface AnimatedCounterProps {
  target: number;
  startFrame: number;
  prefix?: string;
  suffix?: string;
  fontSize?: number;
  color?: string;
  decimals?: number;
}

export function AnimatedCounter({
  target,
  startFrame,
  prefix = "",
  suffix = "",
  fontSize = 48,
  color = BRAND.onSurface,
  decimals = 0,
}: AnimatedCounterProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = springProgress(frame, startFrame, fps, SPRING_SLOW);
  const value = target * progress;
  const display = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString("en-US");

  return (
    <span style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize, color, letterSpacing: "-0.02em" }}>
      {prefix}{display}{suffix}
    </span>
  );
}

