# StepMark V0.3.0 Design

> Companion design document for `docs/prds/stepmark-v0.3.0-prd.md`.
> PRD defines what V0.3.0 delivers. This file defines how automatic number badges should behave in implementation.

## 1. Design Goals

V0.3.0 adds automatic number badges as a product differentiator over Snipaste.

The design has four goals:

1. Let users create referenceable numbered annotations without typing numbers manually.
2. Keep the number as a stable independent badge, not annotation text.
3. Reuse the V0.2.0 editor, source-coordinate model, annotation model, and tool option panels.
4. Keep V0.3.0 bounded: no manual badge dragging, no automatic renumbering, no full settings page.

The implementation must preserve the existing stack:

- Tauri 2
- React 18
- TypeScript
- Vite
- Konva / react-konva
- Zustand

## 2. Concept Model

### 2.1 Badge vs Annotation

A number badge is an optional child of an annotation.

The badge:

- Has its own value and style.
- Is rendered independently from the annotation text.
- Is positioned from annotation geometry and the user's placement setting.
- Moves when the parent annotation moves.
- Resizes only indirectly when parent geometry or badge style changes.
- Cannot be selected or dragged independently in V0.3.0.

### 2.2 Sequence

One editor session has one global sequence:

```ts
interface NumberingSessionState {
  nextNumber: number;
}
```

The sequence starts at `1` whenever the editor opens for a new screenshot.

Persistent settings do not include `nextNumber`.

### 2.3 Creation Rule

When a supported tool commits a new annotation:

1. Read persistent numbering settings.
2. If numbering is disabled for the active tool, create the annotation without a badge and do not increment `nextNumber`.
3. If numbering is enabled, add `numberBadge.value = nextNumber`.
4. Copy the current global badge style into `numberBadge.style`.
5. Increment `nextNumber`.
6. Push a history snapshot that can restore both annotations and `nextNumber`.

Created badge style is fixed on the annotation. Later style changes affect only future badges.

## 3. Data Model

### 3.1 Types

```ts
export type BadgeShape = "square" | "rounded" | "circle";

export interface NumberBadgeStyle {
  bgColor: string;
  textColor: string;
  shape: BadgeShape;
  fontSize: number;
}

export interface NumberBadge {
  value: number;
  style: NumberBadgeStyle;
}

export interface Annotation {
  id: string;
  type: ToolType;
  rect?: Rect;
  shape?: ShapeKind;
  note?: string;
  arrow?: ArrowData;
  style: AnnotationStyle;
  lineStyle?: LineStyle;
  arrowHeadSize?: number;
  fontFamily?: string;
  numberBadge?: NumberBadge;
}
```

### 3.2 Placement Types

```ts
export type RectBadgePosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export type EllipseBadgePosition =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "center";

export type ArrowBadgePosition = "start" | "middle" | "end";

export type TextBadgePosition = "left" | "right";

export type SmartBadgeAnchor = "target" | "arrow" | "label";

export interface SmartBadgePlacement {
  anchor: SmartBadgeAnchor;
  targetRectPosition: RectBadgePosition;
  targetEllipsePosition: EllipseBadgePosition;
  arrowPosition: ArrowBadgePosition;
  labelPosition: TextBadgePosition;
}

export interface TargetBadgePlacement {
  rectPosition: RectBadgePosition;
  ellipsePosition: EllipseBadgePosition;
}
```

Smart note keeps both rectangle and ellipse target positions. This prevents losing the user's preferred position when switching the smart note target shape.

### 3.3 Persistent Settings

```ts
export interface NumberingSettings {
  enabledByTool: {
    smart: boolean;
    rect: boolean;
    arrow: boolean;
    text: boolean;
  };
  positionByTool: {
    smart: SmartBadgePlacement;
    rect: TargetBadgePlacement;
    arrow: ArrowBadgePosition;
    text: TextBadgePosition;
  };
  badgeStyle: NumberBadgeStyle;
}
```

Default settings:

```ts
export const DEFAULT_NUMBERING_SETTINGS: NumberingSettings = {
  enabledByTool: {
    smart: true,
    rect: false,
    arrow: false,
    text: false,
  },
  positionByTool: {
    smart: {
      anchor: "label",
      targetRectPosition: "top-left",
      targetEllipsePosition: "left",
      arrowPosition: "end",
      labelPosition: "left",
    },
    rect: {
      rectPosition: "top-left",
      ellipsePosition: "left",
    },
    arrow: "end",
    text: "left",
  },
  badgeStyle: {
    bgColor: "#1677ff",
    textColor: "#ffffff",
    shape: "square",
    fontSize: 13,
  },
};
```

Storage key:

```ts
const STORAGE_KEY = "stepmark.numbering.v1";
```

Validate persisted settings field by field. Invalid or missing fields fall back to defaults.

### 3.4 Editor History

History snapshots should include `nextNumber`:

```ts
interface EditorSnapshot {
  annotations: Annotation[];
  cropRegion: Rect;
  nextNumber: number;
}
```

This makes undo/redo deterministic.

Rules:

- Undo creation of numbered annotation restores previous `nextNumber`.
- Redo restores the annotation and next-number state from the snapshot.
- Delete does not renumber other annotations.
- Reset next number should be undoable only if the existing editor pattern treats settings/session state changes as undoable. If not, keep reset outside annotation undo history and document the behavior in UI copy.

Recommendation: keep reset outside annotation undo history for V0.3.0. It affects only future creations and does not modify the canvas.

## 4. Badge Geometry

### 4.1 Measurement

Badge size is derived from text and font size.

Recommended constants:

```ts
const BADGE_HORIZONTAL_PADDING = 6;
const BADGE_VERTICAL_PADDING = 3;
const BADGE_MIN_SIZE = 18;
const BADGE_ANCHOR_GAP = 4;
```

For a value:

```ts
interface BadgeBox {
  width: number;
  height: number;
}
```

Rules:

- Width is measured text width plus horizontal padding.
- Height is font size plus vertical padding.
- Square and rounded rectangle can be wider for multi-digit numbers.
- Circle uses `size = max(width, height, BADGE_MIN_SIZE)` and renders width = height = size.
- Square uses `size = max(width, height, BADGE_MIN_SIZE)` and renders width = height = size.
- Rounded rectangle uses `width = max(width, BADGE_MIN_SIZE)` and `height = max(height, BADGE_MIN_SIZE)`.

### 4.2 Rect Target Positions

For a rectangle `rect` and badge box `box`:

- top-left: outside near `rect.x, rect.y`, offset by `BADGE_ANCHOR_GAP`.
- top-right: outside near `rect.x + rect.width, rect.y`.
- bottom-left: outside near `rect.x, rect.y + rect.height`.
- bottom-right: outside near `rect.x + rect.width, rect.y + rect.height`.
- center: centered inside the rectangle.

If outside placement would leave the crop region, shift the badge inward until visible.

### 4.3 Ellipse Target Positions

Use the ellipse bounds as `rect`.

- left: centered vertically at the left boundary.
- right: centered vertically at the right boundary.
- top: centered horizontally at the top boundary.
- bottom: centered horizontally at the bottom boundary.
- center: centered at ellipse center.

For left/right/top/bottom, the badge is placed just outside the ellipse boundary by `BADGE_ANCHOR_GAP`, then shifted inward if needed to stay visible.

### 4.4 Arrow Positions

For an arrow:

- start: arrow start point.
- middle: midpoint between start and end.
- end: arrow end point.

The badge is centered on the selected point, then shifted perpendicular or inward if it overlaps too awkwardly with the arrow head. V0.3.0 can start with simple point-centering plus crop-boundary shifting.

### 4.5 Text Positions

Text badge placement uses the measured text box.

```ts
interface TextBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

- left: badge right edge sits before the text box left edge with `BADGE_ANCHOR_GAP`.
- right: badge left edge sits after the text box right edge with `BADGE_ANCHOR_GAP`.

The text tool badge must be independent from text content. It must not be inserted as `[1]` text.

For text direction:

- If the rendered text box grows leftward, the badge follows the computed visual left/right box edges.
- Do not infer placement from string content; use measured geometry.

### 4.6 Smart Note Positions

Smart note placement first resolves the selected anchor:

```ts
function resolveSmartBadgeBox(
  annotation: Annotation,
  placement: SmartBadgePlacement,
  badgeBox: BadgeBox,
  cropRegion: Rect
): Rect
```

Anchor behavior:

- `target`: use target shape and current `annotation.shape`.
- `arrow`: use `annotation.arrow`.
- `label`: use measured smart note label box.

If `anchor === "target"`:

- `shape === "ellipse"` uses `targetEllipsePosition`.
- Otherwise use `targetRectPosition`.

If a stored target position is invalid for the shape, fall back to center.

Default smart note placement is:

- anchor: label.
- label position: left.

This places the independent badge adjacent to the smart note label by default, while still allowing users to attach badges to the target shape or arrow.

### 4.7 Crop Boundary Shifting

All badge placement helpers should pass their result through:

```ts
function keepRectInsideCrop(rect: Rect, crop: Rect): Rect
```

Rules:

- If the badge is wider than the crop, align it to crop left.
- If the badge is taller than the crop, align it to crop top.
- Otherwise clamp x/y so the full badge is inside crop.

This function should operate in source coordinates, consistent with V0.2.0 annotation data.

## 5. Rendering

### 5.1 Konva Component

Add a reusable badge component:

```tsx
interface NumberBadgeShapeProps {
  badge: NumberBadge;
  box: Rect;
}
```

Rendering:

- `square`: Konva `Rect` with no corner radius.
- `rounded`: Konva `Rect` with corner radius, recommended `4`.
- `circle`: Konva `Circle` or `Rect` with radius based on box size.
- Text is centered horizontally and vertically.

Do not render a border in V0.3.0.

### 5.2 Shape Integration

Each supported shape component computes its badge box and renders `NumberBadgeShape` when `annotation.numberBadge` exists:

- `SmartAnnotationGroup`
- `RectShape`
- `ArrowShape`
- `TextLabelShape`

Badge rendering should happen after the base annotation so the badge is visible on top.

### 5.3 Export

Because badges are Konva nodes, existing export should include them automatically if export renders the annotation layer.

Add a smoke test for:

- Clipboard export with badges.
- File export with badges.
- Crop boundary shifting reflected in export.

## 6. Tool Option UI

### 6.1 Panel Placement

Use the V0.2.0 secondary option panel system.

Do not add a full settings page.

### 6.2 Per-Tool Controls

Each supported tool panel gets:

- Toggle: automatic numbering.
- Placement controls relevant to that tool.

Smart note controls:

- Automatic numbering toggle.
- Anchor segmented control: target / arrow / label.
- If target and current shape is rectangle: top-left / top-right / bottom-left / bottom-right / center.
- If target and current shape is ellipse: left / right / top / bottom / center.
- If arrow: start / middle / end.
- If label: left / right.

Rectangle controls:

- Automatic numbering toggle.
- If current shape is rectangle: top-left / top-right / bottom-left / bottom-right / center.
- If current shape is ellipse: left / right / top / bottom / center.

Arrow controls:

- Automatic numbering toggle.
- start / middle / end.

Text controls:

- Automatic numbering toggle.
- left / right.

### 6.3 Global Badge Style Controls

Expose shared style controls compactly in the tool option panels. The same global values are shown regardless of which supported tool is active.

Controls:

- Background color.
- Number text color.
- Shape: square / rounded / circle.
- Font size.

Changing global badge style affects only future badges.

### 6.4 Reset Control

Provide `Reset number to 1` in the numbering controls.

Reset behavior:

- Sets current editor session `nextNumber = 1`.
- Does not change existing badges.
- Does not change persistent settings.

## 7. Store and Validation

### 7.1 Persistent Store

Recommended file:

```text
src/store/numberingStore.ts
```

Use Zustand and localStorage, following the V0.2.0 tool style store pattern.

Validation:

- Colors must match `#[0-9a-fA-F]{6}`.
- Shape must be `square`, `rounded`, or `circle`.
- Font size must be an integer, recommended range `8-72`.
- Booleans must be actual booleans.
- Placement values must be members of their allowed unions.

### 7.2 Session State

`nextNumber` belongs to `editorStore`, not `numberingStore`.

Recommended editor actions:

```ts
interface EditorState {
  nextNumber: number;
  consumeNumber: () => number;
  resetNextNumber: () => void;
}
```

Tool hooks should use a single helper to avoid each tool implementing its own increment logic:

```ts
function applyNumberBadgeIfEnabled(
  tool: NumberedTool,
  annotation: Annotation,
  settings: NumberingSettings,
  nextNumber: number
): { annotation: Annotation; consumed: boolean }
```

The editor action that commits the annotation should own incrementing `nextNumber`.

## 8. Testing Strategy

### 8.1 Unit Tests

Add tests for:

- Badge measurement for single-digit, double-digit, square, rounded, and circle.
- Rect positions.
- Ellipse positions.
- Arrow start/middle/end positions.
- Text left/right positions.
- Smart note target/arrow/label anchor resolution.
- Crop boundary shifting.
- Numbering settings validation and fallback.
- Sequence state create, undo, redo, delete, and reset.

### 8.2 Manual Smoke Tests

Run through:

1. New screenshot starts at `1`.
2. Smart note creates badge `1` by default.
3. Rectangle numbering disabled by default; enabling it creates the next badge.
4. Arrow and text numbering can be enabled and use the same global sequence.
5. Delete badge `2`; badge `3` remains `3`.
6. Undo numbered creation restores next number.
7. Redo restores original badge value.
8. Reset next number creates a new badge `1` without changing existing badges.
9. Change badge style and verify only new badges change.
10. Copy and save include visible badges.

## 9. Implementation Notes

- Keep badge placement helpers pure and independent from React.
- Do not use HTML overlays for badge rendering.
- Keep all badge coordinates in source space before converting to viewport/stage space for rendering.
- Prefer central helpers over per-shape ad hoc badge math.
- Keep the V0.3.0 UI compact. The numbering feature should feel like part of the tool panel, not a separate settings application.

## 10. Open Decisions

No open product decisions remain from the V0.3.0 clarification round.

Implementation may still choose exact pixel constants for badge padding, radius, and gaps as long as the output remains compact and readable.
