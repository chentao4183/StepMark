/**
 * Canvas-based text measurement helper shared by number badge rendering.
 *
 * Kept separate from the pure geometry module so geometry stays testable
 * without a DOM, while this file owns the only `document` dependency.
 */
import { labelFontFamily } from "./labelMetrics";

export function measureBadgeTextWidth(text: string, fontSize: number): number {
  if (typeof document === "undefined") return text.length * fontSize * 0.6;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text.length * fontSize * 0.6;
  ctx.font = `${fontSize}px ${labelFontFamily(undefined)}`;
  return ctx.measureText(text).width;
}
