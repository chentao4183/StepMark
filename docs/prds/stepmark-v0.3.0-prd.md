# StepMark V0.3.0 - Product Requirements Document (PRD)

## Requirements Description

### Background

- **Business Problem**: V0.2.0 improves StepMark's editor, crop, and style system, but common screenshot feedback still requires users to manually type numeric references such as `1`, `2`, and `3`. This slows down issue reporting and makes StepMark less differentiated from Snipaste.
- **Target Users**: Windows users who create screenshot feedback for product review, software acceptance, medical information-system review, and daily issue reporting.
- **Value Proposition**: Let users create numbered, referenceable annotations in one drawing action. Automatic numbering turns screenshots into structured issue maps without forcing users to manually place and type every number.

### Feature Overview

- **Core Features**:
  - Add automatic global numbering for smart note, rectangle, arrow, and text annotations.
  - Render the number as an independent badge attached to the annotation, not as part of the annotation text.
  - Let each supported tool enable or disable automatic numbering independently.
  - Persist numbering settings across app restarts, but reset the next number to `1` for each screenshot editing session.
  - Let users configure badge placement per tool and badge visual style globally.
  - Keep created badge values fixed after creation. Deleting an annotation does not renumber existing annotations.
- **Feature Boundaries**:
  - Included: smart note, rectangle/ellipse, arrow, and text tools.
  - Included: badge background color, text color, shape, and font size.
  - Included: per-tool enable toggles and per-tool placement settings.
  - Included: reset next number to `1` inside the current editor session.
  - Excluded: mosaic numbering, per-tool badge visual styles, badge border styling, manual badge dragging, automatic renumbering after delete, multi-sequence profiles, and cross-screenshot number continuity.
- **User Scenarios**:
  - A user captures a system screen, draws three smart notes, and gets badges `1`, `2`, and `3` automatically.
  - A user enables numbering for the rectangle tool, frames several problem areas, and the rectangle badges appear at the configured corner.
  - A user enables numbering for arrows, points to three UI details, and each arrow gets a badge near its endpoint, midpoint, or start point based on the selected setting.
  - A user changes the badge to a blue square with white text and a larger font. The setting persists for future screenshots, while each new screenshot starts at number `1`.

### Detailed Requirements

#### Numbering Behavior

1. **Global sequence**
   - One sequence is shared by all numbered tools inside the current editor session.
   - If the user creates a numbered smart note, then a numbered rectangle, then a numbered arrow, the badges are `1`, `2`, and `3`.

2. **Per-screenshot lifecycle**
   - The next number starts at `1` whenever a new screenshot enters the editor.
   - Numbering settings persist across app restarts. Settings here means per-tool enablement, per-tool placement, and global badge style.
   - The current `nextNumber` value is editor-session state only. It does not persist across screenshots or app restarts and is not part of the persistent numbering settings.

3. **Per-tool enablement**
   - Smart note automatic numbering is enabled by default.
   - Rectangle, arrow, and text automatic numbering are disabled by default.
   - Users can change these defaults through the tool option panels.

4. **Fixed created values**
   - When an annotation is created with a badge, the badge value is stored on that annotation.
   - Deleting badge `2` must not change badge `3` to `2`.
   - Editing annotation text or shape must not change its badge value.

5. **Undo/redo**
   - Undoing creation of a numbered annotation reverts the next number.
   - Redoing the creation restores the same annotation and the same badge value.
   - Undoing or redoing delete operations must not renumber other annotations.

6. **Reset**
   - The UI provides a reset action that sets the current editor session's next number to `1`.
   - Reset does not modify existing annotation badges.
   - Reset is not part of annotation undo/redo history because it affects only future annotation creation and does not modify the canvas.

#### Badge Placement

1. **Smart note**
   - Smart note placement is two-level because the annotation is a group: target shape, arrow, and label.
   - Users first choose the anchor object: target, arrow, or label.
   - If anchored to a rectangular target, positions are top-left, top-right, bottom-left, bottom-right, and center.
   - If anchored to an elliptical target, positions are left, right, top, bottom, and center.
   - If anchored to the arrow, positions are start, middle, and end.
   - If anchored to the label, positions are left and right.
   - Default smart note badge placement is label-left.

2. **Rectangle tool**
   - For rectangular shapes, positions are top-left, top-right, bottom-left, bottom-right, and center.
   - For elliptical shapes, positions are left, right, top, bottom, and center.

3. **Arrow tool**
   - Positions are start, middle, and end.

4. **Text tool**
   - Positions are left and right relative to the rendered text box.
   - The badge is independent from the text content and follows text direction and measured text width.

5. **Boundary handling**
   - Badge placement should honor the user's selected position first.
   - If the badge would be outside the visible crop/export region, it is shifted inward enough to stay visible.

#### Badge Style

1. **Global style**
   - All tools share one badge visual style.
   - The style applies only to newly created badges.
   - Existing badges keep their stored style.

2. **Configurable fields**
   - Background color.
   - Number text color.
   - Shape.
   - Font size.

3. **Shape options**
   - Default shape is square.
   - Square means an equal-width/equal-height block sized to fit the number.
   - Other supported shapes are rounded rectangle and circle.
   - Border color and border width are excluded from V0.3.0.

### Input/Output

- **Input**:
  - Tool option panel toggle for automatic numbering.
  - Tool option panel controls for badge placement.
  - Global badge style controls for background color, text color, shape, and font size.
  - Reset next number action.
  - Existing annotation creation gestures for smart note, rectangle, arrow, and text.
- **Output**:
  - Newly created supported annotations can include an independent number badge.
  - Editor preview shows badges at the configured positions.
  - Exported PNG/JPG and clipboard output include visible badges.
  - Persisted settings restore after app restart.

### Edge Cases

- If numbering is disabled for a tool, creating that tool's annotation must not consume a number.
- If a numbered annotation is created and then immediately undone, the next number should return to its previous value.
- If settings are corrupt or partially missing, StepMark falls back to defaults without crashing.
- If the user changes a smart note from rectangle to ellipse and the saved target position is not valid for the new shape, target placement falls back to center.
- If a text annotation is empty during editing, the badge still uses the text box anchor and updates once text width is known.
- If a badge is larger than the annotation itself, center it on the anchor and keep it inside the crop region where possible.

## Design Decisions

### Technical Approach

- **Architecture Choice**: Keep the Tauri 2 + React + TypeScript + Vite + Konva + Zustand architecture from V0.2.0.
- **Badge model**: Add an optional `numberBadge` field to annotations. The badge is rendered by shape components but stored as annotation data.
- **Settings model**: Add a persistent numbering settings store backed by localStorage with validation and default fallback.
- **Session sequence**: Store `nextNumber` in the editor session state, not in persistent settings.
- **Rendering model**: Render badges in Konva so export and clipboard output naturally include them.
- **Interaction model**: Badges are not independently selectable or draggable in V0.3.0. Moving or resizing an annotation updates the badge position through geometry.

### Suggested Data Model Changes

```typescript
type BadgeShape = "square" | "rounded" | "circle";

interface NumberBadgeStyle {
  bgColor: string;
  textColor: string;
  shape: BadgeShape;
  fontSize: number;
}

interface NumberBadge {
  value: number;
  style: NumberBadgeStyle;
}

interface Annotation {
  // existing V0.2 fields...
  numberBadge?: NumberBadge;
}

interface NumberingSettings {
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

### Constraints

- **Platform**: Windows x64 only.
- **Compatibility**: V0.3.0 depends on the V0.2.0 editor and style panel foundation.
- **Performance**: Badge rendering must not make drag, resize, or arrow preview visibly laggy on a normal 1080p display.
- **Visual Quality**: Default badge style is a square block. The badge must remain legible against common screenshot backgrounds.
- **Implementation Boundary**: Do not add a full settings page for V0.3.0. Use existing tool option panels and a compact numbering/badge style section.

### Risk Assessment

- **Placement complexity risk**: Smart notes have target, arrow, and label sub-anchors. Mitigation: centralize badge anchor geometry helpers and unit-test each anchor type.
- **Undo/redo risk**: Sequence state can drift from annotation history. Mitigation: include `nextNumber` in editor history snapshots when numbered annotation creation changes it.
- **Export risk**: HTML overlays would not export. Mitigation: render badges in Konva, not as external HTML.
- **UI density risk**: Tool panels can become crowded. Mitigation: show only the numbering controls relevant to the active tool, and keep badge style controls compact.

## Acceptance Criteria

### Functional Acceptance

- [ ] Smart note automatic numbering is enabled by default.
- [ ] Rectangle, arrow, and text automatic numbering are disabled by default.
- [ ] Numbering can be enabled or disabled per supported tool.
- [ ] Number values are global across smart note, rectangle, arrow, and text tools in one editor session.
- [ ] Each new screenshot starts numbering from `1`.
- [ ] Numbering settings persist after app restart.
- [ ] `nextNumber` does not persist across screenshots.
- [ ] Deleting a numbered annotation does not renumber remaining annotations.
- [ ] Undoing numbered annotation creation reverts the next number.
- [ ] Redoing numbered annotation creation restores the original badge value.
- [ ] Reset next number sets the next created badge to `1` without changing existing badges.
- [ ] Smart note badge placement supports target, arrow, and label anchors.
- [ ] Smart note target placement supports rectangular and elliptical target position sets.
- [ ] Rectangle/ellipse tool badge placement supports the appropriate position set for the current shape.
- [ ] Arrow badge placement supports start, middle, and end.
- [ ] Text badge placement supports left and right.
- [ ] Badge style supports background color, text color, shape, and font size.
- [ ] Badge shape supports square, rounded rectangle, and circle, with square as the default.
- [ ] Badges are included in copy and save export output.
- [ ] Badges stay visible inside the current crop/export region where possible.

### Quality Standards

- [ ] Badge placement geometry helpers have unit tests.
- [ ] Numbering settings validation and corrupt fallback have unit tests.
- [ ] Editor history tests or focused state tests cover create, undo, redo, delete, and reset numbering behavior.
- [ ] Existing V0.2.0 flows still pass: capture, crop adjust, smart note, rectangle/ellipse, arrow, text, copy, save.
- [ ] Manual smoke test covers badge placement on all supported tools.

### User Acceptance

- [ ] Users can create numbered smart notes without typing the number manually.
- [ ] Users can choose where badges appear for each supported tool.
- [ ] Badge style is easy to distinguish from the red default annotation style.
- [ ] Badge values feel stable and trustworthy after delete, undo, redo, and export.

## Execution Phases

### Phase 1: Data Model and Settings

**Goal**: Add persistent numbering settings and session sequence state.

- [ ] Add number badge types and default settings.
- [ ] Add persistent numbering settings store with validation and fallback.
- [ ] Add editor session `nextNumber` handling.
- [ ] Extend history snapshots where needed for sequence rollback.

**Deliverables**: Types, store, defaults, settings tests.
**Time**: 0.5-1 day.

### Phase 2: Badge Geometry and Rendering

**Goal**: Compute and render badge positions consistently.

- [ ] Add badge measurement helpers.
- [ ] Add target, ellipse, arrow, label, and text badge anchor helpers.
- [ ] Add crop-boundary inward shifting.
- [ ] Add Konva badge renderer.
- [ ] Add unit tests for placement helpers.

**Deliverables**: Geometry helpers, renderer, tests.
**Time**: 1 day.

### Phase 3: Tool Integration

**Goal**: Attach badges to newly created annotations.

- [ ] Integrate numbering with smart note creation.
- [ ] Integrate numbering with rectangle/ellipse creation.
- [ ] Integrate numbering with arrow creation.
- [ ] Integrate numbering with text creation.
- [ ] Ensure disabled tools do not consume numbers.
- [ ] Ensure undo/redo/delete behavior matches the PRD.

**Deliverables**: Numbered annotations across supported tools.
**Time**: 1-1.5 days.

### Phase 4: Toolbar Controls

**Goal**: Expose numbering controls in the existing V0.2 style panel system.

- [ ] Add per-tool automatic numbering toggle.
- [ ] Add per-tool placement controls.
- [ ] Add global badge style controls.
- [ ] Add reset next number action.
- [ ] Keep tool panels compact and readable.

**Deliverables**: Usable numbering UI.
**Time**: 1 day.

### Phase 5: Regression and Release

**Goal**: Stabilize V0.3.0 for release.

- [ ] Run unit tests.
- [ ] Run frontend build.
- [ ] Manual smoke test all badge placements and export paths.
- [ ] Update release notes.

**Deliverables**: Release-ready V0.3.0 build and notes.
**Time**: 0.5-1 day.

---

**Document Version**: 1.0
**Created**: 2026-06-22
**Clarification Rounds**: 5
**Quality Score**: 94/100
