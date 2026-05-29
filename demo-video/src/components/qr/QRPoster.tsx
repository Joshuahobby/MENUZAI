import React from "react";
import { BRAND, MOCK_RESTAURANT } from "../../constants";
import { fontHeadline, fontBody } from "../../utils/fonts";
import { QRCode } from "./QRCode";

interface QRPosterProps {
  width?: number;
  opacity?: number;
  scale?: number;
  rotate?: number;
}

export function QRPoster({ width = 320, opacity = 1, scale = 1, rotate = 0 }: QRPosterProps) {
  const height = Math.round(width * 1.414); // A4 ratio
  const qrSize = Math.round(width * 0.52);

  return (
    <div
      style={{
        width,
        height,
        background: BRAND.surfaceContainerLowest,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
        border: `1px solid ${BRAND.outlineVariant}40`,
        opacity,
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Top gradient stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.primaryContainer})`,
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px 24px", gap: 16, width: "100%" }}>
        {/* Welcome row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <div style={{ flex: 1, height: 1, background: BRAND.outlineVariant }} />
          <span style={{ fontFamily: fontBody, fontWeight: 700, fontSize: Math.round(width * 0.035), color: BRAND.secondary, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Welcome
          </span>
          <div style={{ flex: 1, height: 1, background: BRAND.outlineVariant }} />
        </div>

        {/* Restaurant name */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: Math.round(width * 0.105), color: BRAND.onSurface, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {MOCK_RESTAURANT.name.toUpperCase()}
          </div>
          <div style={{ fontFamily: fontBody, fontSize: Math.round(width * 0.04), color: BRAND.secondary, marginTop: 6 }}>
            Scan to view our digital menu
          </div>
        </div>

        {/* QR box */}
        <div style={{ position: "relative", background: "white", borderRadius: 28, padding: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", border: `1px solid ${BRAND.outlineVariant}30` }}>
          {/* Corner marks */}
          {(
            [
              { top: 8,    left: 8,  borderTopWidth: 2.5, borderLeftWidth: 2.5,  borderTopLeftRadius: 4                                       } as React.CSSProperties,
              { top: 8,    right: 8, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 4                                      } as React.CSSProperties,
              { bottom: 8, left: 8,  borderBottomWidth: 2.5, borderLeftWidth: 2.5,  borderBottomLeftRadius: 4                                  } as React.CSSProperties,
              { bottom: 8, right: 8, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 4                                 } as React.CSSProperties,
            ] as React.CSSProperties[]
          ).map((corner, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 16,
                height: 16,
                borderColor: BRAND.primaryContainer,
                borderStyle: "solid",
                borderWidth: 0,
                ...corner,
              }}
            />
          ))}
          <QRCode size={qrSize} color={BRAND.onSurface} />
        </div>

        {/* CTA text */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: fontBody, fontWeight: 800, fontSize: Math.round(width * 0.038), color: BRAND.primaryContainer, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Scan to View & Order
          </div>
          <div style={{ fontFamily: fontBody, fontSize: Math.round(width * 0.03), color: BRAND.secondary, marginTop: 4 }}>
            menuzai.com
          </div>
        </div>
      </div>
    </div>
  );
}

