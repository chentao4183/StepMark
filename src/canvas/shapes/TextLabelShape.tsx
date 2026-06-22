import { Fragment } from "react";
import { Group, Rect, Text } from "react-konva";
import { smartArrowStart } from "../../geometry/arrowAnchor";
import { measureNumberBadge, textBadgeBox } from "../../geometry/numberBadge";
import { resolveLabelAnchor, resolveLabelBox } from "../../geometry/smartLabelBox";
import { useEditorStore } from "../../store/editorStore";
import { useNumberingStore } from "../../store/numberingStore";
import type { Annotation } from "../../types/annotation";
import { measureBadgeTextWidth } from "../badgeText";
import { LABEL_PAD_X, LABEL_PAD_Y, labelBoxSize } from "../labelMetrics";
import NumberBadgeShape from "./NumberBadgeShape";

interface Props {
  a: Annotation;
  selectable?: boolean;
  onEditText?: (a: Annotation, x: number, y: number) => void;
}

export default function TextLabelShape({ a, selectable = false, onEditText }: Props) {
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.selectAnnotation);
  const update = useEditorStore((s) => s.updateAnnotation);
  const crop = useEditorStore((s) => s.cropRegion);
  const textPlacement = useNumberingStore((s) => s.settings.positionByTool.text);
  const isSelected = selectable && selectedId === a.id;

  if (!a.arrow) return null;
  if (a.note === undefined || a.note.trim() === "") return null;

  const text = a.note;
  const labelX = a.arrow.labelX ?? a.arrow.endX;
  const labelY = a.arrow.labelY ?? a.arrow.endY;
  const { width: boxWidth, height: boxHeight } = labelBoxSize(text, a.style, a.fontFamily);
  const { boxX, boxY } = resolveLabelBox(a, labelX, labelY, boxWidth, boxHeight);

  // Badge for standalone text annotations only. Smart annotations render their
  // badge inside SmartAnnotationGroup so placement can follow the smart anchor.
  const badgeBox =
    a.type === "text" && a.numberBadge
      ? (() => {
          const size = measureNumberBadge(a.numberBadge!.value, a.numberBadge!.style, measureBadgeTextWidth);
          return textBadgeBox({ x: boxX, y: boxY, width: boxWidth, height: boxHeight }, size, textPlacement, crop);
        })()
      : null;

  return (
    <Fragment>
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
          const { labelX: newLabelX, labelY: newLabelY } = resolveLabelAnchor(a, e.target.x(), e.target.y(), boxWidth, boxHeight);
          e.target.position({ x: boxX, y: boxY });
          const nextStart = a.rect ? smartArrowStart(a.shape ?? "rect", a.rect, { x: newLabelX, y: newLabelY }) : null;
          update(a.id, {
            arrow: {
              ...a.arrow!,
              startCorner: a.rect ? undefined : a.arrow!.startCorner,
              startX: nextStart?.x,
              startY: nextStart?.y,
              endX: newLabelX,
              endY: newLabelY,
              labelX: newLabelX,
              labelY: newLabelY,
            },
          });
        }}
      >
        {a.type !== "text" && (
          <Rect x={0} y={0} width={boxWidth} height={boxHeight} fill={a.style.bgColor} cornerRadius={4} />
        )}
        <Text
          x={LABEL_PAD_X}
          y={LABEL_PAD_Y}
          text={text}
          fill={a.style.textColor}
          fontSize={a.style.fontSize}
          fontFamily={a.fontFamily || undefined}
          listening={false}
        />
        {isSelected && (
          <Rect
            x={-4}
            y={-4}
            width={boxWidth + 8}
            height={boxHeight + 8}
            stroke="#1e90ff"
            strokeWidth={1}
            dash={[4, 4]}
            listening={false}
          />
        )}
      </Group>
      {badgeBox && a.numberBadge && <NumberBadgeShape badge={a.numberBadge} box={badgeBox} />}
    </Fragment>
  );
}
