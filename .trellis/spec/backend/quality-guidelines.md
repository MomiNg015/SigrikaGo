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

### Room Presence Boundary Contract

`server/roomPresence.js` owns shared participant and connection-state queries:

- `roomParticipants(room)` returns players first, then spectators.
- `onlineParticipantCount(room)` counts connected players and spectators.
- `hasConnectedRoomParticipant(room)` returns whether any player or spectator is connected.
- `arePlayersDisconnected(room)` returns true only when the room has players and every player is disconnected; spectators do not keep an active game alive.
- `watchPlayerSummary(room, color)` builds the watch-list summary for a player color.

Room broadcasting, watch-room summaries, finished-room close extension, and empty-active-room closure should reuse these helpers instead of reimplementing players/spectators iteration.

Wrong:

```js
const online = room.players.filter((player) => player.socketId).length
  + room.spectators.filter((spectator) => spectator.socketId).length;
```

Correct:

```js
const online = onlineParticipantCount(room);
```

Tests touching participant-state rules should update `server/roomPresence.test.js`; workflow-specific behavior should stay in `server/rooms.test.js`.

### Room Matchmaking Queue Boundary Contract

`server/roomMatchmakingQueue.js` owns waiting-player queue state:

- `createRoomMatchmakingQueue()` returns an isolated queue instance.
- `join(player, { canPair })` normalizes `player.mode`, deduplicates by `user.id` and `socketId`, matches only same-mode compatible queued players, and removes the matched opponent from the queue.
- `list()`, `count()`, and `countsByMode()` expose read-only queue snapshots for API/status surfaces.
- `removeUser(userId)`, `removeSocket(socketId)`, and `clear()` own queue cleanup for leave, disconnect, and tests.

`server/rooms.js` should decide what happens after a match is found: room creation, persistence, clock startup, opening schedule, and `match:found` / `room:update` delivery. It should not hand-edit the waiting queue array.

Wrong:

```js
waitingPlayers = waitingPlayers.filter((candidate) => candidate.user.id !== player.user.id);
waitingPlayers.push({ ...player, mode });
```

Correct:

```js
const match = matchmakingQueue.join(player, { canPair });
```

Tests touching queue state, mode isolation, deduplication, or `canPair` behavior should update `server/roomMatchmakingQueue.test.js`; end-to-end room creation behavior should stay in `server/rooms.test.js`.

### Room Factory Boundary Contract

`server/roomFactory.js` owns initial room and room-player construction:

- `createRoom(first, second, { modeInput, isCodeTaken, now, random })` normalizes the mode, assigns black/white players, creates the opening game state, sets initial timers/deadlines, and generates a non-conflicting room code through `isCodeTaken`.
- `toRoomPlayer(player, color, mode)` builds room player state, including the initial clock and selected character config.
- `userForRoomMode(user, mode)` projects mode-specific rating/rank/win/loss values onto the in-room user snapshot.
- `modeStatsForUser(user, mode)` reads object or array `modeStats` and falls back to legacy spark values or standard defaults.
- `randomRoomCode({ isCodeTaken, random })` owns five-digit room code generation and collision retry.

`server/rooms.js` should decide **when** to create a room and what to do after creation, but it should not hand-build room object shape or duplicate mode-stat projection.

Wrong:

```js
const room = { code: randomRoomCode(), players, game, timerId: null };
```

Correct:

```js
const room = createRoom(first, second, { modeInput: mode, isCodeTaken });
```

Tests touching initial room shape, room-player shape, mode projection, or code collision behavior should update `server/roomFactory.test.js`.

### Room Skill Message Boundary Contract

`server/roomSkillMessages.js` owns skill system-message formatting:

- `describeSkillUse(room, player, targetId)` builds the user-facing skill notice for active and passive skill previews.
- `renderSkillMessage(template, values)` replaces supported placeholders: `{player}`, `{character}`, `{skill}`, `{point}`, `{fromColor}`, `{toColor}`, `{targetColor}`, and `{color}`.
- `formatPointLabel(pointId)` formats board coordinates with the project coordinate labels.
- `stoneLabel(color)` formats `black`, `white`, or unknown stones for messages.

`server/rooms.js` should decide **when** to append a skill system message, but it should not own skill display strings, coordinate labels, or template replacement rules.

Wrong:

```js
appendSystem(room, `${player.user.username} used ${skill.name}`, { kind: "skill" });
```

Correct:

```js
appendSystem(room, describeSkillUse(room, player, targetId), { kind: "skill" });
```

Tests touching skill message text, placeholders, point labels, or stone labels should update `server/roomSkillMessages.test.js`; room flow tests can assert that a skill message was appended.

### Room System Message Boundary Contract

`server/roomSystemMessages.js` owns room chat-log mutation for generic system messages:

- `appendSystem(room, text, options)` appends the canonical system message object, including id, type, kind, current move number, text, and timestamp.
- `appendNotices(room, notices)` appends a list of system notices with the same object shape.
- `ensureRestoredDisconnectedNotices(room)` appends missing disconnect notices for persisted unfinished rooms without duplicating existing disconnect messages.

`server/rooms.js` and room flow helpers should decide **when** a notice is needed, but they should not duplicate the system message object shape or restored-disconnect deduplication rules.

Wrong:

```js
room.chat.push({ type: "system", text, createdAt: Date.now() });
```

Correct:

```js
appendSystem(room, text, { kind: "disconnect" });
```

Tests touching generic system-message shape, notice-list appends, or restored disconnect notices should update `server/roomSystemMessages.test.js`.

### Room Action Validation Boundary Contract

`server/roomActionValidation.js` owns room action point-target validation:

- `validateActionPoint(action, boardSize)` rejects missing/non-object actions as `"未知操作"`.
- Actions without `pointId` are allowed so non-point actions such as pass/resign can continue through their own handlers.
- Actions with `pointId` must delegate to `validatePointId()` from `server/security.js` and return its error text unchanged.

Room action handlers should call this boundary before mutating room/game state instead of importing point validators directly.

Wrong:

```js
const point = validatePointId(action.pointId, room.game.size);
if (!point.ok) return point.error;
```

Correct:

```js
const validationError = validateActionPoint(action, room.game.size);
if (validationError) return { error: validationError };
```

Tests touching room action point validation should update `server/roomActionValidation.test.js`; flow-specific action results can stay in `server/rooms.test.js`.

### Room Close Lifecycle Boundary Contract

`server/roomCloseLifecycle.js` owns room close and empty-active-room lifecycle behavior:

- `createRoomCloseLifecycle(deps)` returns `scheduleRoomClose`, `closeRoom`, `scheduleEmptyActiveRoomClose`, and `clearEmptyRoomClose`.
- `scheduleRoomClose(roomCode, io)` schedules finished-room cleanup, triggers unsaved record persistence through injected callbacks, force-persists `closesAt`, extends valid finished rooms while participants remain connected, and closes with `{ reason: "finished-room-close", roomCode }`.
- `closeRoom(roomCode, io, options)` clears room timers, emits `room:closed`, removes the room from memory, and triggers persisted-room deletion.
- `scheduleEmptyActiveRoomClose(room, io)` marks unfinished rooms invalid after all players are disconnected for five minutes, appends the invalid-room system message, persists the invalid state, and closes the room without creating a game record.
- `clearEmptyRoomClose(room)` cancels the tracked empty-room timeout and clears `emptySince` / `emptyTimerId`.

`server/rooms.js` should decide **when** a room reaches a close path, but it should not duplicate close payload shape, close-delay rules, persisted deletion, or empty-room invalidation state.

Wrong:

```js
room.game.winner = { invalid: true, reason: "empty-room" };
rooms.delete(room.code);
```

Correct:

```js
scheduleEmptyActiveRoomClose(room, io);
```

Tests touching close delays, close payloads, persisted deletion, empty-room invalidation, or empty-room timeout cancellation should update `server/roomCloseLifecycle.test.js`; end-to-end room flow tests can remain in `server/rooms.test.js`.

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
