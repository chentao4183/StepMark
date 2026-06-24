import { describe, expect, it } from "vitest";
import { arrowHeadFromStroke } from "./arrowHead";

describe("arrowHeadFromStroke", () => {
  it("maps the full strokeWidth range to the agreed endpoints", () => {
    expect(arrowHeadFromStroke(1)).toBe(4);
    expect(arrowHeadFromStroke(8)).toBe(18);
  });

  it("grows the head by exactly 2 per step (linear integer map)", () => {
    expect(arrowHeadFromStroke(1)).toBe(4);
    expect(arrowHeadFromStroke(2)).toBe(6);
    expect(arrowHeadFromStroke(3)).toBe(8);
    expect(arrowHeadFromStroke(4)).toBe(10);
    expect(arrowHeadFromStroke(5)).toBe(12);
    expect(arrowHeadFromStroke(6)).toBe(14);
    expect(arrowHeadFromStroke(7)).toBe(16);
    expect(arrowHeadFromStroke(8)).toBe(18);
  });

  it("clamps out-of-range values to the endpoints", () => {
    expect(arrowHeadFromStroke(0)).toBe(4);
    expect(arrowHeadFromStroke(-5)).toBe(4);
    expect(arrowHeadFromStroke(9)).toBe(18);
    expect(arrowHeadFromStroke(100)).toBe(18);
  });
});
