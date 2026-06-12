# Quality Guidelines

> Code quality standards for backend development.

---

## Overview

<!--
Document your project's quality standards here.

Questions to answer:
- What patterns are forbidden?
- What linting rules do you enforce?
- What are your testing requirements?
- What code review standards apply?
-->

(To be filled by the team)

---

## Forbidden Patterns

<!-- Patterns that should never be used and why -->

(To be filled by the team)

---

## Required Patterns

<!-- Patterns that must always be used -->

### Room Broadcast Boundary Contract

`server/roomBroadcasts.js` owns the Socket.IO delivery mechanics for room-level events:

- `broadcastRoom(io, room, { persistRoom })` emits viewer-specific `room:update` payloads and force-persists the room before delivery.
- `broadcastRoomClock(io, room, { persistRoom })` emits lightweight `room:clock` payloads and uses throttled persistence.
- `broadcastToast(io, room, text)` and `emitRoomClosed(io, room, payload)` emit only to connected room participants.
- `roomView(room, viewerId)` remains the compatibility wrapper for `buildRoomView()`.

`server/rooms.js` should decide **when** a lifecycle event needs broadcasting, but it should not duplicate participant iteration, event names, clock payload shape, or viewer-specific room view emission.

Wrong:

```js
for (const participant of [...room.players, ...room.spectators]) {
  io.to(participant.socketId).emit("room:update", buildRoomView(room, participant.user.id));
}
```

Correct:

```js
broadcastRoom(io, room);
```

Tests touching this boundary should update `server/roomBroadcasts.test.js` for payload shape, connected-participant filtering, and persistence timing.

### Room Timer Boundary Contract

`server/roomTimers.js` owns room timer bookkeeping:

- `scheduleRoomInterval(room, callback, delay)` assigns `room.timerId` and returns it.
- `clearRoomInterval(room)` clears the active interval without changing the stored id, preserving existing room snapshot shape.
- `scheduleRoomTimeout(room, callback, delay)` appends the timeout id to `room.timeoutIds` and removes it before invoking the callback.
- `clearRoomTimeout(room, id)` clears one tracked timeout and removes it from `room.timeoutIds`.
- `clearRoomTimers(room)` clears the room interval and every tracked timeout, then resets `room.timeoutIds` to `[]`.

`server/rooms.js` should decide **when** to schedule opening, skill preview, counting, draw, result-review, close, and empty-room deadlines, but it should not hand-edit `timeoutIds` or call raw timer APIs for room lifecycle timers.

Wrong:

```js
const id = setTimeout(callback, delay);
room.timeoutIds.push(id);
room.timeoutIds = room.timeoutIds.filter((candidate) => candidate !== id);
```

Correct:

```js
scheduleRoomTimeout(room, callback, delay);
```

Tests touching timer bookkeeping should update `server/roomTimers.test.js`; room lifecycle behavior can remain in `server/rooms.test.js`.

### Leaderboard API Contract

`GET /api/leaderboard` returns users who have at least one completed game. Each player row must include:

- `id`, `username`, `rating`, `rank`, `itemEffects`
- `totalGames`, `wins`, `losses`, `draws`
- `commonCharacter`

`draws` is a first-class response field, not a frontend-only derived value. `buildLeaderboard()` increments it when `recordWinnerColor(record)` returns no winner, and tests should assert draw counts alongside wins and losses.

Wrong:

```js
return { totalGames: row.totalGames, wins: row.wins, losses: row.losses };
```

Correct:

```js
return { totalGames: row.totalGames, wins: row.wins, losses: row.losses, draws: row.draws };
```

---

## Testing Requirements

<!-- What level of testing is expected -->

- Leaderboard changes should update `server/leaderboard.test.js` with base win/loss/draw cases, including at least one draw record.

---

## Code Review Checklist

<!-- What reviewers should check -->

(To be filled by the team)
