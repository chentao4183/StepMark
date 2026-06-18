import type { Corner, Rect } from "../types/annotation";
import { cornerPoint } from "./corners";

export interface Point {
  x: number;
  y: number;
}

export const MIN_ARROW_LEN = 90; // px - keep the arrow visible even on a short drag
export const LABEL_GAP = 16; // px - distance from arrow tip to the label box anchor

/**
 * Compute the arrow's end point: take the click point, but if it lies too close
 * to the chosen rect corner, extend it along the corner→click direction so the
 * arrow is at least MIN_ARROW_LEN long. This prevents the "stubby arrow"
 * problem when the user clicks near the box.
 */
export function resolveArrowEnd(corner: Point, click: Point): Point {
  const dx = click.x - corner.x;
  const dy = click.y - corner.y;
  const len = Math.hypot(dx, dy);
  if (len >= MIN_ARROW_LEN || len === 0) {
    return { x: click.x, y: click.y };
  }
  const scale = MIN_ARROW_LEN / len;
  return { x: corner.x + dx * scale, y: corner.y + dy * scale };
}

/**
 * Compute the label's anchor point, offset outward from the arrow tip so the
 * label never overlaps the arrowhead. The label sits just past the tip in the
 * same direction the arrow is traveling.
 */
export function resolveLabelAnchor(corner: Point, tip: Point): Point {
  const dx = tip.x - corner.x;
  const dy = tip.y - corner.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return { x: tip.x + ux * LABEL_GAP, y: tip.y + uy * LABEL_GAP };
}

/** Convenience: end + anchor from a rect corner id + click. */
export function layoutSmartArrow(
  rect: Rect,
  corner: Corner,
  click: Point,
): { end: Point; label: Point } {
  const cornerPt = cornerPoint(rect, corner);
  const end = resolveArrowEnd(cornerPt, click);
  const label = resolveLabelAnchor(cornerPt, end);
  return { end, label };
}
