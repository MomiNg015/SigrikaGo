# Fix pending skill state leaking across rooms

## Goal

Prevent the client-only skill targeting/confirmation state from surviving resignation, room exit, or a transition into another game room.

## What I already know

- `pendingSkill` is a boolean owned by `useRoomSessionState` at App scope.
- The skill button sets this value to `true`, which activates the board confirmation treatment.
- The "resign and exit" callback emits the resign action and navigates home without clearing `pendingSkill`.
- Active-player back navigation intentionally keeps the current room snapshot until the server result arrives, so the stale boolean can outlive the old room.
- Several socket recovery paths already clear the boolean, but ordinary room replacement does not enforce that invariant.

## Requirements

- Clear local skill confirmation immediately when the player confirms either a direct resignation or "resign and exit".
- Scope an active skill confirmation to the room identity in which it was selected.
- A different room must render with skill confirmation inactive on its first render, without waiting for a post-render effect.
- Ordinary snapshots for the same room must not cancel an in-progress skill selection.
- Preserve skill-button toggling, board confirmation, replay behavior, and server game actions.

## Acceptance Criteria

- [x] Selecting a skill in room A and then entering room B cannot activate the skill confirmation UI in room B.
- [x] Confirming resignation clears the local skill selection before emitting the resign action.
- [x] Confirming "resign and exit" clears the local skill selection before emitting and navigating.
- [x] Updating room A with a newer snapshot keeps room A's active local skill selection.
- [x] Focused room-session and RoomScreen regression tests pass.
- [x] Relevant lint, tests, build, and system-design generation pass.

## Definition of Done

- The cross-room state invariant is covered by executable tests.
- The room lifecycle contract is recorded in the frontend state-management spec.
- `docs/system-design.md` and `docs/system-design.html` describe the client room-local draft boundary.
- No unrelated room, skill, replay, or server behavior changes.

## Technical Approach

Represent the client skill-selection draft with the room identity that owns it, while preserving the public `pendingSkill` boolean and `setPendingSkill` setter used by current consumers. Derive `pendingSkill` as false whenever the current room identity differs, so a new room cannot render one stale frame. Also clear the selection explicitly in both RoomScreen resignation confirmations.

## Decision (ADR-lite)

**Context**: Resetting only the reported exit callback would fix one path but leave App-level local state vulnerable to other room transitions. Resetting on every room snapshot would incorrectly cancel selections during ordinary live updates.

**Decision**: Bind the draft to stable room identity and explicitly cancel it at resignation intent boundaries.

**Consequences**: Same-room snapshots preserve the selection, different rooms reject stale state synchronously, and the user-visible resignation flow closes the colorful confirmation treatment immediately.

## Out of Scope

- Changing server-side skill execution, room resignation, or matchmaking protocols.
- Redesigning the skill confirmation visuals or adding new confirmation steps.
- Altering replay skill-effect presentation.

## Technical Notes

- Primary files: `src/app/useRoomSessionState.js`, `src/app/useRoomSessionState.test.js`, `src/room/RoomScreen.jsx`, and `src/room/RoomScreen.test.js`.
- Relevant lifecycle owner: `src/app/AppRoutes.jsx` uses `planRoomBackNavigation` and can retain an active-player room snapshot while returning home.
- Existing reset examples: `src/app/resumeSession.js` and `src/app/socketHandlers.js`.
