# Verification

- Restored status/portrait/name/action desktop order; removed heading markup for friends and blacklist; desktop width 760px. Mobile width and existing shadow/scroll rules retained.
- Production-component browser fixtures: 1440x900, 390x844, 320x568. Asserted visual left-to-right order, desktop width, no horizontal overflow, heading absence, action expansion and blacklist switching. Empty state passed. A 24-row narrow-screen list scrolls to its last row with 14px bottom shadow clearance.
- `npm run check` passed: 359 files / 2529 tests, lint, production build, built CSS, portrait/admin snapshot checks, production config and generated system-design HTML.
- Existing build asset/chunk warnings unchanged. Design-hook colors are unchanged legacy declarations. Reported missing image source is a false positive: `characterPortraitImageProps` supplies the real source via spread, and portraits rendered in all screenshots. No suppressions.
- Temporary browser fixtures remain outside commits under `.codex-run/`.
