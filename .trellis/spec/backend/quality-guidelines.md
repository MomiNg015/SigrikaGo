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

### Auth HTTP Boundary Contract

`server/authRoutes.js` owns the `/api/auth/*` HTTP request handlers:

- `createAuthRouter(deps)` mounts register, login, refresh, and logout routes.
- `createAuthRouteHandlers(deps)` exposes the same handlers for focused unit tests without starting the full server.
- Registration validates username and password, hashes the password, syncs configured admin promotion, and returns the same login response shape as login.
- Login validates credentials, rejects banned users, returns the `already_logged_in` conflict response for active online sockets, and lets `forceLogin` evict the previous session through `onlineSessions.forceLogoutUser()`.
- Refresh reads the `sigrika_refresh` cookie through the login-session helpers, rotates valid refresh cookies, clears invalid/banned sessions, and signs the access-token response with the injected JWT secret.
- Logout clears the refresh token and best-effort clears the access-token session while still succeeding for malformed or expired access tokens.

`server/index.js` should create shared dependencies such as `loginSessions`, `onlineSessions`, `prisma`, and `JWT_SECRET`, then mount this router. It should not duplicate auth handler bodies, cookie parsing, active-account conflict responses, or logout token parsing.

Wrong:

```js
app.post("/api/auth/login", async (req, res) => {
  // credential checks, cookie writes, session eviction
});
```

Correct:

```js
app.use("/api/auth", createAuthRouter({ prisma, jwtSecret, loginSessions, onlineSessions }));
```

Tests touching auth route status codes, cookie rotation/clearing, forced login, refresh-session recovery, or logout cleanup should update `server/authRoutes.test.js`; lower-level session storage behavior should stay in `server/loginSessions.test.js`.

### Player HTTP Boundary Contract

`server/playerRoutes.js` owns authenticated player self-service HTTP handlers:

- `GET /api/me`
- `GET /api/me/resume`
- `POST /api/me/character`
- `POST /api/me/decoration`
- `POST /api/me/music-selection`

It also owns `createCharacterSelectionData()` and `validateOptionalRoomCode()` so HTTP resume, Socket.IO resume, and Socket.IO auth share the same character availability and optional-room-code behavior.

`server/index.js` should create shared dependencies such as `prisma`, `findRoomForUser`, `roomView`, and the `characterSelectionData` closure, then mount this router. It should not duplicate player profile/history enrichment, character/decor ownership checks, blocked-character checks, music-selection error shaping, or optional room-code normalization.

Wrong:

```js
app.post("/api/me/character", authHttp, async (req, res) => {
  const characterId = String(req.body.characterId ?? "");
  // ...
});
```

Correct:

```js
const characterSelectionData = createCharacterSelectionData({ prisma });
app.use("/api", authHttp, createPlayerRouter({
  prisma,
  findRoomForUser,
  roomView,
  characterSelectionData
}));
```

Tests touching player self-service HTTP behavior should update `server/playerRoutes.test.js`; lower-level character resolution should stay in `server/characterSelection.test.js`, resume payload behavior in `server/resume.test.js`, and music selection rules in `server/musicSelection.test.js`.

### Personal Replay HTTP Boundary Contract

`server/replayRoutes.js` owns personal replay HTTP handlers:

- `GET /api/replays`
- `GET /api/replays/:id`

It owns personal replay query shape, player id response fields, legacy `mode ?? "spark"` fallback, and snapshot JSON parsing. Tests should call `createReplayRouteHandlers()` directly instead of matching route source text inside `server/index.js`.

`server/index.js` should mount the replay router with shared auth and `prisma`; it should not duplicate personal replay query projection or snapshot parsing.

Tests touching personal replay route status codes, query fields, mode fallback, or snapshot parsing should update `server/replayRoutes.test.js`.

### Social HTTP Boundary Contract

`server/socialRoutes.js` owns social and public-profile HTTP handlers:

- `GET /api/social`
- `POST /api/social/friends/:targetId`
- `DELETE /api/social/friends/:targetId`
- `POST /api/social/blacklist/:targetId`
- `DELETE /api/social/blacklist/:targetId`
- `GET /api/users/search/profile`
- `GET /api/users/:id/profile`
- `GET /api/users/:id/replays`

The router accepts `authHttp` and mounts it only on authenticated social/profile routes. `GET /api/users/:id/replays` is intentionally public and must remain a single-handler route unless the product requirement changes.

`server/index.js` should create shared dependencies such as `prisma`, `authHttp`, and `statusForUser`, then mount `createSocialRouter()`. It should not duplicate relationship mutation handlers, social-list refresh response shaping, username validation for profile search, mode normalization for profile/replay handlers, or public replay not-found responses.

Wrong:

```js
app.post("/api/social/friends/:targetId", authHttp, async (req, res) => {
  await setRelationship({ prisma, ownerUserId: req.user.id, targetUserId: req.params.targetId });
});
```

Correct:

```js
app.use("/api", createSocialRouter({ prisma, authHttp, statusForUser }));
```

Tests touching social route status codes, auth/public route mounting, relationship response refreshes, username validation, mode normalization, or user replay route responses should update `server/socialRoutes.test.js`; lower-level profile and relationship query behavior should stay in `server/social.test.js`.

### Admin User Management Boundary Contract

`server/adminUserManagement.js` owns admin-side user write operations:

- `sanitizeUserUpdate(body)` accepts only editable user fields and normalizes ratings, coins, owned characters, owned items, selected character, and role values.
- `requireUserUpdateData(data)` is the shared empty-update guard for user edit routes.
- `updateUserProfile()` owns profile updates, structured asset synchronization, progress ledger entries for admin rating/coin changes, last-active-admin protection, and `user.update` audit writes.
- `banUser()` and `unbanUser()` own status transitions, ban metadata, last-active-admin protection for bans, and corresponding audit writes.
- `resetUserPassword()` owns bcrypt hashing inside the same transaction as the `user.reset-password` audit write, without leaking password material into audit JSON.
- User-target audit JSON serialization and low-level `AdminAuditLog` writes live in `server/adminAudit.js`.

`server/adminRoutes.js` should validate route-only concerns such as path params and minimum password/reason length, then delegate user mutations to this boundary. It should not duplicate user-field sanitization, structured asset sync decisions, progress-ledger composition, password hashing, or last-admin checks.

Wrong:

```js
router.patch("/users/:id", async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: req.body });
});
```

Correct:

```js
res.json(await updateUserProfile({ prisma, adminUser: req.user, userId: req.params.id, body: req.body }));
```

Tests touching admin user edit sanitization, ban/unban, password reset, asset sync, progress ledger writes, or admin user audit entries should update `server/adminRoutes.test.js` or a focused `server/adminUserManagement.test.js`; route wiring tests can remain in `server/adminRoutes.test.js`.

### Admin Catalog Management Boundary Contract

`server/adminCatalogManagement.js` owns admin-side catalog write operations for decorations and shop items:

- `createDecoration()`, `updateDecoration()`, and `disableDecoration()` own decoration persistence and `decoration.*` audit writes.
- `createShopItem()`, `updateShopItem()`, and `disableShopItem()` own shop item persistence and `shop-item.*` audit writes.
- `assertShopTargetExists(prisma, item)` validates shop targets for character, decoration, and music catalog entries, including built-in stone decorations and music defaults.
- Shop item audit payloads should use `toShopItemPayload()` so route responses and audit JSON stay consistent.

`server/adminRoutes.js` should own HTTP concerns such as body validation and response shape, then delegate catalog mutations and target validation to this boundary. It should not duplicate decoration/shop item transactions, target-existence checks, or catalog audit writes.

Wrong:

```js
const item = await prisma.shopItem.update({ where: { id }, data: input });
await writeAudit(prisma, req.user, "shop-item.update", item.id, before, item, "shop-item");
```

Correct:

```js
await assertShopTargetExists(prisma, validated.value);
const item = await updateShopItem({ prisma, adminUser: req.user, itemId: req.params.id, input: validated.value });
```

Tests touching admin decoration/shop item create/update/disable, shop target validation, or catalog audit payloads should update `server/adminRoutes.test.js` or a focused `server/adminCatalogManagement.test.js`; player-facing purchase behavior should stay in `server/shop.test.js`.

### Admin Character Management Boundary Contract

`server/adminCharacterManagement.js` owns admin-side character and skill write operations:

- `createCharacter()`, `updateCharacter()`, and `disableCharacter()` own character persistence, skill creation/upsert payloads, and `character.*` audit writes.
- `updateCharacter()` owns compatibility merging from older top-level skill fields such as `skillName`, `skillDescription`, `uses`, `freeTurn`, `targetRule`, `paramsJson`, `costType`, `costValue`, `systemMessage`, and `skillEnabled`.
- `toAdminCharacterPayload(record)` owns admin-facing character payload projection, including disabled skills, default skill system messages, skill cost compatibility fields, and `paramsJson`.
- Character audit payloads should use public character payload projection so admin route responses and audit JSON stay consistent.

`server/adminRoutes.js` should own HTTP concerns such as route validation and response wrapping, then delegate character mutations and admin character payload projection to this boundary. It should not duplicate skill upsert shape, legacy skill-field merging, admin character payload compatibility, or character audit writes.

Wrong:

```js
const after = await prisma.character.update({ where: { id }, data: { skill: { upsert: { update: req.body.skill } } } });
```

Correct:

```js
const character = await updateCharacter({ prisma, adminUser: req.user, characterId: req.params.id, body: req.body });
res.json({ character: toAdminCharacterPayload(character) });
```

Tests touching admin character create/update/disable, legacy skill field compatibility, skill upsert payloads, or admin character payload projection should update `server/adminRoutes.test.js` or a focused `server/adminCharacterManagement.test.js`; public character validation and payload rules should stay in `server/characters.test.js`.

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

### Room Runtime Boundary Contract

`server/roomRuntime.js` owns the runtime callback adapters shared by room lifecycle modules:

- `createRoomRuntime(deps)` returns `persistRoom(room, options)`, `broadcastRoom(io, room)`, and `broadcastToast(io, room, text)`.
- `persistRoom()` delegates to `persistRoomState({ prisma, room, force, throttleMs, onError })` and defaults `force` to false.
- `broadcastRoom()` delegates to `server/roomBroadcasts.js` with the runtime `persistRoom` callback so full room snapshots keep forced persistence behavior centralized.
- `broadcastToast()` forwards room toast delivery to the broadcast boundary without duplicating participant iteration.

`server/rooms.js` should compose this runtime once and inject the returned callbacks into lifecycles, but it should not duplicate persistence throttling options, broadcast persistence injection, or toast forwarding wrappers.

Wrong:

```js
function broadcastRoom(io, room) {
  broadcastRoomUpdate(io, room, { persistRoom });
}
```

Correct:

```js
const roomRuntime = createRoomRuntime(deps);
const { persistRoom, broadcastToast } = roomRuntime;
export const { broadcastRoom } = roomRuntime;
```

Tests touching persistence option wiring, default force behavior, full-room broadcast persistence injection, or toast forwarding should update `server/roomRuntime.test.js`; payload-level broadcast tests should stay in `server/roomBroadcasts.test.js`.

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

### Room Connection Lifecycle Boundary Contract

`server/roomConnectionLifecycle.js` owns room socket connection-state mutation:

- `createRoomConnectionLifecycle(deps)` returns `attachSocketToRoom`, `detachSocket`, and `leaveRoom`.
- `attachSocketToRoom(roomCode, socket, user)` validates the room code, reconnects existing players, clears empty-room close state, appends reconnect notices for active disconnected players, adds first-time spectators, joins the socket room, and force-persists changed room state.
- Spectator attach is idempotent by `user.id`; duplicate spectator joins should not append duplicate spectators or duplicate join notices.
- `detachSocket(socketId, io)` removes the socket from matchmaking, disconnects matching players, timestamps `disconnectedAt`, appends disconnect notices only for unfinished rooms, removes matching spectators, schedules empty-room close when `io` is provided, force-persists changed rooms, and returns changed rooms.
- `leaveRoom(roomCode, userId, socketId)` handles explicit spectator leave and finished-player leave-as-spectator cleanup, appends `spectator-leave` notices, and force-persists changed room state.

`server/rooms.js` should decide which socket event calls this boundary, but it should not duplicate player/spectator socket mutation, reconnect/disconnect notice rules, or forced persistence after connection-state changes.

Wrong:

```js
player.socketId = null;
player.disconnectedAt = Date.now();
room.spectators = room.spectators.filter((spectator) => spectator.socketId !== socketId);
```

Correct:

```js
detachSocket(socketId, io);
```

Tests touching player reconnects, spectator joins/leaves, socket disconnect cleanup, finished-player leave behavior, or connection-state persistence should update `server/roomConnectionLifecycle.test.js`; socket-event integration can remain in `server/rooms.test.js`.

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

### Room Creation Lifecycle Boundary Contract

`server/roomCreationLifecycle.js` owns post-match and direct-duel room creation orchestration:

- `createRoomCreationLifecycle(deps)` returns `joinMatchmaking(player, io, { canPair })` and `createDirectRoom(first, second, io, modeInput)`.
- `joinMatchmaking()` delegates waiting-player state to `matchmakingQueue.join()`, returns `null` when no match is available, and only creates a room when the queue returns a matched opponent/player pair.
- `createDirectRoom()` normalizes the requested mode, removes both users from matchmaking, creates the room, and shares the same post-creation registration path as matchmaking.
- The shared registration path stores the room in `rooms`, force-persists the initial snapshot, starts the game clock, schedules opening completion, emits `match:found` to both sockets with viewer-specific `roomView()` payloads, appends the creation system notice, and broadcasts the initial room snapshot.

`server/rooms.js` should route socket events and expose compatibility exports, but it should not duplicate matched-room registration, forced initial persistence, clock startup, opening scheduling, or `match:found` delivery.

Wrong:

```js
rooms.set(room.code, room);
persistRoom(room, { force: true });
startGameClock(room, io);
scheduleGameStart(room, io);
io.to(first.socketId).emit("match:found", roomView(room, first.user.id));
```

Correct:

```js
const roomCreationLifecycle = createRoomCreationLifecycle(deps);
export const { joinMatchmaking, createDirectRoom } = roomCreationLifecycle;
```

Tests touching matched matchmaking creation, direct duel creation, initial persistence, match-found payloads, or creation notices should update `server/roomCreationLifecycle.test.js`; socket-event routing can remain in `server/rooms.test.js`.

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

### Room Action Lifecycle Boundary Contract

`server/roomActionLifecycle.js` owns gameplay action entry routing:

- `createRoomActionLifecycle(deps)` returns `handleGameAction(roomCode, userId, action, io)`.
- `handleGameAction()` validates the room code, looks up the room, delegates point-target validation to `validateActionPoint(action, room.game.size)`, verifies the actor is a room player, and rejects new actions while `room.game.pendingSkill` is active.
- Test actions go through `isRoomTestAction()` / `handleRoomTestAction()`, append optional test system messages, apply returned game state, and append returned notices.
- Skill actions delegate to `startActiveSkill({ room, player, action, io })`.
- Standard move/pass/resign actions delegate to `applyStandardGameAction()` with the injected room lifecycle dependencies.

`server/rooms.js` should expose the action entry point for socket/API routing, but it should not duplicate action validation order, test-action state application, skill routing, or standard-action dependency wiring.

Wrong:

```js
const room = rooms.get(code);
if (action.type === "skill") return startActiveSkill({ room, player, action, io });
return applyStandardGameAction({ room, player, action, io, appendSystem });
```

Correct:

```js
const roomActionLifecycle = createRoomActionLifecycle(deps);
export const { handleGameAction } = roomActionLifecycle;
```

Tests touching gameplay action entry validation order, test-action dispatch, skill dispatch, or standard-action dependency wiring should update `server/roomActionLifecycle.test.js`; action-result rule behavior should stay in the focused rule modules.

### Room Chat Lifecycle Boundary Contract

`server/roomChatLifecycle.js` owns room chat entry mutation:

- `createRoomChatLifecycle(deps)` returns `addChat(roomCode, user, text)`.
- `addChat()` validates the room code before normalizing text, normalizes text through `normalizeChatText()`, looks up the room, appends the canonical chat message object, and returns the changed room.
- Chat message shape is `{ id, type: "chat", userId, username, moveNumber, text, createdAt }`.
- `moveNumber` is captured from `room.game.moveNumber` at send time; `id` and `createdAt` come from injectable `randomUUID` and `now` dependencies for deterministic tests.
- Invalid room codes, invalid text, and missing rooms return `null` without mutating chat.

`server/rooms.js` should expose the chat entry point for socket/API routing, but it should not duplicate text normalization order, chat payload shape, message id creation, or move-number capture.

Wrong:

```js
room.chat.push({ type: "chat", text, createdAt: Date.now() });
```

Correct:

```js
const roomChatLifecycle = createRoomChatLifecycle(deps);
export const { addChat } = roomChatLifecycle;
```

Tests touching chat entry validation order, message shape, move-number capture, id/timestamp injection, or no-op cases should update `server/roomChatLifecycle.test.js`; socket delivery behavior can remain in `server/rooms.test.js` or socket integration tests.

### Room Queries Boundary Contract

`server/roomQueries.js` owns room read-model projection and lookup helpers:

- `createRoomQueries({ rooms, onlineParticipantCount, watchPlayerSummary })` returns `listActiveRooms`, `listWatchRooms`, `isUserInActiveRoom`, and `findRoomForUser`.
- `listActiveRooms()` returns in-memory rooms whose `room.game.phase` is not `finished`.
- `listWatchRooms()` projects each room to `{ code, mode, onlineCount, moveNumber, status, closesAt, black, white }`, using `room.mode ?? room.game.mode ?? "spark"` and delegating participant counts/player summaries to `server/roomPresence.js`.
- `isUserInActiveRoom(userId)` must use active-room filtering so finished rooms do not block matchmaking or lobby actions.
- `findRoomForUser(userId, roomCode)` searches either a specific room code or all rooms and returns `null` when no player match exists.

`server/rooms.js` should keep the shared room map, but it should not duplicate watch-list projection shape, active-room filtering, online-count calculation, or user-room lookup behavior.

Wrong:

```js
const onlineCount = room.players.filter((player) => player.socketId).length;
return { code: room.code, onlineCount };
```

Correct:

```js
const roomQueries = createRoomQueries({ rooms });
export const { listWatchRooms } = roomQueries;
```

Tests touching active-room filtering, watch-room payload shape, mode fallback, participant summary delegation, or user-room lookup should update `server/roomQueries.test.js`; API/socket callers can keep integration tests around their event wiring.

### Room Request Lifecycle Boundary Contract

`server/roomRequestLifecycle.js` owns counting, draw, and scoring request entry validation:

- `createRoomRequestLifecycle(deps)` returns `requestCounting`, `respondCounting`, `requestDraw`, `respondDraw`, and `handleScoringAction`.
- Each entry point validates the room code through `validateRoomCode()`, looks up the room, verifies the actor is a player, checks phase preconditions, and then delegates mutation to `server/roomScoringFlow.js`.
- `handleScoringAction()` also delegates point-target validation to `validateActionPoint(action, room.game.size)` before scoring phase checks.
- Counting requests are allowed only from `playing`; counting responses are allowed only from `countingRequested`.
- Draw requests are allowed only from `playing`; draw responses are allowed only from `drawRequested`.
- Dead-stone marking actions require `markingDead`; result accept/reject actions require `resultReview`.

`server/rooms.js` should route socket/API events to these entry points, but it should not duplicate room/player lookup, phase checks, or scoring point validation for counting/draw/scoring flows.

Wrong:

```js
const room = rooms.get(roomCode);
if (room.game.phase !== GAME_PHASES.drawRequested) return { ok: false };
return applyDrawResponse({ room, player, accepted });
```

Correct:

```js
return respondDraw(roomCode, userId, accepted, io);
```

Tests touching counting/draw/scoring entry validation, phase preconditions, player lookup, or dispatch into scoring flow should update `server/roomRequestLifecycle.test.js`; full room flow regressions can remain in `server/rooms.test.js`.

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

### Room Persistence Restore Lifecycle Boundary Contract

`server/roomPersistenceRestoreLifecycle.js` owns persisted-room restore orchestration:

- `createRoomPersistenceRestoreLifecycle(deps)` returns `restorePersistedRooms(io)`.
- `restorePersistedRooms()` reads rows through injected `listPersistedRooms()`, parses each row snapshot, hydrates it through `hydratePersistedRoom()`, skips hydrated rows without a room `code`, appends restored disconnect notices, registers the room in `rooms`, invokes `resumeRoomTimers(room, io)`, and force-persists rooms whose resume result is not `false`.
- A row that throws during JSON parse, hydration, notice append, timer resume, or persistence should be logged through `onError(message, error)` and must not abort later rows.
- The returned array contains restored rooms that had a room code, including rooms that are immediately closed by restore-time timer decisions; skipped/failed rows are omitted.

`server/rooms.js` should provide dependencies and expose the compatibility entry point, but it should not duplicate persisted-row iteration, parse/hydrate/register sequencing, bad-row isolation, or force-persist-after-resume behavior.

Wrong:

```js
for (const row of await listPersistedRooms(prisma)) {
  const room = hydratePersistedRoom(JSON.parse(row.snapshot));
  rooms.set(room.code, room);
}
```

Correct:

```js
const restoreLifecycle = createRoomPersistenceRestoreLifecycle(deps);
export const { restorePersistedRooms } = restoreLifecycle;
```

Tests touching persisted-row iteration, bad snapshot isolation, no-code skips, registration, timer resume handoff, or post-resume force persistence should update `server/roomPersistenceRestoreLifecycle.test.js`; end-to-end restart behavior can remain in `server/rooms.test.js`.

### Room Opening Lifecycle Boundary Contract

`server/roomOpeningLifecycle.js` owns the room opening transition:

- `createRoomOpeningLifecycle(deps)` returns `completeRoomOpening(room, io)` and `startInitialPassiveSkillNow(room, io)`.
- `completeRoomOpening()` returns false unless the room is in `opening` phase.
- For opening rooms, it switches `room.game.phase` to `playing`, refreshes `room.lastTick`, appends the `game-start` system notice, broadcasts the full room, schedules the initial passive-skill attempt, and returns true.
- `startInitialPassiveSkillNow()` delegates to `maybeStartPassiveSkill(room, io)` so tests and restore paths can trigger the same passive-skill entry point.

`server/rooms.js` should expose compatibility wrappers for deadline/restore callers, but it should not duplicate opening phase mutation, game-start notice shape, last-tick refresh, broadcast timing, or initial passive-skill handoff.

Wrong:

```js
room.game.phase = GAME_PHASES.playing;
appendSystem(room, "game started");
broadcastRoom(io, room);
```

Correct:

```js
return roomOpeningLifecycle.completeRoomOpening(room, io);
```

Tests touching opening completion, non-opening no-ops, game-start notices, broadcast timing, last-tick refresh, or initial passive-skill handoff should update `server/roomOpeningLifecycle.test.js`; deadline/restore scheduling can remain in their focused lifecycle tests.

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
