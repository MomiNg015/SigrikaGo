# 准时宝与吃子挑战赛本地引擎

## Goal
Move ordinary practice and ranked capture-challenge bot search to the player's browser, reducing CPU demand on the small cloud server. The server remains authoritative for rules and scores.

## Confirmed requirements
- Beginner heuristic, intermediate GNU Go level 5, advanced and capture challenge GNU Go level 10 execute locally in a dedicated Worker.
- Capture challenge still records server-computed scores at 100 moves. User explicitly accepts client engine manipulation risk; no engine attestation or server recomputation.
- Preserve bot-visible positions, restricted legal candidates, formal action pipeline and skill semantics.
- Bind jobs to the authenticated human connection and current position; reject duplicates, stale and unauthorized results.
- Handle initialization, failures, reload/reconnection and backgrounding without fabricating bot losses or silently lowering difficulty.
- Keep corrupted Sigrika's independent server engine path intact.
- Preserve unrelated working tree edits.

## Technical approach
Build a reproducible GNU Go 3.8 WASM artifact using upstream GTP through FS/callMain. Extract shared pure position conversion. Add server-managed per-room jobs and a frontend Worker controller. Initialize before practice admission. Persist execution backend with legacy server compatibility. Server jobs use bounded leases and recover from current authority state, never trust client score.

## Decision
The user approved implementation after explicitly including ranked capture challenge in local computation. No further scope confirmation is needed. Initial rollout targets local-only new practice rooms with explicit unsupported/load failure messages rather than an unbounded automatic cloud fallback. Existing persisted rooms retain their previous backend.

## Acceptance criteria
- [x] WASM returns restricted legal moves at levels 5 and 10 on representative 13x13 positions; built browser Worker plays both tiers.
- [x] New ordinary and capture rooms use local computation without probing or searching native GNU Go.
- [x] Server authorization, position invalidation, duplicate handling and recovery tests pass.
- [x] Capture settlement and special duel isolation remain covered.
- [x] Worker timeout/restart, cleanup and readiness paths are tested.
- [x] Browser smoke test and measured desktop timings recorded; unavailable real-device testing disclosed.
- [x] Relevant tests, lint/build, deployment checks and design/spec updates pass.
- [ ] Whole-project gate: blocked by 8 failures in 6 unrelated test files; see research/validation.md. Current task changes do not touch those features.

## Out of scope
Offline play, client engine anti-cheat, ranked-mode removal, neural network replacement, and corrupted Sigrika engine migration.
