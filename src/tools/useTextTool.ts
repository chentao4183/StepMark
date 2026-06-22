import type Konva from "konva";
import { applyNumberBadgeIfEnabled } from "../numbering/applyNumbering";
import { useEditorStore } from "../store/editorStore";
import { useNumberingStore } from "../store/numberingStore";
import { useToolStyleStore } from "../store/toolStyleStore";
import { useToolState } from "../store/toolState";
import { annotationFieldsFromToolStyle } from "../style/styleMapping";
import type { Annotation } from "../types/annotation";

export function useTextTool() {
  const addAnnotation = useEditorStore((s) => s.addAnnotation);
  const style = useToolStyleStore((s) => s.settings.text);
  const ts = useToolState();

  function pos(e: Konva.KonvaEventObject<MouseEvent>) {
    return e.target.getStage()!.getPointerPosition()!;
  }

  function submit(text: string) {
    if (ts.textPos && text.trim()) {
      const base: Annotation = {
        id: crypto.randomUUID(),
        type: "text",
        note: text,
        arrow: { endX: ts.textPos.x, endY: ts.textPos.y },
        ...annotationFieldsFromToolStyle("text", useToolStyleStore.getState().settings),
      };
      const numberingSettings = useNumberingStore.getState().settings;
      const nextNumber = useEditorStore.getState().nextNumber;
      const { annotation, consumed } = applyNumberBadgeIfEnabled("text", base, numberingSettings, nextNumber);
      addAnnotation(annotation, { consumedNumber: consumed });
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
    style,
  };
}
