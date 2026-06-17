import { Rect, Text } from "react-konva";
import type { Annotation } from "../../types/annotation";

export default function TextLabelShape({ a }: { a: Annotation }) {
  if (!a.arrow || a.note === undefined) return null;
  const padX = 12;
  const padY = 5;
  const text = a.note || "";
  // Approximate width: char count * fontSize * 0.6
  const approxWidth = Math.max(40, text.length * a.style.fontSize * 0.6 + padX * 2);
  const height = a.style.fontSize + padY * 2;

  // Anchor at arrow end; put the label above-right of the end point (MVP simplicity).
  const labelX = a.arrow.endX;
  const labelY = a.arrow.endY - height;

  return (
    <>
      <Rect
        x={labelX}
        y={labelY}
        width={approxWidth}
        height={height}
        fill={a.style.bgColor}
        cornerRadius={4}
        listening={false}
      />
      <Text
        x={labelX + padX}
        y={labelY + padY}
        text={text}
        fill={a.style.textColor}
        fontSize={a.style.fontSize}
        listening={false}
      />
    </>
  );
}
