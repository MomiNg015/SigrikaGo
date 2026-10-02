# Verification

- Status labels use inline flex with centered text on both axes. Portrait rows reserve a fixed 48px status column, keep 32px portraits and 44px action targets, and left-align the adjacent identity. Plain-name padding removed to keep four-character names readable at 320px; image-nameplate styling remains separate.
- Real-component production browser fixture passed at 1440x900, 390x844 and 320x568: measured text-center alignment, fixed avatar/name column positions, 760px desktop width, no horizontal overflow, actions, blacklist, empty list and 24-row scrolling. Bottom shadow gutter remains 14px. Screenshots inspected at narrow portrait width.
- Friends/CSS targeted checks: 65 tests passed. Initial full run had one unrelated GNU Go child-process timeout (1000ms) while browser build ran concurrently; full check rerun without that parallel build.
- Existing literal colors reported by the design hook are unchanged legacy declarations; no new colors or suppressions.
- Temporary screenshots and browser fixtures remain outside commits in `.codex-run/`.
- Final npm run check passed: 359 files / 2529 tests, lint, production build, built CSS, portrait/admin snapshot, production config and generated system-design HTML.
