# Frontend Layout Polish

## Goal

Fix player-facing frontend layout issues without changing the existing Bright School visual language: mobile shop music product cards must not overlap, internal scrollable window regions should remain scrollable while hiding visible scrollbar chrome, replay list time values should align to the left, and the story guidance window should keep padding between its parent frame and the portrait/text/options regions.

## Requirements

- Mobile shop music category product cards keep their title, art, price, quantity/status, and purchase action in non-overlapping, self-contained card rows/tiles.
- The shop music fix covers the portrait mobile layout and does not regress desktop shop card layout.
- Player-facing modal/window internal scroll regions hide scrollbar chrome while preserving mouse wheel, touch, keyboard, and momentum scrolling.
- Do not make the root page or admin workbench depend on hidden scrollbars for core layout; scope the change to player-facing window/list regions already owned by modal/theme layers.
- Replay list time values align left in both desktop table layout and mobile Bright School card layout.
- Preserve the mobile profile replay scroll containment contract: `.profile-replay-list-scroll` remains the scroll owner and `.profile-replay-dialog .replay-table` remains non-scrollable.
- Story guidance windows keep a visible parent-frame padding gutter around the portrait area, dialogue text area, and option/action area on desktop and mobile.

## Acceptance Criteria

- [x] `src/modals/ShopModal.test.js` or a focused CSS contract test fails before the shop music fix and passes after it.
- [x] Scrollbar hiding is covered by a focused style/theme contract assertion for the intended scroll owners.
- [x] Replay time alignment is covered by a focused style/theme contract assertion.
- [x] Story guidance parent-frame padding is covered by focused base and Bright School mobile CSS contract assertions.
- [x] Mobile and desktop selectors are checked together where the changed surface has both viewport contracts.
- [x] `npm run docs:system-design` is run after docs updates.

## Definition of Done

- Focused tests pass.
- Relevant style/theme contract tests pass.
- `npm run docs:system-design` regenerates `docs/system-design.html`.
- No unrelated visual redesign, palette changes, or broad CSS architecture migration.

## Technical Approach

Use existing CSS ownership:

- Shop: inspect `ShopModal`, `ShopItemCard`, base shop CSS, Bright School commerce shop CSS, and final mobile commerce/warehouse overrides. Add the smallest category-specific music mobile rule if the overlap is caused by music cards missing the self-contained mobile card contract that item/character/decoration already have.
- Scrollbars: prefer a reusable scoped selector/mixin pattern inside the existing player theme/modal scroll layers, using `scrollbar-width: none` plus `::-webkit-scrollbar { display: none; }` while preserving `overflow` and `-webkit-overflow-scrolling: touch`.
- Replay: adjust the existing replay table/card selectors so the time cell uses left alignment in desktop and mobile layouts without changing column order or scroll ownership.

## Out of Scope

- Redesigning shop cards, replay cards, or modal chrome.
- Changing admin table scroll primitives or admin workbench scrolling.
- Broad cleanup of legacy scrollbar/theme rules outside the affected player-facing windows.

## Technical Notes

- Project frontend specs read: `.trellis/spec/frontend/index.md`, `.trellis/spec/frontend/css-architecture.md`, `.trellis/spec/frontend/quality-guidelines.md`, `.trellis/spec/frontend/component-guidelines.md`.
- Relevant existing docs mention Bright School shop nested imports, Bright School mobile list/settings/replay CSS, final mobile safety layers, and desktop/mobile replay list contracts in `docs/system-design.md`.
- The `ui-ux-pro-max` local skill package has no runnable `scripts/search.py`; apply the loaded layout/accessibility rules manually.
