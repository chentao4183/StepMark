import { useActiveTool } from "../tools";
import { useSelectionTool } from "../tools/useSelectionTool";
import { useEditorShortcuts } from "../tools/useEditorShortcuts";
import { hideCurrentWindow } from "../ipc/bridge";
import { exportToFile } from "../canvas/exportCanvas";
import EditorStage from "../canvas/EditorStage";
import Toolbar from "./Toolbar";
import TextInputOverlay from "./TextInputOverlay";

interface Props {
  /** Called when the user hits Esc to exit the editor. */
  onExit?: () => void;
}

/**
 * The editor body: editor stage + toolbar + text-input overlays + shortcuts.
 *
 * Window-agnostic — used both by the standalone EditorWindow and by the
 * SelectorWindow's in-place "editing" mode. All tool/selection/shortcut state
 * lives in the shared Zustand stores, so this component is pure presentation.
 */
export default function EditorView({ onExit }: Props) {
  const active = useActiveTool();
  const selection = useSelectionTool();
  useEditorShortcuts({
    onExit: onExit ?? (() => hideCurrentWindow()),
    onSave: () => {
      void exportToFile("png");
    },
  });

  return (
    <>
      <EditorStage onEditText={selection.beginEditText} />
      <Toolbar />
      {active.kind === "smart" && active.smart.isEnteringText && active.smart.textPos && (
        <TextInputOverlay
          x={active.smart.textPos.x}
          y={active.smart.textPos.y - 28}
          initial=""
          onSubmit={active.smart.submitText}
          onCancel={active.smart.cancelText}
        />
      )}
      {active.kind === "text" && active.text.textPos && (
        <TextInputOverlay
          x={active.text.textPos.x}
          y={active.text.textPos.y - 28}
          initial=""
          onSubmit={active.text.submit}
          onCancel={active.text.cancel}
        />
      )}
      {selection.editing && (
        <TextInputOverlay
          x={selection.editing.x}
          y={selection.editing.y - 28}
          initial={selection.editing.initial}
          onSubmit={selection.commitEditText}
          onCancel={selection.cancelEdit}
        />
      )}
    </>
  );
}
