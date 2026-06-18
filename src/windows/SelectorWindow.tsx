import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import useImage from "use-image";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen } from "@tauri-apps/api/event";
import { captureScreen, hideCurrentWindow } from "../ipc/bridge";
import { useEditorStore } from "../store/editorStore";
import { useToolState } from "../store/toolState";
import EditorView from "../components/EditorView";
import type { Selection } from "../types/annotation";

type Mode = "selecting" | "editing";

export default function SelectorWindow() {
  const [bg, setBg] = useState<string>("");
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isCapturing, setIsCapturing] = useState(true);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [mode, setMode] = useState<Mode>("selecting");
  // Mirror mode into a ref so the window-level event listeners (subscribed once)
  // always read the latest value without needing to re-subscribe on every change.
  // Re-subscribing on mode change was re-running recapture() and wiping the edit.
  const modeRef = useRef<Mode>("selecting");
  const capturingRef = useRef(false);
  const setModeSync = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
  };

  const [image] = useImage(bg);
  const initEditor = useEditorStore((s) => s.init);
  const setTool = useEditorStore((s) => s.setTool);

  async function waitForPaint() {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  async function recapture() {
    if (modeRef.current !== "selecting" || capturingRef.current) return;
    capturingRef.current = true;
    setIsCapturing(true);
    setBg("");
    setSelection(null);
    startRef.current = null;
    const win = getCurrentWebviewWindow();
    try {
      await win.hide();
      await waitForPaint();
      const dataUrl = await captureScreen();
      if (modeRef.current === "selecting") {
        setBg(dataUrl);
        setIsCapturing(false);
        await win.show();
        await win.setFocus();
      }
    } catch (err) {
      await win.show();
      await win.setFocus();
      setIsCapturing(false);
      alert(`截图失败：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      capturingRef.current = false;
    }
  }

  function closeEditorWindow() {
    useToolState.getState().resetAll();
    setModeSync("selecting");
    setSelection(null);
    startRef.current = null;
    void hideCurrentWindow();
  }

  // Mount once: recapture, and subscribe keydown/focus. These listeners read
  // modeRef.current so they don't need [mode] in deps (which caused the wipe bug).
  useEffect(() => {
    let mounted = true;
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      closeEditorWindow();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);

    const unlistenStart = listen("selector-start", () => {
      if (mounted) {
        void recapture();
      }
    });

    return () => {
      mounted = false;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      unlistenStart.then((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- selecting-mode mouse handlers ----
  function onMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (mode !== "selecting") return;
    const pos = e.target.getStage()!.getPointerPosition()!;
    startRef.current = pos;
    setSelection({ x: pos.x, y: pos.y, width: 0, height: 0 });
  }

  function onMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (mode !== "selecting" || !startRef.current) return;
    const pos = e.target.getStage()!.getPointerPosition()!;
    const s = startRef.current;
    setSelection({
      x: Math.min(s.x, pos.x),
      y: Math.min(s.y, pos.y),
      width: Math.abs(pos.x - s.x),
      height: Math.abs(pos.y - s.y),
    });
  }

  function onMouseUp() {
    if (mode !== "selecting" || !selection) return;
    if (selection.width < 5 || selection.height < 5) {
      hideCurrentWindow();
      return;
    }
    // Switch to in-place editing: keep the full screenshot as background, edit
    // in screen coordinates so the canvas sits exactly over the selection.
    useToolState.getState().resetAll();
    initEditor(bg, selection);
    setTool("smart");
    setModeSync("editing");
  }

  // ---- editing mode ----
  if (mode === "editing" && selection) {
    return (
      <div style={{ position: "relative", width: size.width, height: size.height }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <EditorView onExit={closeEditorWindow} />
        </div>
        <SelectionShade stageWidth={size.width} stageHeight={size.height} selection={selection} />
      </div>
    );
  }

  if (isCapturing || !image) {
    return <div style={{ width: size.width, height: size.height, background: "transparent" }} />;
  }

  // ---- selecting mode ----
  return (
    <Stage width={size.width} height={size.height} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <Layer>
        <KonvaImage image={image} x={0} y={0} width={size.width} height={size.height} listening={false} />
        {selection ? (
          <SelectionMaskRects stageWidth={size.width} stageHeight={size.height} selection={selection} />
        ) : (
          <Rect x={0} y={0} width={size.width} height={size.height} fill="rgba(0,0,0,0.3)" listening={false} />
        )}
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

function SelectionMaskRects({
  stageWidth,
  stageHeight,
  selection,
}: {
  stageWidth: number;
  stageHeight: number;
  selection: Selection;
}) {
  const { x, y, width, height } = selection;
  const fill = "rgba(0,0,0,0.3)";
  return (
    <>
      <Rect x={0} y={0} width={stageWidth} height={Math.max(0, y)} fill={fill} listening={false} />
      <Rect
        x={0}
        y={y + height}
        width={stageWidth}
        height={Math.max(0, stageHeight - (y + height))}
        fill={fill}
        listening={false}
      />
      <Rect x={0} y={y} width={Math.max(0, x)} height={height} fill={fill} listening={false} />
      <Rect
        x={x + width}
        y={y}
        width={Math.max(0, stageWidth - (x + width))}
        height={height}
        fill={fill}
        listening={false}
      />
    </>
  );
}

/**
 * Visual-only shade for Snipaste-style editing: keep the selected region clear
 * and lightly gray out the rest of the screen. This is outside the Konva export
 * stage, so copy/save still exports the clean selected region only.
 */
function SelectionShade({
  stageWidth,
  stageHeight,
  selection,
}: {
  stageWidth: number;
  stageHeight: number;
  selection: Selection;
}) {
  const { x, y, width, height } = selection;
  const shade = "rgba(0, 0, 0, 0.28)";
  const common: CSSProperties = {
    position: "absolute",
    background: shade,
    pointerEvents: "none",
    zIndex: 20,
  };

  return (
    <>
      <div style={{ ...common, left: 0, top: 0, width: stageWidth, height: Math.max(0, y) }} />
      <div
        style={{
          ...common,
          left: 0,
          top: y + height,
          width: stageWidth,
          height: Math.max(0, stageHeight - (y + height)),
        }}
      />
      <div style={{ ...common, left: 0, top: y, width: Math.max(0, x), height }} />
      <div
        style={{
          ...common,
          left: x + width,
          top: y,
          width: Math.max(0, stageWidth - (x + width)),
          height,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width,
          height,
          border: "2px solid #1e90ff",
          boxSizing: "border-box",
          pointerEvents: "none",
          zIndex: 21,
        }}
      />
    </>
  );
}
