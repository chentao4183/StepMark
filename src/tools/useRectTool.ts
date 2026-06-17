import { useRef } from "react";
import type Konva from "konva";
import { useEditorStore } from "../store/editorStore";
import { useToolState } from "../store/toolState";
import { DEFAULT_STYLE, type Annotation, type Rect } from "../types/annotation";

export function useRectTool() {
  const addAnnotation = useEditorStore((s) => s.addAnnotation);
  const ts = useToolState();
  const startRef = useRef<{ x: number; y: number } | null>(null);

  function pos(e: Konva.KonvaEventObject<MouseEvent>) {
    return e.target.getStage()!.getPointerPosition()!;
  }

  return {
    preview: ts.rectPreview,
    handlers: {
      onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
        const p = pos(e);
        startRef.current = p;
        ts.setRectPreview({ x: p.x, y: p.y, width: 0, height: 0 });
      },
      onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!startRef.current) return;
        const p = pos(e);
        const s = startRef.current;
        const r: Rect = {
          x: Math.min(s.x, p.x),
          y: Math.min(s.y, p.y),
          width: Math.abs(p.x - s.x),
          height: Math.abs(p.y - s.y),
        };
        ts.setRectPreview(r);
      },
      onMouseUp: () => {
        const r = ts.rectPreview;
        if (r && r.width > 5 && r.height > 5) {
          const a: Annotation = { id: crypto.randomUUID(), type: "rect", rect: r, style: { ...DEFAULT_STYLE } };
          addAnnotation(a);
        }
        startRef.current = null;
        ts.setRectPreview(null);
      },
    },
  };
}
