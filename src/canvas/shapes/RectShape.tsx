import { Rect } from "react-konva";
import type { Annotation } from "../../types/annotation";

export default function RectShape({ a }: { a: Annotation }) {
  if (!a.rect) return null;
  return (
    <Rect
      x={a.rect.x}
      y={a.rect.y}
      width={a.rect.width}
      height={a.rect.height}
      stroke={a.style.borderColor}
      strokeWidth={a.style.borderWidth}
      listening={false}
    />
  );
}
