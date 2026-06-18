import { Group, Rect, Text } from "react-konva";
import type { Annotation } from "../../types/annotation";
import { useEditorStore } from "../../store/editorStore";
import { nearestRectEdgePoint } from "../../geometry/rectEdge";

const PAD_X = 10;
const PAD_Y = 5;

interface Props {
  a: Annotation;
  selectable?: boolean;
  onEditText?: (a: Annotation, x: number, y: number) => void;
}

function measureWidth(text: string, fontSize: number): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text.length * fontSize * 0.6;
  ctx.font = `${fontSize}px system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif`;
  return ctx.measureText(text).width;
}

export default function TextLabelShape({ a, selectable = false, onEditText }: Props) {
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.selectAnnotation);
  const update = useEditorStore((s) => s.updateAnnotation);
  const isSelected = selectable && selectedId === a.id;

  if (!a.arrow) return null;
  // Empty notes intentionally render no label; smart annotations still show
  // their rectangle and arrow.
  if (a.note === undefined || a.note.trim() === "") return null;

  const text = a.note;
  const labelX = a.arrow.labelX ?? a.arrow.endX;
  const labelY = a.arrow.labelY ?? a.arrow.endY;

  const textWidth = measureWidth(text, a.style.fontSize);
  const boxWidth = Math.max(40, textWidth + PAD_X * 2);
  const boxHeight = a.style.fontSize + PAD_Y * 2;
  const { boxX, boxY } = labelBoxPosition(a, labelX, labelY, boxWidth, boxHeight);

  return (
    <Group
      x={boxX}
      y={boxY}
      listening={selectable}
      draggable={isSelected}
      onClick={(e) => {
        if (!selectable) return;
        e.cancelBubble = true;
        select(a.id);
      }}
      onTap={(e) => {
        if (!selectable) return;
        e.cancelBubble = true;
        select(a.id);
      }}
      onDblClick={(e) => {
        if (!selectable || !onEditText) return;
        e.cancelBubble = true;
        onEditText(a, labelX, labelY);
      }}
      onDragEnd={(e) => {
        const { labelX: newLabelX, labelY: newLabelY } = labelAnchorFromBox(a, e.target.x(), e.target.y(), boxWidth, boxHeight);
        const newStart = a.rect ? nearestRectEdgePoint(a.rect, { x: newLabelX, y: newLabelY }) : null;
        e.target.position({ x: boxX, y: boxY });
        update(a.id, {
          arrow: {
            ...a.arrow!,
            startX: newStart?.x ?? a.arrow!.startX,
            startY: newStart?.y ?? a.arrow!.startY,
            endX: newLabelX,
            endY: newLabelY,
            labelX: newLabelX,
            labelY: newLabelY,
          },
        });
      }}
    >
      <Rect
        x={0}
        y={0}
        width={boxWidth}
        height={boxHeight}
        fill={a.style.bgColor}
        cornerRadius={4}
        shadowEnabled={isSelected}
        shadowColor="#00d2ff"
        shadowBlur={10}
        shadowOpacity={0.9}
      />
      <Text
        x={PAD_X}
        y={PAD_Y}
        text={text}
        fill={a.style.textColor}
        fontSize={a.style.fontSize}
        listening={false}
      />
      {isSelected && (
        <Rect
          x={-4}
          y={-4}
          width={boxWidth + 8}
          height={boxHeight + 8}
          stroke="#00d2ff"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Group>
  );
}

function labelBoxPosition(
  a: Annotation,
  labelX: number,
  labelY: number,
  boxWidth: number,
  boxHeight: number,
): { boxX: number; boxY: number } {
  if (a.arrow?.startX !== undefined && a.arrow.startY !== undefined) {
    return { boxX: labelX, boxY: labelY };
  }

  switch (a.arrow?.startCorner) {
    case "tl":
      return { boxX: labelX - boxWidth, boxY: labelY - boxHeight };
    case "tr":
      return { boxX: labelX, boxY: labelY - boxHeight };
    case "bl":
      return { boxX: labelX - boxWidth, boxY: labelY };
    case "br":
      return { boxX: labelX, boxY: labelY };
    default:
      return { boxX: labelX - boxWidth / 2, boxY: labelY - boxHeight / 2 };
  }
}

function labelAnchorFromBox(
  a: Annotation,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
): { labelX: number; labelY: number } {
  if (a.arrow?.startX !== undefined && a.arrow.startY !== undefined) {
    return { labelX: boxX, labelY: boxY };
  }

  switch (a.arrow?.startCorner) {
    case "tl":
      return { labelX: boxX + boxWidth, labelY: boxY + boxHeight };
    case "tr":
      return { labelX: boxX, labelY: boxY + boxHeight };
    case "bl":
      return { labelX: boxX + boxWidth, labelY: boxY };
    case "br":
      return { labelX: boxX, labelY: boxY };
    default:
      return { labelX: boxX + boxWidth / 2, labelY: boxY + boxHeight / 2 };
  }
}
