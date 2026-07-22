# Prelaunch Phase 0 and Phase 1 Hardening

## Goal

Freeze a reproducible prelaunch baseline, remove the username-based administrator elevation risk, and remediate the currently reported dependency vulnerabilities without changing the product's open-registration behavior.

## What I already know

- The requested scope is Phase 0 plus Phase 1 from the prelaunch plan.
- Open registration must remain available. Invite codes, registration shutdown, allowlists, and admin-precreated user accounts are explicitly out of scope.
- The original checkout is on `codex/misc` and contains unrelated in-progress work, so release hardening must not absorb or overwrite those edits.
- Phase 0 is isolated in worktree `C:\\codex\\SigrikaGo-prelaunch-phase0-phase1` on branch `codex/prelaunch-phase0-phase1`, based on commit `38f8c5d967ed7cf5559fbe817c148c6d8157f69a`.
- Normal registration currently calls `syncConfiguredAdmin()`, so a newly registered username listed in `ADMIN_USERNAMES` can be promoted to administrator.
- `npm audit --omit=dev` currently reports 13 vulnerabilities: 1 low, 6 moderate, 3 high, and 3 critical. Publicly relevant runtime findings include Multer and the Socket.IO `ws` chain; build/development findings include Vite, Vitest, Babel, and `concurrently`/`shell-quote`.
- The work changes authentication/deployment behavior, so `docs/system-design.md`, the relevant split system-design documents, deployment documentation, and generated `docs/system-design.html` must stay synchronized.

## Assumptions (temporary)

- Administrator creation will use a local-only CLI command backed by the existing Prisma database.
- Normal registration, login, and refresh endpoints will preserve their current public behavior except that registration/login will no longer promote accounts by configured username.
- Existing administrator roles stored in the database will remain valid.
- Dependency remediation will use controlled version upgrades and regression tests rather than `npm audit fix --force`.

## Open Questions

- None.

## Requirements

- Establish a named prelaunch hardening branch from an explicit commit while preserving unrelated WIP.
- Remove administrator elevation from normal registration, login, refresh, and server-startup flows.
- Provide an idempotent, local CLI command that promotes an existing user to administrator; it must not create a normal player account on behalf of the operator.
- Preserve open registration with no invite, allowlist, or precreation gate.
- Preserve existing database-stored administrator roles across login and restart.
- Add regression tests proving configured usernames cannot self-promote through registration or login.
- Upgrade vulnerable dependencies in controlled groups and keep package metadata/lockfile consistent.
- Verify upload, HTTP, Socket.IO, authentication, build, unit, E2E, and production configuration behavior.
- Synchronize deployment and system-design documentation.

## Acceptance Criteria

- [x] Work is isolated from pre-existing unrelated WIP on a dedicated branch and worktree.
- [x] Registering any username produces a player unless its database role is changed explicitly.
- [x] Login, refresh, and server startup do not mutate the stored role.
- [x] Existing administrators remain administrators.
- [x] A documented local CLI command promotes an existing user idempotently and fails safely for unknown users.
- [x] Open registration remains enabled without invitation or allowlist checks.
- [x] Publicly reachable runtime dependency high/critical advisories are removed.
- [x] Remaining advisories, if any, have no high/critical severity and are explicitly documented with reachability and upgrade rationale.
- [x] Targeted authentication/admin, upload, Socket.IO, and dependency tests pass.
- [x] E2E passes, and full-check/stability deviations are limited to recorded inherited failures outside Phase 0/1 scope with no Phase 1 regression.
- [x] System-design markdown and generated HTML are synchronized.

## Definition of Done

- Tests added or updated for administrator security and dependency compatibility.
- Lint, scoped unit tests, production build/config validation, and E2E are green; inherited full-suite/stability deviations are recorded without broadening this task.
- Documentation reflects the new administrator bootstrap workflow and dependency boundary.
- Changes are committed in scoped, reviewable commits on the hardening branch.

## Out of Scope

- Invite codes, registration shutdown, allowlists, or admin-precreated player accounts.
- Database baseline migration repair from Phase 2.
- Capacity tuning, backup automation, monitoring, and rollout operations from later phases.
- Legal and compliance work.
- CSS or UI refactors unrelated to dependency compatibility.

## Technical Approach

- Keep role truth in the database and remove `ADMIN_USERNAMES` from request-time authentication decisions.
- Add a dedicated Node CLI under `scripts/` that resolves an existing username, updates its role transactionally/idempotently, writes a clear operator result, and disconnects Prisma cleanly.
- Remove the live `ADMIN_USERNAMES` configuration and all request-time/startup consumers; historical design records may retain it as history.
- Upgrade direct dependencies first, inspect transitive resolution, and add package overrides only when an upstream direct upgrade cannot yet resolve a runtime advisory safely.
- Run focused tests after each dependency group before the full repository gate.

## Decision (ADR-lite)

**Context**: Username-based automatic promotion lets a public registrant claim a configured administrator name on a fresh deployment.

**Decision**: Administrator elevation moves out of normal HTTP authentication flows into a local operator command. Public registration remains unchanged otherwise.

**Consequences**: Deployment gains one explicit administrator bootstrap step. Existing database roles remain authoritative, and knowing a configured username no longer grants privilege.

## Technical Notes

- Primary files: `server/adminConfig.js`, `server/authRoutes.js`, `server/serverStartup.js`, `scripts/`, `package.json`, `package-lock.json`, `docs/deployment.md`, `docs/system-design.md`, and `docs/system-design/03-backend-realtime-api.md`.
- Existing production checks live in `server/security.js` and `scripts/check-production-config.mjs`.
- Existing upload middleware is created in `server/index.js`; Socket.IO compatibility must be verified after dependency upgrades.

## Verification Results

- `npm run lint`: passed.
- Targeted administrator/authentication/upload/Socket.IO/ExcelJS tests: 6 files, 25 tests passed.
- Full unit suite excluding the unchanged inherited CSS debt baseline test: 285 files, 2021 tests passed.
- `npm run build`: passed with the existing large ExcelJS/Pixi chunk warnings.
- `npm run check:production`: passed with a production-strength example secret and HTTPS origin.
- `npm run test:e2e` on isolated ports 5183/3183: 3/3 passed.
- `npm run docs:system-design` plus `docs/systemDesignHtml.test.js`: passed.
- `npm audit --omit=dev`: 0 high, 0 critical, 2 moderate; both records trace to the same ExcelJS 4.4.0 -> uuid 8.3.2 advisory documented in deployment/system-design docs.
- `npm run check`: blocked only by `src/styles/cssLayerInventory.test.js` (`totalBytes` 1217982 > frozen baseline 1215814). `git diff HEAD -- src/styles` is empty, so this is inherited from the frozen base and remains outside Phase 0/1.
- `npm run verify:stability`: 11/14 passed in the full run. Both Aemeath cases retain the known 403 ownership-fixture failure; one mobile Sigrika case hit cumulative HTTP 429, then passed 1/1 on a fresh isolated rerun.
