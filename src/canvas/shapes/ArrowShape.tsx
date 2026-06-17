import { Arrow } from "react-konva";
import type { Annotation } from "../../types/annotation";

export default function ArrowShape({ a }: { a: Annotation }) {
  if (!a.arrow) return null;
  const start =
    a.arrow.startX !== undefined && a.arrow.startY !== undefined
      ? { x: a.arrow.startX, y: a.arrow.startY }
      : null;

  // For the 'smart' tool the arrow start is resolved from the rect corner elsewhere;
  // here we only render when we have an explicit start (the standalone 'arrow' tool) or
  // we degrade to a zero-length arrow so the shape still occupies the end point.
  const points = start
    ? [start.x, start.y, a.arrow.endX, a.arrow.endY]
    : [a.arrow.endX, a.arrow.endY, a.arrow.endX, a.arrow.endY];

  return (
    <Arrow
      points={points}
      stroke={a.style.borderColor}
      strokeWidth={a.style.borderWidth}
      fill={a.style.borderColor}
      pointerLength={10}
      pointerWidth={10}
      listening={false}
    />
  );
}
