# Mobile Shop Product Card Layout

## Goal

Make Bright School mobile shop product cards, especially music products, use a desktop-like card layout with a larger product image/media slot. The current mobile final guard compresses product artwork to a small thumbnail, which weakens product recognition.

## Requirements

* Preserve the existing desktop shop card layout and visual contract.
* Update mobile Bright School product cards to keep a vertical card structure: product media, title, metadata/price, and action button.
* Increase mobile product media slots from thumbnail size to a desktop-like card media area while still fitting two cards per row on phone portrait.
* Keep touch targets stable, with purchase/action buttons at least 44px tall.
* Keep the fix scoped to shop product cards; do not redesign the shop modal, wallet, mascot, tabs, warehouse, or product detail modal.

## Acceptance Criteria

* [ ] On phone portrait, `.shop-category-music.shop-item > img` no longer computes to a 52px fixed thumbnail.
* [ ] Mobile Bright School product cards keep a stable two-column grid without horizontal overflow.
* [ ] Product media slots are large enough to visually match the desktop card hierarchy.
* [ ] Static CSS tests cover the final mobile Bright School override so future rules do not shrink media back to thumbnail size.

## Definition of Done

* Focused CSS tests pass.
* Browser verification covers mobile phone portrait and desktop widths.
* No unrelated existing WIP is staged, reverted, or restyled.
* System design docs are unchanged because this is a local style contract fix, not an architecture/theme-system update.

## Technical Approach

Adjust the final mobile Bright School shop-card override in `src/styles/mobile-adaptive/bright-school-overrides/shop-cards.css`, because it is imported after base mobile and theme mobile CSS and currently owns the 52px media clamp. Keep the desktop Bright School card contract in `src/styles/themes/bright-school/commerce/shop/product-grid.css` unchanged.

## Decision (ADR-lite)

**Context**: Desktop Bright School shop cards already use a large media-first card structure. The mobile final guard was written to avoid overlap but shrank product art to thumbnail size.

**Decision**: Keep the final mobile guard as the owner, but change it from a compact thumbnail layout to a taller vertical card layout with a larger media row and stable metadata/action rows.

**Consequences**: The mobile grid remains two columns and gains slightly taller cards. This prioritizes product artwork readability without changing the broader commerce layout.

## Out of Scope

* Desktop shop redesign.
* Product detail modal changes.
* Warehouse card changes.
* Commerce data, purchase behavior, or API changes.

## Technical Notes

* Relevant specs read: `.trellis/spec/frontend/index.md`, `.trellis/spec/frontend/css-architecture.md`, `.trellis/spec/frontend/component-guidelines.md`, `.trellis/spec/frontend/quality-guidelines.md`.
* Relevant CSS inspected: `src/styles/themes/bright-school/commerce/shop/product-grid.css`, `src/styles/themes/bright-school/mobile/commerce-warehouse/shop-layout.css`, `src/styles/mobile-adaptive/phone-shop.css`, `src/styles/mobile-adaptive/bright-school-overrides/shop-cards.css`.
* Current problem source: final mobile Bright School override sets product media to `52px`, including `.shop-category-music.shop-item > img`.
