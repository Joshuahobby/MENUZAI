import { BRAND } from "../../constants";
import { fontBody } from "../../utils/fonts";
import { RobotIcon } from "../../components/ui/Icons";
import { pulse } from "../../utils/springs";

interface AIFabProps {
  frame: number;
  scale?: number;
  opacity?: number;
  showTooltip?: boolean;
}

export function AIFab({ frame, scale = 1, opacity = 1, showTooltip = false }: AIFabProps) {
  const dotScale = pulse(frame, 0.5, 0.1);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", flexDirection: "column", alignSelf: "flex-end" }}>
      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            background: BRAND.onSurface,
            color: "white",
            borderRadius: 12,
            padding: "6px 12px",
            fontFamily: fontBody,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            marginBottom: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}
        >
          AI Digital Waiter â€” tap me! âœ¨
        </div>
      )}

      {/* FAB */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryContainer})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 8px 24px ${BRAND.primaryContainer}50`,
          transform: `scale(${scale})`,
          opacity,
          position: "relative",
        }}
      >
        <RobotIcon size={28} color="white" />
        {/* Pulse dot */}
        <div
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 14,
            height: 14,
            borderRadius: 7,
            background: BRAND.tertiaryContainer,
            border: "2px solid white",
            transform: `scale(${dotScale})`,
          }}
        />
      </div>
    </div>
  );
}

