import React from "react";
import { createRoot } from "react-dom/client";
import "./global.css";

function SelectorApp() {
  return <div style={{ width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)" }}>Selector</div>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SelectorApp />
  </React.StrictMode>
);
