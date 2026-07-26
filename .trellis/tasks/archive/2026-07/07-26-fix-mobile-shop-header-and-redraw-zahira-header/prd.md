# Fix mobile shop header and redraw Zahira header

## Goal

Make the shared shop header visually and geometrically consistent: align the mobile refresh and close controls exactly, and replace Zahira's current hard-cropped storefront background with a simple low-detail color band.

## Requirements

- Fix the mobile shop close button so it shares the refresh button's vertical center at portrait widths.
- The final mobile owner must neutralize later generic modal positioning without changing the 44px touch targets.
- The fix applies to both Zahira and Fractsidus because they share the same semantic header.
- Use a simple blue-gray to muted-purple color treatment only for `.shop-header[data-store="zahira"]`; the Fractsidus deep-red header remains unchanged.
- Do not draw or crop canopy, tassel, shelf, tent, character, product, or other scene elements into the Zahira header.
- The header must read as a separate control strip instead of implying a continuous illustration with the main shop background.
- Preserve readable dark-plum Zahira title text and the existing familiar paper controls.

## Acceptance Criteria

- [x] At 375x812 and 375x600, refresh and close button top/center coordinates differ by no more than 1px at rest.
- [x] Both mobile controls remain exactly 44x44px and neither is absolutely positioned.
- [x] Zahira header uses a simple low-detail CSS color band rather than cropping `zahira-shop-background-crayon-v1.webp` or adding another scene image.
- [x] The Zahira header remains quieter than the title and controls and is visibly separate from the main illustration.
- [x] Fractsidus header colors and image source remain unchanged.
- [x] Desktop and portrait browser screenshots show no title clipping or header/body seam regression.
- [x] Shop CSS contract tests and the CSS debt non-growth contract pass for this task's commit snapshot.
- [x] `docs/system-design.md`, the relevant UI/theme chapter, and generated HTML are synchronized.

## Definition of Done

- Focused tests pass.
- Desktop and portrait browser checks pass.
- System-design documentation is regenerated.
- Unrelated hover-performance work remains untouched and excluded from the commit.

## Technical Approach

- Give the existing explicit `data-store="zahira"` owner one simple low-detail color gradient with no scene imagery.
- Put the alignment correction in `src/styles/mobile-adaptive/shop-window-redesign.css`, which is the final portrait safety layer.
- Lock the source ownership and mobile alignment declarations in `ShopModal.test.js`.

## Decision (ADR-lite)

**Context:** Cropping the full storefront into a 60–68px header produces unpredictable detail density, while generic modal close-button rules can override the shared grid geometry on mobile.

**Decision:** Use a simple scene-free Zahira color band and an explicit final mobile shop-button alignment owner.

**Consequences:** The header stays intentionally separate from the main illustration, adds no new runtime asset, and the two controls no longer depend on generic modal positioning.

## Out of Scope

- Redrawing either shop body background.
- Changing the Fractsidus header artwork.
- Changing title copy, refresh behavior, close behavior, or shop navigation.
- Editing the parallel costume/music hover-performance task.

## Technical Notes

- `ShopModal.jsx` already provides `data-store={activeStore}` and semantic refresh/title/close order.
- Current computed mobile state showed the refresh button at `y=19.5` and close button at `y=24`, with the close button resolving to `position:absolute`.
- Existing Zahira source: `public/assets/shop/zahira-shop-background-crayon-v1.png`.
- Existing owners: `background-crayon.css`, `window-redesign.css`, and final `mobile-adaptive/shop-window-redesign.css`.
