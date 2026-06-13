# Tech Debt Priority Cleanup

## Goal

Reduce the highest-priority technical debt found in the repository audit without changing user-facing gameplay behavior. The first goal is to restore the local quality gate, then make the CSS contract less brittle where the current failure shows drift, and finally document the updated debt boundary for future work.

## What I already know

- `npm test` currently fails in `src/styles/hudComponents.test.js` because the Bright School home player plaque CSS contract expects an older grid template.
- `src/home/HomeScreen.test.jsx` and `src/styles/themes/bright-school/home.css` agree on the newer plaque layout: `76px minmax(116px, 1fr) minmax(164px, max-content)`.
- `npm run build` passes but Vite warns about large chunks: CSS around 555 KB, JS chunks around 861 KB and 499 KB.
- `npm run test:e2e` passes with 3 Playwright tests.
- The largest debt areas are CSS override volume, route/bundle splitting, `server/rooms.js`, and `server/index.js`.
- Project instruction requires every update to also update `docs/system-design.md`.

## Assumptions

- This task should prioritize small, safe fixes over large architectural refactors.
- The current user request authorizes implementation, but the design should still be explicit before code edits.
- Existing uncommitted work may belong to another in-progress task; changes must stay narrow and avoid reverting unrelated edits.

## Requirements

- Fix the failing CSS contract test by aligning it with the current Bright School plaque contract or by making the assertion less duplicated and less stale-prone.
- Preserve the existing Bright School plaque layout and visual behavior unless a test proves it is wrong.
- Add a lightweight debt note or contract improvement so this exact drift is less likely to recur.
- Update `docs/system-design.md` for any project-visible testing or debt-governance change.
- Do not attempt large `server/rooms.js`, `server/index.js`, or CSS theme decompositions in this task unless they are required to restore tests.

## Acceptance Criteria

- [x] `npm test -- src/styles/hudComponents.test.js src/home/HomeScreen.test.jsx` passes.
- [x] `npm test` passes, or any remaining failure is unrelated and explicitly documented.
- [x] `npm run build` passes.
- [x] `npm run test:e2e` passes or any environment-specific blocker is documented.
- [x] `docs/system-design.md` is updated and `npm run docs:system-design` is run.

## Definition of Done

- Tests updated or added where the fix changes a contract.
- Build and relevant tests run.
- Documentation updated in both Markdown and generated HTML.
- No unrelated dirty files are reverted.

## Out of Scope

- Full CSS architecture rewrite.
- Route-level code splitting implementation.
- `server/rooms.js` state-machine decomposition.
- `server/index.js` route extraction.
- New gameplay behavior or UI redesign.

## Technical Notes

- Current failing assertion: `src/styles/hudComponents.test.js` expects `grid-template-columns: 76px minmax(120px, 1fr) 94px !important`.
- Current source of truth: `src/styles/themes/bright-school/home.css` uses `grid-template-columns: 76px minmax(116px, 1fr) minmax(164px, max-content) !important`.
- `src/home/HomeScreen.test.jsx` already asserts the current home plaque layout and the stats minimum width.
- Relevant frontend spec: `.trellis/spec/frontend/quality-guidelines.md`.
- Relevant component spec: `.trellis/spec/frontend/component-guidelines.md`.
