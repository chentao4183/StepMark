import type { Rect } from "../types/annotation";
import type { Point } from "./corners";

export function nearestRectEdgePoint(rect: Rect, p: Point): Point {
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;
  const clampedX = clamp(p.x, left, right);
  const clampedY = clamp(p.y, top, bottom);

  const outside = p.x < left || p.x > right || p.y < top || p.y > bottom;
  if (outside) {
    return { x: clampedX, y: clampedY };
  }

  const distances = [
    { edge: "left" as const, d: Math.abs(p.x - left) },
    { edge: "right" as const, d: Math.abs(right - p.x) },
    { edge: "top" as const, d: Math.abs(p.y - top) },
    { edge: "bottom" as const, d: Math.abs(bottom - p.y) },
  ];
  const nearest = distances.reduce((best, item) => (item.d < best.d ? item : best), distances[0]);

  switch (nearest.edge) {
    case "left":
      return { x: left, y: p.y };
    case "right":
      return { x: right, y: p.y };
    case "top":
      return { x: p.x, y: top };
    case "bottom":
      return { x: p.x, y: bottom };
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
