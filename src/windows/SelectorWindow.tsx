import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import useImage from "use-image";
import { captureScreen, hideCurrentWindow, showEditorWindow } from "../ipc/bridge";
import type { Selection } from "../types/annotation";

export default function SelectorWindow() {
  const [bg, setBg] = useState<string>("");
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [image] = useImage(bg);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const dataUrl = await captureScreen();
      if (mounted) setBg(dataUrl);
    })();
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => {
      mounted = false;
      window.removeEventListener("resize", onResize);
    };
  }, []);

  function onMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    const pos = e.target.getStage()!.getPointerPosition()!;
    startRef.current = pos;
    setSelection({ x: pos.x, y: pos.y, width: 0, height: 0 });
  }

  function onMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!startRef.current) return;
    const pos = e.target.getStage()!.getPointerPosition()!;
    const s = startRef.current;
    setSelection({
      x: Math.min(s.x, pos.x),
      y: Math.min(s.y, pos.y),
      width: Math.abs(pos.x - s.x),
      height: Math.abs(pos.y - s.y),
    });
  }

  async function onMouseUp() {
    if (!selection || selection.width < 5 || selection.height < 5) {
      // Treat as a click-to-cancel.
      await hideCurrentWindow();
      return;
    }
    await showEditorWindow({
      x: selection.x,
      y: selection.y,
      width: selection.width,
      height: selection.height,
      fullBase64: bg,
    });
    await hideCurrentWindow();
    // Reset for next capture.
    setSelection(null);
    startRef.current = null;
    setBg("");
  }

  return (
    <Stage width={size.width} height={size.height} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <Layer>
        <KonvaImage image={image} x={0} y={0} width={size.width} height={size.height} listening={false} />
        {/* Dim overlay */}
        <Rect x={0} y={0} width={size.width} height={size.height} fill="rgba(0,0,0,0.3)" listening={false} />
        {/* Selection outline */}
        {selection && (
          <Rect
            x={selection.x}
            y={selection.y}
            width={selection.width}
            height={selection.height}
            fill="rgba(0,0,0,0)"
            stroke="#ff4757"
            strokeWidth={2}
            dash={[6, 3]}
            listening={false}
          />
        )}
      </Layer>
    </Stage>
  );
}
