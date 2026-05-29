import { spring, interpolate } from "remotion";
import type { SpringConfig } from "remotion";

export const SPRING_ENTRANCE: SpringConfig = { damping: 15, stiffness: 120, mass: 1, overshootClamping: false };
export const SPRING_BOUNCE: SpringConfig   = { damping: 12, stiffness: 150, mass: 1, overshootClamping: false };
export const SPRING_SLOW: SpringConfig     = { damping: 25, stiffness: 60,  mass: 1, overshootClamping: false };

export function entranceY(frame: number, delay: number, fps: number, distance = 40): number {
  const s = spring({ fps, frame: Math.max(0, frame - delay), config: SPRING_ENTRANCE });
  return interpolate(s, [0, 1], [distance, 0]);
}

export function entranceX(frame: number, delay: number, fps: number, distance = 40): number {
  const s = spring({ fps, frame: Math.max(0, frame - delay), config: SPRING_ENTRANCE });
  return interpolate(s, [0, 1], [distance, 0]);
}

export function scaleIn(frame: number, delay: number, fps: number, from = 0.8): number {
  const s = spring({ fps, frame: Math.max(0, frame - delay), config: SPRING_BOUNCE });
  return interpolate(s, [0, 1], [from, 1]);
}

export function fadeIn(frame: number, delay: number, duration = 20): number {
  return interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function fadeOut(frame: number, start: number, duration = 20): number {
  return interpolate(frame, [start, start + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function stagger(frame: number, startFrame: number, index: number, fps: number, gap = 18) {
  const f = Math.max(0, frame - startFrame - index * gap);
  const s = spring({ fps, frame: f, config: SPRING_ENTRANCE });
  return {
    opacity: interpolate(s, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
    translateY: interpolate(s, [0, 1], [30, 0]),
    scale: interpolate(s, [0, 1], [0.95, 1]),
  };
}

export function pulse(frame: number, amplitude = 0.3, speed = 0.14): number {
  return 1 + Math.abs(Math.sin(frame * speed)) * amplitude;
}

export function streamText(frame: number, startFrame: number, endFrame: number, content: string): string {
  const count = Math.floor(
    interpolate(frame, [startFrame, endFrame], [0, content.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  return content.slice(0, count);
}

export function springProgress(frame: number, delay: number, fps: number, config: SpringConfig = SPRING_SLOW): number {
  return spring({ fps, frame: Math.max(0, frame - delay), config });
}

