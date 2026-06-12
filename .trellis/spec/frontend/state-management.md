# State Management

> How state is managed in this project.

---

## Overview

Most app-wide state is still owned by `src/main.jsx` and passed into extracted app hooks or shell components. New behavior should keep side effects in the focused `src/app/*` helpers where possible, especially socket handlers, current-user updates, preload, overlays, and room navigation.

---

## State Categories

- Current account state lives behind `useCurrentUser`; use its `updateUser` callback instead of writing directly to the `user` setter so account changes stay centralized.
- Room state is server state delivered by socket snapshots and projected into `RoomScreen`.
- Overlay and toast state are app shell state owned by `AppOverlays` and `useToastQueue`.

---

## Server State

### Scenario: Room Snapshot User Sync

#### 1. Scope / Trigger
- Trigger: handling `match:found`, `room:update`, or live `room:resume` payloads that include room players.
- The room player payload may include mode-specific display stats from the active room mode.

#### 2. Signatures
- `updateUser(nextUserOrUpdater)`
- `mergeCurrentUserFromRoom(currentUser, roomView)`

#### 3. Contracts
- Keep using `mergeCurrentUserFromRoom(currentUser, roomView)` when the current player's room snapshot carries fresh account-visible fields such as coins, item effects, cosmetics, or character state.
- `updateUser` must not generate coins, rating, or rank-change toasts. Numeric rewards can be shown in dedicated result UI, not as automatic account-diff toasts.
- A player entering a spark or standard room is a context switch, not a settlement event.
- When the app enters `home`, refresh `/api/me` once and write the response through `updateUser` so the lobby plaque reflects post-game mode stats.
- Finished result resume snapshots (`payload.type === "result"`) must not merge stale player stats into the current user.

#### 4. Validation & Error Matrix
- `match:found` -> sync user silently, close overlays, and store the pending transition.
- `room:update` -> sync user silently before applying pending transition or entering the room view.
- live `room:resume` -> sync user silently only when `payload.type === "room"`.
- result `room:resume` -> restore result UI without calling `updateUser`.
- `home` view entry -> request `/api/me`; success updates current user, failure stays silent because auth retry/reset is owned by the API client/session layer.

#### 5. Good/Base/Bad Cases
- Good: `updateUser((current) => mergeCurrentUserFromRoom(current, roomView))` updates state without automatic stat toasts.
- Base: a legacy spark room with no mode-specific stat difference still syncs without visible stat toasts.
- Bad: reintroducing a previous/next user diff that emits `金币+`, `积分+`, or `段位...` toasts from generic account updates.

#### 6. Tests Required
- Socket handler tests must assert that room-entry syncs still call `updateUser`.
- Home refresh tests must assert that only authenticated home views request a user refresh.
- Result resume tests must assert that stale result snapshots do not call `updateUser`.

#### 7. Wrong vs Correct

Wrong:

```js
if (current.rating !== nextUser.rating) {
  showToast(`积分${nextUser.rating - current.rating}`);
}
```

Correct:

```js
updateUser((current) => mergeCurrentUserFromRoom(current, roomView));
```

### Scenario: Room Snapshot Structural Sharing

#### 1. Scope / Trigger
- Trigger: handling full `room:update` snapshots that replace authoritative room state.
- Full room snapshots are still the protocol contract, but the frontend should preserve stable references for unchanged snapshot subtrees before writing to React state.

#### 2. Signatures
- `applyRoomSnapshot(currentRoom, incomingRoom)` returns the room object that should be stored in state.
- `socketHandlers.roomUpdate(roomView)` must call `setRoom((current) => applyRoomSnapshot(current, nextRoomView))`.

#### 3. Contracts
- If the current and incoming room are missing, have different `code`, or have different `role`, use the incoming snapshot directly.
- For the same room identity, structurally share plain JSON arrays and objects from the current snapshot when their values are unchanged.
- Duplicate snapshots should return the current room reference so React can skip state work.
- Changed arrays should reuse unchanged entries by index; this keeps unchanged board points, players, chat messages, and nested game view objects stable for memoized consumers.
- Snapshot sharing must not alter authoritative payload semantics; it only chooses object identity for equal plain JSON values.

#### 4. Validation & Error Matrix
- Duplicate same-room snapshot with fresh object identities -> return `currentRoom`.
- One board point changes -> return a new room/game/points array but reuse unchanged point objects.
- One player timer or status changes -> return a new players array but reuse unchanged player entries.
- Different room code or role -> return `incomingRoom` without sharing.

#### 5. Good/Base/Bad Cases
- Good: `room:update` after reconnect can preserve the existing room object when the server sends the same snapshot twice.
- Base: A move update replaces the changed point and history while preserving unrelated point objects.
- Bad: Directly calling `setRoom(roomView)` for every same-room snapshot, forcing room consumers to compare fresh object graphs.
- Bad: Mutating the incoming snapshot or current room in place.

#### 6. Tests Required
- Unit tests for `applyRoomSnapshot` must cover duplicate snapshots, per-point sharing, per-player sharing, and different room identities.
- Socket handler tests must assert `room:update` uses a functional state setter and still preserves reconnect audio-baseline markers.
- Run `npm test -- src/app/roomSnapshot.test.js src/app/socketHandlers.test.js` for changes in this area, then run the project `check` gate before handoff.

#### 7. Wrong vs Correct

Wrong:

```js
setRoom(roomView);
```

Correct:

```js
setRoom((current) => applyRoomSnapshot(current, roomView));
```

---

## Common Mistakes

- Treating room snapshot rating/rank changes as account reward events. Mode-specific stats can differ between spark and standard, so changing modes can make the current player's displayed rating/rank change without any game settlement.
- Bypassing `applyRoomSnapshot` for full same-room `room:update` payloads. This loses structural sharing and makes memoized board/player consumers work harder.
