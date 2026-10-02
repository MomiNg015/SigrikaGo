# admin story tutorial node settings popup

## Goal

Make the admin story/tutorial node editor faster to use by turning the selected-node settings panel into a floating window opened from the flow graph, positioned near the click/tap point when possible, and by exposing the existing insert-after-current-node action inside that window.

## Requirements

* Clicking a flow graph node, merge target, path guide entry, issue item, or newly inserted node keeps selecting/revealing the node as before.
* Direct clicks on actual graph node cards open the node settings as a floating window near the user's pointer position on desktop.
* The floating settings window has an explicit close button and can be dismissed without changing the selected node.
* The settings window reuses the current `StepEditor` form behavior for all node types and fields.
* The settings window includes an "插入步骤" button that calls the same `addNodeAfter()` behavior as the existing flow-header insert action, so it adds a new node after the currently selected node and reveals/highlights it.
* Narrow/mobile layouts must still be usable; the settings window should fit within the viewport and avoid horizontal overflow.
* The flow graph, path guide, issues panel, and preview remain synchronized with the selected node.

## Acceptance Criteria

* [x] Clicking a node card opens the settings window with that node selected.
* [x] The window is clamped inside the viewport instead of rendering off-screen.
* [x] The close button hides the settings window.
* [x] The "插入步骤" button inside the window inserts after the selected node using the same code path as the existing insert button.
* [x] On mobile/narrow screens, the window remains readable and operable.
* [x] Relevant static tests cover the new source/CSS contracts.
* [x] `docs/system-design.md` and regenerated `docs/system-design.html` are updated because this changes documented admin editor behavior.

## Definition of Done

* Tests added or updated for the editor interaction contract.
* Focused test command passes for the affected admin editor tests.
* System design docs regenerated with `npm run docs:system-design`.
* Changes stay inside the admin story workbench surface unless a direct dependency requires otherwise.

## Technical Approach

Reuse existing `selectedNodeId`, `revealNode()`, `addNodeAfter()`, and `StepEditor` plumbing. Add a small piece of UI state for the settings window position and visibility. Teach flow-node selection to accept pointer coordinates for real node-card clicks, then render `StepEditor` in a floating `dialog` surface outside the support grid.

The previous support-grid middle column is removed so issues and preview remain below the graph while the editor appears only when requested. CSS stays in the existing `admin-story-workbench` namespace and uses viewport clamping plus a mobile media rule.

## Decision (ADR-lite)

**Context**: The current editor form is always visible in the support grid, which makes repeated graph edits require attention shifts and consumes layout width.

**Decision**: Keep the graph as the source of node selection and move the form into a floating window opened by node clicks, while preserving the same form component and insert-after-node behavior.

**Consequences**: This avoids duplicating node field code and keeps graph/readability improvements intact. The floating layer needs explicit viewport bounds and a close affordance so it does not block mobile use.

## Out of Scope

* No StoryScript data model changes.
* No drag-and-drop graph editing.
* No redesign of script library, issue grouping, preview playback, or branch swimlane rules.

## Technical Notes

* Relevant implementation files: `src/admin/AdminOnboardingStory.jsx`, `src/styles/admin/story-workbench/forms-preview.css`, `src/styles/admin/story-workbench/overlays.css`, and `src/styles/admin/story-workbench/shell.css`.
* Existing insertion behavior lives in `addNodeAfter()` and already inserts after `selectedNode`.
* Existing tests in `src/admin/AdminOnboardingStory.test.jsx` are static contract tests for the workbench source and CSS.
* Existing system design docs already describe the editor as a desktop/mobile-aware story workbench and must be updated to mention the floating node settings window.

## Verification

* `npm test -- src/admin/AdminOnboardingStory.test.jsx src/styles/styleContract.test.js src/styles/cssLayerInventory.test.js`
* `npm run build`
* `npm run docs:system-design`
* `npm run check`
