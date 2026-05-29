import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BRAND, FRAMES } from "../constants";
import { Scene01Intro } from "./Scene01Intro";
import { Scene02PublicMenu } from "./Scene02PublicMenu";
import { Scene03AiWaiter } from "./Scene03AiWaiter";
import { Scene04Dashboard } from "./Scene04Dashboard";
import { Scene05QROutro } from "./Scene05QROutro";

// Cross-dissolve: last 30 frames of each scene fade to white, first 30 of next fade from white
function CrossDissolve({ atFrame, duration = 30 }: { atFrame: number; duration?: number }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [atFrame - duration, atFrame, atFrame + duration],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  if (opacity === 0) return null;
  return (
    <AbsoluteFill style={{ background: BRAND.surface, opacity, pointerEvents: "none" }} />
  );
}

export function MainVideo() {
  return (
    <AbsoluteFill style={{ background: BRAND.surface }}>
      <Sequence from={FRAMES.INTRO_START} durationInFrames={FRAMES.INTRO_END - FRAMES.INTRO_START + 30}>
        <Scene01Intro />
      </Sequence>

      <Sequence from={FRAMES.MENU_START - 15} durationInFrames={FRAMES.MENU_END - FRAMES.MENU_START + 30}>
        <Scene02PublicMenu />
      </Sequence>

      <Sequence from={FRAMES.CHAT_START - 15} durationInFrames={FRAMES.CHAT_END - FRAMES.CHAT_START + 30}>
        <Scene03AiWaiter />
      </Sequence>

      <Sequence from={FRAMES.DASH_START - 15} durationInFrames={FRAMES.DASH_END - FRAMES.DASH_START + 30}>
        <Scene04Dashboard />
      </Sequence>

      <Sequence from={FRAMES.QR_START - 15} durationInFrames={FRAMES.QR_END - FRAMES.QR_START}>
        <Scene05QROutro />
      </Sequence>

      {/* Dissolves between scenes */}
      <CrossDissolve atFrame={FRAMES.INTRO_END} />
      <CrossDissolve atFrame={FRAMES.MENU_END} />
      <CrossDissolve atFrame={FRAMES.CHAT_END} />
      <CrossDissolve atFrame={FRAMES.DASH_END} />
    </AbsoluteFill>
  );
}

