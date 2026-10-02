# mobile shop item meta row alignment

## Goal

Fix the Bright School portrait mobile shop card regression where item-category cards hide the visible price and do not visually center their content after the previous compact card layout change.

## Requirements

- Mobile shop item cards must show quantity and price on the same third row.
- For item-category cards, the quantity label stays on the left and the price stays on the right.
- Cards without a quantity label, including character, decoration, and music, keep the price centered.
- Mobile product card contents remain horizontally centered overall.
- Keep the existing compact four-row mobile card structure and the current product image size contract.
- Preserve desktop shop layout and music purchase-limit removal.

## Acceptance Criteria

- [ ] Mobile Bright School item cards visibly show `不限量` or stock text and the coin price on the same row.
- [ ] The item meta row computes as a real two-column grid, not `display: contents`.
- [ ] Price-only cards compute as a centered one-column meta row.
- [ ] Browser check at phone portrait size confirms no horizontal overflow and centered card content.
- [ ] Focused shop and CSS contract tests pass.

## Definition of Done

- Tests updated for the item meta row regression.
- Focused Vitest checks pass.
- Browser verification covers mobile item cards and desktop non-regression.

## Out of Scope

- New shop visuals, new assets, or desktop restyling beyond preserving existing behavior.
- System design documentation changes, because this is a local CSS/layout bugfix without architecture or runtime behavior changes.

## Technical Notes

- Likely files: `src/styles/mobile-adaptive/bright-school-overrides/shop-cards.css`, `src/modals/ShopModal.test.js`.
- Root cause: an earlier Bright School mobile layer sets `.shop-card-meta { display: contents !important; }`; the final compact-card override aligned properties on that element but did not restore it as a real row container.
- Relevant specs: `.trellis/spec/frontend/css-architecture.md`, `.trellis/spec/frontend/quality-guidelines.md`.
