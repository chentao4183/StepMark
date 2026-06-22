import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_NUMBERING_SETTINGS } from "../types/numbering";
import { loadNumberingSettings, NUMBERING_STORAGE_KEY, useNumberingStore } from "./numberingStore";

const ORIGINAL_LOCAL_STORAGE = globalThis.localStorage;

function withStorage(storage: { getItem: (k: string) => string | null; setItem?: (k: string, v: string) => void }) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
}

function restoreStorage() {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: ORIGINAL_LOCAL_STORAGE });
}

describe("loadNumberingSettings", () => {
  afterEach(() => {
    restoreStorage();
  });

  it("falls back to defaults when localStorage is missing the key", () => {
    withStorage({ getItem: () => null });
    expect(loadNumberingSettings()).toEqual(DEFAULT_NUMBERING_SETTINGS);
  });

  it("loads valid persisted settings", () => {
    const persisted = {
      enabledByTool: { smart: false, rect: true, arrow: true, text: true },
      positionByTool: {
        smart: {
          anchor: "target",
          targetRectPosition: "bottom-right",
          targetEllipsePosition: "right",
          arrowPosition: "start",
          labelPosition: "right",
        },
        rect: { rectPosition: "center", ellipsePosition: "top" },
        arrow: "start",
        text: "right",
      },
      badgeStyle: { bgColor: "#abcdef", textColor: "#123456", shape: "circle", fontSize: 18 },
    };
    withStorage({ getItem: (k) => (k === NUMBERING_STORAGE_KEY ? JSON.stringify(persisted) : null) });
    expect(loadNumberingSettings()).toEqual(persisted);
  });

  it("falls back to defaults on corrupt JSON", () => {
    withStorage({ getItem: (k) => (k === NUMBERING_STORAGE_KEY ? "{not json" : null) });
    expect(loadNumberingSettings()).toEqual(DEFAULT_NUMBERING_SETTINGS);
  });

  it("applies field-level fallback for partially invalid settings", () => {
    const persisted = {
      enabledByTool: { smart: "yes" as unknown, rect: 1 as unknown, arrow: true, text: false },
      positionByTool: {
        smart: {
          anchor: "weird",
          targetRectPosition: "top-left",
          targetEllipsePosition: "left",
          arrowPosition: "end",
          labelPosition: "left",
        },
        rect: { rectPosition: "top-left", ellipsePosition: "left" },
        arrow: "middle",
        text: "left",
      },
      badgeStyle: { bgColor: "nope", textColor: "#ffffff", shape: "hexagon", fontSize: 999 },
    };
    withStorage({ getItem: (k) => (k === NUMBERING_STORAGE_KEY ? JSON.stringify(persisted) : null) });

    const settings = loadNumberingSettings();
    // valid booleans are kept, invalid fields fall back
    expect(settings.enabledByTool).toEqual({
      smart: DEFAULT_NUMBERING_SETTINGS.enabledByTool.smart,
      rect: DEFAULT_NUMBERING_SETTINGS.enabledByTool.rect,
      arrow: true,
      text: false,
    });
    expect(settings.positionByTool.arrow).toBe("middle");
    expect(settings.positionByTool.smart.anchor).toBe(DEFAULT_NUMBERING_SETTINGS.positionByTool.smart.anchor);
    expect(settings.badgeStyle).toEqual({
      bgColor: DEFAULT_NUMBERING_SETTINGS.badgeStyle.bgColor,
      textColor: "#ffffff",
      shape: DEFAULT_NUMBERING_SETTINGS.badgeStyle.shape,
      fontSize: DEFAULT_NUMBERING_SETTINGS.badgeStyle.fontSize,
    });
  });
});

describe("useNumberingStore updates", () => {
  let captured = "";
  beforeEach(() => {
    captured = "";
    withStorage({
      getItem: () => null,
      setItem: (_k, v) => {
        captured = v;
      },
    });
    useNumberingStore.getState().resetSettings();
  });

  afterEach(() => {
    restoreStorage();
  });

  it("persists updates to localStorage", () => {
    useNumberingStore.getState().updateEnabled("rect", true);
    const stored = JSON.parse(captured);
    expect(stored.enabledByTool.rect).toBe(true);
    expect(useNumberingStore.getState().settings.enabledByTool.rect).toBe(true);
  });

  it("updates badge style and persists a copy", () => {
    useNumberingStore.getState().updateBadgeStyle({ bgColor: "#000000" });
    expect(useNumberingStore.getState().settings.badgeStyle.bgColor).toBe("#000000");
    const stored = JSON.parse(captured);
    expect(stored.badgeStyle.bgColor).toBe("#000000");
  });

  it("resets to defaults", () => {
    useNumberingStore.getState().updateEnabled("arrow", true);
    useNumberingStore.getState().resetSettings();
    expect(useNumberingStore.getState().settings).toEqual(DEFAULT_NUMBERING_SETTINGS);
  });
});
