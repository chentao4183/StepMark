import React from "react";
import { createRoot } from "react-dom/client";
import "./global.css";

function EditorApp() {
  return <div style={{ width: "100vw", height: "100vh", background: "#1a1a2e" }}>Editor</div>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EditorApp />
  </React.StrictMode>
);
