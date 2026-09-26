# Local Practice Engine Contract

## 1. Scope / Trigger

All new ordinary Zhunshibao and ranked capture-challenge rooms run bot search in
the owner's browser Worker. This user-approved design accepts modified client
engines; no attestation or server re-search. Server legality and score authority
remain mandatory. Legacy snapshots without `practice.engineBackend` use the
server path. Sigrika corruption duel remains on its dedicated server path.

## 2. Signatures

```js
socket.emit("practice:start", {
  difficulty: "beginner" | "intermediate" | "advanced",
  playerColor: "black" | "white" | "random",
  engineVersion: "gnugo-3.8-v1",
  challenge: "capture-challenge" // optional; advanced only
}, ack);
socket.emit("practice:compute", { roomCode, version: "gnugo-3.8-v1", active: false /* optional */ }, ack);
// ACK: { ok: true, job: null | { id, roomCode, positionVersion, version,
// difficulty, botColor, size, legalVertices, sgf? , view? } }
socket.emit("practice:computed", { roomCode, jobId, positionVersion,
  action: { type: "move", pointId } // or { type: "pass" }
}, ack);
// ACK: { ok: true, duplicate?: true } | { ok: false, code }
```

## 3. Contracts

- `startPracticeTransition` initializes the real Worker before admission, passes
  the version and fences canceled/disconnected starts. Runtime registration
  requires the version; native availability is irrelevant to new room admission.
- `practice.engineBackend="browser"` persists and is projected. Job leases and
  heartbeat timestamps are runtime-only, never restored. Recovery issues a fresh
  job from the current server state. No DB migration is required.
- Only the authenticated human's current socket can request or submit. A lease
  lasts 60 seconds and binds the job id, socket, and SHA-256 of the whole game
  state (skills may change a board without increasing `moveNumber`).
- SGF and whitelist come from `gameViewForColor(botColor)` and formal `playMove`.
  Only beginner receives a projected rule-state object for the shared heuristic.
  Neither worker receives an arbitrary GTP command from a client. Server replies
  never include unprojected board state. Client returns only a move or pass.
- Apply the reply as the server-known bot through `handleGameAction`; ignore
  client scores/identities. Cache the last accepted job receipt so a lost ACK
  cannot play twice. Reject work during pending skills, other phases/turns,
  after a mutation, or at ordinary practice's capture-resignation threshold.
- Beginner uses shared JS; intermediate and advanced/challenge use GNU Go 3.8
  WASM levels 5/10, cache 8 MB, no silent difficulty fallback. Minimum delay is
  difficulty-configured and server checked. Search timeout is 30 seconds, readiness
  60 seconds. Watchdog runs outside the Worker; terminate and restart once after
  search failure, then show a pause/retry message. Initialization failure creates
  no room; a later retry creates a fresh Worker.
- Poll every 1.5 seconds while visible/connected. Hidden/disconnect/leave cancels
  work and fences late replies. `active:false` revokes the lease and pauses clocks;
  missing heartbeat pauses after 10 seconds. Bot has unlimited thinking clock.
  Connected idle rooms end neutrally after 15 minutes without a challenge score.
  Existing disconnected-room cleanup remains authoritative. Foreground/reconnect
  requests current work; process restart does not restore old leases.
- Challenge still ends and scores on the server at 100 moves. Ordinary 22-capture
  resignation, counting/dead-marking/result confirmation remain server automated.
- Production serves `/engines/gnugo-3.8/` including GPL license, source, build script
  and manifest. Use WASM MIME, gzip, revalidation and 404 for missing artifacts.
  CSP `script-src 'self' 'wasm-unsafe-eval'`; do not enable JS `unsafe-eval`.
  Builder and runtime version must move together on subsequent artifact changes.
- Import the precompiled public JS with a same-origin absolute URL derived from
  `self.location.origin`, plus `@vite-ignore`. Root-relative dynamic imports still
  receive Vite's `?import` in development and trigger `ERR_LOAD_PUBLIC_URL`.
  Do not hide the error overlay or relax CSP to work around asset routing.

## 4. Validation & Error Matrix

| Condition | Result |
|---|---|
| Old client / mismatched engine version | `local_practice_version`, refresh; no new room |
| Missing runtime local adapter | `local_practice_unavailable` |
| Wrong user/socket, spectator, legacy or special room | `local_practice_forbidden` |
| Expired/replaced job, wrong position, wrong phase or turn | `local_practice_stale` |
| Too early result | `local_practice_wait`; retry same job |
| Unknown action, non-whitelisted move, formal action rejects | `local_practice_invalid` |
| Accepted job repeated by same socket | success with `duplicate:true`, no mutation |
| Lost ACK | retry the same submission up to three times, no extra search |
| WASM/network failure | visible error/pause; never manufacture a win |

## 5. Good / Base / Bad Cases

- Good: challenge browser computes level 10, server validates and records its own
  capture count at move 100. Engine failure cannot be submitted as bot resignation.
- Base: refresh while bot thinks revokes the old connection, restores room state
  and starts a fresh local search without a second server search.
- Bad: accept caller-supplied score/bot id; bind only to moveNumber; replay a result
  twice; use raw authoritative hidden state; cloud fallback for all weak devices.

## 6. Tests Required

- `server/localPracticeEngine.test.js`: authorization, lease/position invalidation,
  safe SGF, minimum delay, idempotency, skill/capture boundaries, 100-move settlement,
  restart persistence and special-room isolation.
- `server/socketPracticeEvents.test.js` / `practiceRoomAutomation.test.js`: new
  local admission does not probe native engine; local turns never server-search.
- `roomClockLifecycle.test.js`: paused clock and neutral idle completion.
- `src/practice/*.test.js`: Worker readiness/timeout/restart, visibility fencing,
  lost ACK, cleanup and initialization retry.
- `npm run verify:practice-wasm`: artifact hash, actual levels 5/10 on empty,
  20-move and 70-move positions; compare native moves when available.
- `npm run test:e2e:practice`: both Vite development and production Workers under
  CSP with isolated real servers/DBs, moves, refresh/recovery, download failure
  and retry. Assert no Vite error overlay. Preview-only tests miss dev transforms.

## 7. Wrong vs Correct

```js
// Wrong: client dictates a trusted result or bot identity.
room.game.captures.white = payload.captures;
handleGameAction(room.code, payload.botId, payload.action, io);
// Correct: server validates its own lease and applies only a sanitized action.
localPracticeEngine.submit(socket, { roomCode, jobId, positionVersion,
  action: { type: "move", pointId } }, io);
```
