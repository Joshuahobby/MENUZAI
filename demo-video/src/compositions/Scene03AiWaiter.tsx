import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring } from "remotion";
import { BRAND, MOCK_ITEMS } from "../constants";
import { fontHeadline, fontBody } from "../utils/fonts";
import { PhoneFrame } from "../components/ui/PhoneFrame";
import { MenuHeader } from "../components/menu/MenuHeader";
import { ChatModal } from "../components/chat/ChatModal";
import { ChatBubble } from "../components/chat/ChatBubble";
import { TypingDots } from "../components/chat/TypingDots";
import { OrderConfirmCard } from "../components/chat/OrderConfirmCard";
import { fadeIn, streamText } from "../utils/springs";

const PHONE_WIDTH = 360;
const AI_RESPONSE = "Perfect choice! Truffle Ribeye + Molten Lava Cake is a stunning combination. Shall I place that order for Table 7?";

const ORDER_ITEMS = [
  { name: "Truffle Ribeye Steak", qty: 1, price: MOCK_ITEMS[0].price },
  { name: "Molten Lava Cake",     qty: 1, price: MOCK_ITEMS[2].price },
];

export function Scene03AiWaiter() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Overlay fade
  const overlayOpacity = interpolate(frame, [0, 30], [0, 0.45], { extrapolateRight: "clamp" });

  // Chat sheet slides up
  const sheetSpring = spring({ fps, frame: Math.max(0, frame - 0), config: { damping: 22, stiffness: 90 } });
  const sheetY = interpolate(sheetSpring, [0, 1], [650, 0]);

  // Message timing
  const msg1Opacity  = fadeIn(frame, 60, 20);
  const msg1X        = interpolate(frame, [60, 80], [-20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const msg2Opacity  = fadeIn(frame, 120, 20);
  const msg2X        = interpolate(frame, [120, 140], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const typingOpacity = interpolate(frame, [170, 185, 260, 275], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const aiText       = streamText(frame, 275, 370, AI_RESPONSE);
  const aiOpacity    = fadeIn(frame, 270, 20);
  const cardY        = interpolate(spring({ fps, frame: Math.max(0, frame - 380), config: { damping: 18 } }), [0, 1], [40, 0]);
  const cardOpacity  = fadeIn(frame, 380, 20);
  const confirmed    = frame >= 480;
  const finalOpacity = fadeIn(frame, 510, 20);
  const finalX       = interpolate(frame, [510, 530], [-20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${BRAND.surface} 0%, ${BRAND.surfaceContainerLow} 100%)` }}>
      {/* Right copy */}
      <div style={{ position: "absolute", right: 100, top: "50%", transform: "translateY(-50%)", width: 400, opacity: fadeIn(frame, 0, 30) }}>
        <div style={{ fontFamily: fontBody, fontWeight: 700, fontSize: 12, color: BRAND.primaryContainer, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
          AI Digital Waiter
        </div>
        <div style={{ fontFamily: fontHeadline, fontWeight: 800, fontSize: 48, color: BRAND.onSurface, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Orders itself.<br />
          <span style={{ color: BRAND.primaryContainer }}>Every table.</span>
        </div>
        <div style={{ fontFamily: fontBody, fontSize: 18, color: BRAND.secondary, marginTop: 16, lineHeight: 1.6 }}>
          The AI greets guests, suggests dishes, upsells naturally, and places the order -- no staff needed.
        </div>

        {/* Feature list */}
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12, opacity: fadeIn(frame, 60, 30) }}>
          {["Works every table simultaneously", "Upsells automatically -- avg +22% order value", "Sends order to kitchen instantly"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: BRAND.tertiaryContainer, flexShrink: 0 }} />
              <span style={{ fontFamily: fontBody, fontSize: 15, color: BRAND.secondary }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phone */}
      <div style={{ position: "absolute", left: 160, top: "50%", transform: "translateY(-50%)" }}>
        <PhoneFrame width={PHONE_WIDTH}>
          <div style={{ width: "100%", height: "100%", background: BRAND.surface, position: "relative", overflow: "hidden" }}>
            {/* Background menu (blurred) */}
            <MenuHeader />

            {/* Overlay */}
            <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})`, zIndex: 10 }} />

            {/* Chat Modal */}
            <ChatModal translateY={sheetY}>
              {frame >= 60 && (
                <ChatBubble role="assistant" text="Hello! I'm your digital server for Le Bistro. What can I get you today?" opacity={msg1Opacity} translateX={msg1X} />
              )}
              {frame >= 120 && (
                <ChatBubble role="user" text="I'd love the steak and a dessert" opacity={msg2Opacity} translateX={msg2X} />
              )}
              {frame >= 170 && frame < 280 && (
                <TypingDots frame={frame} opacity={typingOpacity} />
              )}
              {frame >= 270 && (
                <ChatBubble role="assistant" text={aiText} opacity={aiOpacity} />
              )}
              {frame >= 380 && (
                <OrderConfirmCard
                  items={ORDER_ITEMS}
                  tableNumber="7"
                  confirmed={confirmed}
                  opacity={cardOpacity}
                  translateY={cardY}
                />
              )}
              {frame >= 510 && (
                <ChatBubble role="assistant" text="Your order is heading to the kitchen! Enjoy, Table 7" opacity={finalOpacity} translateX={finalX} />
              )}
            </ChatModal>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
}

