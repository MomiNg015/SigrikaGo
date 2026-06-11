# State Management

> How state is managed in this project.

---

## Overview

Most app-wide state is still owned by `src/main.jsx` and passed into extracted app hooks or shell components. New behavior should keep side effects in the focused `src/app/*` helpers where possible, especially socket handlers, current-user updates, preload, overlays, and room navigation.

---

## State Categories

- Current account state lives behind `useCurrentUser`; use its `updateUser` callback instead of writing directly to the `user` setter when changes may trigger user-facing stat notifications.
- Room state is server state delivered by socket snapshots and projected into `RoomScreen`.
- Overlay and toast state are app shell state owned by `AppOverlays` and `useToastQueue`.

---

## Server State

### Scenario: Room Snapshot User Sync

#### 1. Scope / Trigger
- Trigger: handling `match:found`, `room:update`, or live `room:resume` payloads that include room players.
- The room player payload may include mode-specific display stats from the active room mode.

#### 2. Signatures
- `updateUser(nextUserOrUpdater, { notifyStats = true } = {})`
- `mergeCurrentUserFromRoom(currentUser, roomView)`

#### 3. Contracts
- Keep using `mergeCurrentUserFromRoom(currentUser, roomView)` when the current player's room snapshot carries fresh account-visible fields such as coins, item effects, cosmetics, or character state.
- Pass `{ notifyStats: false }` to `updateUser` for room-entry and room-snapshot syncs.
- A player entering a spark or standard room is a context switch, not a settlement event. Do not show coins, rating, or rank-change toasts from these snapshots.
- Finished result resume snapshots (`payload.type === "result"`) must not merge stale player stats into the current user.

#### 4. Validation & Error Matrix
- `match:found` -> sync user silently, close overlays, and store the pending transition.
- `room:update` -> sync user silently before applying pending transition or entering the room view.
- live `room:resume` -> sync user silently only when `payload.type === "room"`.
- result `room:resume` -> restore result UI without calling `updateUser`.

#### 5. Good/Base/Bad Cases
- Good: `updateUser((current) => mergeCurrentUserFromRoom(current, roomView), { notifyStats: false })`.
- Base: a legacy spark room with no mode-specific stat difference still syncs without visible stat toasts.
- Bad: calling `updateUser((current) => mergeCurrentUserFromRoom(current, roomView))` from a room socket event, because switching between spark and standard stats can look like a rating/rank change.

#### 6. Tests Required
- Socket handler tests must assert that room-entry syncs call `updateUser` with `{ notifyStats: false }`.
- Result resume tests must assert that stale result snapshots do not call `updateUser`.

#### 7. Wrong vs Correct

Wrong:

```js
updateUser((current) => mergeCurrentUserFromRoom(current, roomView));
```

Correct:

```js
updateUser((current) => mergeCurrentUserFromRoom(current, roomView), { notifyStats: false });
```

---

## Common Mistakes

- Treating room snapshot rating/rank changes as account reward events. Mode-specific stats can differ between spark and standard, so changing modes can make the current player's displayed rating/rank change without any game settlement.
