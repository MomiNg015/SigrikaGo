# Deployment loading and interaction fixes

## Goal and requirements
User requested three concrete fixes: theme options each occupy one row with unwrapped labels; tutorial dims surrounding UI by 20% while waiting for a move or a non-continue choice, retaining bright interactive targets; loading screens finish required images and playable audio before revealing home or starting battle.

## Acceptance criteria
- [x] Desktop and portrait theme options are three rows; text remains on one line.
- [x] Tutorial focus follows actionable phases; continue/NPC/loading phases remain undimmed; controls and board retain their interaction behavior.
- [x] Home visual assets used by CSS participate in decoded image preloading.
- [x] Battle and login voices populate the playback cache, including catalog overrides.
- [x] Critical resource failure remains on loading with retry; no ready acknowledgement on failure.
- [x] Regression tests, production build and system-design export pass.

## Technical approach
Repair existing asset registry and loader with opt-in strict readiness and retry, reuse voice decoder; preserve existing music streaming. Add a pointer-transparent tutorial spotlight with cutouts for actionable controls. Keep existing layout and audio trigger contracts.

## Scope
No gameplay rules, database changes, unrelated WIP or deployment changes. Live deployment URL was not provided; local production build will be verified. User's explicit request supplies implementation authorization.

## Verification
- Full suite run: 470 files, 3420 tests; 3418 passed. Two old source-contract assertions (App.test.js and styleContract.test.js) were updated for the requested new behavior and rerun successfully (19 and 58 tests respectively).
- Additional critical readiness, home-module, battle retry/cancellation and tutorial regressions passed. Final asset tests: 35/35; final tutorial/style regression: 80/80.
- Real Chrome: 5 browser cases passed (1440/390/320 theme and tutorial interactions, delayed home art with predecoded audio, tutorial gate beyond three seconds). Screenshots and logs are in this task directory.
- Lint, production build, built-CSS contracts, 187 voice files, 18 portrait files/39 visible bounds, isolated default-snapshot round trip, production config and system-design HTML export passed.
- Production build retains existing oversized-chunk warnings. Live hosted deployment was not accessed or changed.
- Awaiting scoped commit confirmation; unrelated original workspace changes remain intact. See commit-plan.md.
