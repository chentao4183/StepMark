import { describe, expect, it } from "vitest";
import { nearestRectEdgePoint } from "./rectEdge";

describe("nearestRectEdgePoint", () => {
  const rect = { x: 100, y: 100, width: 200, height: 80 };

  it("projects an outside point to the nearest edge segment", () => {
    expect(nearestRectEdgePoint(rect, { x: 180, y: 40 })).toEqual({ x: 180, y: 100 });
    expect(nearestRectEdgePoint(rect, { x: 340, y: 150 })).toEqual({ x: 300, y: 150 });
  });

  it("projects outside corner directions to rectangle corners", () => {
    expect(nearestRectEdgePoint(rect, { x: 50, y: 40 })).toEqual({ x: 100, y: 100 });
    expect(nearestRectEdgePoint(rect, { x: 340, y: 240 })).toEqual({ x: 300, y: 180 });
  });

  it("uses the nearest edge when the point is inside the rectangle", () => {
    expect(nearestRectEdgePoint(rect, { x: 140, y: 120 })).toEqual({ x: 140, y: 100 });
    expect(nearestRectEdgePoint(rect, { x: 292, y: 150 })).toEqual({ x: 300, y: 150 });
  });
});
