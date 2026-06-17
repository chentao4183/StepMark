import { Group, Arrow, Rect } from "react-konva";
import type { Annotation } from "../../types/annotation";
import { cornerPoint } from "../../geometry/corners";
import { useEditorStore } from "../../store/editorStore";
import RectShape from "./RectShape";
import TextLabelShape from "./TextLabelShape";

interface Props {
  a: Annotation;
  selectable?: boolean;
  onEditText?: (a: Annotation, x: number, y: number) => void;
}

/**
 * The smart annotation is a composite: rect + arrow (from the rect's chosen
 * corner to a label anchor) + optional label. When selectable, the rect itself
 * is draggable and moves the whole annotation (rect + arrow end + label);
 * double-click opens a text editor for the note.
 */
export default function SmartAnnotationGroup({ a, selectable = false, onEditText }: Props) {
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.selectAnnotation);
  const update = useEditorStore((s) => s.updateAnnotation);
  const isSelected = selectable && selectedId === a.id;

  const start = a.rect && a.arrow?.startCorner ? cornerPoint(a.rect, a.arrow.startCorner) : null;

  return (
    <Group
      listening={selectable}
      onClick={() => selectable && select(a.id)}
      onTap={() => selectable && select(a.id)}
      onDblClick={(e) => {
        if (selectable && onEditText && a.arrow) {
          const stage = e.target.getStage();
          const pos = stage?.getPointerPosition();
          onEditText(a, pos?.x ?? a.arrow.endX, pos?.y ?? a.arrow.endY);
        }
      }}
    >
      {/* The rect doubles as the selection + drag handle for the whole group. */}
      {a.rect && (
        <RectShape
          a={a}
          selectable={selectable}
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
      <TextLabelShape a={a} />

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
            update(a.id, {
              rect: { x: a.rect!.x + dx, y: a.rect!.y + dy, width: a.rect!.width, height: a.rect!.height },
              arrow: a.arrow
                ? {
                    ...a.arrow,
                    endX: a.arrow.endX + dx,
                    endY: a.arrow.endY + dy,
                    labelX: (a.arrow.labelX ?? a.arrow.endX) + dx,
                    labelY: (a.arrow.labelY ?? a.arrow.endY) + dy,
                  }
                : a.arrow,
            });
          }}
        />
      )}
    </Group>
  );
}
