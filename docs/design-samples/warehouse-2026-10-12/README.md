# Warehouse visual directions

## Selected direction

Follow-up refinement restores the original warehouse sticker artwork, close control, border, grid-paper background, corner radius and shadow. The window is fixed at 680px on desktop and 740px on phones, capped by existing sticker-safe viewport height; only the content scrolls. Directory indices, archive heading/index and decorative stars are removed. Production QA compares shell appearance against the original theme and asserts stable height across filters and all stress states.

Direction 2 was approved and integrated into the real `WarehouseModal` and `WarehouseItemGrid`. `production.html` previews those components with the complete production theme and isolated local API fixtures. It never submits account requests. Use `?long`, `?many` and `?empty` to inspect stress states. The original comparison page remains a design reference.

Production preserves real item metadata, recruitment navigation/hidden actions, the existing request lock and the existing recipient/story flow. Local preview quantities are not account quantities. Run `node docs/design-samples/warehouse-2026-10-12/verify-production.mjs`; all 16 viewport/state combinations passed, including long content and 30 items. Warehouse DOM tests cover callback routing and inventory refresh. A pre-existing Denia portrait test expectation was updated to its current rainbow-spray avatar. Design-hook color warnings in legacy test assertions are unchanged fixture values, not new palette additions.

Production verification: repository lint, build and built-CSS checks passed; warehouse tests passed (21 assertions/tests across three suites), and the shared stylesheet import contract passed. The combined selection has 96 passing tests and two pre-existing CSS-inventory failures: an unrelated `(max-width: 360px)` query in `match-mode-title-layout.css`, plus 889 bytes above the previous workspace debt allowance after accounting exactly for this feature's 9846-byte delta. Those unrelated contracts were not loosened. System-design HTML was regenerated. Build still reports the existing large-chunk warning. Commit/archive remains pending the quality gate.

Open `/docs/design-samples/warehouse-2026-10-12/index.html` on the existing Vite development server. The toolbar switches between three directions and a portrait phone preview. Add `?view=case`, `?view=book`, or `?view=arcade` to deep-link; `&embed=1` hides the sample toolbar.

## Review

The current `src/modals/warehouse/WarehouseItemGrid.jsx` repeats media, copy and an action in each item. `src/styles/themes/bright-school/commerce/warehouse-profile/warehouse-item-card.css` applies 18px rounding to both the card and image well, pill text/quantity labels and a thick offset shadow. Equal visual weight and nested containers compete with item artwork.

These samples expose one selected item and one action area. Names and counts remain visible in the collection. Existing item art, classroom background and LXGWMarkerGothic title font are reused.

| Direction | Layout | Tradeoff |
| --- | --- | --- |
| Club supply case | Mint case, compartment tray, cream inspection leaf | Clearest inventory grouping; more structural chrome |
| Item field guide | Paper directory, illustrated archive page and previous/next controls | Strong campus identity; slower to scan than the tray |
| Arcade backpack | Blue title panel, pink selected slot, mint cut-corner grid and enlarged item | Strongest game-menu energy; more angular visual weight |

## Boundaries

The comparison page counts, descriptions and recipient roster are sample fixtures, not live account data. Consumption only mutates local React state. Recruitment displays a local readiness message. No production imports of sample files. Phone preview has independent state, reset by the toolbar reset control. The selected production version preserves hidden/disabled recruitment actions rather than using this comparison-page readiness message.

## Palette and design-hook review

Main colors match `DESIGN.md`: sheet `#fffaf0`, ink `#3d2b25`, pink `#ff9ebb`, mint `#bfe8dd`, blue `#9ad3de`. Secondary muted paper, divider and case-shadow tones are intentional local material shades, not a new theme palette. Font alias was corrected to the documented `Sigrika Window Title`; it uses the same existing font asset. Hook rounded-border findings are false positives from compact CSS combining separate selectors: item containers and buttons have zero radius; only circular ornaments use 50% radius. No suppressions added.

## Verification

Run `node docs/design-samples/warehouse-2026-10-12/verify.mjs` with Vite at port 5173. It applies the repository ESLint rules explicitly because this new sample is outside the maintained-file lint list, then checks all three directions at 1440×1000, 390×844, 360×640 and 320×568.

Coverage includes missing artwork, horizontal overflow, clipped labels, filters, cancel without consuming, choosing a recipient, repeated use to exhaustion, coin-bag exhaustion, recruitment feedback, book previous/next, close/reopen, variant picker, phone iframe reset and reduced motion. Screenshots and `verification.json` capture the results. Vertical page scrolling on short phones is intentional. No permanent timers, network writes, or background animation loops are introduced.

Height-fill refinement: directory and hero occupy the available grid tracks; directory and long descriptions scroll independently. Action and pagination retain fixed bottom rows across normal, long and many-item states. Portrait layout distributes height between the two-column directory and inspector, with centered item details. Production checks assert these geometry contracts at all four viewports.

Recruitment navigation: 前去招募 now opens the existing recruitment window and closes warehouse without consuming inventory. Production preview includes the real recruitment modal with isolated fixtures; all four normal viewport checks click through and assert warehouse removal. Updated component and overlay suites pass all 32 tests.

Target-card refinement: reuse the matching painted ID card content and style, preserve item-target rules and accessible reasons, and mute unavailable targets. Desktop uses five columns; phones use two with contained scrolling. `verify-targets.mjs` verifies seven targets, disabled state, loaded frames, name fit, scroll containment and closing back to warehouse at four viewport sizes. Related warehouse and matching suites pass 32 tests.

Quantity comparison: `quantity.html` offers tag, stamp and counter treatments within the real warehouse preview, retaining its shell and palette. Styles are imported only by the fixture preview, scoped by `data-quantity-style`, and do not change production CSS. `verify-quantity.mjs` passes 18 style/viewport/count cases plus picker switching. Quantity stress uses `&largeCounts`. The fixture removes the duplicate owned count in each proposal. User selected the stamp treatment, now applied in production.

Approved quantity direction 2 is applied to the three existing warehouse CSS owners: ink underline in the directory, tilted double-line stamp beside the hero, compact portrait geometry and Arial tabular numerals. Removed the redundant owned-count node; action alignment remains stable. Verification includes the production styling without preview attributes alongside the three retained comparisons.

Detail title refinement: a content-width pale-pink paper label and pink left rule distinguish the item name from category/body copy. Long titles wrap; portrait padding is compact. Existing fixed-height and inner-scroll behavior remains.

Title underline exploration: user rejected the title paper block and requested three casual hand-drawn underline samples. `title.html` switches pink marker, blue double pencil and pink/mint wave strokes within the production fixture. Background/left border are removed only in these previews; hand-authored SVG backgrounds use the existing palette. `verify-title.mjs` checks 18 normal/long title and desktop/portrait cases plus live switching. User selected title direction 1, now promoted.

Approved title direction 1 (pink marker) is now in production via the shared public SVG and existing detail/mobile style owners. Replaces the rejected paper rectangle and left rule; preserves typography, stamp quantities and fixed layout. Production without preview attributes is included in the title checks.
