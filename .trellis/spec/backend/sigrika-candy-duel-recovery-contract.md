# Sigrika Candy Duel Recovery Contract

## 1. Scope / Trigger

Use this contract when changing `sigrika-candy:duel-start`, `sigrika-candy:duel-status`, `sigrika-candy:duel-watch`, the account-level Sigrika candy arc, special-room restoration, empty-room cleanup interactions, or the client transition that starts or observes the corruption duel. The account can outlive its `PersistedRoom`; `duel-active` is therefore not proof that a resumable room still exists.

## 2. Signatures

```js
socket.emit("sigrika-candy:duel-start", {}, (ack) => {});
socket.emit("sigrika-candy:duel-status", {}, (ack) => {});
socket.emit("sigrika-candy:duel-watch", {}, (ack) => {});

// New room
{ ok: true, roomCode: string }

// Existing authoritative room
{ ok: true, roomCode: string, resumed: true }

// Authorized availability result
{ ok: true, status: "available" | "owned" | "occupied" }

// Another user won the final create race; no room is created or observed
{
  ok: false,
  error: "西格莉卡？已经开始和别人对局了。",
  code: "special_duel_occupied",
  status: "occupied"
}

// The observed room ended after the yellow button was shown; no room is created
{
  ok: false,
  error: "这盘决战已经结束了。",
  code: "special_watch_ended",
  status: "available"
}

// Stale account-to-room link repaired; no room is created in this request
{
  ok: false,
  error: "上次特殊对局已失效，状态已恢复，请再次点击开始决战",
  code: "special_room_reset",
  sigrikaCandyArc: {
    useCount: 8,
    phase: "awaiting-duel",
    outcome: "",
    roomCode: "",
    corrupted: true,
    active: true
  }
}
```

The persisted recovery transition writes:

```js
{
  sigrikaCandyPhase: "awaiting-duel",
  sigrikaCandyRoomCode: "",
  sigrikaCandyOutcome: ""
}
```

## 3. Contracts

- Refresh the socket user before reading the candy phase.
- Only a refreshed user whose phase is still a corrupted phase may query or observe the special duel. Generic watch-room lists and `room:join` must keep the room hidden; even a guessed room code returns the ordinary room-unavailable response without first leaking spectator capacity.
- The in-memory room map is the single-process authority for the server-wide slot. Any unfinished `sigrika-corruption-duel` room occupies it from synchronous registration through preload, opening, live play, disconnect recovery, and persisted-room restoration. `finished` releases the slot before delayed room deletion.
- The final availability check and synchronous room registration must have no `await` between them. If another owner already occupies the slot, return `special_duel_occupied`; do not create a second room and do not auto-observe the winner.
- `awaiting-duel` creates exactly one new special room and persists its new room code as `duel-active`.
- `duel-active` with a matching in-memory room carrying `sigrikaCandyDuel` resumes that room and never creates a duplicate.
- `duel-active` whose expected room is absent or is not a Sigrika candy duel performs an expected-room transition through `recoverMissingSigrikaCandyDuel()`. The transition may reset only when both the current phase and current room code still match the values inspected by the socket handler.
- A successful stale-room repair is intentionally two-step: the first request returns `special_room_reset` without creating a room; the player's next request follows the ordinary `awaiting-duel` creation path.
- Recovery clears only the stale room code and outcome. It preserves use count 8, corruption presentation, candy effects, story progress, records, rewards, and every unrelated user field.
- The ack carries only the normalized `sigrikaCandyArc` mutation payload. The client merges that field into the current user with a functional updater; it must not replace the complete user with a partial Prisma projection.
- If the expected phase or room code changed before recovery completed, return `special_phase_changed` with the latest normalized arc and require a retry rather than overwriting the newer state.
- Special observation uses the existing spectator-capacity admission and `roomView` safety boundary, but `attachSocketToRoom` requires an explicit internal `allowSigrikaCandySpectator` authority flag plus a corrupted-phase user. Spectators remain read-only and receive only current safe presentation state, not hidden Zhizi audit fields or replayed completed presentation steps.
- A special spectator result confirms and leaves the room back to the still-open mode picker. It never calls the owner's recovery API. The owner result continues into recovery as before.
- The fresh red challenge action must first open `ConfirmModal` with the exact message `本对局为高难度对局，用时为30分钟包干制，确定参与吗？`. Cancel closes only that confirmation. Confirm preserves an explicit start intent and only then enters the existing preload/create flow; status polling during the confirmation must never turn that click into observation. Owner resume and occupied observation remain one-click actions.
- Both duel players use independent 1800-second main clocks with no byo-yomi. The corrupted room timer owner must keep label and digits on the high-contrast corruption text tokens. On portrait mobile it restores the normally hidden timer label and lays out label, digits, and a flexible remaining-width progress track in one row.

## 4. Validation & Error Matrix

| Condition | Ack code | Behavior |
|---|---|---|
| `awaiting-duel` | success | Create and persist a new special room |
| `awaiting-duel` + another unfinished special room | `special_duel_occupied` | Create no room, observe no room, update the client to the yellow occupied state |
| `duel-active` + matching special room | success with `resumed: true` | Attach the socket and emit `match:found` |
| `duel-active` + missing/non-special room + expected state still matches | `special_room_reset` | Reset to `awaiting-duel`, clear room/outcome, sync arc, create no room |
| Phase or room code changed before the reset write | `special_phase_changed` | Preserve the newer state, sync the latest arc, create no room |
| Any non-startable phase | `invalid_special_phase` | Reject without changing the arc or creating a room |
| Match admission closed while no duel exists | `capacity_reached` | Reject before new-room creation; existing owner resume remains available |
| Authorized watch + no unfinished duel | `special_watch_ended` | Observe no room, create no room, restore the red challenge state |
| Authorized watch + spectator capacity closed | capacity error | Observe no room and preserve the occupied state |
| Non-corrupted status/watch request | `invalid_special_phase` | Reject before looking up or exposing the active duel |
| Authentication refresh fails | `auth_expired` | Reject without room creation |

## 5. Good / Base / Bad Cases

- Good: an account references a room deleted by empty-room cleanup; the first click repairs the arc and changes the client button from “继续” to the normal start label, while the second click creates a new duel.
- Base: a process-restored valid special room is found by the user's persisted room code and resumes normally.
- Bad: silently creating a new room during the stale-room request makes a new game look like a continuation and violates the selected explicit recovery behavior.
- Bad: resetting every `duel-active` account during login or startup can destroy valid resumable rooms.
- Bad: sending a partial `publicUser()` result to `updateUser()` as a complete replacement can erase unrelated presentation relations such as equipped costumes.

## 6. Tests Required

- `server/sigrikaCandyArc.test.js` asserts that stale-room recovery data is produced only for `duel-active` with the exact expected room code and that mismatched/newer states produce no write data.
- `server/socketSigrikaCandyEvents.test.js` asserts valid-room resume creates no duplicate, stale-room first click writes `awaiting-duel` and returns `special_room_reset`, the second click creates one new room, and a changed expected room code returns `special_phase_changed` without a write.
- `server/socketSigrikaCandyEvents.test.js` also asserts authorized status, hidden ordinary-user status, occupied create-race behavior, direct authorized observation, and ended watch-race behavior. `server/roomConnectionLifecycle.test.js` keeps the explicit internal spectator authority boundary covered.
- `src/app/useMatchActions.test.js` asserts the client functionally merges `ack.sigrikaCandyArc`, clears the pending match transition, shows the server recovery message, and maps `special_duel_occupied` back to the occupied button without auto-observing.
- `src/home/HomeScreen.dom.test.jsx` covers the exact occupied label, `is-spectate` state, direct watch event, unchanged picker visibility, and `special_watch_ended` rollback. Result tests distinguish owner “继续” from spectator “确认”.
- `src/home/HomeScreen.dom.test.jsx` also covers the exact high-difficulty copy, cancel/no-start behavior, and confirmation-before-create boundary. Room factory/persistence tests assert both players' 1800-second zero-byo-yomi clocks, while the corruption CSS contract asserts high-contrast timer tokens and the portrait three-column fill layout.
- The full project check must keep lint, unit/integration tests, production build, built CSS contracts, and generated system-design documentation green; pre-existing admin snapshot drift must be reported separately rather than exported into an unrelated fix.

## 7. Wrong vs Correct

Wrong:

```js
if (phase === "duel-active" && !existingRoom) {
  return createSigrikaCandyDuelRoom(player, io);
}
```

Correct:

```js
if (phase === "duel-active" && !existingRoom?.sigrikaCandyDuel) {
  const updatedUser = await recoverMissingSigrikaCandyDuel({
    prisma,
    userId: socket.user.id,
    roomCode: socket.user.sigrikaCandyArc.roomCode
  });
  return acknowledge({
    ok: false,
    code: "special_room_reset",
    error: "上次特殊对局已失效，状态已恢复，请再次点击开始决战",
    sigrikaCandyArc: updatedUser.sigrikaCandyArc
  });
}
```

The correct path makes state repair explicit and leaves new-room creation to the next `awaiting-duel` request.
