# Zhizi KataGo integration research

## Public protocol facts

Sources:

* https://github.com/kinfkong/zhizi-open-api/blob/main/docs/en/reference/rest-api.md
* https://github.com/kinfkong/zhizi-open-api/blob/main/docs/en/reference/engine-options.md
* https://github.com/kinfkong/zhizi-open-api/blob/main/docs/en/reference/socketio-gtp.md
* https://github.com/kinfkong/zhizi-open-api/blob/main/docs/en/guides/engine-sessions.md
* https://github.com/lightvector/KataGo/blob/master/docs/GTP_Extensions.md

The supported flow is:

1. `POST /api/cluster/account/login` with exactly one of `phone` or `email` plus `password`.
2. Keep the returned account token in memory and use it as a Bearer token for `POST /api/cluster/account/fetch-socketio-token`.
3. Request the fixed engine configuration `--platform all --engine-type go --gpu-type vip-share --kata-name katago-TENSORRT --kata-weight 28bnbt`.
4. Connect with Socket.IO v4, WebSocket transport, path `/socket.io.v4`, and query key `zz-socketio-token`.
5. Wait for the custom `ready` event, then send newline-terminated GTP commands.
6. On disconnect, discard the runner state, get a new Socket.IO token, and replay the full board.
7. Send `stop` before an idempotent teardown.

`stdout` can be a string, Buffer/ArrayBuffer view, or an object wrapping binary data. Chunks and physical lines do not align with logical messages. One physical analysis line can contain multiple `info move ...` blocks, so the parser must split each `info` token and preserve unknown fields defensively. Zhizi publicly guarantees the candidate subset around `move`, `order`, `visits`, `winrate`, `scoreLead`, and `pv`; common KataGo outputs also include `prior`, `lcb`, `utility`, and score statistics.

KataGo reports candidate and root values from the analyzed/current player's perspective by default. `kata-analyze` runs until another command or a newline stops it. Full KataGo supports `rootInfo true`, but Zhizi guarantees only its documented subset, so the integration cannot require root info.

## Live capability probe

On 2026-08-06 the configured account completed a short `vip-share` probe against a 13x13 empty Chinese-rules position:

* password login succeeded;
* VIP membership was active;
* Socket.IO session allocation and custom `ready` succeeded;
* `kata-analyze B 10 rootInfo true` produced multiple `info` candidate blocks on one physical line;
* `prior` and `pv` were present;
* the Top-1 candidate reached 802 visits during the short probe;
* the probe did not establish that `rootInfo` is reliably present, so Top-1 visits remain the portable stopping threshold;
* the session was stopped and disconnected immediately after the probe.

No account identifier, password, Bearer token, or Socket token belongs in this artifact or in runtime logs.

## Repository integration findings

* `server/practiceRoomAutomation.js` owns the per-room scheduled/in-flight lock and already revalidates engine suggestions through the authoritative game action pipeline.
* `server/sigrikaDuelEngine.js` owns the special same-turn fallback chain. The smallest safe change is to try Zhizi first, then retain advanced GNU Go, intermediate GNU Go, beginner heuristic, and safe pass.
* `server/roomFactory.js` stores special-duel state under `room.sigrikaCandyDuel`; `server/roomStatePersistence.js` persists that object wholesale, while `server/roomView.js` explicitly projects only safe fields. Hidden audit state can therefore live in the persisted special-duel object without reaching browsers or replays.
* `server/roomBroadcasts.js` persists before invoking the practice automation callback. Audit mutations performed by the automation after a broadcast need an explicit forced persistence call.
* A player pre-move candidate snapshot can be scheduled when the special room is on the human turn. After the player action broadcasts, the scheduler can compare the new history entry with the prior snapshot before scheduling the bot turn. This avoids changing the shared action lifecycle.
* `src/shared/game.js` stores ordinary moves as `{ type: "move", color, id, moveNumber }` and passes as `{ type: "pass", color, moveNumber }`. The special duel disables skills, so complete GTP replay can use this history safely.
* `gameViewForColor()` remains the required information boundary. Although the special duel has no hidden-hand skills, both remote NPC analysis and hidden player audit should still receive the color-specific view.
* `room.sigrikaCandyDuel` already persists across process restore. Aggregate audit state and the current pending snapshot can be restored without persisting remote tokens or runner state.
* Graceful shutdown currently flushes room persistence before Prisma closes. The room automation should expose a close method so the server lifecycle can stop/disconnect the remote session before dependency shutdown.

## Komi unit decision

`src/shared/gameScoring.js` stores komi in the project's displayed stone/子 unit. It subtracts `2.75` from Black and adds `2.75` to White, creating a raw difference of `5.5`, then divides the final raw margin by two for display. Existing tests confirm that an empty/equal board with internal komi `2.75` is White by `2.75` stones.

GTP/KataGo komi is expressed in points. Therefore the special duel's internal `game.komi = 2.75` must synchronize as `komi 5.5`, not `komi 2.75`. The conversion is `gtpKomi = internalKomi * 2` and requires a regression test.

## Chosen implementation shape

1. A pure protocol module handles Socket payload decoding, position replay, GTP coordinate conversion, and analysis candidate parsing.
2. A server-only engine module handles configuration, REST authentication, one in-memory Socket.IO session, serialized analysis, timeout/reconnect, idle teardown, and redacted error mapping.
3. A pure AI-agreement module owns eligibility filters, rolling metrics, two-stage confirmation, and the 35-eligible-move extreme shortcut.
4. The existing Sigrika engine boundary tries Zhizi only when configured, then keeps the existing local fallback chain.
5. Practice automation prepares human-turn snapshots asynchronously, consumes them after the matching move, persists hidden aggregates, and exposes only a one-time story-trigger boolean/event through the existing safe special-duel projection.
6. Production configuration validation requires the selected login identifier and password only when `ZHIZI_ENABLED=true`; it never prints secret values and never silently changes from `vip-share` to a paid GPU tier.
