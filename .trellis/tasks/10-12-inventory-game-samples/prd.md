# Warehouse game-feel samples

## Goal
Review the existing warehouse and deliver three interactive visual directions using the existing cream, pink, mint, blue and brown campus palette. User requests game feel, less rounded rectangular chrome and no redundant annotations.

## Confirmed scope
- Three isolated samples: club supply case, item field guide, arcade backpack.
- Reuse existing item artwork and title font. Different layouts and selection treatments within the current palette.
- Desktop and portrait phone layouts; local filters, selection, character choice, consumption, close and reopen.
- Keep production warehouse and real account state untouched. All inventory counts are fixtures.
- Update system-design entry and regenerate HTML.

## Review
WarehouseItemGrid repeats image, description and action in every article. The Bright School warehouse-item-card owner adds 18px rounding to both card and media, pill labels and thick shadows. This repeats containers and dilutes item focus. Samples separate browsing from one focused action area.

## Acceptance
- Three distinct selectable layouts, real project assets, no explanatory paragraphs in the UI.
- No horizontal overflow at 320, 390 and 1440px.
- All sample controls work; exhausted items cannot be consumed; cancel preserves counts.
- Browser visual inspection, asset/error checks, scoped lint and docs generation.

## Out of scope
Production integration, backend changes, item balancing, account writes and replacement art.

## Delivery
- Added `docs/design-samples/warehouse-2026-10-12/` with three interactive directions and screenshots.
- Passed 12 viewport/interaction combinations, scoped project lint, missing-image/console checks, reduced motion and phone reset.
- Updated system-design entry and generated HTML; reviewed sample screenshots at desktop and portrait sizes.
- No new production conventions or contracts to add to specs. Existing dirty repository work remains untouched.
- Samples delivered for visual selection; production promotion is not part of this task.

## Approved follow-up
User selected direction 2 (item field guide). Promote the book layout to the production warehouse. Preserve server inventory, real item use, recipient restrictions, story callbacks, unusable recruitment items and hidden actions. Add selection/filter/page behavior with safe fallback after inventory changes. Preserve unrelated WIP. Validate the complete theme cascade on desktop and portrait phones and refresh system design.

## Integration verification

Follow-up request: restore the original sticker header and shell appearance; fixed-height window with internal scrolling; remove directory/archive indices, archive heading and decorative stars. Implemented with existing sticker geometry, 680px desktop / 740px phone caps and unchanged original shell decoration. Browser checks now compare original computed shell appearance and fixed height across filters and stress states.
- Approved direction integrated; no changes to item API, inventory hook implementation or target dialog.
- 16 browser viewport/stress combinations pass, including real component callback flow with isolated API fixtures.
- All 21 warehouse tests, stylesheet import contract, repository lint, production build and built-CSS checks pass.
- Combined targeted run: 96 passed, 2 unrelated CSS inventory failures (889 pre-existing bytes above allowance, unregistered match-mode 360px media query). Own CSS allowance accounts exactly for 3 files, 9846 normalized bytes and 59 important declarations.
- Spec and system-design synchronized. Commit/archive pending shared quality gate; unrelated workspace edits remain intact.

Height-fill refinement: directory and hero occupy the available grid tracks; directory and long descriptions scroll independently. Action and pagination retain fixed bottom rows across normal, long and many-item states. Portrait layout distributes height between the two-column directory and inspector, with centered item details. Production checks assert these geometry contracts at all four viewports.

Recruitment navigation refinement: replace the disabled label with 前去招募. The enabled action closes warehouse and opens the existing recruitment overlay, never consumes an item, and preserves hidden actions and pending-request locks.

Target-card refinement: reuse the matching painted ID card content and style, preserve item-target rules and accessible reasons, and mute unavailable targets. Desktop uses five columns; phones use two with contained scrolling. `verify-targets.mjs` verifies seven targets, disabled state, loaded frames, name fit, scroll containment and closing back to warehouse at four viewport sizes. Related warehouse and matching suites pass 32 tests.

Quantity samples requested: ship three isolated, live warehouse quantity treatments (paper tag, ink stamp, game counter) for selection, preserving the approved shell/layout and palette. Use the existing production component with preview-only CSS; test one- through four-digit counts, local consumption and mobile fit. All 18 scenarios pass; the stamp treatment is now promoted after user selection.

Approved quantity direction 2 is applied to the three existing warehouse CSS owners: ink underline in the directory, tilted double-line stamp beside the hero, compact portrait geometry and Arial tabular numerals. Removed the redundant owned-count node; action alignment remains stable. Verification includes the production styling without preview attributes alongside the three retained comparisons.

Detail title refinement: a content-width pale-pink paper label and pink left rule distinguish the item name from category/body copy. Long titles wrap; portrait padding is compact. Existing fixed-height and inner-scroll behavior remains.

Title underline exploration: user rejected the title paper block and requested three casual hand-drawn underline samples. `title.html` switches pink marker, blue double pencil and pink/mint wave strokes within the production fixture. Background/left border are removed only in these previews; hand-authored SVG backgrounds use the existing palette. `verify-title.mjs` checks 18 normal/long title and desktop/portrait cases plus live switching. User selected title direction 1, now promoted.

Approved title direction 1 (pink marker) is now in production via the shared public SVG and existing detail/mobile style owners. Replaces the rejected paper rectangle and left rule; preserves typography, stamp quantities and fixed layout. Production without preview attributes is included in the title checks.
