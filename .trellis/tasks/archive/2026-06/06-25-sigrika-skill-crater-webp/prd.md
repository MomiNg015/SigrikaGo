# create Sigrika skill crater webp asset

## Goal

Use the supplied transparent PNG artwork as Sigrika's resolved erase-point crater/field marker, delivered as a runtime WebP asset and displayed at 1.5 board-cell lengths on both desktop and mobile boards.

## Requirements

* Convert `C:/Users/Moming/Pictures/q版/ri1.png` to WebP with alpha preserved.
* Replace the existing Sigrika erase-point marker at `public/assets/effects/sigrika-erased-field-marker.webp`.
* Render the point-local marker at `150%` of a board point cell, equivalent to 1.5 board-cell lengths.
* Keep the marker pointer-transparent and compatible with the existing pending meteor reveal animation.
* Update the Board style contract test that locks marker size and asset usage.
* Update system design documentation because this changes a runtime skill-effect resource and presentation fact.

## Acceptance Criteria

* [ ] `public/assets/effects/sigrika-erased-field-marker.webp` is generated from the supplied PNG and has an alpha channel.
* [ ] `.void` uses `--erased-field-marker-size: 150%`.
* [ ] Board tests pass for the Sigrika erased-field marker contract.
* [ ] `docs/system-design.md` and the relevant `docs/system-design/`分篇 describe the updated WebP marker and 1.5-cell size.
* [ ] `npm run docs:system-design` regenerates `docs/system-design.html`.

## Definition of Done

* Focused tests pass.
* System design docs are regenerated.
* Existing unrelated working-tree changes are left untouched.

## Technical Approach

Use Pillow to perform deterministic PNG to WebP conversion without invoking image generation. The existing board marker is a point-local DOM/CSS `.void` element, so updating the CSS size applies consistently across desktop and mobile because both layouts share the same board point grid.

## Decision (ADR-lite)

Context: The project already has a Sigrika marker asset and DOM/CSS presentation path.
Decision: Replace the existing marker asset in place and update the CSS variable from 72% to 150%.
Consequences: Existing references and preload manifests remain stable, while visual size changes everywhere the shared board CSS is used.

## Out of Scope

* Changing Sigrika's skill rules or target validation.
* Reworking the Pixi meteor animation.
* Adding new asset filenames or preload groups.

## Technical Notes

* Relevant marker CSS: `src/styles/room/board/latest-touch-void.css`.
* Relevant test: `src/room/Board.test.js`.
* Runtime docs: `docs/system-design.md`, `docs/system-design/01-project-overview.md`, and `docs/system-design/05-assets-audio-preload.md`.
