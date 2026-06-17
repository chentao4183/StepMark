import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { useEditorStore } from "../store/editorStore";
import EditorView from "../components/EditorView";

interface LoadPayload {
  x: number;
  y: number;
  width: number;
  height: number;
  fullBase64: string;
}

/**
 * Standalone editor window (loaded via editor.html). Retained for compatibility,
 * but the primary capture flow now edits in place inside the selector window.
 */
export default function EditorWindow() {
  const init = useEditorStore((s) => s.init);
  const setTool = useEditorStore((s) => s.setTool);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unlisten = listen<LoadPayload>("editor-load", (event) => {
      const p = event.payload;
      // Store the FULL screenshot + the selection rect (screen coords). The
      // background is drawn at full-window size; selectionRect only drives export.
      init(p.fullBase64, { x: p.x, y: p.y, width: p.width, height: p.height });
      setTool("smart");
      setLoaded(true);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [init, setTool]);

  if (!loaded) {
    return <div style={{ width: "100vw", height: "100vh", background: "#1a1a2e" }} />;
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#1a1a2e" }}>
      <EditorView />
    </div>
  );
}
