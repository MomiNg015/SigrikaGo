# Remove player-facing move-number toggle

## Goal

Remove the player-facing control that enables board move numbers. Decorated and special-effect stones make move numbers unreliable as an optional visual overlay, so the safer product decision is to prevent users from turning the feature on.

## Requirements

- Remove the desktop room header move-number button.
- Remove the mobile room menu move-number item.
- Keep message board, settings, and coordinate controls available on both desktop and mobile.
- Keep underlying board move-number support unchanged for internal or non-player-facing callers.
- Force real rooms and tutorial battle rooms to pass `showMoves={false}`.
- Update `docs/system-design.md` and regenerate `docs/system-design.html`.

## Acceptance Criteria

- [ ] `RoomHeader` no longer imports or renders the move-number icon/button.
- [ ] `RoomScreen` and `TutorialBattleScreen` no longer expose a move-number toggle handler.
- [ ] Desktop room utilities keep message board, settings, and coordinates.
- [ ] Mobile room menu keeps message board, settings, and coordinates.
- [ ] Focused board tests pass.
- [ ] `npm run docs:system-design` has been run after documentation changes.

## Definition of Done

- Tests added or updated before production code changes.
- Focused test command passes.
- Documentation source and generated HTML are synchronized.
- Unrelated dirty worktree files are preserved.

## Technical Approach

Revert the badge prototype and remove the player-facing control from `src/room/header/RoomHeader.jsx`. Remove room/tutorial state that could enable `showMoves`, while preserving existing `Board` support so the internal prop contract does not churn.

## Decision (ADR-lite)

Context: decorated and special stones make direct text-over-stone move numbers unreliable.

Decision: hide the move-number toggle from player-facing room headers instead of shipping a new visual treatment.

Consequences: users cannot opt into a visual mode that becomes ambiguous on decorated and special-effect stones. The existing board prop remains available for internal consumers, but ordinary room and tutorial battle paths keep it off.

## Out of Scope

- Changing how move numbers are derived from history.
- Adding a new toggle mode or preference setting.
- Reworking stone decoration assets or skill-effect animations.
- Changing board coordinate, scoring, replay-step, or latest-action marker behavior.

## Technical Notes

- `src/room/Board.jsx` currently renders `{showMoves && moveNumber !== null && <b>{moveNumber}</b>}` inside `.stone`.
- `src/styles/room/board/latest-touch-void.css` currently styles `.stone b` as full-stone centered raw text.
- Relevant specs read: `.trellis/spec/frontend/css-architecture.md`, `.trellis/spec/frontend/quality-guidelines.md`, `.trellis/spec/frontend/component-guidelines.md`, `.trellis/spec/guides/index.md`.
