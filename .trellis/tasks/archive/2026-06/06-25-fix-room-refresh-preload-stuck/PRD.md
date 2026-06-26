# Fix Room Refresh Preload Stuck

## Problem

Refreshing during a match can leave the client on a full startup loading screen instead of recovering into the active match flow. The risky case is a player reconnecting while the room is still in `GAME_PHASES.preloading`: the server resumes the socket and emits a live `room:update`, but the client currently only treats preloading rooms as pending match transitions when `matchSuccessRef.current` already exists.

## Goal

When a player refreshes during match resource preparation, the recovered room must re-enter the battle preload route, emit `room:preload-ready` after local battle resources load, and only enter the room after the server snapshot leaves `preloading`.

## Scope

- Frontend socket room recovery state machine.
- Regression tests for resumed preloading player rooms.
- System-design documentation for refresh recovery behavior.

## Non-Goals

- Changing server preload timeout behavior.
- Changing which battle assets are preloaded.
- Adding a soft timeout to the login startup preload page.

## Acceptance Criteria

- A `room:update` for a player room in `GAME_PHASES.preloading` with no existing pending match transition creates a `matchSuccess` transition marked countdown-complete and routes to `match-preloading`.
- The recovered preloading room is not written into active `room` state prematurely.
- A later same-room `room:update` that leaves `preloading` clears the pending match and enters `room`.
- Existing pending-match countdown behavior remains unchanged.
- Relevant tests and `npm run docs:system-design` pass.
