import React from "react";

interface PhoneFrameProps {
  children: React.ReactNode;
  width?: number;
}

// iPhone 15 Pro proportions: 390Ã—844 logical, frame adds ~20px each side
// We render at a fixed logical size and let the parent scale
export function PhoneFrame({ children, width = 390 }: PhoneFrameProps) {
  const height = Math.round(width * (844 / 390));
  const frameThickness = Math.round(width * 0.045);
  const borderRadius = Math.round(width * 0.13);
  const innerRadius = borderRadius - frameThickness;

  return (
    <div
      style={{
        width: width + frameThickness * 2,
        height: height + frameThickness * 2,
        borderRadius,
        background: "linear-gradient(135deg, #2a2a2e 0%, #1a1a1e 50%, #2a2a2e 100%)",
        padding: frameThickness,
        boxShadow:
          "0 0 0 1px #3a3a3e, 0 40px 80px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Side buttons */}
      <div style={{ position: "absolute", left: -3, top: "22%", width: 3, height: 36, borderRadius: "3px 0 0 3px", background: "#2a2a2e" }} />
      <div style={{ position: "absolute", left: -3, top: "32%", width: 3, height: 60, borderRadius: "3px 0 0 3px", background: "#2a2a2e" }} />
      <div style={{ position: "absolute", left: -3, top: "42%", width: 3, height: 60, borderRadius: "3px 0 0 3px", background: "#2a2a2e" }} />
      <div style={{ position: "absolute", right: -3, top: "30%", width: 3, height: 80, borderRadius: "0 3px 3px 0", background: "#2a2a2e" }} />

      {/* Inner screen */}
      <div
        style={{
          width,
          height,
          borderRadius: innerRadius,
          overflow: "hidden",
          position: "relative",
          background: "#fcf9f8",
        }}
      >
        {/* Dynamic Island */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 120,
            height: 34,
            borderRadius: 20,
            background: "#000",
            zIndex: 100,
          }}
        />

        {/* Content */}
        <div style={{ width: "100%", height: "100%", overflowY: "hidden", overflowX: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

