import { describe, it, expect } from "vitest";
import { resolveArrowEnd, resolveLabelAnchor, layoutSmartArrow, MIN_ARROW_LEN, LABEL_GAP } from "./arrowLayout";

describe("resolveArrowEnd", () => {
  it("keeps the click point when it is far enough", () => {
    const corner = { x: 0, y: 0 };
    const click = { x: 100, y: 100 };
    expect(resolveArrowEnd(corner, click)).toEqual(click);
  });

  it("extends a too-close click to the minimum length, same direction", () => {
    const corner = { x: 0, y: 0 };
    const click = { x: 3, y: 4 }; // length 5
    const end = resolveArrowEnd(corner, click);
    expect(Math.hypot(end.x, end.y)).toBeCloseTo(MIN_ARROW_LEN, 5);
    // same direction ratio as the original click
    expect(end.x / end.y).toBeCloseTo(3 / 4, 5);
  });

  it("returns the click unchanged when length is zero (degenerate)", () => {
    expect(resolveArrowEnd({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({ x: 5, y: 5 });
  });
});

describe("resolveLabelAnchor", () => {
  it("places the label beyond the tip in the arrow direction", () => {
    const corner = { x: 0, y: 0 };
    const tip = { x: 60, y: 0 }; // arrow pointing right
    const label = resolveLabelAnchor(corner, tip);
    expect(label.x).toBeCloseTo(60 + LABEL_GAP, 5);
    expect(label.y).toBeCloseTo(0, 5);
  });
});

describe("layoutSmartArrow", () => {
  it("chains end + label resolution off a rect corner", () => {
    const rect = { x: 100, y: 100, width: 200, height: 100 };
    const out = layoutSmartArrow(rect, "tr", { x: 310, y: 105 });
    // tr corner is (300,100); click (310,105) is length ~11 → extended to 60
    const corner = { x: 300, y: 100 };
    expect(Math.hypot(out.end.x - corner.x, out.end.y - corner.y)).toBeGreaterThanOrEqual(MIN_ARROW_LEN - 0.5);
    // label is further out than the tip
    expect(Math.hypot(out.label.x - corner.x, out.label.y - corner.y)).toBeGreaterThan(
      Math.hypot(out.end.x - corner.x, out.end.y - corner.y),
    );
  });
});
