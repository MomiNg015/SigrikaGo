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

### Room Clock Lifecycle Boundary Contract

`server/roomClockLifecycle.js` owns the per-room game clock interval behavior:

- `createRoomClockLifecycle(deps)` returns `startGameClock(room, io)`.
- `startGameClock()` sets `room.lastTick`, registers the 1-second interval through `scheduleRoomInterval()`, and owns the interval callback.
- If a room has already left the in-memory room map, it clears the room interval.
- If the room is not in `playing` phase, it refreshes `lastTick` without ticking a player clock.
- If all players are disconnected, it refreshes `lastTick` and delegates to `scheduleEmptyActiveRoomClose()`.
- During active play, it deducts elapsed seconds from the active player via `tickPlayerClock()`.
- When the active player times out, it marks the game finished, computes the timeout winner, emits the invalid early-result toast when needed, appends the timeout system message, schedules room close, and broadcasts the full room.
- Otherwise it emits only `broadcastRoomClock()` so normal per-second ticks avoid full room snapshots.

`server/rooms.js` should decide **when** a room clock starts or resumes, but it should not own the interval callback, timeout finish mutation, or clock-vs-room broadcast decision.

Wrong:

```js
scheduleRoomInterval(room, () => {
  tickPlayerClock(active, elapsed);
  broadcastRoom(io, room);
}, 1000);
```

Correct:

```js
startGameClock(room, io);
```

Tests touching clock interval branching, timeout finish behavior, disconnected-player handoff, or clock broadcast choice should update `server/roomClockLifecycle.test.js`; end-to-end opening/restore behavior can remain in `server/rooms.test.js`.

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

### Room Skill Resolution Boundary Contract

`server/roomSkillResolution.js` owns skill-preview lifecycle and pending skill resolution:

- `createRoomSkillLifecycle(deps)` returns `startActiveSkill`, `maybeStartPassiveSkill`, `schedulePendingSkillResolution`, and `completePendingSkillResolution`.
- `startActiveSkill({ room, player, action, io })` validates active skill availability, chooses board-confirmation targets, applies the shared `useSkill()` result, creates `room.pendingSkillResolution`, moves the room into `skillPreview`, appends the skill system message, and schedules preview completion.
- `maybeStartPassiveSkill(room, io)` owns color-illusion passive preview start and returns false when the current room state cannot start a passive preview.
- `schedulePendingSkillResolution(room, io)` owns restored pending-skill delay calculation and timer scheduling.
- `completePendingSkillResolution(roomCode, pendingSkillId, io)` owns replacing the preview state with the resolved game snapshot, clearing `pendingSkillResolution`, resetting byo-yomi for the acting player, appending notices, handing off finished games to room close scheduling, chaining passive skills, and broadcasting the resolved room.
- `buildPendingSkillPreview()` owns pending-skill payload fields consumed by the frontend animation layer: skill identity, target id, affected point ids, marked point ids, removed counts, item effects, and banner/board-effect durations.

`server/rooms.js` should decide **when** an action/opening/restore path reaches skill-preview logic, but it should not hand-build pending-skill payloads, directly mutate `pendingSkillResolution`, or duplicate preview completion behavior.

Wrong:

```js
room.pendingSkillResolution = { pendingSkillId, game: result.state };
room.game = { ...room.game, phase: GAME_PHASES.skillPreview, pendingSkill };
```

Correct:

```js
return startActiveSkill({ room, player, action, io });
```

Tests touching preview payload metadata, delay math, scheduling, or completion side effects should update `server/roomSkillResolution.test.js`; end-to-end active/passive skill flow should remain covered by `server/rooms.test.js`.

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

### Room Restore Lifecycle Boundary Contract

`server/roomRestoreLifecycle.js` owns restored-room timer resume decisions after persisted room hydration:

- `createRoomRestoreLifecycle(deps)` returns `resumeRoomTimers(room, io)`.
- Finished rooms with expired `closesAt` close immediately through `closeRoom(room.code, io, { reason: "finished-room-close" })` and return false so callers skip persistence.
- Finished rooms whose close window is still active delegate to `scheduleRoomClose(room.code, io)`.
- Opening rooms always start the game clock; if `openingEndsAt` has elapsed they call `completeRoomOpening(room, io)`, otherwise they delegate to `scheduleGameStart(room, io)`.
- Restored `skillPreview` rooms first call `schedulePendingSkillResolution(room, io)`. If the pending skill snapshot is no longer schedulable, the room falls back to `playing` and clears `game.pendingSkill`.
- Active rooms start the game clock, resume phase-specific deadlines through `schedulePendingRoomDeadlines(room, io)`, and schedule empty-room close handling.

`server/rooms.js` should hydrate and register persisted rooms, but it should not duplicate restore-time branching for finished/opening/skill-preview/active phases.

Wrong:

```js
if (room.game.phase === GAME_PHASES.skillPreview) {
  room.game.phase = GAME_PHASES.playing;
}
```

Correct:

```js
const restored = resumeRoomTimers(room, io);
```

Tests touching restore-time phase branching, expired close windows, opening deadline decisions, invalid pending-skill fallback, or active deadline scheduling should update `server/roomRestoreLifecycle.test.js`; persisted-room integration can remain in `server/rooms.test.js`.

### Room Deadline Scheduler Boundary Contract

`server/roomDeadlineScheduler.js` owns room deadline timer scheduling and timeout transitions:

- `createRoomDeadlineScheduler(deps)` returns `scheduleGameStart`, `scheduleInitialPassiveSkill`, `scheduleCountingTimeout`, `scheduleDrawTimeout`, `scheduleResultReviewTimeout`, and `schedulePendingRoomDeadlines`.
- `scheduleGameStart(room, io)` schedules opening completion from `room.openingEndsAt`.
- `scheduleInitialPassiveSkill(room, io)` schedules the first passive-skill attempt after `INITIAL_PASSIVE_SKILL_DELAY_MS` and broadcasts only when a passive skill actually starts.
- `scheduleCountingTimeout(room, io)` restores suspended hidden hands, clears scoring/counting state, appends the counting-timeout system message, and broadcasts when the counting deadline expires.
- `scheduleDrawTimeout(room, io)` clears draw-request state, appends the draw-timeout system message, and broadcasts when the draw deadline expires.
- `scheduleResultReviewTimeout(roomOrCode, io)` clears result-review scoring state, appends the result-review timeout system message, and broadcasts when the result deadline expires.
- `schedulePendingRoomDeadlines(room, io)` resumes only the deadline timer matching the room's current phase.

`server/rooms.js` should decide **when** room state enters these phases, but it should not duplicate deadline delay math, timeout state-reset rules, or restored-room deadline scheduling.

Wrong:

```js
scheduleRoomTimeout(room, () => {
  room.game.phase = GAME_PHASES.playing;
  room.drawDeadline = null;
}, room.drawDeadline - Date.now());
```

Correct:

```js
scheduleDrawTimeout(room, io);
```

Tests touching opening delay, passive-skill delay, timeout state resets, timeout messages, or restored pending deadlines should update `server/roomDeadlineScheduler.test.js`; end-to-end phase behavior can remain in `server/rooms.test.js`.

### Room Result Persistence Boundary Contract

`server/roomResultPersistence.js` owns finished-room result persistence:

- `saveGameRecord({ prisma, room })` is the only room result persistence entry point.
- Invalid finished rooms set `room.recordSaved = true` and do not create `GameRecord`, mode-stat, reward, ledger, or item-effect operations.
- Valid draws create a `GameRecord`, increment both players' mode `draws`, update in-room mode stats, and do not apply rating/coin rewards.
- Decisive results create a `GameRecord`, apply room-user rewards, upsert winner/loser mode stats, update user rating/win/loss/coin fields where appropriate, create progress ledger entries, and include item-effect cleanup operations.
- `modeStatsUpsertOperation()`, `applyDrawResultToRoomUser()`, and `gameResultProgressEntries()` keep the operation-shape helpers testable outside the realtime room lifecycle.

`server/rooms.js` should decide **when** a finished room needs saving, but it should not own `GameRecord` payload shape, mode-stat upsert shape, reward transaction composition, or progress ledger payloads.

Wrong:

```js
prisma.gameRecord.create({ data: { roomCode: room.code } });
```

Correct:

```js
await saveGameRecord({ prisma, room });
```

Tests touching result persistence helpers, invalid-result skipping, draw stat updates, or progress ledger payloads should update `server/roomResultPersistence.test.js`; integrated winner/loser reward persistence should remain covered by `server/rooms.test.js`.

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
