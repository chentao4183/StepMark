import { Group, Rect, Text } from "react-konva";
import type { Annotation } from "../../types/annotation";
import { useEditorStore } from "../../store/editorStore";
import { nearestCorner } from "../../geometry/corners";
import { labelBoxOffset } from "../../geometry/labelBox";

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
        e.target.position({ x: boxX, y: boxY });
        update(a.id, {
          arrow: {
            ...a.arrow!,
            // Smart annotation: re-pick the nearest rect corner to the new label
            // position and rebind the arrow origin to that corner (spec §5.2/§5.3
            // stay consistent after a drag). Keep the corner id as the source of
            // truth; standalone arrows fall back to their stored absolute coords.
            startCorner: a.rect ? nearestCorner(a.rect, { x: newLabelX, y: newLabelY }) : a.arrow!.startCorner,
            startX: undefined,
            startY: undefined,
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
  // Smart annotations store startCorner; the label extends away from the rect
  // per spec §5.3. Standalone arrows have no rect/corner, so the anchor is the
  // box's top-left (label extends down-right from the click point).
  if (a.arrow?.startCorner) {
    const off = labelBoxOffset(a.arrow.startCorner, boxWidth, boxHeight);
    return { boxX: labelX + off.dx, boxY: labelY + off.dy };
  }
  return { boxX: labelX, boxY: labelY };
}

function labelAnchorFromBox(
  a: Annotation,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
): { labelX: number; labelY: number } {
  // Inverse of labelBoxPosition: recover the anchor (endX,endY) from the box's
  // current top-left.
  if (a.arrow?.startCorner) {
    const off = labelBoxOffset(a.arrow.startCorner, boxWidth, boxHeight);
    return { labelX: boxX - off.dx, labelY: boxY - off.dy };
  }
  return { labelX: boxX, labelY: boxY };
}
