import type { LineStyle, ShapeKind, SmartShapeKind } from "./annotation";

export interface SmartToolStyle {
  color: string;
  strokeWidth: number;
  shape: SmartShapeKind;
  fontSize: number;
  fontFamily: string;
}

export interface RectToolStyle {
  color: string;
  strokeWidth: number;
  shape: ShapeKind;
}

export interface ArrowToolStyle {
  color: string;
  strokeWidth: number;
  lineStyle: LineStyle;
}

export interface TextToolStyle {
  color: string;
  fontSize: number;
  fontFamily: string;
}

export interface ToolStyleSettings {
  smart: SmartToolStyle;
  rect: RectToolStyle;
  arrow: ArrowToolStyle;
  text: TextToolStyle;
}

export const DEFAULT_TOOL_STYLES: ToolStyleSettings = {
  smart: {
    color: "#ff4757",
    strokeWidth: 3,
    shape: "rect",
    fontSize: 17,
    fontFamily: "",
  },
  rect: {
    color: "#ff4757",
    strokeWidth: 3,
    shape: "rect",
  },
  arrow: {
    color: "#ff4757",
    strokeWidth: 3,
    lineStyle: "solid",
  },
  text: {
    color: "#ff4757",
    fontSize: 17,
    fontFamily: "",
  },
};

export const TOOL_STYLE_LIMITS = {
  strokeWidth: { min: 1, max: 8 },
  fontSize: { min: 8, max: 72 },
};
