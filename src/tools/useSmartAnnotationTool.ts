import { useRef } from "react";
import type Konva from "konva";
import { useEditorStore } from "../store/editorStore";
import { useToolState } from "../store/toolState";
import { nearestCorner } from "../geometry/corners";
import { layoutSmartArrow } from "../geometry/arrowLayout";
import { DEFAULT_STYLE, type Annotation, type Corner } from "../types/annotation";

type Phase = "idle" | "dragging-rect" | "placing-arrow" | "entering-text";

/**
 * Smart annotation 5-step flow backed by the shared tool-state store so that
 * the Stage (handlers) and the overlay (text input) observe one machine.
 *
 *   1. idle            - waiting for mousedown
 *   2. dragging-rect   - drawing the rect
 *   3. placing-arrow   - rect committed, arrow end follows the mouse
 *   4. click           - pin the arrow; end + label anchor are resolved so the
 *                        arrow has a minimum length and the label sits past the tip
 *   5. entering-text   - label input open; on submit the annotation commits
 *                        (empty text is allowed → renders as box + arrow only)
 */
export function useSmartAnnotationTool() {
  const addAnnotation = useEditorStore((s) => s.addAnnotation);
  const ts = useToolState();
  const phaseRef = useRef<Phase>("idle");
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const rectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const startCornerRef = useRef<Corner>("tr");
  const arrowEndRef = useRef<{ x: number; y: number } | null>(null);
  const labelAnchorRef = useRef<{ x: number; y: number } | null>(null);

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
          reset();
        }
      }
    },
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (phaseRef.current !== "placing-arrow" || !rectRef.current) return;
      const p = pos(e);
      const corner: Corner = nearestCorner(rectRef.current, p);
      // Resolve a minimum-length arrow end and an outward label anchor so the
      // box + arrow + label don't crowd together.
      const { end, label } = layoutSmartArrow(rectRef.current, corner, p);
      startCornerRef.current = corner;
      arrowEndRef.current = end;
      labelAnchorRef.current = label;
      ts.setSmart({ startCorner: corner, arrowEnd: end, textPos: label });
      setPhase("entering-text");
    },
  };

  function submitText(text: string) {
    if (rectRef.current && arrowEndRef.current) {
      const a: Annotation = {
        id: crypto.randomUUID(),
        type: "smart",
        rect: rectRef.current,
        // Empty note is allowed; TextLabelShape hides itself when note is empty,
        // leaving just the box + arrow.
        note: text,
        arrow: {
          startCorner: startCornerRef.current,
          endX: arrowEndRef.current.x,
          endY: arrowEndRef.current.y,
          labelX: labelAnchorRef.current?.x,
          labelY: labelAnchorRef.current?.y,
        },
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
    labelAnchorRef.current = null;
    ts.resetSmart();
  }

  return {
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
