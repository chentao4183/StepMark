import { useRef } from "react";
import type Konva from "konva";
import { useEditorStore } from "../store/editorStore";
import { useToolState } from "../store/toolState";
import { cornerPoint, nearestCorner } from "../geometry/corners";
import { DEFAULT_STYLE, type Annotation } from "../types/annotation";

type Phase = "idle" | "drawing-rect" | "selecting-label-position" | "editing-label";

export function useSmartAnnotationTool() {
  const addAnnotation = useEditorStore((s) => s.addAnnotation);
  const ts = useToolState();
  const phaseRef = useRef<Phase>("idle");
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const rectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const skipNextClickRef = useRef(false);

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
      setPhase("drawing-rect");
    },
    onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => {
      const p = pos(e);
      if (phaseRef.current === "drawing-rect" && dragStartRef.current) {
        const s = dragStartRef.current;
        ts.setSmart({
          previewRect: {
            x: Math.min(s.x, p.x),
            y: Math.min(s.y, p.y),
            width: Math.abs(p.x - s.x),
            height: Math.abs(p.y - s.y),
          },
        });
      } else if (phaseRef.current === "selecting-label-position" && rectRef.current) {
        ts.setSmart({
          arrowStart: cornerPoint(rectRef.current, ts.startCorner),
          arrowEnd: p,
        });
      }
    },
    onMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (phaseRef.current !== "drawing-rect") return;
      const r = ts.previewRect;
      if (!r || r.width <= 5 || r.height <= 5) {
        reset();
        return;
      }

      const p = pos(e);
      rectRef.current = r;
      skipNextClickRef.current = true;
      // spec §5.2: the arrow starts from the rect corner nearest to where the
      // mouse was released. Storing the corner id (not absolute coords) lets the
      // anchor recompute automatically as the rect moves/resizes, and drives the
      // label-extend direction in spec §5.3.
      const corner = nearestCorner(r, p);
      ts.setSmart({
        previewRect: null,
        rect: r,
        startCorner: corner,
        arrowStart: cornerPoint(r, corner),
        arrowEnd: p,
        textPos: null,
      });
      setPhase("selecting-label-position");
    },
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (phaseRef.current !== "selecting-label-position" || !rectRef.current) return;
      if (skipNextClickRef.current) {
        skipNextClickRef.current = false;
        return;
      }

      const p = pos(e);
      ts.setSmart({
        arrowStart: cornerPoint(rectRef.current, ts.startCorner),
        arrowEnd: p,
        textPos: p,
      });
      setPhase("editing-label");
    },
  };

  function submitText(text: string) {
    const rect = ts.rect;
    const arrowStart = ts.arrowStart;
    const arrowEnd = ts.arrowEnd;
    const labelAnchor = ts.textPos;

    if (rect && arrowStart && arrowEnd && labelAnchor && text.trim()) {
      const a: Annotation = {
        id: crypto.randomUUID(),
        type: "smart",
        rect,
        note: text,
        arrow: {
          // Smart annotations store the corner id, not absolute start coords,
          // so the anchor and the label-extend direction (spec §5.3) stay
          // correct when the rect moves. Absolute startX/startY is for the
          // standalone arrow tool only.
          startCorner: ts.startCorner,
          endX: arrowEnd.x,
          endY: arrowEnd.y,
          labelX: labelAnchor.x,
          labelY: labelAnchor.y,
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
    skipNextClickRef.current = false;
    ts.resetSmart();
  }

  return {
    phase: phaseRef.current,
    previewRect: ts.previewRect,
    rect: ts.rect,
    arrowStart: ts.arrowStart,
    arrowEnd: ts.arrowEnd,
    textPos: ts.textPos,
    isEnteringText: ts.textPos !== null,
    handlers,
    submitText,
    cancelText: reset,
  };
}
