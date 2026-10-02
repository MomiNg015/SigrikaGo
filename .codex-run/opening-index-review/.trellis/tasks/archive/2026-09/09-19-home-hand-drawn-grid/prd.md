# Home hand-drawn grid

## Goal
Add a quiet hand-drawn grid to the existing cream home board requested in the screenshot.

## Requirements
- Preserve paper texture, frame, artwork, layout and interactions.
- Warm brown, subtly irregular square lines; static and below the content.
- Desktop and portrait mobile support; no changes to corruption surfaces.

## Approach
Use a small repeating SVG background on the board's existing before pseudo-element. Inset it inside the frame and disable pointer events. Existing artwork remains untouched. Prefer this over editing the raster board so density can adapt without stretching strokes.

## Acceptance
- [x] Visible quiet grid inside the board at desktop and portrait sizes (2542, 1920, 1440 and 390px browser previews).
- [x] Decoration is static, inset from the frame, and pointer-events none; existing content geometry remains intact.
- [x] 2527 existing tests passed in the limited-worker full run; the two stale baseline/generated-doc failures were corrected and their 23 tests passed on rerun. Build, built CSS, portrait, admin snapshot and production config checks passed. System design HTML regenerated.

## Review notes
The original 28px board radius is existing raster-frame geometry and intentionally unchanged. The new grid radius uses the documented 16px value. CSS budget records only this feature's measured growth. No new reusable spec pattern is needed for this local decoration.

## Scope
Only home board decoration, documentation and task metadata. No new settings, animation or layout changes.
