import { useRef } from "react";
import type Konva from "konva";
import { useEditorStore } from "../store/editorStore";
import { useToolState } from "../store/toolState";
import { nearestCorner } from "../geometry/corners";
import { DEFAULT_STYLE, type Annotation, type Corner } from "../types/annotation";

type Phase = "idle" | "dragging-rect" | "placing-arrow" | "entering-text";

/**
 * Smart annotation 5-step flow backed by the shared tool-state store so that
 * EditorStage (handlers) and EditorWindow (text overlay) observe one machine.
 *
 *   1. idle            - waiting for mousedown
 *   2. dragging-rect   - drawing the rect
 *   3. placing-arrow   - rect committed, arrow end follows the mouse
 *   4. click           - pin the arrow end; corner finalized to nearest
 *   5. entering-text   - label input open; on submit the annotation commits
 */
export function useSmartAnnotationTool() {
  const addAnnotation = useEditorStore((s) => s.addAnnotation);
  const ts = useToolState();
  const phaseRef = useRef<Phase>("idle");
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const rectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const startCornerRef = useRef<Corner>("tr");
  const arrowEndRef = useRef<{ x: number; y: number } | null>(null);

  // Keep refs in sync with phase transitions.
  function setPhase(p: Phase) {
    phaseRef.current = p;
  }

  function pos(e: Konva.KonvaEventObject<MouseEvent>) {
    return e.target.getStage()!.getPointerPosition()!;
  }

  const handlers = {
    onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (phaseRef.current !== "idle") return;
      const p = pos(e);
      dragStartRef.current = p;
      ts.setSmart({ previewRect: { x: p.x, y: p.y, width: 0, height: 0 } });
      setPhase("dragging-rect");
    },
    onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => {
      const p = pos(e);
      if (phaseRef.current === "dragging-rect" && dragStartRef.current) {
        const s = dragStartRef.current;
        ts.setSmart({
          previewRect: {
            x: Math.min(s.x, p.x),
            y: Math.min(s.y, p.y),
            width: Math.abs(p.x - s.x),
            height: Math.abs(p.y - s.y),
          },
        });
      } else if (phaseRef.current === "placing-arrow") {
        arrowEndRef.current = p;
        ts.setSmart({ arrowEnd: p });
      }
    },
    onMouseUp: () => {
      if (phaseRef.current === "dragging-rect") {
        const r = ts.previewRect;
        if (r && r.width > 5 && r.height > 5) {
          rectRef.current = r;
          startCornerRef.current = "tr";
          ts.setSmart({ previewRect: null, rect: r, startCorner: "tr" });
          setPhase("placing-arrow");
        } else {
          ts.resetSmart();
          setPhase("idle");
        }
      }
    },
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (phaseRef.current !== "placing-arrow") return;
      const p = pos(e);
      const corner: Corner = rectRef.current ? nearestCorner(rectRef.current, p) : "tr";
      startCornerRef.current = corner;
      arrowEndRef.current = p;
      ts.setSmart({ startCorner: corner, arrowEnd: p, textPos: p });
      setPhase("entering-text");
    },
  };

  function submitText(text: string) {
    if (rectRef.current && arrowEndRef.current) {
      const a: Annotation = {
        id: crypto.randomUUID(),
        type: "smart",
        rect: rectRef.current,
        note: text,
        arrow: { startCorner: startCornerRef.current, endX: arrowEndRef.current.x, endY: arrowEndRef.current.y },
        style: { ...DEFAULT_STYLE },
      };
      addAnnotation(a);
    }
    reset();
  }

  function reset() {
    setPhase("idle");
    dragStartRef.current = null;
    rectRef.current = null;
    startCornerRef.current = "tr";
    arrowEndRef.current = null;
    ts.resetSmart();
  }

  return {
    // Re-expose for renderers; phase derived from the stored state.
    phase: phaseRef.current,
    previewRect: ts.previewRect,
    rect: ts.rect,
    startCorner: ts.startCorner,
    arrowEnd: ts.arrowEnd,
    textPos: ts.textPos,
    isEnteringText: ts.textPos !== null,
    handlers,
    submitText,
    cancelText: reset,
  };
}
