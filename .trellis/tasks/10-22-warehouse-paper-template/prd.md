# Warehouse paper-card template

## Request and scope
Create one reviewable warehouse content template following the user's retained hard-shadow, hover and press direction. Reconsider quantity styling. This is a sample-only request: do not modify production components or styles.

## Decisions
Keep the current title sticker, window exterior and directory/detail structure. Turn directory entries into tangible paper cards with 3px/4px ink shadows and an opaque selected state. Give the detail area a matching paper surface. Replace underlined small counts and the tilted double-border stamp with aligned `持有` plus a clear numeral; never cover item artwork. Desktop stays split; portrait uses a single-column scrolling directory over a detail card with larger artwork. Preserve real bundled item assets and LXGW typography.

### Confirmed follow-up
1. Mobile shows exactly one item per row.
2. Restore the original circular backdrop, dashed ring and -7 degree artwork rotation.
3. Remove detail x/y pagination and previous/next controls.
4. Remove category filters, category labels and item-kind counter.
5. Give the detail artwork as much space as practical while keeping quantity and action visible.

## Prototype behavior
Local fixture quantities only; selectable items, local use confirmation and reset. Recruitment shows a local preview message without consuming items. Support large counts, empty inventory and narrow portrait sizing through sample controls. Compare against the existing isolated production preview. No API calls, account mutations, new dependencies or generated artwork.

## Acceptance and verification
- [x] One interactive template plus current-view comparison is saved under docs/design-samples.
- [x] Quantity positions remain readable at 1/12/128/9999; long names and no inventory remain usable.
- [x] Desktop, 390/360/320px and short portrait render without overflow or cropped shadows/actions.
- [x] Hover/press/reduced-motion, selection and local quantity consumption work; categories and paging are absent.
- [x] Screenshots, concise rationale and system-design summary are saved; unrelated WIP remains untouched.

## Results
Scoped ESLint, 8 browser viewport/state checks and interaction checks passed, with zero API requests. System-design HTML regenerated and its 4 consistency tests passed. Screenshots reviewed at desktop, standard/narrow/short portrait and large-count/long-name states. No production implementation or reusable specification contract changed; no spec additions needed.

## Inputs
Current WarehouseModal/WarehouseItemGrid and field-guide CSS; the earlier 2026-10-12 quantity exploration (stamp was selected then); current DESIGN.md; latest approved friend paper-card feedback. No additional preference question is necessary for a concrete first template.
