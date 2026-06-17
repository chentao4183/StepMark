import type Konva from "konva";
import { useEditorStore } from "../store/editorStore";
import { useToolState } from "../store/toolState";
import { DEFAULT_STYLE, type Annotation } from "../types/annotation";

export function useTextTool() {
  const addAnnotation = useEditorStore((s) => s.addAnnotation);
  const ts = useToolState();

  function pos(e: Konva.KonvaEventObject<MouseEvent>) {
    return e.target.getStage()!.getPointerPosition()!;
  }

  function submit(text: string) {
    if (ts.textPos && text.trim()) {
      const a: Annotation = {
        id: crypto.randomUUID(),
        type: "text",
        note: text,
        arrow: { endX: ts.textPos.x, endY: ts.textPos.y },
        style: { ...DEFAULT_STYLE },
      };
      addAnnotation(a);
    }
    ts.setTextPos(null);
  }

  return {
    textPos: ts.textPos,
    handlers: {
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
        ts.setTextPos(pos(e));
      },
    },
    submit,
    cancel: () => ts.setTextPos(null),
  };
}
