# Approved scoped commit

`fix(ui): restore inline mobile battle layout and lighter control shadows`

## Include
- `src/styles/mobile-adaptive/readable-type-battle.css`
- `src/styles/mobile-adaptive/battle-paper-player-mobile.css`
- `src/styles/mobile-adaptive/room-header-scoreboard.css`
- `src/styles/mobile-adaptive/battle-paper-panels-mobile.css`
- `src/styles/themes/bright-school/mobile/room/dock-actions/action-button-labels.css`
- `src/room/header/RoomHeader.jsx`, its DOM test and `src/room/RoomScreen.test.js`
- `src/styles/room/actions-requests/action-states-tools.css`
- `src/styles/mobile-adaptive/mobile-room-portrait/shell-header-menu.css`
- `src/styles/themes/bright-school/mobile/room/shell-header-menu/menu-buttons.css`
- `src/styles/mobile-adaptive/sigrika-corruption/room-icons.css`, `room-panels.css` and `room-secondary-surfaces.css` (moved coordinate selector parity only)
- `src/styles/cssLayerInventory.js` (exact task delta only)
- `tests/e2e/battle-presentation.spec.js`
- `tests/e2e/spectator-presence.config.js`
- `tests/e2e/fixtures/spectator-presence.jsx`
- `docs/system-design.md` and generated `docs/system-design.html`: only the mobile battle paragraph edited in this task.
- `.trellis/spec/frontend/css-architecture.md`: only the mobile battle contract paragraph added in this task.
- Current task PRD and this commit plan; archive and journal occur after the work commit.

## Preserve existing work
Do not stage pre-existing profile, achievement, app refresh/toast, ESLint, artwork/sample, or other Trellis/spec changes. In shared documentation, stage only the current task's hunks. Before-task copies of the shared documents are under `.codex-run/mobile-battle-inline/` for exact comparison.

## Review evidence
Latest menu iteration: all 12 browser cases and 167 focused component/style tests pass; final build, built-CSS contracts and generated system-design HTML pass. Changed-file lint explicitly applies maintained rules to the header JSX. Screenshots: `.codex-run/mobile-battle-inline/menu-final-492.png` and `menu-final-320.png`. Earlier full layout validation also passed 443 battle checks, 4 generated-document checks and 4 real-Pixi stability cases.

User approved this scope on 2026-10-22. Commit-time broad checks and the unrelated local admin-snapshot mismatch are recorded in `prd.md`; do not refresh admin defaults as part of this UI commit.
