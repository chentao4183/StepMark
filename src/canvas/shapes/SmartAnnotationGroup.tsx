import { Group, Arrow } from "react-konva";
import type { Annotation } from "../../types/annotation";
import { cornerPoint } from "../../geometry/corners";
import RectShape from "./RectShape";
import TextLabelShape from "./TextLabelShape";

/**
 * The smart annotation is a composite: a rect, an arrow from the rect's
 * chosen corner to a label anchor point, and the label itself.
 *
 * The arrow start is derived from `arrow.startCorner` against the rect, so it
 * stays attached to the rect even if the rect is moved/resized.
 */
export default function SmartAnnotationGroup({ a }: { a: Annotation }) {
  const start =
    a.rect && a.arrow?.startCorner ? cornerPoint(a.rect, a.arrow.startCorner) : null;

  return (
    <Group listening={false}>
      <RectShape a={a} />
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
    </Group>
  );
}
