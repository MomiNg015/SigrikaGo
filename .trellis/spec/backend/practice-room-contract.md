# Practice Room Contract

## 1. Scope / Trigger

Use this contract when changing the `practice:start` socket event, practice-room persistence, the Zhunshibao scheduler, or practice result handling. Practice games share the authoritative Spark room pipeline but must remain isolated from matchmaking, public spectating, records, and progression.

## 2. Signatures

```js
socket.emit("practice:start", {
  difficulty: "beginner" | "basic",
  playerColor: "black" | "white" | "random"
}, (ack) => {});

// Success
{ ok: true, roomCode: string }

// Failure
{ ok: false, error: string, code: string }
```

The created room must expose `mode: "spark"`, `rated: false`, `matchSource: "practice"`, `recordPolicy: "none"`, and a persisted `practice` configuration.

## 3. Contracts

- The server is authoritative: clients request settings and then consume the existing `match:found`, preload, clock, action, scoring, result, and resume flows.
- Zhunshibao has resource id `zhunshibao`, no character or skill, and is auto-ready during preload.
- Bot decisions receive `gameViewForColor(room.game, bot.color)` rather than the hidden authoritative board.
- One bot action may be scheduled per room/turn. A restored active room must re-arm scheduling.
- Practice rooms count toward active-room admission but never enter matchmaking statistics, queues, or the public watch list.
- Closing a practice game sets result state without creating a game record, rewards, rating changes, growth, achievements, or task progress.

## 4. Validation & Error Matrix

| Condition | Ack code | Behavior |
|---|---|---|
| Unknown difficulty or player color | `invalid_practice_options` | Reject before room creation |
| Runtime match admission closed | `capacity_reached` | Reject and increment admission rejection metric |
| User already has an active room | `active_room_exists` | Reject without replacing that room |
| Authentication refresh fails | `auth_expired` | Reject and require login |
| Valid request | success | Leave matchmaking, create the room, return `roomCode` |

## 5. Good / Base / Bad Cases

- Good: a valid basic/random request creates a non-rated Spark room and the bot moves through the normal action lifecycle.
- Base: refresh or process restore rebuilds the practice metadata and resumes only the currently valid bot turn.
- Bad: deriving moves from the authoritative hidden board, creating replay/progression rows, or advertising the room as watchable violates this contract.

## 6. Tests Required

- Socket tests assert all request validation codes, active-room rejection, matchmaking exit, and room metadata.
- Decision tests inject a seeded random source, cap candidates at 48, assert legal moves, and prove hidden information is not consumed.
- Automation tests assert delay bands, duplicate-schedule suppression, capture resign thresholds, and ordinary-capture-only semantics.
- Persistence/view/result tests assert restore metadata, safe bot projection, watch-list exclusion, and no record or rewards.
- Scoring tests assert one conservative bot dead-stone analysis per request and acceptance after human corrections.

## 7. Wrong vs Correct

### Wrong

```js
const move = chooseMove(room.game); // leaks hidden authoritative state
await saveGameRecord(room);         // practice must not persist progression
```

### Correct

```js
const visibleGame = gameViewForColor(room.game, bot.color);
const move = choosePracticeMove(visibleGame, options);
if (room.recordPolicy !== "none") await saveGameRecord(room);
```
