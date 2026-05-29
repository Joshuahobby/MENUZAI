import { BRAND } from "../../constants";
import { fontBody } from "../../utils/fonts";

interface ChatBubbleProps {
  text: string;
  role: "user" | "assistant";
  opacity?: number;
  translateX?: number;
}

export function ChatBubble({ text, role, opacity = 1, translateX = 0 }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <div
        style={{
          maxWidth: "82%",
          padding: "12px 16px",
          borderRadius: 20,
          ...(isUser
            ? { borderTopRightRadius: 4, background: BRAND.primaryContainer, color: "white" }
            : { borderTopLeftRadius: 4, background: BRAND.surfaceContainerLow, color: BRAND.onSurface }),
          fontFamily: fontBody,
          fontSize: 13,
          lineHeight: 1.5,
          boxShadow: isUser ? `0 2px 12px ${BRAND.primaryContainer}40` : "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

