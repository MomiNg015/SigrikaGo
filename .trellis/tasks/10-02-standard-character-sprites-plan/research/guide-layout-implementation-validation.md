# Guide layout implementation validation

2026-10-03. Authorized scope: adopt the approved classroom story-stage sample; change only the original teaching/home dialogue's left artwork. Main agent implemented directly under inline Trellis mode; delegates reviewed documents and runtime differences read-only.

## Result and preserved behavior

- Story portrait has a fixed viewport-dependent crop and 1.72x source height. The crop ends above the knees; desktop portrait covers the paper's left side, mobile paper covers its lower portion. Paper is 292px desktop / 326px phone with fixed bottom anchors, independent body scroll and visible actions.
- Short lines, long rules, three answers and expression changes share identical portrait/image rectangles at 1280x900, 390x844 and 360x640. The actual stage remains at scrollTop=0 after option focus and body scrolling.
- NPC keeps its original 68x68 / 58x58 grid reservation and original outer bubble CSS. Only an absolute bust frame protrudes above it. Home artwork is outside the measured scroll panel, using the original panelStyle; target calculations, observer, skip and click gating are unchanged.
- All three guide surfaces display and preload full illustrations. Existing avatar assets remain available. Source failure falls back without full-source crop; A-fails -> B -> A retries the standard expression without remounting the story body.
- No story text, expressions, node graph, timings, target actions, room/board arrangement, handbook/student-ID UI, API or database content changed. The offline sample's enlarged NPC cards and peek controls were not ported.

## Verification

- `npm run check`: PASS. ESLint, 403 files / 2,868 tests, portrait and admin snapshot checks, production build, built CSS contracts, production configuration and design HTML generation all passed.
- `npx playwright test -c tests/e2e/story-sprites.config.js --output .tmp/guide-story-v2-browser`: PASS, 4 tests. Full-resolution expressions, original text, same crop under short/long/choice nodes, zero stage scrolling, reachable long-text continuation and original NPC slot checked.
- `npx playwright test -c tests/e2e/home-onboarding.config.js --output .tmp/guide-home-v2-browser`: PASS, 3 complete tours at 1440x1000, 390x844 and 360x640. All 24 original steps, real windows, target bounds, artwork/target clearance, input interception and completion checked.
- Final focused checks after the CSS precedence adjustment: PASS, 88 tests across inventory/style contracts and story/home DOM suites. The broad gate included all new fallback/home DOM tests; the later source edit only indented JSX.
- CUA inspected actual production components in the local fixture at desktop, 390x844 and 360x640. Corrected the global image width clamp, legacy gold-action/grid winner and mobile overflow:hidden winner. The latter allowed browser focus to scroll the entire stage before the fix.
- Existing source/script APIs were reviewed for unchanged progression and same-surface reuse. The review found the A -> B -> A failed-source persistence issue; it was fixed and covered in both portrait suites.

## Design scan review

New stage and portrait CSS use existing paper/ink/pink colors, with no new motion or high layer. Hook findings in portrait-text, selected-actions, audit-foundation, guided-actions and old test assertions are inherited color/radius values unchanged by this work; edits only scoped variables or exclusions. They are contextual false positives for this patch and remain unsuppressed. One existing mobile precedence declaration is replaced by four (+3 net important declarations), with one new bounded portrait owner. Exact CSS delta: +1 file, +4540 normalized bytes, +3 important, +1 existing-palette hex occurrence, +1 media file. Existing unrelated checkout debt/budget is preserved.

## Evidence and limits

Screenshots: `C:/Users/Moming/.codex/visualizations/2026/10/02/01a0fbc7-ae53-71a3-90eb-82bdaae98b51/guide-implementation-v2/` (`story-choices-desktop.jpg`, `story-choices-phone-390.jpg`, `story-long-phone-360.jpg`, `battle-phone-390.jpg`, `home-phone-390.jpg`). Test logs and browser artifacts are under `.tmp/guide-v2-check.log`, `.tmp/guide-story-v2-browser*` and `.tmp/guide-home-v2-browser*`.

Browser evidence uses real components with the existing published default guide; fixture users and API responses are local test data. Deployment/live account validation is outside this visual scope. The broader asset-plan task remains active for later scene decisions. Commit only owned files/hunks; unrelated release, deployment, room, profile and test-workflow WIP stays in the checkout.
