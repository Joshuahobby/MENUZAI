import { BRAND } from "../../constants";

interface TypingDotsProps {
  frame: number;
  opacity?: number;
}

export function TypingDots({ frame, opacity = 1 }: TypingDotsProps) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", opacity }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "12px 16px",
          borderRadius: 20,
          borderTopLeftRadius: 4,
          background: BRAND.surfaceContainerLow,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: BRAND.secondary,
              opacity: 0.5,
              transform: `translateY(${Math.sin((frame + i * 8) * 0.35) * 4}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

