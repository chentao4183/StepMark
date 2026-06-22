import {
  labelAnchorFromBoxPosition,
  labelBoxOffset,
  labelBoxPosition as positionLabelBox,
  labelSide,
  labelVerticalAnchor,
} from "./labelBox";
import type { Annotation } from "../types/annotation";

/**
 * Shared smart/text label box math.
 *
 * Extracted so both the TextLabelShape renderer and the number badge
 * placement use the SAME path to compute the rendered visual label box,
 * keeping badge anchor math consistent with where the label is actually drawn.
 */

export interface LabelBoxRect {
  boxX: number;
  boxY: number;
  width: number;
  height: number;
}

export function resolveLabelBox(
  a: Annotation,
  labelX: number,
  labelY: number,
  boxWidth: number,
  boxHeight: number,
): { boxX: number; boxY: number } {
  if (a.rect) {
    const anchor = { x: labelX, y: labelY };
    return positionLabelBox(anchor, labelSide(anchor, a.rect), boxWidth, boxHeight, labelVerticalAnchor(anchor, a.rect));
  }
  if (a.arrow?.startCorner) {
    const off = labelBoxOffset(a.arrow.startCorner, boxWidth, boxHeight);
    return { boxX: labelX + off.dx, boxY: labelY + off.dy };
  }
  return { boxX: labelX, boxY: labelY };
}

export function resolveLabelAnchor(
  a: Annotation,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
): { labelX: number; labelY: number } {
  if (a.rect) {
    const oldAnchor = { x: a.arrow?.endX ?? boxX, y: a.arrow?.endY ?? boxY };
    const anchor = labelAnchorFromBoxPosition(
      { x: boxX, y: boxY },
      labelSide(oldAnchor, a.rect),
      labelVerticalAnchor(oldAnchor, a.rect),
      boxWidth,
      boxHeight,
    );
    return { labelX: anchor.x, labelY: anchor.y };
  }
  if (a.arrow?.startCorner) {
    const off = labelBoxOffset(a.arrow.startCorner, boxWidth, boxHeight);
    return { labelX: boxX - off.dx, labelY: boxY - off.dy };
  }
  return { labelX: boxX, labelY: boxY };
}
