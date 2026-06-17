import { Layer } from "react-konva";
import { useEditorStore } from "../../store/editorStore";
import RectShape from "../shapes/RectShape";
import ArrowShape from "../shapes/ArrowShape";
import TextLabelShape from "../shapes/TextLabelShape";
import MosaicShape from "../shapes/MosaicShape";
import SmartAnnotationGroup from "../shapes/SmartAnnotationGroup";

export default function AnnotationLayer() {
  const annotations = useEditorStore((s) => s.annotations);

  return (
    <Layer>
      {annotations.map((a) => {
        switch (a.type) {
          case "smart":
            return <SmartAnnotationGroup key={a.id} a={a} />;
          case "rect":
            return <RectShape key={a.id} a={a} />;
          case "arrow":
            return <ArrowShape key={a.id} a={a} />;
          case "text":
            return <TextLabelShape key={a.id} a={a} />;
          case "mosaic":
            return <MosaicShape key={a.id} a={a} />;
          default:
            return null;
        }
      })}
    </Layer>
  );
}
