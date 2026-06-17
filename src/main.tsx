import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import { onScreenshotTriggered, showSelectorWindow } from "./ipc/bridge";

function MainApp() {
  useEffect(() => {
    const unlisten = onScreenshotTriggered(() => {
      showSelectorWindow();
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      SnapNote is running in the background. Press F1 to capture.
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);
