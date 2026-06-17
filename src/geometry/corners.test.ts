import { describe, it, expect } from "vitest";
import { nearestCorner, cornerPoint } from "./corners";

describe("nearestCorner", () => {
  const rect = { x: 100, y: 100, width: 200, height: 100 };

  it("returns tl when pointer is near top-left", () => {
    expect(nearestCorner(rect, { x: 110, y: 110 })).toBe("tl");
  });

  it("returns tr when pointer is near top-right", () => {
    expect(nearestCorner(rect, { x: 290, y: 105 })).toBe("tr");
  });

  it("returns bl when pointer is near bottom-left", () => {
    expect(nearestCorner(rect, { x: 105, y: 195 })).toBe("bl");
  });

  it("returns br when pointer is near bottom-right", () => {
    expect(nearestCorner(rect, { x: 295, y: 195 })).toBe("br");
  });

  it("returns the strictly nearest corner on a tie-adjacent case", () => {
    // pointer slightly above-right of center is closest to tr
    expect(nearestCorner(rect, { x: 250, y: 110 })).toBe("tr");
  });
});

describe("cornerPoint", () => {
  it("computes each corner", () => {
    const rect = { x: 10, y: 20, width: 30, height: 40 };
    expect(cornerPoint(rect, "tl")).toEqual({ x: 10, y: 20 });
    expect(cornerPoint(rect, "tr")).toEqual({ x: 40, y: 20 });
    expect(cornerPoint(rect, "bl")).toEqual({ x: 10, y: 60 });
    expect(cornerPoint(rect, "br")).toEqual({ x: 40, y: 60 });
  });
});
