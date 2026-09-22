# Restore original handbook with left bookmark tabs

## Goal
Undo the two handbook beautification commits from today while keeping the left character/decoration tab navigation requested by the user.

## Requirements
- Restore the window chrome, character layout and card presentation from `5db4f892`, immediately before `3baddd73`.
- Keep shared WindowBookmarkTabs, accessible panel relationships and character/decoration switching.
- Remove today's book/card image assets and style overrides. Do not introduce another design or retain today's column-count overrides.
- Preserve original corruption, details, decoration actions, costume resolution and sortie voice lifecycle.
- Preserve unrelated working-tree changes and historical task records.

## Acceptance Criteria
- [x] Original visual owners render the handbook at desktop and portrait mobile widths.
- [x] Left tabs switch the original content and keyboard navigation works.
- [x] No generated handbook imagery or student-card CSS remains in production.
- [x] Focused checks and browser inspection pass; docs and generated system-design HTML reflect the rollback.

## Scope and Approach
Only handbook changes from `3baddd73` and `ee9ed77c` are reversed. Keep content roots as direct modal children so original CSS selectors continue to apply; provide panel accessibility attributes on those roots. No new artwork, broader redesign, unrelated room changes or history rewrite.

## Open Questions
None: the latest user instruction explicitly selects the pre-beautification presentation with left tabs retained.

## Validation
- Lint, production build and built CSS contracts passed.
- Focused handbook/bookmark/style/inventory suites: 84 tests passed.
- Full suite: 2565 passed and 5 failed initially. The rollback CSS budget was corrected and its 20-test suite passed; the other four failures are the previously observed resume ordering/profile CSS, ShopModal style, and RoomScreen style assertions outside this task.
- Browser checks at 1440x1000, 390x844 and 360x640 passed: no horizontal overflow, original 5/3-column owners restored, last character reachable, detail opens, both tabs and keyboard navigation work.
- Production no longer references generated handbook assets. Baseline character grid differs only by optional tabpanel attributes.
