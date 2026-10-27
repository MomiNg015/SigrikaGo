# Validation — practice and capture window

## Result
- Full Vitest run: 464 files / 3391 tests. One legacy CSS assertion still expected the removed three-column difficulty layout; updated it to the mode-card geometry. All other 3390 tests passed. The corrected HomeScreen suite then passed all 23 tests.
- Focused flow suites: 55 tests passed, including first-use guards, persistence, account isolation, stale characters, blocked/corrupt storage, shared character selection, fixed advanced capture payload, leaderboard loading/error/empty states and nested close/focus restoration.
- Production-CSS browser regression: six checks passed across desktop and 320/360/390px portrait viewports. New unified-window checks cover 1280/390/320px, all three solid icon fills, 8px/12px padding, stable control geometry, complete dialogue, refresh recovery, fixed capture difficulty, leaderboard last-row reachability and pinned personal ranking.
- Lint, portrait/visible-bounds validation, isolated admin snapshot round-trip, Vite production build, built-CSS contracts, sample production configuration and system-design generation passed.
- Existing Vite public-asset placeholder and large-chunk warnings remain; no new build error.

## Visual review
- Verified full application CSS, including the real SVG circle fill rather than only the SVG wrapper's color. Existing global theme rules otherwise recolor child SVG geometry.
- Explicit theme-scoped minimum card heights preserve vertical gutters around the 44px tool controls. Mode cards use 72px desktop / 68px portrait.
- Speech-tail overflow is intentional. Text Range bounds, rather than scrollWidth (which includes the tail), verify that dialogue stays inside its bubble and window.
- Desktop fixed-overlay evidence uses viewport screenshots; full-page screenshots can temporarily re-layout nested fixed overlays during capture. Inspected production viewport rendering separately.
- Design-hook findings for legacy HUD colors and existing speech-bubble/card radii are outside the requested visual change. The three new solid icon colors are intentional user-requested level semantics. The tool radius reuses the existing practice card's 12px inner-control treatment. No hook suppressions or unrelated theme changes were added.

## Evidence (local, ignored)
- `.codex-run/practice-capture-check.log`
- `.codex-run/practice-capture-final-gates.log`
- `.codex-run/practice-capture-browser-final.log`
- `.codex-run/practice-capture-desktop-prod.png`
- `test-results/team-match-unified-practic-224c1--and-capture-ranking-at-390/practice-capture.png`

## Scope
Game rules, AI engines, capture ranking calculation and server APIs are unchanged. Existing browser `practice` role preferences are reused; obsolete capture-only role preferences are preserved but no longer used by the entry. Other account role selections are unchanged.
