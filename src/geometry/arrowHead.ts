import { TOOL_STYLE_LIMITS } from "../types/toolStyle";

/**
 * Maps an arrow tool's strokeWidth (1–8) to its arrow head size.
 *
 * The arrow tool exposes a single "thickness" control (strokeWidth) that drives
 * both the line width and the arrow head, so the two scale together instead of
 * being tuned independently. The mapping is linear with integer endpoints:
 *
 *   strokeWidth 1 → head 4   (min)
 *   strokeWidth 8 → head 18  (max)
 *
 * Each step grows the head by 2, so the lookup is exact and round-trip stable.
 */
const HEAD_BY_STROKE: Record<number, number> = {
  1: 4,
  2: 6,
  3: 8,
  4: 10,
  5: 12,
  6: 14,
  7: 16,
  8: 18,
};

export function arrowHeadFromStroke(strokeWidth: number): number {
  const clamped = clampInt(strokeWidth, TOOL_STYLE_LIMITS.strokeWidth.min, TOOL_STYLE_LIMITS.strokeWidth.max);
  return HEAD_BY_STROKE[clamped];
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
