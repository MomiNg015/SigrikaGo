# Profile window corrections

## Goal
Apply the seven corrections in the user's annotated screenshot to the existing resume and public profile windows.

## Requirements
- Match public-profile identity height to the original shorter resume on desktop and mobile; do not enlarge the resume to match details.
- Match mobile replay button sizing to achievement/personalization controls.
- Temporarily disable achievement and personalization entry controls. Suppress achievement-unlocked listeners and toast notifications during the internal test without deleting the feature.
- Horizontally center the desktop rank value, not its heading. Restore the original mobile left-heading/right-value flex row, including its original wrap at 320px.
- Center recent-result markers and their empty state in both contexts, while keeping the recent-ten title at the far left on desktop and mobile.
- Give identity cards the same shadow treatment as adjacent cards.
- Keep a capture-challenge card around empty results.

## Acceptance Criteria
- [x] Both profile contexts follow the original compact identity height on desktop/mobile; desktop rank values center, mobile keeps its original wrapping row, and both recent-ten titles stay left.
- [x] Achievement/personalization controls are unavailable; achievement evaluation and unlock notifications are paused.
- [x] Replay remains available with matching mobile control dimensions.
- [x] Capture challenge loading, error, empty and populated states stay within the card.
- [x] Relevant behavior tests/build pass and desktop/portrait rendering inspected; unrelated full-gate blocker documented below.

## Scope and decisions
- Preserve existing profile layout, data APIs, other WIP and design samples.
- Preserve achievement data and award code for future release; pause server condition evaluation/reward grants and disable client entry/listener/notification behavior through one reversible release flag. Existing counters continue to retain gameplay history.
- Reuse current CSS owners and shared components. No new dependencies or redesign.
- Edge cases include zero/partial recent games, capture fetch errors and 320px portrait screens.
- No blocking questions: the screenshot defines the requested outcome.

## Definition of Done
Update tests where behavior changes, relevant specs, docs/system-design.md and generated HTML; record validation evidence.

## Validation
- Focused client/component/CSS tests: 53 passed.
- Achievement evaluator and commerce/gacha/player route tests: 32 passed.
- Real Chrome profile-paper browser matrix: 10 passed at 1440/800/390/360/320px, both contexts, partial/empty/ten recent results, challenge empty card, shadows, control sizing, keyboard tabs and last-row reachability. Screenshots under `test-results/profile-window/` were inspected at desktop, 390px and 320px.
- ESLint, portrait checks, production build, built CSS contracts and production configuration passed. System-design HTML regenerated and all four document checks passed.
- CSS debt non-growth contracts passed without changing the baseline.
- Full project check: existing admin snapshot differs from local siteSettings/characters; left unchanged to preserve unrelated admin configuration.
- Full Vitest run: 451 files / 3301 tests passed; the only failure was generated system-design HTML becoming stale during the edit. Regeneration plus the four-test document suite passed. The final backend change was separately covered by 32 passing evaluator/route tests. Full lint and the final changed-file lint pass both succeeded.
- Design hook's missing-image report is a false positive: the challenge image receives the existing `characterPortraitImageProps` spread, including its real src.

## Follow-up correction validation
- Restored original mobile rank flex layout, including the left-aligned wrapped value at 320px; desktop values center.
- Both identity cards measure 164px on desktop and 160px on mobile in the representative fixture. Mobile public actions clear the portrait at every tested width.
- Recent-ten labels are left-aligned in both contexts while partial/full/empty result sets remain centered.
- All 10 browser matrix cases and 119 CSS/document tests passed after the correction; changed-file ESLint and diff whitespace checks passed. Desktop, 390px and 320px screenshots inspected.
- Existing approved 12px/asymmetric card corners and 9px controls triggered generic radius hook findings; these values are unchanged and documented by the approved warm-paper spec.
- Production build and built-CSS contracts passed after the correction.
