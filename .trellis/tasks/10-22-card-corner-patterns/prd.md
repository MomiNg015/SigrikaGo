# 内容卡片角部几何纹理三版样板

## Goal
Review player-facing content-card families and provide three concrete corner-geometric texture options grounded in the current Bright School theme and StarTorch academy context.

## Requirements
- Three visually distinct directions: orbital arcs, diagonal facets, and Go-coordinate geometry.
- Non-tiling, finite corner compositions with deliberate scale variation.
- Render the current ResumeModal and UserProfileCard with current typography, content, layout, state colors and interaction unchanged.
- Include compact and prose card studies to demonstrate broader use; report the source-level audit across card families.
- Desktop and portrait 390/320px previews, original/texture-off comparison, normal/empty/long-name fixtures.
- Isolated files under docs/design-samples/card-corner-patterns-2026-10-22; no production UI edits.

## Decisions
The user requested three samples, which already authorizes the design exploration. Selection/integration is a subsequent task; no extra approval is needed to prepare these samples. Use finite SVG background images (no-repeat) rather than tiled textures. Preserve the existing outer window grid.

## Expansion and boundaries
- Future: shared semantic motif sizing could be introduced after selection.
- Adjacent contexts: profile, handbook descriptions, friends detail, warehouse detail, achievements and announcements.
- Dense rows, buttons, admin, cinematics and storefront artwork should not receive indiscriminate decoration.
- Preserve unrelated in-progress source, spec and documentation edits.

## Acceptance criteria
- [x] All three directions visible in both real profile contexts and card studies.
- [x] Corner backgrounds do not change baseline geometry or text: 18 comparisons passed.
- [x] Desktop/portrait, empty data, long names and meaningful controls checked.
- [x] Screenshots visually inspected; no browser errors; all motifs use no-repeat.
- [x] Review notes and system-design entry updated; documentation regenerated.

## Quality and spec decision
Sample JS/JSX passed the project ESLint rules. 18 baseline geometry/text comparisons and 6 narrow edge cases passed. The new CSS is paint-only and is not imported by production. No production code contract changed, so the design choices and safe integration boundary are documented in the sample README rather than imposed on existing specs. User selection is deliberately deferred to the next task.

## QA inventory
Variant, context, viewport, texture toggle, fixture and standalone links; live mode/play controls; close/reopen and mock auxiliary entry. Verify the last character row on short phones. Confirm SVG backgrounds are no-repeat, absent on dense rows and pointer-neutral.

## Sources
PRODUCT.md, DESIGN.md, profile-dossier/card-surfaces.css, profile-paper-cards.css, ProfileResumeView.jsx, friends-companion.css, warehouse-field-guide-detail.css, character-details.css, announcement/detail.css. The existing profile-surfaces fixture demonstrates the local-only request harness and is copied into this independent sample.
