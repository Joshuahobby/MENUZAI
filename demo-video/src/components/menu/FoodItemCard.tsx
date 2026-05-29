import { Img } from "remotion";
import { BRAND, fmtPrice } from "../../constants";
import { fontHeadline, fontBody } from "../../utils/fonts";
import { StarIcon } from "../../components/ui/Icons";

interface FoodItem {
  name: string;
  price: number;
  description: string;
  badge: string;
  image: string;
}

interface FoodItemCardProps {
  item: FoodItem;
  opacity?: number;
  translateY?: number;
}

const BADGE_META: Record<string, { label: string; color: string; bg: string }> = {
  bestseller: { label: "Bestseller", color: "#92400e", bg: "#fef3c7" },
  healthy:    { label: "Healthy",    color: "#065f46", bg: "#d1fae5" },
  new:        { label: "New",        color: "#1e40af", bg: "#dbeafe" },
  popular:    { label: "Popular",    color: "#7c2d12", bg: "#ffedd5" },
};

export function FoodItemCard({ item, opacity = 1, translateY = 0 }: FoodItemCardProps) {
  const badge = BADGE_META[item.badge] ?? BADGE_META.popular;

  return (
    <div
      style={{
        background: BRAND.surfaceContainerLowest,
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${BRAND.outlineVariant}30`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 140, overflow: "hidden" }}>
        <Img
          src={item.image}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Price badge */}
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            borderRadius: 12,
            padding: "4px 10px",
            fontFamily: fontHeadline,
            fontWeight: 800,
            fontSize: 12,
            color: BRAND.primaryContainer,
          }}
        >
          {fmtPrice(item.price)}
        </div>
        {/* Badge chip */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            background: badge.bg,
            borderRadius: 8,
            padding: "3px 8px",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <StarIcon size={10} color={badge.color} />
          <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 10, color: badge.color }}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 14, color: BRAND.onSurface, marginBottom: 4, lineHeight: 1.2 }}>
          {item.name}
        </div>
        <div style={{ fontFamily: fontBody, fontSize: 11, color: BRAND.secondary, marginBottom: 12, lineHeight: 1.4 }}>
          {item.description}
        </div>
        {/* Add button */}
        <div
          style={{
            background: BRAND.primaryContainer,
            borderRadius: 14,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 12, color: "white" }}>Add to Order</span>
        </div>
      </div>
    </div>
  );
}

