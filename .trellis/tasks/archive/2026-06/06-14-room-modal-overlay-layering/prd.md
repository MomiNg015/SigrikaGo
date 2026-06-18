# Fix Room Modal Overlay Layering

## Goal

Ensure room modal backdrops visually cover desktop room floating controls, including both players' skill chips and the chat button, when confirmation or request-related modal UI appears.

## Requirements

* Raise the shared modal backdrop stacking contract above room floating surfaces that use `--room-floating-z`.
* Preserve the existing `--room-floating-z` behavior for skill detail panels, chat popovers, and room member popovers.
* Keep mobile character-chain badges compact so they do not cover small portrait art.
* Do not change room gameplay, modal interaction behavior, or request timeout logic.
* Update system design docs per project instructions.

## Acceptance Criteria

* [x] `.modal-backdrop` stacks above room floating layers such as skill chips and chat controls.
* [x] Static tests lock the modal backdrop z-index above the known room floating defaults and dynamic base.
* [x] Mobile room portrait strips render chain count as a compact star/count pill instead of a full repeated-star badge over the portrait.
* [x] Existing room floating layer tests continue to pass.
* [x] `docs/system-design.md` is updated and `docs/system-design.html` is regenerated.

## Definition of Done

* Targeted tests pass.
* System design docs are regenerated.
* Aggregate `npm run check` passes.
* No unrelated files are reverted or included.

## Technical Approach

Use the shared modal CSS layer as the single source of truth for the app-wide backdrop z-index. Keep room floating components unchanged so their internal ordering still works, but raise modal backdrops above them.

## Decision (ADR-lite)

Context: Room controls intentionally use `--room-floating-z` so skill details, chat popovers, and member popovers can rise above each other. The shared modal backdrop was still at `z-index: 10`, below those room controls.

Decision: Raise `.modal-backdrop` in the shared modal CSS and add a static contract test.

Consequences: Modal overlays consistently dim room controls without weakening the room floating-layer contract.

## Out of Scope

* Reworking modal rendering into React portals.
* Changing request toast design or room action logic.
* Refactoring global z-index tokens.

## Technical Notes

* `src/styles/modals/base-result-skill.css` currently sets `.modal-backdrop { z-index: 10; }`.
* `src/styles/room/players-timers-skills.css` uses `--room-floating-z` defaults of `20`, `60`, `80`, and `90`.
* `src/styles/room/chat-responsive.css` uses `--room-floating-z` default `24` for chat controls.
* `src/room/RoomBattleStage.jsx` starts dynamic floating layers at `90`.
