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

---

## Common Mistakes

- Treating room snapshot rating/rank changes as account reward events. Mode-specific stats can differ between spark and standard, so changing modes can make the current player's displayed rating/rank change without any game settlement.
