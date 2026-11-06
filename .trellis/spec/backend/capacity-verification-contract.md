# Capacity verification contract

## 1. Scope / Trigger
Capacity harness, local resource simulation, or claims about supported online users/games. Production remains single-process Node + SQLite.

## 2. Signatures
`npm run verify:capacity -- --profile target --action-mode move --rooms 20 --sockets 100 --registration-concurrency 1 --stagger-actions --skip-build --skip-restart`.
`--rooms 0` measures idle connections. Default `layout` retains the synthetic diagnostic. `--reconnect-ratio 0` really disables reconnection.

## 3. Contracts
- Real move mode uses the received player view, current-color socket and `playMove` legality. It sends normal `game:action` moves; no random-layout action is used. Staggering distributes each room's one action across the interval.
- Registration is setup, not steady-state login traffic. Record setup failures separately; changing registration concurrency must be disclosed.
- Local `--restart-after-setup` restarts the isolated service after account creation and before connecting clients. This separates cumulative event-loop histograms from bcrypt setup cost; disclose it in the report. It does not replace the optional loaded-server restart/recovery test.
- `CAPACITY_WINDOWS_LIMITS=1` requires Windows/Python. Explicit `CAPACITY_SERVER_AFFINITY` and `CAPACITY_DRIVER_AFFINITY` apply only to the benchmark processes, at below-normal priority. Server Job Object committed-memory limit defaults to 1536 MiB (`CAPACITY_SERVER_MEMORY_MIB`); host free-memory floor defaults to 1024 MiB (`CAPACITY_MIN_FREE_MIB`). The helper records verified limits, peak commit and minimum host free memory.
- Job committed-memory caps are not a physical-RAM-limited VM. Never call this a measured Linux 2GB cloud ceiling. Keep other apps untouched; stop the owned test server if free memory falls below the floor.
- Use a fresh isolated database, track each server PID, confirm shutdown before cleanup. Preserve data if shutdown fails. Remote AI disabled for local fixture.
- Any client error or unexpected disconnect fails thresholds. Check server-observed final online/room counts. Idle mode has no action samples; latency gates are inapplicable. Missing server telemetry still fails. Reports include aborted setup failures.
- `--recycle-after-moves N` requires real move mode, N >= 20 and a local isolated database auditor. Resign, verify exactly one durable record with the right players/winner/move count/finished snapshot, leave and rematch the same pair, then rejoin spectators. Alternate the resigning player to avoid unbounded rank divergence. At least one audited settlement per room is required to pass this mode. `--http-reads-per-cycle N` adds authenticated `/api/me` reads and reports their latency/errors.
- Keep loaded restart/reconnect enabled in lifecycle smoke. Lifecycle iteration count and HTTP samples are part of the report; a finite short run is not an overnight soak.
- IPC shutdown uses `stopTestProcesses` with a shutdown message, waits for actual exit and handles an IPC channel that closed before send. The owned Windows job uses kill-on-close so an interrupted guard cannot strand descendants. Guard-induced exit is resource-aborted, never a capacity result.

## 4. Validation & Error Matrix
| Case | Expected |
| --- | --- |
| Client action/reconnect failure | Failed report, even if p95 is good |
| rooms=0 | Zero rooms, no artificial game; connection/telemetry checks still apply |
| Host memory below floor | Terminate only the owned server job; aborted run, not capacity ceiling |
| Resource limiter cannot apply | Fail before server import |
| Live database owner | Refuse cleanup |

## 5. Good / Base / Bad Cases
Good: measured staged topology + duration + action pacing + errors + resource evidence. Base: smoke proves the toolchain. Bad: treating default 500/100 guardrails or a short local pass as a production capacity guarantee.

## 6. Tests Required
Capacity unit coverage: idle topology, zero reconnect, invalid action mode, client-error rejection, mandatory lifecycle completion, percentile math, 80 alternating legal moves without input mutation. Real fixture verifies resource limits, durable settlements, rematches, action/observation/reconnect paths and cleanup. Target cloud soak and full skill/AI load remain separate gates.

## 7. Wrong vs Correct
Wrong: “500 sockets configured, therefore 2GB supports 500 users.” Correct: cite the achieved topology, measured latency/error/CPU/memory, setup exclusions, run duration and exact host constraints.
