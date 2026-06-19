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

### Scenario: Audio Settings Mute State

#### 1. Scope / Trigger
- Trigger: changing Settings > Audio controls, `DEFAULT_AUDIO_SETTINGS`, `loadAudioSettings()`, `audioVolume()`, or playback code that reads `audioSettings`.
- Audio settings are local app shell state persisted to `localStorage`, and playback modules consume the same object for BGM, SFX, and voice volume.

#### 2. Signatures
- `DEFAULT_AUDIO_SETTINGS`: `{ master: number, bgm: number, sfx: number, voice: number, muted: Record<string, boolean> }`.
- Persisted storage key: `sigrika-audio-settings`.
- `audioVolume(settings, channel)` returns the effective 0-1 volume for the requested playback channel.

#### 3. Contracts
- Slider percentages remain 0-100 values and must not be rewritten to `0` merely because a channel is muted.
- Per-channel mute state lives under `audioSettings.muted[channel]`.
- `muted.master === true` mutes every channel; `muted[channel] === true` mutes only that requested channel.
- Settings UI title buttons may toggle mute state; range slider changes must clear that channel's mute flag and keep the new percentage.
- Playback modules should continue calling `audioVolume()` instead of inspecting raw percentages or muted flags directly.

#### 4. Validation & Error Matrix
- Old persisted settings with no `muted` object -> valid, all channels unmuted.
- `muted[channel] === true` with slider value `80` -> effective volume is `0`, displayed slider value remains `80`.
- Moving a muted channel slider -> muted flag for that channel becomes false.
- Invalid percentage values -> keep using existing finite-number fallback behavior.

#### 5. Good/Base/Bad Cases
- Good: clicking the BGM title sets `muted.bgm = true` while `bgm` remains `50`.
- Base: a user with only `{ master, bgm, sfx, voice }` in localStorage keeps the old audible behavior.
- Bad: setting `bgm: 0` to represent mute, because manual slider movement can no longer restore the previous percentage.

#### 6. Tests Required
- `src/audio/audioSettings.test.js` covers master/channel mute behavior and finite percentage fallback.
- `src/modals/SettingsModal.test.jsx` covers muted row hooks, unchanged range value, title toggle source, and slider unmute source.

#### 7. Wrong vs Correct

Wrong:

```js
setAudioSettings((settings) => ({ ...settings, bgm: 0 }));
```

Correct:

```js
setAudioSettings((settings) => ({
  ...settings,
  muted: { ...(settings.muted ?? {}), bgm: true }
}));
```

### Scenario: App Audio Runtime State

#### 1. Scope / Trigger
- Trigger: changing app-level audio settings initialization, audio-settings persistence, background-music resume behavior, or socket reconnect wiring that affects playback recovery.
- This is app shell state, not route state or socket protocol state.

#### 2. Signatures
- `useAudioRuntimeState()` returns `{ audioSettings, setAudioSettings, audioResumeSignal, resumeAudioPlayback }`.
- `useAudioSettingsPersistence(audioSettings)` persists the returned settings to `localStorage`.
- `useGameSocketConnection({ onSocketReconnect })` receives a callback and forwards it to `connectGameSocket()`.

#### 3. Contracts
- `App.jsx` should call `useAudioRuntimeState()` instead of directly importing `loadAudioSettings` or calling `useAudioSettingsPersistence()`.
- Socket reconnects should call the hook's `resumeAudioPlayback()` callback, not a raw `setAudioResumeSignal` setter owned by `App.jsx`.
- `BackgroundMusic` receives the hook's `audioResumeSignal`; ordinary SFX/voice consumers continue receiving the same `audioSettings` object.
- Settings UI still mutates audio settings through the returned `setAudioSettings` callback.
- Keep the hook free of route, room, match, and overlay state so it remains a focused audio runtime boundary.

#### 4. Validation & Error Matrix
- Initial render -> load settings through `loadAudioSettings()` inside the hook.
- Audio settings change -> persist through `useAudioSettingsPersistence(audioSettings)`.
- Socket reconnect -> increment `audioResumeSignal` through `resumeAudioPlayback()`.
- Missing reconnect callback -> `useGameSocketConnection` falls back to a no-op.

#### 5. Good/Base/Bad Cases
- Good: `const { audioSettings, audioResumeSignal, resumeAudioPlayback } = useAudioRuntimeState();`
- Base: Existing settings modal props continue to receive `audioSettings` and `setAudioSettings`.
- Bad: `App.jsx` imports `loadAudioSettings` and stores `[audioResumeSignal, setAudioResumeSignal]` directly.
- Bad: socket code knows about the audio signal setter shape instead of receiving a callback.

#### 6. Tests Required
- App wiring tests should assert `App.jsx` delegates to `useAudioRuntimeState()` and does not import `loadAudioSettings` or `useAudioSettingsPersistence`.
- Socket handler tests should continue asserting reconnect callbacks are invoked when `connect` fires.
- Run `npm test -- src/app/App.test.js src/app/socketHandlers.test.js` after changes in this boundary.

#### 7. Wrong vs Correct

Wrong:

```jsx
const [audioSettings, setAudioSettings] = useState(loadAudioSettings);
const [audioResumeSignal, setAudioResumeSignal] = useState(0);
useAudioSettingsPersistence(audioSettings);
useGameSocketConnection({ setAudioResumeSignal });
```

Correct:

```jsx
const {
  audioSettings,
  setAudioSettings,
  audioResumeSignal,
  resumeAudioPlayback
} = useAudioRuntimeState();

useGameSocketConnection({ onSocketReconnect: resumeAudioPlayback });
```

---

## Server State

### Scenario: Startup Preload User And Catalog Wiring

#### 1. Scope / Trigger
- Trigger: changing login completion, startup preload, authenticated catalog loading, or any setter passed from `App.jsx` into `useStartupPreload()`.
- Startup preload is the bridge from a valid token to the home shell; failures here can silently reset the session to the login screen.

#### 2. Signatures
- `useStartupPreload({ token, setUser, setCharacters, setMusicTracks, setView, ... })`
- `loadPublicCharacterCatalog({ token })`
- `loadMusicTrackCatalog({ token })`
- `shouldFinishPreloadAsHome({ view, room, matchSuccess })`

#### 3. Contracts
- `App.jsx` must pass every setter that `useStartupPreload()` destructures and invokes.
- When authenticated preload succeeds, it must refresh `/api/me`, public characters, and merged music tracks before finishing at `home`.
- `setMusicTracks(nextMusicTracks)` is required after `loadMusicTrackCatalog()` so post-login music labels use the merged catalog.
- The catch path may reset to login only for real preload failures; missing setter wiring is a code bug and must be covered by tests.
- Do not add new preload side effects without updating both the hook call in `App.jsx` and a wiring/regression test.

#### 4. Validation & Error Matrix
- Valid token and all preload requests succeed -> set user/catalogs and finish at `home`.
- Missing token -> no preload work.
- `/api/me` or catalog request fails -> close socket, clear session state, and return to `login`.
- Missing `setMusicTracks` or another invoked setter -> invalid implementation; tests should fail before runtime.

#### 5. Good/Base/Bad Cases
- Good: `App.jsx` passes `setMusicTracks` alongside `setCharacters` to `useStartupPreload()`.
- Base: a fresh login preloads default music names when the admin has no display-name overrides.
- Bad: adding `setFoo(nextFoo)` inside `useStartupPreload()` without passing `setFoo` from `App.jsx`, causing a post-login TypeError that is swallowed by the preload catch path.

#### 6. Tests Required
- App startup preload wiring tests assert the `useStartupPreload()` call includes invoked catalog setters such as `setMusicTracks`.
- Session/preload tests assert fresh login can finish as home even when the previous ref view is `login`.
- API client tests should still cover auth refresh behavior when preload requests receive 401.

#### 7. Wrong vs Correct

Wrong:

```jsx
useStartupPreload({
  setCharacters,
  token
});
```

Correct:

```jsx
useStartupPreload({
  setCharacters,
  setMusicTracks,
  token
});
```

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
- A player entering a spark, standard, or gomoku room is a context switch, not a settlement event.
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

### Scenario: Lobby Stats State Writes

#### 1. Scope / Trigger
- Trigger: handling `lobby:stats` socket payloads or changing lobby online/matchmaking counters.
- Lobby stats can arrive while the user is browsing home, waiting for matchmaking, or recovering from reconnects, so duplicate payloads should not churn the home shell.

#### 2. Signatures
- `normalizeLobbyStats(stats)` returns `{ onlineCount, matchmakingCount, matchmakingCounts }`.
- `sameLobbyStats(current, next)` returns `true` only when the current state already has every supported mode count and all numeric counts match.

#### 3. Contracts
- `socketHandlers.lobbyStats(stats)` should write through a functional setter and return the current state object when normalized stats are unchanged.
- Legacy or reset state without `matchmakingCounts` should be normalized on the next lobby stats payload even when visible counts are zero.
- Per-mode counts must continue to use `GAME_MODE_IDS` so new modes do not require hard-coded lobby updater branches.

#### 4. Validation & Error Matrix
- Duplicate `{ onlineCount, matchmakingCount, matchmakingCounts }` -> return the current state object.
- Missing `matchmakingCounts` on the incoming payload -> derive spark from `matchmakingCount` and other modes from `0`.
- Existing current state lacks `matchmakingCounts` -> return a normalized object instead of preserving the legacy shape.

#### 5. Good/Base/Bad Cases
- Good: repeated `lobby:stats` payloads with identical mode counts do not re-render the home screen.
- Base: older reset paths that only store `{ onlineCount, matchmakingCount }` are normalized by the next socket payload.
- Bad: `setLobbyStats({ ... })` for every socket payload because unchanged server counts still create a new object graph.

#### 6. Tests Required
- `src/app/socketHandlers.test.js` must assert lobby stats normalization and stable-object behavior for duplicate payloads.

### Scenario: Room Clock State Writes

#### 1. Scope / Trigger
- Trigger: handling lightweight `room:clock` payloads from the socket.
- Clock payloads are high-frequency updates and must not schedule React state writes for unrelated or already-cleared room sessions.

#### 2. Signatures
- `applyRoomClock(room, clock)` returns the room object that should remain in state.
- `socketHandlers.roomClock(clock)` routes the payload to the current live room and/or pending match-success room only when their `code` matches `clock.roomCode`.

#### 3. Contracts
- Ignore missing or stale `room:clock` payloads without calling `setRoom` or `setMatchSuccess`.
- If only the pending match-success room matches the clock, update only `matchSuccess`; do not call the live room setter while `roomRef.current` is empty or points elsewhere.
- If a pending match-success clock payload does not change any timer data, do not schedule `setMatchSuccess`; the transition ref may keep its existing room object.
- If only the live room matches the clock, update only `room`.
- `applyRoomClock()` must preserve `room.game`, unchanged player objects, and the whole room object when no player time changed.
- `applyRoomClock()` must return the original room when the snapshot has no `players` array yet; clock recovery must not crash an incomplete or legacy snapshot.

#### 4. Validation & Error Matrix
- `clock.roomCode` differs from current and pending room codes -> no state setter is called.
- Pending match room code matches and current room is null -> only `setMatchSuccess` is called.
- Pending match room code matches but all player times are unchanged -> no state setter is called.
- Current room code matches -> `setRoom((current) => applyRoomClock(current, clock))` is called.
- Matching room has no `players` array -> return the room unchanged.

#### 5. Good/Base/Bad Cases
- Good: A stale clock from a closed room is ignored before scheduling state work.
- Base: A normal playing room tick updates only the active player's time object and keeps `game` stable.
- Bad: Calling both `setRoom` and `setMatchSuccess` for every clock payload regardless of room code.

#### 6. Tests Required
- `src/app/roomClock.test.js` must cover changed timers, wrong-room payloads, and missing player lists.
- `src/app/socketHandlers.test.js` must cover stale clock payloads and pending-match-only clock payloads.

### Scenario: Room Snapshot Structural Sharing

#### 1. Scope / Trigger
- Trigger: handling full `room:update` snapshots, live `room:resume` snapshots, or pending match-success room snapshots that replace authoritative room state.
- Full room snapshots are still the protocol contract, but the frontend should preserve stable references for unchanged snapshot subtrees before writing to React state.

#### 2. Signatures
- `applyRoomSnapshot(currentRoom, incomingRoom)` returns the room object that should be stored in state.
- `socketHandlers.roomUpdate(roomView)` must call `setRoom((current) => applyRoomSnapshot(current, nextRoomView))`.
- Live `socketHandlers.roomResume({ type: "room", room })` must also store the recovered snapshot through a functional setter and `applyRoomSnapshot`; result resumes may restore the finished result snapshot directly.
- `syncPendingMatchRoom()` and `completePendingMatchRoom()` must structurally share same-room pending match snapshots so a `match:found` followed by `room:update` does not bypass the full-snapshot sharing path before the transition modal completes.
- `syncPendingMatchRoom()` should consume same-room duplicate snapshots without calling `setMatchSuccess` when `applyRoomSnapshot()` returns the current pending room object.

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
- Good: `room:update`, live `room:resume`, or a pending match-success room update can preserve the existing room object when the server sends the same snapshot twice.
- Good: a duplicate pending match-success `room:update` is consumed by the transition boundary without creating a fresh `{ startedAt, room }` wrapper.
- Base: A move update replaces the changed point and history while preserving unrelated point objects.
- Bad: Directly calling `setRoom(roomView)` for every same-room snapshot, forcing room consumers to compare fresh object graphs.
- Bad: Mutating the incoming snapshot or current room in place.

#### 6. Tests Required
- Unit tests for `applyRoomSnapshot` must cover duplicate snapshots, per-point sharing, per-player sharing, and different room identities.
- Socket handler tests must assert `room:update` and live `room:resume` use functional state setters and still preserve reconnect audio-baseline markers.
- Match transition tests must assert pending match room sync and completion keep unchanged snapshot subtrees stable, and duplicate pending snapshots do not schedule `setMatchSuccess`.
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

### Scenario: Room Patch Continuity

#### 1. Scope / Trigger
- Trigger: adding or changing any lightweight `room:patch` payload, room patch reducer, socket patch listener, or backend room patch emission path.
- Room patches are incremental realtime state, not authoritative snapshots. They must be cheap to apply, idempotent, and recoverable when a client misses a patch.

#### 2. Signatures
- Backend patch payloads include `{ roomCode, eventId, type, baseRevision, revision, ...patchFields }`.
- Full room views include `revision` so the client knows the latest patch stream position after `room:update`, `room:resume`, or `match:found`.
- `applyRoomPatch(currentRoom, patch)` returns the room object to store in state.
- `roomPatchNeedsResume(currentRoom, patch)` returns `true` when a patch is for the current room but its revision does not continue from the current room revision.
- `roomPatchCanUpdate(currentRoom, patch)` returns `true` only when the patch targets the current room, has a known patch type, is not stale, and has the minimum type-specific payload needed to change state.
- Installed socket handlers must emit `room:resume` when `roomPatchNeedsResume(...)` is true.
- Current lightweight patch types are `chat:append` and `presence:update`.

#### 3. Contracts
- `server/roomBroadcasts.js` owns patch revision metadata. Individual socket event modules should pass the domain patch shape, not hand-roll `eventId`, `baseRevision`, or `revision`.
- Patch revisions are monotonic per room. A patch with `revision <= currentRoom.revision` is duplicate or stale and must not be applied.
- A patch with `baseRevision !== currentRoom.revision` and `revision > currentRoom.revision` indicates a gap. The client must reject it and request `room:resume`.
- Legacy patches without `revision` may still be applied by type-specific reducers for backward-compatible tests or narrow mocks, but new runtime patches must carry revision fields.
- Patch reducers must preserve unchanged room slices, especially `game` and `players`, so chat/request patches do not cause board or timer panels to re-render.
- Socket patch handlers must check `roomPatchCanUpdate(...)` before calling `setRoom`; wrong-room, missing-room, unknown, stale, duplicate, and malformed patches should not schedule React state work.
- `presence:update` patches may replace `players`, `spectatorCount`, `spectators`, and `chat`, but must not carry or replace `game`; connection changes, spectator membership, and connection system messages should not repaint the board. Their reducers should structurally share unchanged player, spectator, and chat entries so only changed member rows or player panels receive new object references.
- If a full `room:update` already includes the same mutation that a following continuous patch carries, the patch reducer must still advance `room.revision` so the next patch is not treated as a gap.
- Full `room:update` and `room:resume` remain authoritative. Patch recovery should request a snapshot rather than trying to infer missing intermediate state.

#### 4. Validation & Error Matrix
- Patch is for another room code -> ignore it and do not request resume.
- Patch is for no current room -> ignore it and do not call `setRoom`.
- Patch has no revision -> apply only if its type-specific reducer can do so idempotently.
- Patch revision is equal to or below current revision -> ignore as duplicate/stale.
- Patch base revision differs from current revision while patch revision is newer -> reject patch and emit `room:resume`.
- Patch type is unknown -> ignore it without mutating state.
- Current room is null -> ignore patch because there is no local target for continuity checks.
- Continuous `chat:append` patch contains a message that already exists in a just-applied full snapshot -> advance revision without duplicating the message.
- Continuous `presence:update` patch after a direct reconnect snapshot -> advance revision and keep the authoritative `game` object from the snapshot.

#### 5. Good/Base/Bad Cases
- Good: `chat:append` with `baseRevision: 2` and `revision: 3` appends one message, stores `revision: 3`, and preserves the existing `game` object.
- Good: `presence:update` with `baseRevision: 3` and `revision: 4` updates connection flags, spectators, and system chat while preserving `room.game` and unchanged member/chat entry references.
- Base: duplicate `chat:append` with the same message id or same revision returns the current room object.
- Bad: applying a patch with `baseRevision: 4` while the client room is at `revision: 1`, because that can hide missed moves, request state, or chat entries.
- Bad: using a full `room:update` broadcast for disconnect/reconnect or spectator membership changes after a socket has already received its direct authoritative snapshot.
- Bad: calling `setRoom((current) => ({ ...current, chat: nextChat }))` directly from a socket listener without using the shared reducer and gap check.

#### 6. Tests Required
- `src/app/roomPatch.test.js` must cover continuous patch application, duplicate/stale patch ignoring, unknown/wrong-room patch ignoring, and gap detection.
- Patch scheduling tests must assert `roomPatchCanUpdate()` rejects missing-room, wrong-room, stale, unknown, and malformed patches before React state setters are called.
- Presence patch tests must assert `presence:update` preserves `game`, structurally shares unchanged member/chat entries, updates changed slices, and advances revision when a direct snapshot already contains the same mutation.
- `src/app/socketHandlers.test.js` must assert gapped installed patch listeners emit `room:resume` and do not call `setRoom`.
- Backend broadcast tests must assert patch payloads include `eventId`, `baseRevision`, and `revision`, and that the room revision increments before persistence.
- Backend room socket tests must assert join/resume/leave/disconnect connection changes use `broadcastRoomPresencePatch` instead of full room broadcasts.
- Room factory, view, and persistence tests must assert room `revision` is created, exposed in views, persisted, and hydrated with a safe default for older snapshots.

#### 7. Wrong vs Correct

Wrong:

```js
socket.on("room:patch", (patch) => {
  setRoom((current) => ({ ...current, chat: [...current.chat, patch.message] }));
});
```

This applies patches even when the client missed an earlier patch and can re-render unchanged room slices unnecessarily.

Correct:

```js
socket.on("room:patch", (patch) => {
  handlers.roomPatch(patch, () => socket.emit("room:resume", buildRoomResumeRequest()));
});
```

`handlers.roomPatch` checks revision continuity before calling `applyRoomPatch`, and requests the authoritative snapshot when continuity is broken.

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

### Scenario: Achievement And Personalization Overlay State

#### 1. Scope / Trigger
- Trigger: adding or changing achievement windows, personalization/equipment windows, achievement unlock toasts, or player API refresh handling.
- Achievement overlays are app shell modals opened from the resume profile surface; achieved state and equipped reward data are server state, not separate local profile stores.

#### 2. Signatures
- `useOverlayState()` returns `showAchievements`, `setShowAchievements`, `showPersonalization`, and `setShowPersonalization`.
- `AppOverlays` renders `AchievementModal` and `PersonalizationModal` from those flags.
- Player API responses may include `achievementUnlocks: AchievementUnlockPayload[]`.
- `showAchievementUnlocks(unlocks)` emits visible `achievement` tone toast messages and ignores non-arrays/empty arrays.

#### 3. Contracts
- Resume/profile entry buttons should open achievements and personalization by toggling overlay state, not by navigating away from the home shell.
- `AchievementModal` must fetch `GET /api/achievements` when opened and keep filter tabs local to the modal (`unachieved`, `achieved`, `all`).
- `PersonalizationModal` must fetch `GET /api/me/achievement-equipment`, patch only changed equipment slots, and write returned user/equipment data through `updateUser`.
- Home `/api/me` refresh should consume any returned `achievementUnlocks` before or alongside updating current user state.
- The callback passed as `onAchievementUnlocks` into `useHomeUserRefresh()` must be stable, such as via `useCallback([showToast])`; otherwise every user refresh render can trigger another `/api/me` request loop.
- Shop purchase, gacha draw, and warehouse item-use hooks should display backend-returned `achievementUnlocks` immediately after successful mutations.
- Do not duplicate achievement evaluation rules in the frontend; the frontend only displays list/equipment/unlock payloads returned by the API.

#### 4. Validation & Error Matrix
- Achievement modal opens with no achievements -> render an empty state inside the modal.
- `achievementUnlocks` omitted -> no toast and no error.
- `achievementUnlocks: []` -> no toast and no error.
- `onAchievementUnlocks` identity changes on every render -> invalid implementation; it can create a `/api/me` request loop and make shop/house requests hit rate limits.
- Personalization patch rejects a slot -> keep the modal open and show the route-provided error message.
- User closes either overlay -> local filter/selection state can reset on next open, but app-level overlay keys must close cleanly through `closeAllOverlays()`.

#### 5. Good/Base/Bad Cases
- Good: a gacha response with two unlocks calls the shared toast helper twice with `tone: "achievement"`.
- Good: `const showAchievementUnlocks = useCallback(..., [showToast])` before passing it to `useHomeUserRefresh()`.
- Base: a player opens the achievement modal before unlocking anything and sees all enabled achievements as unachieved rows/cards.
- Bad: a frontend hook increments achievement counters locally or infers unlocks from button clicks.
- Bad: adding `const [showAchievements, setShowAchievements] = useState(false)` directly in `App.jsx`.
- Bad: passing an inline achievement-unlock callback into `useHomeUserRefresh()`, because `updateUser(data.user)` re-renders the app and restarts the refresh effect.

#### 6. Tests Required
- `src/app/useOverlayState.test.js` must include achievement and personalization keys in default and close-all projections.
- Modal/component tests should assert achievement tabs, achieved/unachieved row classes, equipment slot validation messaging, and save refresh behavior when practical.
- Commerce/gacha/warehouse hook tests must assert returned unlocks are passed to the achievement toast helper.
- App-level regression tests should assert the achievement unlock callback passed to home refresh is memoized.
- App overlay/source tests should be updated when the achievement/personalization prop boundary changes.

#### 7. Wrong vs Correct

Wrong:

```jsx
const unlocked = localDrawCount >= achievement.targetCount;
setShowAchievementToast(unlocked);
```

Correct:

```jsx
const showAchievementUnlocks = useCallback((unlocks = []) => {
  for (const unlock of unlocks) showToast(`达成成就：${unlock.name}`, "achievement");
}, [showToast]);

const result = await apiPost("/api/gacha/draw", body);
showAchievementUnlocks(result.achievementUnlocks);
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
- `normalizeMatchStart(payload)` returns `{ startedAt, mode }` with missing mode normalized to `spark`.
- `sameMatchStart(current, next)` checks whether a repeated waiting payload can keep the current object.

#### 3. Contracts
- `App.jsx` should read match transition fields from `useMatchSessionState()` instead of adding separate top-level state for pending or successful match transitions.
- `matchStart` owns the waiting modal payload and should remain either `null` or `{ startedAt, mode }`.
- `matchSuccess` owns the success transition payload and should remain either `null` or `{ startedAt, room }`.
- `isMatchPending` and `isMatchTransitioning` are derived state; do not store them independently.
- `matchSuccessRef` still mirrors `matchSuccess` through `useSyncedRefs()` for socket room-update synchronization.
- `socketHandlers.matchWaiting(payload)` should write through a functional setter and return the current `matchStart` object when `startedAt` and `mode` are unchanged.

#### 4. Validation & Error Matrix
- No `matchStart` and no `matchSuccess` -> no match modal.
- `matchStart` present -> waiting modal can render mode and start time.
- Repeated `match:waiting` with the same `startedAt` and mode -> keep the current `matchStart` object.
- Missing waiting mode -> normalize to `spark`.
- `matchSuccess` present -> success transition can complete into the pending room.
- Room resume or auth reset -> both match fields must be cleared.

#### 5. Good/Base/Bad Cases
- Good: `const { matchStart, setMatchStart, matchSuccess, setMatchSuccess } = useMatchSessionState();`
- Good: duplicate `match:waiting` payloads from reconnect do not recreate the waiting-modal payload object.
- Base: `AppOverlays` can continue receiving `matchStart` and `matchSuccess` separately while the shell boundary is gradually narrowed.
- Bad: adding a separate `const [isMatching, setIsMatching] = useState(false);`.
- Bad: `setMatchStart({ startedAt, mode })` for every waiting payload because unchanged server notifications still re-render the match waiting overlay.
- Bad: treating `matchSuccessRef.current` as a source of truth after `matchSuccess` has been cleared.

#### 6. Tests Required
- `src/app/useMatchSessionState.test.js` should cover default state and derived pending/transition flags.
- `src/app/socketHandlers.test.js` should assert waiting payload normalization and stable-object behavior for duplicate `match:waiting` payloads.
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

### Scenario: Incoming Duel Request State

#### 1. Scope / Trigger
- Trigger: handling `duel:incoming` or `duel:closed` socket payloads, changing the direct-duel banner, or changing the synthesized doorbell sound trigger.
- Incoming duel requests are transient app shell state. The socket payload can be repeated around reconnect or delivery retries, so duplicate request ids must not retrigger the banner or sound.

#### 2. Signatures
- `incomingDuelRef` mirrors the current `incomingDuel` app state through `useSyncedRefs()`.
- `socketHandlers.duelIncoming(request)` stores a new request only when `sameDuelRequest(incomingDuelRef.current, request)` is false.
- `sameDuelRequest(current, next)` compares `requestId`.

#### 3. Contracts
- `App.jsx` should pass `incomingDuelRef` into `useGameSocketConnection()` alongside the setter.
- `duel:incoming` should update `incomingDuelRef.current` immediately before calling `setIncomingDuel(request)`, so back-to-back duplicate socket payloads are suppressed before React commits the state update.
- Doorbell SFX should play only for a newly accepted incoming request id.
- `duel:closed` should clear `incomingDuelRef.current` when the closed request id matches the current banner request.
- Do not put sound playback inside a React state updater; updater functions must stay pure.

#### 4. Validation & Error Matrix
- First `duel:incoming` for `requestId: "a"` -> set the banner request and play the doorbell once.
- Repeated `duel:incoming` for `requestId: "a"` while the banner is already current -> no setter call and no sound.
- `duel:incoming` for a different request id -> replace the banner and play the doorbell.
- `duel:closed` for the current request id -> clear both the ref and the visible banner through the existing functional setter.
- `duel:closed` for an old request id -> leave the current banner alone.

#### 5. Good/Base/Bad Cases
- Good: a reconnect replay of the same direct-duel request does not animate the banner or replay the doorbell.
- Base: a new friend duel request still interrupts the current banner because it has a different `requestId`.
- Bad: `setIncomingDuel(request); playDoorbellSound(...)` for every incoming payload because repeated packets can cause duplicate UI and audio work.

#### 6. Tests Required
- `src/app/socketHandlers.test.js` must assert new incoming duel requests set state and play audio, duplicate request ids are ignored before scheduling state, and matching close events clear the ref.

---

## Common Mistakes

- Treating room snapshot rating/rank changes as account reward events. Mode-specific stats can differ across spark, standard, and gomoku, so changing modes can make the current player's displayed rating/rank change without any game settlement.
- Bypassing `applyRoomSnapshot` for full same-room `room:update`, live `room:resume`, or pending match-success room payloads. This loses structural sharing and makes memoized board/player consumers work harder.
- Adding app-level modal flags directly to `App.jsx` instead of extending `useOverlayState()`.
- Storing `resultModalOpen` as independent state instead of deriving it from `useRoomSessionState()`.
- Adding independent match booleans instead of deriving them from `useMatchSessionState()`.
- Replaying direct-duel banner state or doorbell audio for the same `requestId` instead of suppressing duplicate `duel:incoming` payloads through `incomingDuelRef`.
