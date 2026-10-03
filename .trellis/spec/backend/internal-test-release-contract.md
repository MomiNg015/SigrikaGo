# Internal Test Release Contract

## 1. Scope / Trigger

Read before changing settlement, account occupancy, startup recovery, password reset, clock accounting, readiness or production release recovery. The supported topology is one Node process and one SQLite database.

## 2. Signatures (command/API/DB)

- `saveGameRecord({ prisma, room }): Promise<void>`; `GameRecord.settlementId String? @unique`, `settlementState String @default("")`; incremental migration `20261002040000_game_settlement_receipt`.
- `createRoomCreationLifecycle(...).isUserBusy(userId)` covers playing, preload, opening and finished-but-unsaved rooms. Synchronous final assertions precede every room registration.
- `match:join({ mode, lineup }, ack)`: disconnected clients emit nothing; callers wait for ACK or `match:found`, with an 8-second deadline and cancellation cleanup.
- Shared `validateLoginPassword`, `validateNewPassword` in `src/shared/passwordValidation.js`; `resetUserPassword` atomically writes hash, revokes `LoginSession` rows and writes the audit event. `disconnectUser(userId, message)` follows commit.
- `syncGameClock(room, io)` charges whole seconds from elapsed milliseconds and per-player `clockRemainderMs`. `internalKomiToGtpKomi(komi)` converts internal 子 to 目 for SGF/GTP.
- `GET /health/ready`: 200 `ready`; 503 `draining`, `storage-unavailable` or `persistence-unavailable`. `createDatabaseHealth` caches a bounded `SELECT 1` probe.
- `sudo deploy/update-production.sh`; recovery: `sudo <candidate-release>/deploy/restore-production.sh PROJECT_DIR PREVIOUS_RELEASE PRE_MIGRATION_DB`.

## 3. Contracts (request/response/env)

- Generate a settlement UUID on room creation and persist it in the room snapshot. Legacy rooms derive a deterministic ID from code, creation time and participant IDs. The settlement adapter uses a fresh Proxy target with bound original methods; never assign delegate overrides onto an object inheriting from the Prisma Client Proxy. Calculate rewards on cloned state, and persist the unique record, reward/stat/ledger/item updates in one transaction. Publish user changes, result rewards and `recordSaved` only after commit. Recovery replays the committed receipt without a second reward write. Capture challenge retains its existing unique receipt; invalid/practice exclusions remain unchanged.
- Expired valid finished snapshots with no saved flag must retry settlement before deletion, including ordinary, team and special rooms. A pending settlement keeps participants busy across all creation paths.
- Recheck account occupancy after asynchronous user/blacklist/team reads, for both requester and candidates; the final synchronous creation guard is mandatory even when a caller checked earlier.
- Startup/refresh 503, timeout or network failure retains session and room state, shows a retry notice, and never falls through to authentication logout. Confirmed 401/403 clears session. A failed non-auth music catalog uses built-in tracks. HTTP status survives non-JSON error bodies. Socket loss is visible on desktop and portrait mobile.
- New/reset passwords: 8–64 Unicode code points, at most 72 UTF-8 bytes, no control characters. Legacy login accepts 6 characters. Admin reset revokes every session in the same transaction; online sockets receive `account:logged-out` and disconnect after commit.
- Synchronize clocks before turn mutation or entering paused phases. Resume/reject/deadline/skill boundaries reset `lastTick` so no suspended milliseconds are charged. Main-time fractions remain attached to the player, including persisted snapshots; a valid move resetting byo-yomi grants a complete fresh period and clears the previous period fraction.
- Database probe timeout 2 seconds, interval 5 seconds, cached result stale after 15 seconds; only one probe may remain in flight. Repeated room/result persistence failure becomes unhealthy after at least 3 failures over 30 seconds; success clears its key. Readiness failure blocks new admission while allowing existing recovery paths.
- Production checks and update/restore require explicit `NODE_ENV=production` and the declared absolute database path. Build locked dependencies and frontend in a new `.releases/` directory while the old complete release continues serving. Save the previous code/dependencies/frontend and a second verified database backup after service drain, immediately before migration. Activate via systemd drop-in only after migration/snapshot reconciliation. Fast-forward the operator checkout to the exact candidate only after readiness succeeds.
- Before migration begins, a failure may restart the untouched old service. After migration begins, restore old frontend/drop-in but keep the service stopped; print explicit complete-release/database recovery. Recovery validates the selected backup first, preserves failed candidate data, restores the matched complete release and drained DB, then requires bounded readiness. Any recovery error explicitly stops the service and preserves the original failure status, including a failed start command. Never auto-restart old code against possibly migrated data.

## 4. Validation & Error Matrix

| Trigger | Required result |
| --- | --- |
| Transaction failure | No visible reward/saved flag; retry permitted |
| Duplicate restored room or commit before stale snapshot write | One record and one ledger award; replay receipt |
| Busy account appears during async matching | Reject `active_room_exists`; no second room |
| Refresh or `/api/me` HTML 503 | Retain session, show retry, recover to home |
| ACK failure, missing ACK, disconnect, cancel | Exit pending match UI and release timer/listeners |
| Admin reset with valid/invalid password | Valid: hash+revoke+audit atomic; invalid: no transaction |
| Callback jitter or pause resumes between callbacks | Preserve fractions, exclude paused interval |
| Hung DB or repeated write errors | Bounded health response, 503 and blocked admission; recover on success |
| Migration/start/readiness failure | Stop service, retain complete old release and drained DB; explicit recovery |

## 5. Good / Base / Bad Cases

- Good: two restored room objects race and only one transaction awards rewards; both recover the same receipt.
- Base: a saved finished room closes normally; practice and invalid games create no ordinary progression.
- Bad: mark the original room saved before `await prisma.$transaction`, or restart after migration failure using whichever dependencies now happen to occupy the root checkout.

## 6. Tests Required

- `server/roomSettlement.integration.test.js`: real migrated disposable SQLite, race, stale snapshot, failed transaction/retry, old access/refresh session rejection after reset.
- Match/creation/restore lifecycle tests: every mode, post-await races, expired unsaved results and finished saved release.
- `startupNetwork.dom.test.jsx`, `matchDelivery.test.js`, stability `startup-network.spec.js`: auth and preload 503, music fallback, ACK/timeout/cancel/connection recovery and viewport fit.
- `releaseClock.test.js`, deadline tests: subsecond jitter, turn fractions, resume boundaries and matching SGF/GTP komi.
- `databaseHealth.test.js`: bounded hung probe, no overlapping probes, stale/failure/recovery and sustained result-write signal.
- `deploymentRecovery.test.js`: execute the actual trap with mocked host commands; old frontend/full-release drop-in, pre-migration restart, post-migration no restart, and explicit stop preserving the error code after a recovery start failure. Shell syntax and static deployment ordering tests supplement it.
- Full `npm run check`, isolated migration/backup verification, stability, capacity smoke and practice WASM parity. Actual cloud systemd/Nginx/disk/capacity still require target-host verification.

## Full-system browser isolation

- `npm run test:e2e:all` runs application/site-entry/home-onboarding/team-match/local-practice serially with one worker and separate artifacts. Fixtures and real backend flows must be identified separately in reports.
- Application ports default to 5317/3317. All API, upload and WebSocket proxies must use the isolated backend; never inherit the development Vite proxy to 3001. Tests seed only a runId-checked disposable database.
- Separate Vite cache/entry scans from the development service. Upload roots and databases stay in this run's `.tmp/playwright` paths; fixture remote AI is disabled. API readiness precedes browser registration.
- Namespace automatic journeys through the existing stability-only limiter key; do not weaken production limits to make tests pass.
- Real flows validate rights, concurrent economic writes, backend navigation, workbook save/publish separation, multi-mode settlement/replay, reconnect and action retry, binary resources and upload boundaries. Capture challenge must finish 100 real browser-engine moves and retain its no ordinary reward/replay policy.
- Signal ownership belongs to the fixture when it must stop child services before database cleanup. Windows strong termination also requires cleanup by the exact runId, never a broad deletion of temporary databases.

## 7. Wrong vs Correct

Wrong: catch any startup exception and clear token; set `recordSaved = true` on the live room before committing; recover only `dist/` and restart against unknown DB state.

Correct: preserve authentication through transient errors; settle cloned state behind a unique durable receipt; restore a matched complete old release plus a verified drained database only through the explicit operator recovery path.
