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

### Scenario: Story Script Presentation Fields

#### 1. Scope / Trigger
- Trigger: changing generic story script node fields, option fields, admin story editing, `StoryPlayerModal`, or story-script validation.
- Story scripts are stored as JSON in `StoryScript.draftNodesJson` and `StoryScript.publishedNodesJson`, so field additions must survive UI edit, API normalization, persistence, player playback, and legacy onboarding compatibility paths.

#### 2. Signatures
- Node fields: `{ id, speakerName, characterId, effect, text, nextNodeId, options }`.
- Supported node effects come from `src/shared/storyPresentation.js`; empty string means no special effect.
- Option fields: `{ label, nextNodeId, revealDelaySeconds }`.
- `revealDelaySeconds` is either blank or a non-negative finite number of seconds.
- `nextNodeId: ""` on an option is a close-window action, not a validation failure.

#### 3. Contracts
- Keep story presentation constants in `src/shared/storyPresentation.js` when both frontend and backend need the same ids.
- `server/storyScripts.js` is the authoritative API normalization boundary for generic story scripts. It must preserve `effect` and per-option `revealDelaySeconds` when saving drafts, publishing, reading admin payloads, and returning player payloads.
- The legacy onboarding compatibility normalizer in `server/onboardingStory.js` must stay aligned enough to preserve the same node and option presentation fields when it parses legacy JSON.
- Admin editing should bind `effect` at node level and `revealDelaySeconds` at option level. Do not move reveal timing to the node unless the product contract changes.
- Player rendering should treat blank reveal delays as "after typewriter complete" and numeric delays as timers from current-node entry. Completing the typewriter immediately reveals all options.

#### 4. Validation & Error Matrix
- Unknown `effect` -> HTTP 400 story input error.
- Blank `effect` or missing `effect` -> normalize to no effect.
- Missing or blank `revealDelaySeconds` -> normalize to blank and wait for text completion.
- `revealDelaySeconds < 0`, `NaN`, or infinite -> HTTP 400 story input error.
- Option `nextNodeId === ""` -> valid terminal close action.
- Non-empty option target missing from current script -> publish-time target error.

#### 5. Good/Base/Bad Cases
- Good: `{ effect: "long-text-compress-portrait" }` reaches the player and only that node switches story modal layout.
- Good: one option with `revealDelaySeconds: 0.5` appears while the text is still typing, while a blank-delay sibling waits for text completion.
- Base: older nodes with no `effect` or `revealDelaySeconds` continue playing with default behavior.
- Bad: adding an option timing field to the admin form but forgetting `normalizeOption()`, because the value will disappear on save.
- Bad: using a node-level options reveal delay after the option-level contract is established.

#### 6. Tests Required
- Backend story-script tests must assert effect normalization, invalid effect rejection, option reveal-delay preservation, blank compatibility, and invalid delay rejection.
- Player story tests must assert effect class/data hooks and option reveal timing before and after typewriter completion.
- Admin story tests must assert the effect control, option-level numeric timing input, and responsive option-row layout.
- CSS contract tests must keep default story layout unchanged and lock any special effect layout hooks.

#### 7. Wrong vs Correct

Wrong:

```js
function normalizeOption(option = {}) {
  return {
    label: normalizeText(option.label),
    nextNodeId: normalizeText(option.nextNodeId)
  };
}
```

This silently drops option timing on save.

Correct:

```js
function normalizeOption(option = {}) {
  return {
    label: normalizeText(option.label),
    nextNodeId: normalizeText(option.nextNodeId),
    revealDelaySeconds: normalizeOptionRevealDelaySeconds(option.revealDelaySeconds)
  };
}
```

### Match Preload Room Boundary

Matched and accepted-duel rooms must start in `GAME_PHASES.preloading` and use `server/roomPreparationLifecycle.js` as the only boundary for player resource readiness. Socket handlers may validate `room:preload-ready` and forward `{ roomCode, userId }`, but they must not mutate room phase directly. The lifecycle owns ready counts, the 90 second timeout, `match:preload-timeout`, transition into `opening`, and scheduling the existing game-start timer.

Tests touching this boundary should cover room creation, ready count broadcasts, both-ready opening transition, timeout abort, and socket event registration.

### Room Debug Test Tools Contract

#### 1. Scope / Trigger
- Trigger: changing room debug actions, development-only room test buttons, or production deployment checks that mention debug gameplay tools.
- This is a cross-layer test utility contract: frontend visibility, Socket.IO gameplay payloads, backend action handling, and production safety must stay aligned.

#### 2. Signatures
- Frontend visibility gate: `const SHOW_TEST_TOOLS = import.meta.env.DEV` in `src/room/RoomBattleStage.jsx`.
- Debug action payloads: `{ type: "test-random-layout" }`, `{ type: "test-restore-skill" }`, and `{ type: "test-enter-byo-yomi" }`.
- Backend action list: `ROOM_TEST_ACTION_TYPES` in `server/roomTestActions.js`.
- Backend safety gate: `canUseDebugTestActions(env)` returns true only when `env.NODE_ENV !== "production"`.

#### 3. Contracts
- Room test tools are visible by default in Vite development builds and hidden in production builds.
- Production must reject debug test actions even if legacy `ENABLE_TEST_ACTIONS` is set.
- `test-enter-byo-yomi` is a room-wide test shortcut: it sets every room player's `time.main` to `0`, calls `resetByoYomi()` for each timed player, returns `skipByoYomiReset: true`, and does not run normal move effects.
- The mobile room action dock must not hide `.test-tools`; development testers need the same shortcuts on phone layouts as on desktop.
- The shortcut is not a production gameplay feature and must not change ordinary clock timing or phase rules.

#### 4. Validation & Error Matrix
- `NODE_ENV === "production"` with any debug flag -> reject with the existing test-tool unavailable error.
- Non-production env -> allow room debug actions.
- Room phase not `playing` -> `test-enter-byo-yomi` rejects without mutating player timers.
- Missing or legacy player `time` object -> skip that player rather than crashing the debug action.

#### 5. Good/Base/Bad Cases
- Good: local `npm run dev` shows the Timer test button and one click puts both black and white timers into byo-yomi.
- Base: production builds do not render the test-tool group and server-side production validation still fails when `ENABLE_TEST_ACTIONS` is enabled.
- Bad: requiring both `VITE_ENABLE_TEST_TOOLS` and `ENABLE_TEST_ACTIONS` for local development, because it makes the temporary test button appear missing.
- Bad: forcing only the acting player's timer into byo-yomi when the test goal is to exercise both players' countdown behavior.

#### 6. Tests Required
- `server/roomTestActions.test.js` must assert the action list, production rejection, and both-player byo-yomi mutation.
- `server/security.test.js` must assert development-only debug action permission.
- `src/room/ActionBar.test.js` must assert the frontend gate remains dev-only and does not depend on `VITE_ENABLE_TEST_TOOLS`.
- `src/room/RoomScreen.test.js` must assert mobile room CSS keeps `.test-tools` visible in the action dock.

#### 7. Wrong vs Correct

Wrong:

```js
const SHOW_TEST_TOOLS = import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_TOOLS === "true";
```

Correct:

```js
const SHOW_TEST_TOOLS = import.meta.env.DEV;
```

Wrong:

```js
player.time.main = 0;
resetByoYomi(player);
```

Correct:

```js
for (const roomPlayer of room.players ?? []) {
  if (!roomPlayer?.time) continue;
  roomPlayer.time.main = 0;
  resetByoYomi(roomPlayer);
}
```

### Auth HTTP Boundary Contract

`server/authRoutes.js` owns the `/api/auth/*` HTTP request handlers:

- `createAuthRouter(deps)` mounts register, login, refresh, and logout routes.
- `createAuthRouteHandlers(deps)` exposes the same handlers for focused unit tests without starting the full server.
- Registration validates username and password, hashes the password, syncs configured admin promotion, and returns the same login response shape as login.
- Login validates credentials, rejects banned users, returns the `already_logged_in` conflict response for active online sockets, and lets `forceLogin` evict the previous session through `onlineSessions.forceLogoutUser()`.
- Refresh reads the `sigrika_refresh` cookie through the login-session helpers, rotates valid refresh cookies, clears invalid/banned sessions, and signs the access-token response with the injected JWT secret.
- Logout clears the refresh token and best-effort clears the access-token session while still succeeding for malformed or expired access tokens.

`server/index.js` should create shared dependencies such as `loginSessions`, `onlineSessions`, `prisma`, and `JWT_SECRET`, then mount this router. It should not duplicate auth handler bodies, cookie parsing, active-account conflict responses, or logout token parsing.

`/api/auth` must be mounted before broad authenticated `/api` routers such as commerce, admin, player, and replay routes. If `app.use("/api", authHttp, ...)` appears before the auth router, login/register/refresh/logout requests will be intercepted by `authHttp` and return `请先登录` before the auth handlers run. `server/authRouteOrder.test.js` locks this ordering.

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

### Commerce HTTP Boundary Contract

`server/commerceRoutes.js` owns authenticated commerce HTTP handlers:

- `POST /api/shop/:id/purchase`
- `GET /api/items/inventory`
- `POST /api/items/:itemId/use`

`server/index.js` should mount this router behind `authHttp`. It should not duplicate purchase, inventory, or item-use handler bodies, route-level user id binding, request param forwarding, or route error response shaping.

Wrong:

```js
app.post("/api/items/:itemId/use", authHttp, async (req, res) => {
  res.json(await useInventoryItem({ prisma, userId: req.user.id }));
});
```

Correct:

```js
app.use("/api", authHttp, createCommerceRouter({ prisma }));
```

Tests touching commerce route status codes, request param forwarding, or route error shaping should update `server/commerceRoutes.test.js`; purchase and item domain behavior should stay in `server/shop.test.js` and `server/items.test.js`.

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

### Public/Lobby HTTP Boundary Contract

`server/publicRoutes.js` owns public catalog and lobby HTTP handlers:

- `GET /api/health`
- `GET /api/characters`
- `GET /api/shop`
- `GET /api/site-settings`
- `POST /api/feedback`
- `GET /api/leaderboard`
- `GET /api/rooms/watch`

The router accepts `authHttp` and mounts it only on authenticated lobby routes. `GET /api/health`, `GET /api/characters`, and `GET /api/site-settings` are public; shop catalog, feedback, leaderboard, and watch-list routes require the current user.

`server/index.js` should create shared dependencies such as `prisma`, `authHttp`, and `listWatchRooms`, then mount `createPublicRouter()`. It should not duplicate public character/site-setting response shapes, shop catalog user-id binding, feedback error shaping, leaderboard query projection, or watch-room mode filtering.

Wrong:

```js
app.get("/api/leaderboard", authHttp, async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true } });
});
```

Correct:

```js
app.use("/api", createPublicRouter({ prisma, authHttp, listWatchRooms }));
```

Tests touching public/lobby route status codes, auth/public route mounting, feedback route errors, leaderboard query shape, or watch-list filtering should update `server/publicRoutes.test.js`; lower-level leaderboard, feedback, shop, character, and site-settings behavior should stay in their domain tests.

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

### User Asset Compatibility Boundary Contract

`server/userAssets.js` owns compatibility between legacy user asset fields and structured user asset relations:

- Legacy parsers and serializers for `ownedCharacters`, `ownedDecorations`, `ownedItems`, and `itemEffects` live in this module.
- `syncStructuredUserAssets()` and `structuredUserAssetSyncOperations()` replace-sync legacy asset fields into `UserCharacter`, `UserDecoration`, `UserItem`, and `UserItemEffect`.
- `structuredUserItemEffectSyncOperations()` is the narrow effect-only sync path for room result cleanup, where room public users may not carry complete character or inventory fields.
- `publicUserAssets(user)` is the public projection boundary for selected character, selected stone decoration, owned characters, owned decorations, owned item counts, character chain counts, and item effects. It merges legacy fields with loaded structured relations so `publicUser()` and route responses do not duplicate compatibility rules.
- Rating-based and built-in character unlocks are applied inside this asset projection so the public account payload has one ownership source of truth during the migration.

`server/db.js` should compose the public user payload and delegate asset compatibility to `publicUserAssets()`. It should not duplicate legacy item parsing, structured relation merging, chain-count projection, item-effect parsing, or built-in/rating unlock rules.

Wrong:

```js
const ownedCharacters = new Set(parseCharacterAssetList(user.ownedCharacters));
for (const entry of user.userCharacters ?? []) ownedCharacters.add(entry.characterSlug);
```

Correct:

```js
const payload = { ...baseUserFields, ...publicUserAssets(user) };
```

Tests touching user asset parsing, legacy-to-structured sync, public asset projection, item effect merge behavior, or character chain projection should update `server/userAssets.test.js`; top-level public user payload tests can remain in `server/db.test.js`.

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
- `broadcastRoomPatch(io, room, patch, { persistRoom, forcePersist })` emits lightweight `room:patch` payloads with revision metadata; default patch persistence is forced, while explicitly non-critical chat/presence callers may pass `forcePersist: false` to use the shared throttled persistence path.
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
- `broadcastRoomPatch(io, room, patch, { forcePersist })` forwards the persistence timing choice to `server/roomBroadcasts.js`, defaulting to forced persistence unless the socket boundary explicitly marks the patch as non-critical.
- `server/roomStatePersistence.js` serializes asynchronous snapshot upserts per room code, while allowing different room codes to persist independently; callers that need a global consistency point can await `flushRoomPersistence()`, and callers that need only one room can await `flushRoomPersistence(roomCode)` without blocking unrelated room writes.
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

Tests touching persistence option wiring, default force behavior, per-room persistence ordering, full-room broadcast persistence injection, or toast forwarding should update `server/roomRuntime.test.js` or `server/roomStatePersistence.test.js`; payload-level broadcast tests should stay in `server/roomBroadcasts.test.js`.

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
- `attachSocketToRoom(roomCode, socket, user)` validates the room code, reconnects existing players, clears empty-room close state, appends reconnect notices for active disconnected players, adds first-time spectators, joins the socket room, updates the injected socket-room index callbacks, and force-persists changed room state.
- Spectator attach is idempotent by `user.id`; duplicate spectator joins should refresh the spectator socket id without appending duplicate spectators or duplicate join notices.
- `detachSocket(socketId, io)` removes the socket from matchmaking, reads candidate rooms through the injected socket-room lookup callback, disconnects matching players, timestamps `disconnectedAt`, appends disconnect notices only for unfinished rooms, removes matching spectators, unregisters socket mappings, schedules empty-room close when `io` is provided, force-persists changed rooms, and returns changed rooms.
- `leaveRoom(roomCode, userId, socketId)` handles explicit spectator leave and finished-player leave-as-spectator cleanup, unregisters socket mappings, appends `spectator-leave` notices, and force-persists changed room state.

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

Tests touching player reconnects, spectator joins/leaves, socket-index maintenance, socket disconnect cleanup, finished-player leave behavior, or connection-state persistence should update `server/roomConnectionLifecycle.test.js`; socket-event integration can remain in `server/rooms.test.js`.

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
- `modeStatsForUser(user, mode)` reads object or array `modeStats` and falls back to legacy spark values or shared non-spark defaults such as standard/gomoku defaults.
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
- Non-test gameplay actions must pass `validateRoomActionPhase(action, room.game.phase)` from `server/roomActionPhaseGuards.js` before skill or standard action delegation.
- Skill actions delegate to `startActiveSkill({ room, player, action, io })` only when the phase matrix allows `skill`.
- Standard move/pass/resign actions delegate to `applyStandardGameAction()` with the injected room lifecycle dependencies only when the phase matrix allows that action type. Move/pass/skill require `GAME_PHASES.playing`; resign is allowed in `playing`, `counting-requested`, and `draw-requested`, but not opening, skill-preview, marking-dead, result-review, or finished.

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

Tests touching gameplay action entry validation order, phase-matrix rejection, test-action dispatch, skill dispatch, or standard-action dependency wiring should update `server/roomActionLifecycle.test.js`; action-result rule behavior should stay in the focused rule modules.

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
- When `server/roomMembershipIndex.js` is injected, active membership checks and user-room lookup should use the user-to-room index instead of scanning every room. Socket disconnect cleanup should use the same index module's socket-to-room lookup through `server/roomConnectionLifecycle.js`.

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
- `closeRoom(roomCode, io, options)` clears room timers, emits `room:closed`, removes the room from memory, and triggers persisted-room deletion. The `rooms.js` composition must wait for pending snapshot upserts for that room code before deleting the persisted row so a late upsert cannot recreate a closed room.
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
- `server/roomCloseLifecycle.js` must not emit `room:closed`, unregister the room, delete it from memory, or delete the persisted row for a valid finished room until `room.recordSaved === true`. If `saveGameRecord()` fails or is still pending when the close timer fires, keep the room open and retry the save before scheduling another close check. Invalid finished rooms may skip record creation because `saveGameRecord()` marks them saved.

`server/rooms.js` should decide **when** a finished room needs saving, but it should not own `GameRecord` payload shape, mode-stat upsert shape, reward transaction composition, progress ledger payloads, or the close-before-record-saved retry policy.

Wrong:

```js
prisma.gameRecord.create({ data: { roomCode: room.code } });
```

Correct:

```js
await saveGameRecord({ prisma, room });
```

Tests touching result persistence helpers, invalid-result skipping, draw stat updates, or progress ledger payloads should update `server/roomResultPersistence.test.js`; tests touching close gating around failed or pending record saves should update `server/roomCloseLifecycle.test.js`; integrated winner/loser reward persistence should remain covered by `server/rooms.test.js`.

### Server Startup Data Boundary Contract

`server/serverStartup.js` owns startup data and schema initialization order:

- `initializeServerData({ prisma })` runs built-in character seed, built-in shop seed, default site settings, social schema guard, room persistence schema guard, login-session schema guard, game-mode schema guard, gacha schema guard, and configured-admin promotion.
- `server/index.js` should call this boundary once after HTTP middleware and Socket.IO server creation are configured, but before route/socket handlers depend on seeded data or compatibility tables.
- New startup-time seeders or schema guards should be added to `initializeServerData()` and covered by `server/serverStartup.test.js` so ordering stays explicit.

Wrong:

```js
await seedCharacters(prisma);
await ensureGachaSchema(prisma);
await promoteConfiguredAdmins(prisma);
```

Correct:

```js
await initializeServerData({ prisma });
```

Tests touching startup initializer ordering should update `server/serverStartup.test.js`; schema behavior itself should remain in the focused schema/domain tests.

### Socket Guard Boundary Contract

`server/socketGuards.js` owns Socket.IO connection-level guard middleware:

- `installSocketRateGuard(socket)` initializes `socket.data.rateGuard` and installs a Socket.IO packet middleware with `socket.use()`.
- The guard allows up to 120 events inside a 10-second window, resets the count after the window elapses, and emits `error:toast` without calling `next()` after the limit is exceeded.
- `server/index.js` should call this boundary during `io.on("connection")`, but it should not duplicate rate-window constants, counter reset logic, or limit rejection behavior.

Wrong:

```js
socket.use((_packet, next) => {
  socket.data.count += 1;
  if (socket.data.count > 120) return;
  next();
});
```

Correct:

```js
installSocketRateGuard(socket);
```

Tests touching Socket.IO event rate limiting should update `server/socketGuards.test.js`; business socket event behavior should remain in route, room, or lifecycle tests.

### Socket Event Registration Boundary Contract

`server/socketEvents.js` owns the per-connection Socket.IO event registration suite:

- `registerSocketEvents(socket, deps)` installs the rate guard and registers matchmaking, room connection/resume, gameplay, chat, direct-duel, and disconnect event groups for one authenticated socket.
- The module is an orchestration boundary only; event-specific behavior must remain in `server/socketMatchEvents.js`, `server/socketRoomEvents.js`, `server/socketGameEvents.js`, `server/socketChatEvents.js`, `server/socketDuelEvents.js`, and `server/socketDisconnectEvents.js`.
- `server/index.js` should register online presence and initial `me` / `lobby:stats` emissions, then call this boundary once with shared dependencies. It should not import every socket event group or duplicate rate-guard installation.
- New Socket.IO event groups should be added to `registerSocketEvents()` with a focused `server/socket*Events.js` module and a matching focused test file.

Wrong:

```js
io.on("connection", (socket) => {
  installSocketRateGuard(socket);
  registerMatchSocketEvents(socket, deps);
  registerRoomSocketEvents(socket, deps);
});
```

Correct:

```js
io.on("connection", (socket) => {
  registerSocketEvents(socket, deps);
});
```

Tests touching the connection-level event registration suite should update `server/socketEvents.test.js`; event behavior tests should stay in the focused `server/socket*Events.test.js` files.

### Socket Match Event Boundary Contract

`server/socketMatchEvents.js` owns the Socket.IO matchmaking event registration:

- `registerMatchSocketEvents(socket, deps)` registers `match:join` and `match:leave` handlers for one authenticated socket.
- `match:join` normalizes the requested mode, refreshes `socket.user` before queueing, filters waiting candidates through `hasBlacklistBetween()`, delegates queue/room creation to `joinMatchmaking()`, emits `match:waiting` only when no room is created, and broadcasts lobby stats after the success path.
- `match:leave` delegates queue cleanup to `leaveMatchmaking()`, emits `match:left`, and broadcasts lobby stats.
- `server/index.js` should pass shared dependencies into this boundary during `io.on("connection")`, but it should not duplicate candidate blacklist filtering, match waiting payloads, or lobby-stat refresh timing.

Wrong:

```js
socket.on("match:join", async () => {
  const room = joinMatchmaking({ user: socket.user, socketId: socket.id }, io);
  if (!room) socket.emit("match:waiting", { startedAt: Date.now() });
});
```

Correct:

```js
registerMatchSocketEvents(socket, {
  io,
  prisma,
  refreshSocketUser,
  listWaitingPlayers,
  hasBlacklistBetween,
  joinMatchmaking,
  leaveMatchmaking,
  broadcastLobbyStats,
  normalizeGameModeId
});
```

Tests touching matchmaking Socket.IO event registration, auth refresh before queueing, blacklist candidate filtering, waiting payload timing, or leave-event lobby refresh should update `server/socketMatchEvents.test.js`; queue behavior should stay in `server/roomMatchmakingQueue.test.js` and matched-room creation behavior in `server/roomCreationLifecycle.test.js`.

### Socket Room Event Boundary Contract

`server/socketRoomEvents.js` owns Socket.IO room connection and resume event registration:

- `registerRoomSocketEvents(socket, deps)` registers `room:join`, `room:leave`, and `room:resume` handlers for one authenticated socket.
- `room:join` validates the room code, delegates room attachment to `attachSocketToRoom()`, emits the viewer-specific `room:update`, and broadcasts the changed room through `broadcastRoom()`. Missing or closed rooms emit the existing room-unavailable toast.
- `room:leave` delegates room mutation to `leaveRoom()`, leaves the Socket.IO room only when a room changed, emits `room:left`, and broadcasts the changed room.
- `room:resume` delegates resume payload selection to `resumePayloadForUser()`, uses `validateOptionalRoomCode()` for optional room-code normalization, reattaches resumable rooms through `attachSocketToRoom()`, and otherwise emits the original `room:resume` payload.
- `server/index.js` should pass shared dependencies into this boundary during `io.on("connection")`, but it should not duplicate room-code validation, room attachment, resume payload branching, Socket.IO room leave calls, or post-change broadcast timing.

Wrong:

```js
socket.on("room:join", ({ roomCode }) => {
  const room = attachSocketToRoom(roomCode, socket, socket.user);
  socket.emit("room:update", roomView(room, socket.user.id));
});
```

Correct:

```js
registerRoomSocketEvents(socket, {
  io,
  prisma,
  validateRoomCode,
  validateOptionalRoomCode,
  attachSocketToRoom,
  leaveRoom,
  findRoomForUser,
  resumePayloadForUser,
  roomView,
  broadcastRoom
});
```

Tests touching Socket.IO room join/leave/resume event registration, room-code error forwarding, attach failures, viewer-specific update emission, resume fallback payloads, or post-change broadcasts should update `server/socketRoomEvents.test.js`; room connection mutation behavior should stay in `server/roomConnectionLifecycle.test.js` and resume payload behavior in `server/resume.test.js`.

### Socket Game Event Boundary Contract

`server/socketGameEvents.js` owns Socket.IO gameplay, counting, draw, and scoring event registration:

- `registerGameSocketEvents(socket, deps)` registers `game:action`, `counting:request`, `counting:respond`, `draw:request`, `draw:respond`, and `scoring:action` handlers for one authenticated socket.
- Each handler forwards the current `socket.user.id`, room code, action/accepted payload, and `io` dependency to the matching room lifecycle entry point.
- Failed lifecycle results emit `error:toast` with `result.error`; successful lifecycle results broadcast the changed room through `broadcastRoom(io, result.room)`.
- `server/index.js` should pass shared lifecycle dependencies into this boundary during `io.on("connection")`, but it should not duplicate result error emission, success broadcast checks, or per-event lifecycle argument wiring.

Wrong:

```js
socket.on("game:action", (payload = {}) => {
  const result = handleGameAction(payload.roomCode, socket.user.id, payload.action, io);
  if (!result.ok) socket.emit("error:toast", result.error);
});
```

Correct:

```js
registerGameSocketEvents(socket, {
  io,
  handleGameAction,
  requestCounting,
  respondCounting,
  requestDraw,
  respondDraw,
  handleScoringAction,
  broadcastRoom
});
```

Tests touching Socket.IO game/counting/draw/scoring event registration, lifecycle argument wiring, result error toasts, or success-room broadcasts should update `server/socketGameEvents.test.js`; gameplay rules should stay in `server/roomActionLifecycle.test.js`, counting/draw/scoring entry validation in `server/roomRequestLifecycle.test.js`, and lower-level game rule modules.

### Socket Chat Event Boundary Contract

`server/socketChatEvents.js` owns Socket.IO room chat event registration:

- `registerChatSocketEvents(socket, deps)` registers `chat:send` for one authenticated socket.
- The handler forwards `roomCode`, current `socket.user`, and text to `addChat()`.
- When `addChat()` returns a changed room, the handler broadcasts it through `broadcastRoom(io, room)`; null results are intentionally silent because room-code, text, and missing-room rejection already live in `server/roomChatLifecycle.js`.
- `server/index.js` should pass shared chat and broadcast dependencies into this boundary during `io.on("connection")`, but it should not duplicate chat mutation calls or post-chat broadcast checks.

Wrong:

```js
socket.on("chat:send", ({ roomCode, text } = {}) => {
  const room = addChat(roomCode, socket.user, text);
  if (room) broadcastRoom(io, room);
});
```

Correct:

```js
registerChatSocketEvents(socket, {
  io,
  addChat,
  broadcastRoom
});
```

Tests touching Socket.IO chat event registration, chat payload forwarding, or post-chat broadcast behavior should update `server/socketChatEvents.test.js`; chat text normalization and chat message mutation rules should stay in `server/roomChatLifecycle.test.js`.

### Socket Duel Event Boundary Contract

`server/socketDuelEvents.js` owns Socket.IO direct-duel event registration:

- `registerDuelSocketEvents(socket, deps)` registers `duel:request` and `duel:respond` handlers for one authenticated socket.
- Both handlers refresh `socket.user` before delegating so direct-duel room creation uses the latest selected character and user state.
- `duel:request` string-normalizes `targetUserId`, normalizes the requested game mode through `normalizeGameModeId()`, and delegates to `duelRequests.handleRequest()`.
- `duel:respond` string-normalizes `requestId`, coerces `accepted` to boolean, delegates to `duelRequests.handleResponse()`, and broadcasts lobby stats after a successful response path.
- Refresh or duel-manager failures emit the existing auth-expired `error:toast`; failed responses do not broadcast lobby stats.
- `server/index.js` should pass shared duel, auth-refresh, mode-normalization, and lobby-stat dependencies into this boundary during `io.on("connection")`, but it should not duplicate direct-duel payload coercion, auth-refresh timing, failure toast handling, or lobby-stat refresh timing.

Wrong:

```js
socket.on("duel:request", async ({ targetUserId, mode }) => {
  await duelRequests.handleRequest(socket, targetUserId, mode);
});
```

Correct:

```js
registerDuelSocketEvents(socket, {
  refreshSocketUser,
  duelRequests,
  normalizeGameModeId,
  broadcastLobbyStats
});
```

Tests touching Socket.IO duel event registration, refresh-before-delegate behavior, payload coercion, auth-expired toasts, or successful response lobby refreshes should update `server/socketDuelEvents.test.js`; request lifecycle behavior should stay in `server/duelRequests.test.js`.

### Socket Disconnect Event Boundary Contract

`server/socketDisconnectEvents.js` owns Socket.IO disconnect cleanup registration:

- `registerDisconnectSocketEvents(socket, deps)` registers the `disconnect` handler for one authenticated socket.
- The handler unregisters the online socket, delegates room/matchmaking cleanup to `detachSocket(socket.id, io)`, broadcasts every changed room returned by `detachSocket()`, and refreshes lobby stats after cleanup.
- Lobby stats are refreshed even when no room changed so online-presence counts remain current.
- `server/index.js` should pass shared online-session, room-detach, room-broadcast, and lobby-stat dependencies into this boundary during `io.on("connection")`, but it should not duplicate disconnect cleanup order, detach result iteration, or lobby-stat refresh timing.

Wrong:

```js
socket.on("disconnect", () => {
  onlineSessions.unregisterOnlineSocket(socket);
  detachSocket(socket.id, io);
});
```

Correct:

```js
registerDisconnectSocketEvents(socket, {
  io,
  unregisterOnlineSocket,
  detachSocket,
  broadcastRoom,
  broadcastLobbyStats
});
```

Tests touching Socket.IO disconnect event registration, cleanup ordering, changed-room broadcasts, or lobby refresh behavior should update `server/socketDisconnectEvents.test.js`; room connection mutation behavior should stay in `server/roomConnectionLifecycle.test.js`.

### Production Static Asset Boundary Contract

`server/staticAssets.js` owns production Vite asset hosting and SPA fallback:

- `installProductionStaticAssets(app, { distDir })` mounts nothing unless either `NODE_ENV === "production"` or `LOCAL_PROD_STATIC` is truthy, and `distDir` exists. `LOCAL_PROD_STATIC=1` is reserved for local production-like stability verification; it must not weaken production deployment validation.
- When active, it mounts the built Vite directory with a short default cache and adds a one-year immutable `Cache-Control` header only for hashed Vite chunk/asset filenames. Public `/assets/**` runtime resources keep the shorter static cache and ETag behavior so same-name WebP/SVG/audio replacements are not pinned by immutable browser caches.
- The SPA fallback must exclude `/api`, `/socket.io`, and `/uploads` so backend APIs, Socket.IO transport, and uploaded assets keep their existing routes.
- `server/index.js` should provide the `distDir` and call this boundary once near the end of route/socket setup; it should not duplicate production checks, cache-header regexes, or fallback route patterns.

Wrong:

```js
if (process.env.NODE_ENV === "production") {
  app.use(express.static(distDir));
  app.get("*", sendIndex);
}
```

Correct:

```js
installProductionStaticAssets(app, { distDir });
```

Tests touching production asset mounting, local production-like static mode, SPA fallback exclusions, or immutable cache headers should update `server/staticAssets.test.js`.

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
