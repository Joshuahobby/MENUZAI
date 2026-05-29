import React from "react";
import { BRAND } from "../../constants";
import { fontHeadline, fontBody } from "../../utils/fonts";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: string;
  iconColor: string;
  valueColor?: string;
  opacity?: number;
  translateY?: number;
  scale?: number;
  highlight?: boolean;
}

export function StatCard({ icon, label, value, sub, iconColor, valueColor, opacity = 1, translateY = 0, scale = 1, highlight = false }: StatCardProps) {
  return (
    <div
      style={{
        background: highlight ? "#fffbeb" : BRAND.surfaceContainerLowest,
        borderRadius: 24,
        padding: "20px 20px 18px",
        border: highlight ? `1.5px solid ${BRAND.amber500}40` : `1px solid ${BRAND.surfaceContainer}`,
        boxShadow: highlight ? `0 4px 20px ${BRAND.amber500}20` : "0 1px 4px rgba(0,0,0,0.04)",
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        flex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <div style={{ color: iconColor }}>{icon}</div>
        <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 10, color: BRAND.secondary, textTransform: "uppercase", letterSpacing: "0.15em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 28, color: valueColor ?? BRAND.onSurface, lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontFamily: fontBody, fontSize: 10, color: BRAND.secondary }}>
        {sub}
      </div>
    </div>
  );
}

