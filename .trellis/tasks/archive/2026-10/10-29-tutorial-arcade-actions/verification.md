# Verification

- Main-session inline implementation and review followed the configured Trellis route.
- 15 targeted suites / 279 tests passed; restored the existing ChatBox draft/dock regression tests alongside the new icon-popup test, then all 3 ChatBox DOM tests passed.
- `npm run verify:battle-fixes`: 22 suites / 443 tests plus 4 generated-system-design tests passed.
- Final `npm run lint`, `npm run build` and `npm run check:built-css` passed. Build retains the existing large-chunk warning.
- `npm run docs:system-design` and its 4 tests reran successfully after the final documentation update.
- Tutorial browser checks: 27 combinations of nine states and 1440/390/320px widths. All five guided actions advance; duplicate pass submits once; skill/board/choice transitions, popup bounds, Escape/focus and outside dismissal pass.
- Ordinary production browser checks: 20 state/viewport combinations, 20 measured presses, touch and protected surfaces pass. Unchanged production screenshot noise was removed.
- Viewed real desktop skill, portrait choices and header-log screenshots. At 320px the full-width option labels fit correctly; the initial fixed 180px label assertion was corrected to account for viewport padding.
- Full repository check was not rerun: the immediately preceding task recorded 472 passing suites / 3426 tests and an unrelated reproducible worker exit in scripts/e2eIsolation.test.js. This task does not claim a fresh full-repository pass.

## Scope review

The existing input-focus implementation is included as the necessary dependency for matching cutouts and highlighted arcade caps. Preload, settings, promotional samples and other existing work remain unstaged. Existing ChatBox coverage was preserved after review found it had initially been overwritten. The staged TutorialBattleScreen removes only unrelated preload hunks; its working file retains them. System-design HTML is rendered from staged Markdown. CSS inventory includes exactly two owners and 1862 normalized bytes, 21 important declarations, one media owner, no new literal colors or motion. Working-tree metrics retain the unrelated remaining 128 bytes.

The runtime stays local: pass uses shared game rules, draw means agreed tutorial completion, and no new network action is sent. Normal ActionBar behavior is unchanged when tutorialAction is absent.
