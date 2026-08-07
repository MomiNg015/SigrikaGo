# Sigrika Candy Duel Recovery Contract

## 1. Scope / Trigger

Use this contract when changing `sigrika-candy:duel-start`, the account-level Sigrika candy arc, special-room restoration, empty-room cleanup interactions, or the client transition that starts the corruption duel. The account can outlive its `PersistedRoom`; `duel-active` is therefore not proof that a resumable room still exists.

## 2. Signatures

```js
socket.emit("sigrika-candy:duel-start", {}, (ack) => {});

// New room
{ ok: true, roomCode: string }

// Existing authoritative room
{ ok: true, roomCode: string, resumed: true }

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
- `awaiting-duel` creates exactly one new special room and persists its new room code as `duel-active`.
- `duel-active` with a matching in-memory room carrying `sigrikaCandyDuel` resumes that room and never creates a duplicate.
- `duel-active` whose expected room is absent or is not a Sigrika candy duel performs an expected-room transition through `recoverMissingSigrikaCandyDuel()`. The transition may reset only when both the current phase and current room code still match the values inspected by the socket handler.
- A successful stale-room repair is intentionally two-step: the first request returns `special_room_reset` without creating a room; the player's next request follows the ordinary `awaiting-duel` creation path.
- Recovery clears only the stale room code and outcome. It preserves use count 8, corruption presentation, candy effects, story progress, records, rewards, and every unrelated user field.
- The ack carries only the normalized `sigrikaCandyArc` mutation payload. The client merges that field into the current user with a functional updater; it must not replace the complete user with a partial Prisma projection.
- If the expected phase or room code changed before recovery completed, return `special_phase_changed` with the latest normalized arc and require a retry rather than overwriting the newer state.

## 4. Validation & Error Matrix

| Condition | Ack code | Behavior |
|---|---|---|
| `awaiting-duel` | success | Create and persist a new special room |
| `duel-active` + matching special room | success with `resumed: true` | Attach the socket and emit `match:found` |
| `duel-active` + missing/non-special room + expected state still matches | `special_room_reset` | Reset to `awaiting-duel`, clear room/outcome, sync arc, create no room |
| Phase or room code changed before the reset write | `special_phase_changed` | Preserve the newer state, sync the latest arc, create no room |
| Any non-startable phase | `invalid_special_phase` | Reject without changing the arc or creating a room |
| Match admission closed | `capacity_reached` | Reject before room lookup or mutation |
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
- `src/app/useMatchActions.test.js` asserts the client functionally merges `ack.sigrikaCandyArc`, clears the pending match transition, and shows the server recovery message.
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
