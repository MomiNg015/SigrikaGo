# Sigrika Zhizi KataGo Contract

## 1. Scope / Trigger

- This contract applies only to `matchSource="sigrika-corruption-duel"` rooms. Public Zhunshibao practice behavior is unchanged.
- It covers Zhizi Cloud authentication/session allocation, KataGo GTP transport, corrupted Sigrika NPC decisions, hidden human-move agreement auditing, persisted dialogue/fake-skill presentation, safe projection, and shutdown.
- The integration is server-only because the Zhizi password, bearer token, Socket.IO token, raw candidates, and agreement evidence must never enter browser code or a room view.

## 2. Signatures

```js
createZhiziKataGoEngine({ env, fetchImpl, socketFactory })
engine.isEnabled() -> boolean
engine.ensureAvailable() -> Promise<{ ok, reason? }>
engine.search(gameView, botColor) -> Promise<{ ok, action?, analysis?, reason? }>
engine.analyze(gameView, playerColor, { purpose: "npc" | "audit" })
engine.close() -> void

createRoomCreationLifecycle({ prewarmSigrikaEngine })
prewarmSigrikaEngine() -> Promise<{ ok, reason? }>

createSigrikaAiAgreementSnapshot({
  analysis, boardSize, playerColor, positionMoveNumber, legalMoveCount, minVisits
})
evaluateSigrikaAiAgreementMove(audit, historyEntry)

sigrikaCandyDuel.presentation = null | {
  sequence: number,
  type: "dialogue" | "skill",
  speaker: "西格莉卡？",
  text?: string,
  skillName?: string
}
```

- Login: `POST https://www.zhizigo.com/api/cluster/account/login` with exactly one of `phone` or `email`, plus `password`.
- Session allocation: authenticated `POST /api/cluster/account/fetch-socketio-token` with fixed `args`:
  `--platform all --engine-type go --gpu-type vip-share --kata-name katago-TENSORRT --kata-weight 28bnbt`.
- Socket.IO uses path `/socket.io.v4`, WebSocket transport, query key `zz-socketio-token`, and waits for the custom `ready` event before GTP.

## 3. Contracts

- Environment keys:
  - `ZHIZI_ENABLED`: opt-in boolean; disabled means no network access.
  - Exactly one of `ZHIZI_ACCOUNT_PHONE` / `ZHIZI_ACCOUNT_EMAIL` when enabled.
  - `ZHIZI_ACCOUNT_PASSWORD` when enabled.
  - Optional bounded controls: `ZHIZI_NPC_MIN_VISITS`, `ZHIZI_AUDIT_MIN_VISITS`, `ZHIZI_SEARCH_TIMEOUT_MS` and the adapter's other timeout/interval keys. `ZHIZI_SEARCH_TIMEOUT_MS` defaults to and is hard-capped at 5000ms; lower values down to 1000ms remain valid.
- Credentials and tokens stay in server process memory or ignored deployment environment files. Never place them in source, tests, logs, client bundles, room views, chat metadata, or persisted room snapshots.
- One Zhizi GTP session, one in-flight session-opening promise, and one active analysis are allowed per Node process. Reconnect allocates a fresh Socket.IO token and replays the complete legal `move` / `pass` history.
- Creating a `sigrika-corruption-duel` room starts `ensureAvailable()` without awaiting it. Prewarm must complete login, VIP-share allocation, Socket.IO `ready`, and `kata-set-param maxTime`; it must not synchronize a board or start `kata-analyze`.
- Room registration, persistence, the `match:found` event, and entry into the duel never wait for prewarm. Synchronous throws and rejected prewarm promises are contained; the first ordinary search retries or follows the documented fallback chain.
- If the first search overlaps prewarm, both callers await the same session-opening promise. They must not log in twice, allocate two Socket.IO tokens, or open two VIP-share sessions. A warmed but unused session uses the normal configurable idle timeout (default 90 seconds) and is then closed.
- Internal komi is stored in half-point stone units, so special-duel `2.75` is sent to GTP as `komi 5.5`. Use Chinese rules and `boardsize 13`.
- A physical stdout line can contain multiple `info move` blocks. Parse every block and keep `move`, `order`, `visits`, `winrate`, `scoreLead`, `prior`, and `pv`; never assume one candidate per line.
- Each fresh KataGo session receives `kata-set-param maxTime <seconds>` using the bounded search duration. The client keeps a matching watchdog for continuous `kata-analyze`, sends `stop` at the limit, and treats already-streamed candidates as a successful Zhizi result with `partial=true`; reaching the limit is not itself a local-engine fallback condition.
- If the full search window ends before any candidate arrives, return the public `timeout` reason without opening a second five-second search. Connection failures may still use the existing one-time fresh-session recovery before a search result exists.
- NPC chain is fixed: enabled Zhizi `vip-share` -> GNU Go level 10 -> GNU Go level 5 -> beginner heuristic -> safe pass. Every candidate is revalidated with the formal `playMove` boundary before `handleGameAction`.
- Human agreement analysis begins only when the position has at least 20 total moves and it is the human turn. Analyze the pre-move position and compare only the immediately following matching human `move` history entry.
- Exclude passes, stale/missing snapshots, positions with at most two legal moves, insufficient visits, and positions whose top two candidates are effectively equivalent.
- Regular suspicion requires a rolling 24 eligible moves with Top-1 >= 75%, Top-3 >= 92%, average score loss <= 0.8, at most one score loss over 2.5, and at least five hard-AI hits; then require a separate six eligible moves with at least five Top-3 hits, average loss <= 1.0, and no loss over 3.0.
- Extreme suspicion uses the user-approved boundary of 35 eligible moves, cumulative Top-1 >= 90%, and at least six hard-AI hits. It may trigger without the six-move confirmation.
- A hard-AI hit is a Top-1 match whose policy-prior rank is at least four and whose score lead over Top-2 is at least 1.0.
- Persist `sigrikaCandyDuel.aiAgreementAudit` and any pending pre-move snapshot so restart/resume does not erase or double-count evidence. Public `roomView` exposes only `aiAgreementTriggered`, monotonic `aiAgreementEventSeq`, and the current sanitized `presentation`; raw metrics/candidates/reason and internal presentation stages remain server-only.
- Triggering is a narrative signal, not proof or punishment. It may start Sigrika's loss-of-control story but must not ban, rate-limit, alter rewards, or publicly accuse the player.
- Formal room skills stay disabled. The corrupted NPC player card always displays `？？？ · ？`; it must never reveal `秘日六席` or `七宗罪` as the persistent skill identity.
- On the first corrupted-NPC turn, automation must publish `那么，让你看看才能的差距吧。`, then the visual-only skill `秘日六席`, clear the presentation, and only then enter the ordinary NPC move chain.
- When the agreement audit triggers, automation must publish in order: `为什么你所展示的力量，和那个禁忌的来源这么像...`, `我懂了......我懂了！那么你也是恶啊！`, `行吧，那就用恶的方式来结束这令人失望的一局吧。`, then the visual-only skill `七宗罪`. Clear the presentation before ordinary play resumes.
- Ordinary corrupted-NPC move calculation must not append a `西格莉卡？正在思考。` / `kind="npc-thinking"` system record. Presentation dialogue, fake-skill records, engine fallback notices, and ordinary game records remain available; clients may hide legacy persisted `npc-thinking` records for this room type.
- Dialogue/skill presentation may update only `sigrikaCandyDuel` metadata and system records. It must not mutate board points/history, turn, move number, captures, formal skill uses/costs/removals/passives, winner, rank, or rewards.
- Persist the opening/reaction stage and monotonic presentation sequence before broadcasting. Restart/resume continues from the next stage without replaying completed lines or skipping directly to a move.
- Corrupted-duel dialogue and fake-skill bursts are text/visual only. `useRoomAudioEffects` suppresses character and TTS voices for the whole special room, while ordinary board SFX remain available.
- Shutdown closes the remote session before flushing rooms and disconnecting runtime dependencies.

## 4. Validation & Error Matrix

| Condition | Internal result | Required behavior |
|---|---|---|
| `ZHIZI_ENABLED` false | `disabled` | Do not make REST or Socket.IO calls; use local NPC chain; skip audit |
| Special-room prewarm rejects or throws | contained warmup failure | Still create, persist, and emit the room; ordinary first-turn search may retry and then use the normal fallback chain |
| Prewarm and first search overlap | shared session-opening promise | Allocate exactly one VIP-share session; search waits for that ready/configured session, then synchronizes the current board |
| Enabled with missing/ambiguous identifier or password | `configuration` | Production config check fails; runtime uses local NPC fallback |
| Login/session HTTP 401 | `authentication` after one retry | Clear cached bearer, log in once more, then fall back if still rejected |
| REST/ready/GTP timeout or disconnect | `timeout` / `connection` | Tear down session, retry once with a new token/full replay, then fall back |
| Five-second `kata-analyze` limit with candidates | successful partial analysis | Send `stop`, keep the latest ordered candidates, and use the Zhizi Top-1 without local fallback |
| Five-second `kata-analyze` limit without candidates | `timeout` | Stop and close the session, do not start a second full search, then use the ordinary failure fallback boundary |
| Another analysis is active | `busy` | Never overlap GTP streams; NPC falls back, audit skips that position |
| Unsupported history or malformed/empty candidates | `unsupported-history` / `invalid-response` | Do not submit an action or count evidence |
| Candidate is illegal in current authoritative position | `invalid-result` | Reject it and continue the explicit NPC fallback chain |
| Audit result below visit floor / forced / equivalent | excluded | Mark the position attempted, persist no pending evidence, continue play |
| Pending audit survives restart | restored snapshot | Evaluate exactly the expected next human move once, then clear pending |
| Opening/reaction presentation survives restart | restored presentation stage | Continue from the next stage, never replay a completed line or execute an extra move |
| Unknown/malformed public presentation | invalid projection | Project `null`; never expose internal stages or arbitrary private metadata |
| Fake skill presentation is active | dialogue/skill metadata only | Keep the formal game state byte-for-byte equivalent until the normal move action runs |

## 5. Good / Base / Bad Cases

- Good: special-room creation starts one non-blocking ready/configured session; the first search reuses it, replays the 13x13 position, and Sigrika uses a legal Top-1 action.
- Base: Zhizi is disabled or temporarily unreachable; room creation still succeeds and the same bot turn proceeds through GNU Go/heuristic fallback, while ordinary practice semantics remain unchanged.
- Bad: awaiting prewarm before emitting the room, allocating a second VIP-share session when first search overlaps warmup, exposing the password/token/raw candidates/internal stage, starting two concurrent analyses, sending internal `2.75` directly as GTP komi, parsing only the first `info` block, judging passes/forced choices, counting fewer than 35 moves for the extreme path, treating the trigger as enforcement, putting fake skills into `game.pendingSkill`, or letting the NPC move before its active sequence finishes violates this contract.

## 6. Tests Required

- Config/security tests: disabled makes no network call; enabled requires one identifier and password; fixed VIP-share engine args cannot be overridden.
- Protocol tests: binary/string payloads, komi conversion, complete move/pass replay, multiple candidates per line, GTP I-column conversion, pass/resign mapping.
- Engine tests: login/allocation/ready, `ensureAvailable()` creates and configures a session without analysis, concurrent prewarm/search performs one allocation, engine-side five-second `maxTime`, full synchronization, Top-1 action, partial-candidate success at the watchdog limit, no second full search when the limit yields no candidate, global busy response, timeout/disconnect cleanup, one 401 re-authentication, redacted errors, close/disconnect.
- Audit tests: opening gate, forced/equivalent/low-visit exclusions, stale/pass exclusion, 24+6 confirmation, exact 35-move extreme threshold, hard-AI definition, no double evaluation after restore.
- Room/automation tests: only special-room creation fires non-blocking prewarm; warmup failure does not block room creation; Zhizi-first NPC choice, same-turn local fallback, pre-move audit persistence, post-move reconciliation, one in-flight operation, and shutdown close.
- Presentation automation tests: exact line/skill order, opening once-only gate, real extreme-35 trigger routing, no `npc-thinking` system append, no game-state mutation during presentation, ordinary move only after clear, and restored-stage continuation.
- View/persistence tests: hidden metrics, candidates, and presentation stages survive `PersistedRoom` round-trip but never appear in `buildRoomView`; only trigger boolean/event sequence plus the sanitized current presentation are public.
- Frontend tests: corrupted player card remains `？？？ · ？` with formal skills disabled; dialogue/skill components contain exact copy, have no voice dependency, portal to the corruption action layer, fit portrait phones, and provide reduced-motion behavior.
- Live smoke: `npm run verify:zhizi` must authenticate with deployment env, allocate `vip-share`, return one legal 13x13 action, and print no secret/token.

## 7. Wrong vs Correct

### Wrong

```js
// Browser code receives credentials/candidates and decides whether to accuse.
socket.emit("zhizi:analyze", { password, history });
if (top1Rate(last10) > 0.9) banPlayer();

// A normal five-second cutoff discards valid cloud work and switches engines.
if (searchTimedOut) return localFallback();

// Room creation waits on the remote provider and overlapping search opens another session.
await zhiziEngine.ensureAvailable();
emitMatchFound(room);
```

### Correct

```js
// The server owns credentials, analysis, persistence, and formal action legality.
const result = await zhiziEngine.analyze(gameViewForColor(room.game, human.color), human.color);
room.sigrikaCandyDuel.aiAgreementAudit = markSigrikaAiAnalysisAttempt(audit, moveNumber, snapshot);
// The server advances persisted presentation stages; game.pendingSkill and game state stay untouched.
room.sigrikaCandyDuel.aiReactionPresentationStage = "pending";
// The safe room projection exposes only trigger signals and the sanitized current presentation.

await session.setSearchTimeLimit(5_000); // kata-set-param maxTime 5
const analysis = await session.analyze(playerColor, { timeoutMs: 5_000 });
// At the watchdog limit, streamed candidates resolve with partial=true and remain Zhizi results.

// Special-room creation starts warmup but never waits; ensureAvailable/search share currentSession().
void Promise.resolve(zhiziEngine.ensureAvailable()).catch(() => {});
emitMatchFound(room);
```
