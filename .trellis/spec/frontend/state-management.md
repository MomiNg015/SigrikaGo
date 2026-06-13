# State Management

> How state is managed in this project.

---

## Overview

Most app-wide state is still owned by `src/app/App.jsx` and passed into extracted app hooks or shell components. `src/main.jsx` should stay a thin browser mount entry. New behavior should keep side effects in the focused `src/app/*` helpers where possible, especially socket handlers, current-user updates, preload, overlays, and room navigation.

---

## State Categories

- Current account state lives behind `useCurrentUser`; use its `updateUser` callback instead of writing directly to the `user` setter so account changes stay centralized.
- Room session state lives behind `useRoomSessionState`; authoritative room snapshots still come from the server, while replay position, pending-skill UI state, dismissed result room, and derived result-modal visibility stay in this app-level room session boundary.
- Match session state lives behind `useMatchSessionState`; pending matchmaking and match-success transition state stay together because socket handlers, startup preload, match actions, overlays, and background music all observe or mutate this pair.
- Overlay visibility state lives behind `useOverlayState`; `App.jsx` may pass the returned `show*` flags and `setShow*` callbacks to route and overlay composition, but it should not add new top-level `useState(false)` flags for modal visibility.
- Toast state is app shell state owned by `useToastQueue`.

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

### Scenario: App Overlay Visibility State

#### 1. Scope / Trigger
- Trigger: adding or changing app-level modal visibility such as shop, gacha, house, warehouse, resume, leaderboard, friends, watch, settings, or message board.
- These flags are app shell state, not feature-domain data.

#### 2. Signatures
- `useOverlayState()` returns `show*` booleans and `setShow*` callbacks for every app-level overlay.
- `OVERLAY_STATE_KEYS` lists the canonical overlay keys.
- `initialOverlayState(value)` and `closeOverlayState(state)` keep bulk state operations testable without rendering React.

#### 3. Contracts
- New app-level overlay visibility belongs in `useOverlayState()`, not as another top-level `useState(false)` in `App.jsx`.
- Keep existing `show*` / `setShow*` prop names at composition boundaries until the receiving component is intentionally refactored.
- Setter callbacks returned by `useOverlayState()` should remain stable so `useOverlayActions()` and socket/replay actions do not recreate callbacks on every overlay toggle.
- `closeAllOverlays()` in `useOverlayActions()` should close every key represented by `OVERLAY_STATE_KEYS`.
- Overlay visibility should stay separate from route state, room server state, current user state, and toast queue state.

#### 4. Validation & Error Matrix
- All overlays false by default -> no app modal renders.
- One overlay opens -> only that key changes.
- Bulk close -> every known overlay key becomes false.
- Adding a new overlay -> update `OVERLAY_STATE_KEYS`, hook return shape, close-all behavior, `AppRoutes` / `AppOverlays` wiring, and tests.

#### 5. Good/Base/Bad Cases
- Good: `const { showShop, setShowShop } = useOverlayState();`
- Base: `AppRoutes` can still receive `setShowShop` while the composition boundary is being gradually narrowed.
- Bad: `const [showNewModal, setShowNewModal] = useState(false);` inside `App.jsx`.
- Bad: closing all overlays by manually updating only the currently visible subset.

#### 6. Tests Required
- `src/app/useOverlayState.test.js` should assert the canonical overlay key list and default/close-all projections.
- App route or overlay source tests should be updated when a new overlay prop is introduced.

#### 7. Wrong vs Correct

Wrong:

```js
const [showShop, setShowShop] = useState(false);
const [showGacha, setShowGacha] = useState(false);
```

Correct:

```js
const { showShop, setShowShop, showGacha, setShowGacha } = useOverlayState();
```

### Scenario: Room Session State

#### 1. Scope / Trigger
- Trigger: changing app-level room state, replay playback state, pending skill UI state, or finished-result dismissal behavior.
- This boundary is for client session state around an authoritative room snapshot; it does not own room protocol payload shape or server room lifecycle rules.

#### 2. Signatures
- `useRoomSessionState()` returns `room`, `pendingSkill`, `replayStep`, `dismissedResultRoom`, `resultModalOpen`, and their existing setter callbacks.
- `initialRoomSessionState()` returns the default room session fields.
- `roomSessionView(state)` derives `resultModalOpen` through `shouldShowResultModal(room, dismissedResultRoom, replayStep)`.

#### 3. Contracts
- `App.jsx` should read room-session fields from `useRoomSessionState()` instead of adding separate top-level state for room, replay, pending skill, or result dismissal.
- `resultModalOpen` is derived state and should not be stored separately.
- `setRoom` remains the only React state entry point for full server room snapshots; socket handlers should still use `applyRoomSnapshot()` before writing same-room updates.
- Result resume snapshots should keep using the existing resume-session helpers and setters from this hook.
- Replay opening should update room, replay step, pending skill, and view together through the existing replay actions.

#### 4. Validation & Error Matrix
- No room -> result modal closed.
- Finished room without replay and not dismissed -> result modal open.
- Active replay step -> result modal closed even for a finished room.
- Dismissed room code equals the finished room code -> result modal closed.
- Invalid finished result -> result modal closed.

#### 5. Good/Base/Bad Cases
- Good: `const { room, setRoom, replayStep, setReplayStep, resultModalOpen } = useRoomSessionState();`
- Base: `AppRoutes` and `AppOverlays` can continue receiving individual room-session props until those composition boundaries are intentionally narrowed.
- Bad: `const [resultModalOpen, setResultModalOpen] = useState(false);`
- Bad: recalculating result modal visibility differently in routes, overlays, and background music.

#### 6. Tests Required
- `src/app/useRoomSessionState.test.js` should cover default state and result modal derivation.
- `src/app/resumeSession.test.js`, `src/app/replayOpening.test.js`, and `src/app/socketHandlers.test.js` should be run after changing room resume, replay, or socket room session behavior.

#### 7. Wrong vs Correct

Wrong:

```js
const [room, setRoom] = useState(null);
const [replayStep, setReplayStep] = useState(null);
const resultModalOpen = room?.game?.phase === "finished";
```

Correct:

```js
const { room, setRoom, replayStep, setReplayStep, resultModalOpen } = useRoomSessionState();
```

### Scenario: Match Session State

#### 1. Scope / Trigger
- Trigger: changing pending matchmaking, match-found transition state, match waiting payloads, match success modal timing, or startup preload recovery around a pending match.
- This boundary is for client match transition state; it does not own matchmaking queue rules or Socket.IO event payload shape.

#### 2. Signatures
- `useMatchSessionState()` returns `matchStart`, `matchSuccess`, `isMatchPending`, `isMatchTransitioning`, `setMatchStart`, and `setMatchSuccess`.
- `initialMatchSessionState()` returns the default match state.
- `matchSessionView(state)` derives booleans from the two transition fields.

#### 3. Contracts
- `App.jsx` should read match transition fields from `useMatchSessionState()` instead of adding separate top-level state for pending or successful match transitions.
- `matchStart` owns the waiting modal payload and should remain either `null` or `{ startedAt, mode }`.
- `matchSuccess` owns the success transition payload and should remain either `null` or `{ startedAt, room }`.
- `isMatchPending` and `isMatchTransitioning` are derived state; do not store them independently.
- `matchSuccessRef` still mirrors `matchSuccess` through `useSyncedRefs()` for socket room-update synchronization.

#### 4. Validation & Error Matrix
- No `matchStart` and no `matchSuccess` -> no match modal.
- `matchStart` present -> waiting modal can render mode and start time.
- `matchSuccess` present -> success transition can complete into the pending room.
- Room resume or auth reset -> both match fields must be cleared.

#### 5. Good/Base/Bad Cases
- Good: `const { matchStart, setMatchStart, matchSuccess, setMatchSuccess } = useMatchSessionState();`
- Base: `AppOverlays` can continue receiving `matchStart` and `matchSuccess` separately while the shell boundary is gradually narrowed.
- Bad: adding a separate `const [isMatching, setIsMatching] = useState(false);`.
- Bad: treating `matchSuccessRef.current` as a source of truth after `matchSuccess` has been cleared.

#### 6. Tests Required
- `src/app/useMatchSessionState.test.js` should cover default state and derived pending/transition flags.
- `src/app/matchTransition.test.js`, `src/app/socketHandlers.test.js`, `src/app/sessionState.test.js`, and `src/app/resumeSession.test.js` should be run after changing match transition behavior.

#### 7. Wrong vs Correct

Wrong:

```js
const [matchStart, setMatchStart] = useState(null);
const [matchSuccess, setMatchSuccess] = useState(null);
const [isMatching, setIsMatching] = useState(false);
```

Correct:

```js
const { matchStart, matchSuccess, setMatchStart, setMatchSuccess } = useMatchSessionState();
```

---

## Common Mistakes

- Treating room snapshot rating/rank changes as account reward events. Mode-specific stats can differ between spark and standard, so changing modes can make the current player's displayed rating/rank change without any game settlement.
- Bypassing `applyRoomSnapshot` for full same-room `room:update` payloads. This loses structural sharing and makes memoized board/player consumers work harder.
- Adding app-level modal flags directly to `App.jsx` instead of extending `useOverlayState()`.
- Storing `resultModalOpen` as independent state instead of deriving it from `useRoomSessionState()`.
- Adding independent match booleans instead of deriving them from `useMatchSessionState()`.
