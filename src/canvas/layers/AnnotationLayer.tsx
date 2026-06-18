import { Layer } from "react-konva";
import { useEditorStore } from "../../store/editorStore";
import RectShape from "../shapes/RectShape";
import ArrowShape from "../shapes/ArrowShape";
import TextLabelShape from "../shapes/TextLabelShape";
import MosaicShape from "../shapes/MosaicShape";
import SmartAnnotationGroup from "../shapes/SmartAnnotationGroup";
import type { Annotation, Rect } from "../../types/annotation";

interface Props {
  selectable?: boolean;
  onEditText?: (a: Annotation, x: number, y: number) => void;
  crop: Rect;
}

export default function AnnotationLayer({ selectable = false, onEditText, crop }: Props) {
  const annotations = useEditorStore((s) => s.annotations);

  return (
    <Layer clipX={crop.x} clipY={crop.y} clipWidth={crop.width} clipHeight={crop.height}>
      {annotations.map((a) => {
        switch (a.type) {
          case "smart":
            return <SmartAnnotationGroup key={a.id} a={a} selectable={selectable} onEditText={onEditText} />;
          case "rect":
            return <RectShape key={a.id} a={a} selectable={selectable} />;
          case "arrow":
            return <ArrowShape key={a.id} a={a} selectable={selectable} />;
          case "text":
            return <TextLabelShape key={a.id} a={a} selectable={selectable} onEditText={onEditText} />;
          case "mosaic":
            return <MosaicShape key={a.id} a={a} selectable={selectable} />;
          default:
            return null;
        }
      })}
    </Layer>
  );
}
