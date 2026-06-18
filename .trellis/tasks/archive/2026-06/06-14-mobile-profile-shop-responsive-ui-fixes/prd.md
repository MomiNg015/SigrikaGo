# Mobile profile and shop responsive UI fixes

## Goal

Fix the 393px mobile Bright School theme regressions called out from browser comments: the home nameplate clips the username art/text, the chain plaque covers too much portrait art, the resume modal header and character record list are cramped, and shop wallet counters wrap or use inconsistent gem styling.

## Requirements

* Home player plaque username/nameplate must resize within the available middle column without clipping the background or name.
* Home chain/avatar plaque must leave more of the portrait visible and keep the chain marker visually secondary.
* Resume modal header must put the title and close button on the first row; achievements and personalization on the second row left; coin and gem counters on the second row right.
* Resume character record list may scroll vertically and must not compress rows until portrait/text content is clipped.
* Shop wallet counters should stay on one line when there is room, and the blue gem counter should use the same background treatment as the resume gem counter.

## Acceptance Criteria

* [ ] 393px portrait home plaque shows the username/nameplate fully within its card.
* [ ] 393px portrait home avatar/chain area no longer hides most of the portrait art.
* [ ] 393px portrait resume header follows the requested two-row layout and keeps the close button aligned with the title.
* [ ] Resume character records scroll internally instead of flattening rows and clipping avatars/text.
* [ ] Shop coin/gem counters stay single-line and gem styling matches the resume gem capsule.
* [ ] Targeted CSS/static tests pass.
* [ ] `npm run docs:system-design` runs after updating system design docs.

## Definition of Done

* Tests updated where existing CSS contract tests cover the touched selectors.
* Relevant system-design documentation updated.
* Lint/test/build risk assessed with targeted verification at minimum.

## Technical Approach

Use the existing final mobile safety layers and Bright School scoped selectors, keeping layout survival rules in `src/styles/mobile-adaptive.css` / nested mobile adaptive files where needed and theme-specific color polish in Bright School theme files. Avoid component contract changes unless CSS cannot solve the selected comments.

## Out of Scope

* New modal flows or account data behavior.
* Desktop-only redesigns unrelated to the mobile comments.

## Technical Notes

* Relevant files discovered: `src/styles/themes/bright-school/home/mobile-compact.css`, `src/styles/themes/bright-school/mobile/home-shell.css`, `src/styles/mobile-adaptive/bright-school-portrait.css`, `src/styles/mobile-adaptive/phone-shop.css`, `src/styles/themes/bright-school/commerce/shop.css`, `src/modals/ResumeModal.jsx`, `src/modals/shop/ShopSidebar.jsx`, `src/modals/HouseModal.test.js`, and `src/styles/hudComponents.test.js`.
* Follow `.trellis/spec/frontend/quality-guidelines.md` CSS ownership, mobile profile record, modal close button, and Bright School home responsive contracts.
