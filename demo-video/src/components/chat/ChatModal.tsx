import React from "react";
import { BRAND } from "../../constants";
import { fontHeadline, fontBody } from "../../utils/fonts";
import { RobotIcon, SendIcon } from "../../components/ui/Icons";

interface ChatModalProps {
  children: React.ReactNode;
  translateY?: number;
  opacity?: number;
}

export function ChatModal({ children, translateY = 0, opacity = 1 }: ChatModalProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      {/* Orange Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryContainer})`,
          padding: "56px 20px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <RobotIcon size={22} color="white" />
        </div>
        <div>
          <div style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 15, color: "white", letterSpacing: "-0.01em" }}>
            AI Digital Waiter
          </div>
          <div style={{ fontFamily: fontBody, fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>
            Powered by MENUZA AI
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          background: BRAND.surfaceContainerLowest,
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          overflow: "hidden",
        }}
      >
        {children}
      </div>

      {/* Input bar */}
      <div
        style={{
          background: BRAND.surface,
          borderTop: `1px solid ${BRAND.outlineVariant}30`,
          padding: "10px 14px 14px",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            background: BRAND.surfaceContainerLow,
            borderRadius: 16,
            padding: "10px 14px",
            fontFamily: fontBody,
            fontSize: 12,
            color: BRAND.secondary,
          }}
        >
          Ask me anything about the menuâ€¦
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: BRAND.primaryContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <SendIcon size={16} color="white" />
        </div>
      </div>
    </div>
  );
}

