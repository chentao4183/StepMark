import { Group, Arrow, Rect } from "react-konva";
import type { Annotation } from "../../types/annotation";
import { cornerPoint } from "../../geometry/corners";
import { useEditorStore } from "../../store/editorStore";
import TextLabelShape from "./TextLabelShape";

interface Props {
  a: Annotation;
  selectable?: boolean;
  onEditText?: (a: Annotation, x: number, y: number) => void;
}

/**
 * The smart annotation is a composite: rect + arrow (from the rect edge to a
 * label anchor) + optional label. When selectable, the rect itself is
 * draggable and moves the whole annotation (rect + arrow + label);
 * double-click opens a text editor for the note.
 */
export default function SmartAnnotationGroup({ a, selectable = false, onEditText }: Props) {
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.selectAnnotation);
  const update = useEditorStore((s) => s.updateAnnotation);
  const isSelected = selectable && selectedId === a.id;

  const start =
    a.arrow?.startX !== undefined && a.arrow?.startY !== undefined
      ? { x: a.arrow.startX, y: a.arrow.startY }
      : a.rect && a.arrow?.startCorner
        ? cornerPoint(a.rect, a.arrow.startCorner)
        : null;

  return (
    <Group
      listening={selectable}
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
        e.cancelBubble = true;
        if (selectable && onEditText && a.arrow) {
          const stage = e.target.getStage();
          const pos = stage?.getPointerPosition();
          onEditText(a, pos?.x ?? a.arrow.endX, pos?.y ?? a.arrow.endY);
        }
      }}
    >
      {a.rect && (
        <Rect
          x={a.rect.x}
          y={a.rect.y}
          width={a.rect.width}
          height={a.rect.height}
          stroke={a.style.borderColor}
          strokeWidth={a.style.borderWidth}
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
          onDragEnd={(e) => {
            const dx = e.target.x() - a.rect!.x;
            const dy = e.target.y() - a.rect!.y;
            moveWholeAnnotation(dx, dy);
          }}
          shadowEnabled={isSelected}
          shadowColor="#00d2ff"
          shadowBlur={10}
          shadowOpacity={0.9}
        />
      )}
      {a.arrow && start && (
        <Arrow
          points={[start.x, start.y, a.arrow.endX, a.arrow.endY]}
          stroke={a.style.borderColor}
          strokeWidth={a.style.borderWidth}
          fill={a.style.borderColor}
          pointerLength={10}
          pointerWidth={10}
          listening={false}
        />
      )}
      <TextLabelShape a={a} selectable={selectable} onEditText={onEditText} />

      {/* Move-whole-annotation drag: an invisible hit rect over the box, only
          when selected. The per-shape RectShape already handles its own drag,
          but for the smart group we want drag to move rect + arrow + label
          together, so we override with this dedicated handle. */}
      {isSelected && a.rect && (
        <Rect
          x={a.rect.x}
          y={a.rect.y}
          width={a.rect.width}
          height={a.rect.height}
          fill="rgba(0,0,0,0.001)"
          draggable
          onDragEnd={(e) => {
            const dx = e.target.x();
            const dy = e.target.y();
            e.target.x(0);
            e.target.y(0);
            moveWholeAnnotation(dx, dy);
          }}
        />
      )}
    </Group>
  );

  function moveWholeAnnotation(dx: number, dy: number) {
    update(a.id, {
      rect: a.rect
        ? { x: a.rect.x + dx, y: a.rect.y + dy, width: a.rect.width, height: a.rect.height }
        : a.rect,
      arrow: a.arrow
        ? {
            ...a.arrow,
            startX: a.arrow.startX === undefined ? a.arrow.startX : a.arrow.startX + dx,
            startY: a.arrow.startY === undefined ? a.arrow.startY : a.arrow.startY + dy,
            endX: a.arrow.endX + dx,
            endY: a.arrow.endY + dy,
            labelX: (a.arrow.labelX ?? a.arrow.endX) + dx,
            labelY: (a.arrow.labelY ?? a.arrow.endY) + dy,
          }
        : a.arrow,
    });
  }
}
