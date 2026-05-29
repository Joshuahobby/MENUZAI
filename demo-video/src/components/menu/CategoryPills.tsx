import { BRAND } from "../../constants";
import { fontBody } from "../../utils/fonts";
import { interpolate } from "remotion";

const CATEGORIES = ["Starters", "Mains", "Burgers", "Desserts", "Drinks"];
const ACTIVE = "Mains";

interface CategoryPillsProps {
  frame: number;
  startFrame: number;
}

export function CategoryPills({ frame, startFrame }: CategoryPillsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "10px 16px",
        overflowX: "hidden",
        background: BRAND.surface,
        borderBottom: `1px solid ${BRAND.outlineVariant}20`,
      }}
    >
      {CATEGORIES.map((cat, i) => {
        const delay = startFrame + i * 6;
        const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const translateX = interpolate(frame, [delay, delay + 20], [-20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const isActive = cat === ACTIVE;

        return (
          <div
            key={cat}
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 7,
              paddingBottom: 7,
              borderRadius: 24,
              background: isActive ? BRAND.primaryContainer : BRAND.surfaceContainerLow,
              color: isActive ? "white" : BRAND.secondary,
              fontFamily: fontBody,
              fontWeight: 600,
              fontSize: 13,
              whiteSpace: "nowrap",
              opacity,
              transform: `translateX(${translateX}px)`,
              boxShadow: isActive ? `0 2px 12px ${BRAND.primaryContainer}40` : "none",
            }}
          >
            {cat}
          </div>
        );
      })}
    </div>
  );
}

