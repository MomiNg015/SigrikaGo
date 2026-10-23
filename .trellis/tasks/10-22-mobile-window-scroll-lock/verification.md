# Verification

## Leaderboard follow-up — 2026-10-23

- Reproduced the user's footer-origin swipe before the CSS change at 320x700 and 390x700. Window y moved from 46 to approximately -300 while document/background positions stayed unchanged; the backdrop had over 3300px of content.
- Added `position: relative` only to the existing `.lp-scroll` owner. The accessible hidden labels now have a containing block inside the list and cannot enlarge the outer backdrop.
- `node node_modules/@playwright/test/cli.js test --config tests/e2e/modal-scroll.config.js`: **7 passed**. Four leaderboard cases cover 320x568, 320x700, 390x700 and 390x844. Each uses 40 records, verifies no extra backdrop overflow, starts the touch inside “我的排名”, asserts unchanged window position, scrolls to the last row, and repeats the footer swipe. Existing settings/nested/desktop cases also passed with the corrected touch origin.
- Targeted hook, leaderboard DOM/source and CSS contract suites: **105 tests passed**. Generated-document suite: **4 tests passed**.
- Lint, production build and built CSS contracts passed. Screenshot at 320x568 inspected: title, bookmark rail, fixed personal-rank footer and list retained their layout.
- The design hook's two pre-existing 6px radii are unchanged intentional leaderboard art; no unrelated radius edit or suppression was added.
- The prior full-gate failures below remain outside the scope of this CSS-only follow-up. They are not represented as resolved.

## Passed

- `npm run lint`.
- `src/app/useModalScrollLock.dom.test.jsx`: 8 tests, including short and long content, both scroll boundaries, nested inline and portal dialogs, precise overflow priority restoration, scroll position, horizontal/range/pinch gestures, tall backdrops, media changes and Strict Mode cleanup.
- `npx playwright test --config tests/e2e/modal-scroll.config.js`: 3 tests. Actual SettingsModal and ConfirmModal under full production theme imports; native CDP touch input at 320x700 and 390x700, desktop overflow unchanged at 1440x900. Tested header/backdrop/short confirmation swipes, scrolling to both endpoints, closing one layer, final unlock, and subsequent background scrolling. No page errors. Screenshot inspection confirmed retained window geometry.
- `npm run docs:system-design`; regenerated `docs/system-design.html` and reran all four `docs/systemDesignHtml.test.js` assertions successfully.
- `npm run check:portraits`: all 18 normalized portraits and 39 visible bounds valid.
- `npm run build`, `npm run check:built-css`, production configuration check.
- `git diff --check`.

## Full gate findings

`npm run check` ran 455 suites / 3325 tests: 452 suites and 3321 tests passed on the initial run. Four initial failures:

1. `docs/systemDesignHtml.test.js`: HTML generation was pending; regenerated and all four tests passed.
2. `server/leaderboardOrder.test.js`: one default 5000 ms timeout; both tests passed unchanged on rerun.
3. `scripts/devApiProxy.integration.test.js`: two default 5000 ms timeouts, reproduced on rerun. At `--testTimeout=15000` all four assertions passed, but an unrelated Vite watcher raised `UNKNOWN` for `.codex-run/scope-editor.log`, so the rerun still exited 1. No timeout or watcher settings were changed in production or tests.

The remaining gate steps were run explicitly because the test failure stops the shell chain. `check:admin-snapshot` reports the committed snapshot differs from local `siteSettings` and `characters`. This task does not export or overwrite admin data. Build passed with existing unresolved-public-asset and ExcelJS chunk-size warnings.

## Scope and limits

No unrelated WIP was reverted or staged. Validation uses Chromium/Edge mobile emulation with native touch dispatch, not physical iOS hardware. Current task work is complete for the scoped commit described in `commit-plan.md`; the whole repository gate is not reported green.
