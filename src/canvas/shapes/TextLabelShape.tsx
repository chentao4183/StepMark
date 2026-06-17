import { Rect, Text } from "react-konva";
import type { Annotation } from "../../types/annotation";

const PAD_X = 10;
const PAD_Y = 5;

function measureWidth(text: string, fontSize: number): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text.length * fontSize * 0.6;
  ctx.font = `${fontSize}px system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif`;
  return ctx.measureText(text).width;
}

export default function TextLabelShape({ a }: { a: Annotation }) {
  if (!a.arrow) return null;
  // Empty (or whitespace-only) note → no label, just box + arrow.
  if (a.note === undefined || a.note.trim() === "") return null;

  const text = a.note;
  const labelX = a.arrow.labelX ?? a.arrow.endX;
  const labelY = a.arrow.labelY ?? a.arrow.endY;

  const textWidth = measureWidth(text, a.style.fontSize);
  const boxWidth = Math.max(40, textWidth + PAD_X * 2);
  const boxHeight = a.style.fontSize + PAD_Y * 2;

  // Center the box on the label anchor so it reads as attached to the tip.
  return (
    <>
      <Rect
        x={labelX - boxWidth / 2}
        y={labelY - boxHeight / 2}
        width={boxWidth}
        height={boxHeight}
        fill={a.style.bgColor}
        cornerRadius={4}
        listening={false}
      />
      <Text
        x={labelX - boxWidth / 2 + PAD_X}
        y={labelY - boxHeight / 2 + PAD_Y}
        text={text}
        fill={a.style.textColor}
        fontSize={a.style.fontSize}
        listening={false}
      />
    </>
  );
}
