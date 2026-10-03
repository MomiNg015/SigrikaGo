# Full-system test contract

## 1. Scope / Trigger

Use for browser suite commands, database/asset fixture changes, proxy configuration and release validation. Reports distinguish real HTTP/SQLite/Socket flows, component fixtures and unverified target-host behavior.

## 2. Signatures

- `npm run test:e2e:all -- [--skip-build] [application site-entry home-onboarding team-match local-practice]`
- `preparePlaywrightTestDatabase({ label, port, runId, manageSignals = true })` returns `{ cleanup, databasePath, databaseUrl, trackProcess }`.
- `stopTestProcesses(children, { graceMs = 18000, forceMs = 5000 })` confirms child exit before resolving.
- `assertTestPortAvailable(port)` probes the dedicated API loopback port before preparing a database or spawning its service; existing listeners reject startup.
- `cleanupPlaywrightTestDatabase({ label, port, runId })` removes only that database and SQLite companions.
- `e2eClientConfig(env)` constructs strict loopback frontend and backend proxy targets.
- `e2eClientEnvironment(env)` sets `CI=true` only for the Vite fixture child, disabling stdin EOF shutdown without enabling Playwright retries or changing backend production configuration.

## 3. Contracts

- All suites run serially with one worker. Each has a fresh UUID and separate artifact output; failure status is aggregated after selected suites complete.
- Build main `dist` before site-entry. `--skip-build` is an explicit current-build assumption and must reject missing `dist/index.html`.
- Application defaults are frontend 5317/backend 3317; `/api`, `/uploads` and `/socket.io` must all use the isolated backend. Database and uploads use `.tmp/playwright`; test asset seeding verifies the run identity.
- Fixtures use separate Vite caches under `node_modules` and explicit dependency entries; exclude scratch/worktree folders from watches. Do not share the development optimizer.
- The stability-only `x-stability-scope` header separates automated journeys without changing production quotas. Remote AI is disabled in local fixtures; its live verification uses the separate configured verifier.
- Inventory-consumption journeys use a deterministic accepting character (Sigrika for rainbow candy). Denia's 35% refusal is a successful HTTP outcome with no consumption; keep its seeded-random unit coverage rather than making browser success depend on chance.
- API readiness precedes registration. When the fixture owns children, pass `manageSignals: false` (no automatic exit cleanup), track the API PID, stop services before DB cleanup, and cover startup failure/early exit. Shutdown waits up to 18 seconds, then force-kills and waits another 5 seconds; failure preserves the database. Cleanup, including runner cleanup by UUID, refuses a database whose recorded API PID is still alive.
- Static-only previews explicitly set `proxy: {}` rather than inheriting development proxy targets; practice covers all three proxy families with its isolated API.
- Stability accepts only `STABILITY_PORT` (default 4173), always prepares a fresh test database and overrides development origin/uploads/remote AI. Do not reuse inherited `DATABASE_URL`. Its real restart integration test explicitly starts `server/index.js` twice with its own disposable database.

## 4. Validation & Error Matrix

| Boundary | Required behavior |
| --- | --- |
| Custom frontend/backend ports | All three proxy families use the selected backend; conflict fails |
| Unknown suite or missing skipped build | Fail before executing tests |
| Business race/duplicate operation | Wallet, structured assets, history and receipt agree; no duplicate reward |
| Unauthorized account or spectator | Reject without mutation |
| Finished room resume | Handle `room:resume` result, not only active `room:update` |
| API not initialized / child exits | Not admitted as ready; stop and clean owned data |
| Browser engine or media load failure | Existing recovery behavior, real binary checks, no fabricated success |

## 5. Good / Base / Bad Cases

- Good: custom isolated ports, new UUID, one worker, real mail race and actual 100-move challenge.
- Base: a component-only fixture has mock APIs and is reported as such.
- Bad: use the development Vite proxy to 3001 while seeding an unrelated test DB; enlarge production rate limits to hide automation interference; treat a page header as proof its new GET completed.

## 6. Tests Required

- `scripts/e2eIsolation.test.js`: custom/default proxy families, strict port, optimizer cache and entries; a real Vite child remains reachable after its automation stdin closes.
- `scripts/stopTestProcesses.test.js`: a real child exits before cleanup, forced exit is bounded, and live-owner database cleanup is rejected.
- `tests/e2e/full-system*.spec.js`: permission boundaries, economic concurrency, all admin pages and explicit saves, workbook local import/save/published separation, all multiplayer modes, settlement replay/stats, spectator/ACK/reconnect, real forms and desktop/portrait windows, upload and media boundaries.
- `local-practice.spec.js`: development/production, engine failure/recovery, reload, 100 moves, challenge leaderboard, no normal replay/reward.
- Retain separate stability, migration, backup, capacity smoke, native/WASM parity and runtime dependency checks. Actual cloud Nginx/systemd/HTTPS/capacity remain target-host gates.

## 7. Wrong vs Correct

Wrong: `server.proxy["/api"] = "http://127.0.0.1:3001"` in an isolated E2E run.

Correct: derive HTTP/upload/WebSocket targets together from `E2E_SERVER_PORT` and keep strict frontend admission separate from user development services.
