# Fix Battle Board Skill And Counter Regressions

## Goal

Fix four player-visible battle-room issues: erased intersections need clearer board boundaries, QiuYuan row-slash overclock should charge one point per direct removal, battle chat text should wrap, and capture/removal counters should not inflate during replay or derived room views.

## Requirements

- When a skill invalidates an intersection, the four adjacent board cells should render as muted gray boundary cells where they exist.
- The outside perimeter lines around those adjacent cells should render with the same stroke weight as the board's first/edge line.
- QiuYuan `row-slash` should add `+1` overclock for each directly removed stone, not `+2`.
- Battle-room chat message text should wrap on desktop and mobile, including long unbroken content.
- Player-facing `captures` should remain ordinary capture counts, and `skillRemovals` should be derived once per replay step rather than accumulated repeatedly from history reconstruction helpers.

## Acceptance Criteria

- [ ] Board markup and CSS expose gray erased-intersection boundary cells and thick perimeter lines without changing gameplay point validity or neighbors.
- [ ] Existing row-slash tests expect five direct removals to add five overclock, and history records `overclockAdded: 5`.
- [ ] Chat CSS preserves the existing room popover layout while allowing message text, names, and long strings to wrap.
- [ ] Replay reconstruction for Voyage Star or other recorded skill removals does not double-count skill removals when `removedByColor` and `cleanupRemovals` are both present.
- [ ] Relevant unit/style tests pass.
- [ ] `docs/system-design.md` and generated `docs/system-design.html` are updated per project instructions.

## Technical Approach

- Keep invalid-intersection boundary visualization in `src/room/Board.jsx` as a presentation overlay derived from `game.points`.
- Keep gray cell and thick line styling in the shared board CSS so desktop and mobile boards share one rendering contract.
- Change row-slash overclock math in `src/shared/gameSkillActions.js`.
- Fix replay-derived counter inflation in `src/room/roomView.js` by using captured owner/count data without adding the same recorded removals twice.
- Add focused tests in existing `Board`, `roomView`, `game`, and `ChatBox` test files.

## Out of Scope

- No change to scoring formula semantics beyond QiuYuan's direct overclock amount.
- No redesign of chat UI, player panels, or skill animations.
- No change to server Socket.IO room payload contracts unless tests reveal a server-side counter source.

## Technical Notes

- `src/room/roomView.js` reconstructs replay snapshots and has a special Voyage Star replay path that can derive `skillRemovals` from history entries.
- `src/shared/gameSkillActions.js` currently computes row-slash `overclockAdded` from `directRemoved * 2`.
- `src/room/Board.jsx` already renders the SVG grid and point-local overlays, making it the right layer for erased-intersection boundary display.
- `src/styles/room/board/grid-scoring.css` owns `.board-lines` and scoring/mark overlays and is the focused CSS target for board boundary visuals.
