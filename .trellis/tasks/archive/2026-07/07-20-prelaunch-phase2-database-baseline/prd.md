# Prelaunch Phase 2 Database Migration Baseline

## Goal

Replace the incomplete pre-production Prisma migration history with one reproducible SQLite baseline so a fresh deployment can run `prisma migrate deploy` from an empty database, while an existing prelaunch database can adopt the baseline without losing data.

## What I already know

- Phase 2 starts from clean branch `codex/prelaunch-phase2`, based on completed Phase 0/1 commit chain at `6db87e60`.
- The main checkout has unrelated UI and asset work and must remain untouched.
- The repository has 35 incremental migrations but no initial schema migration or committed `migration_lock.toml`.
- The first migration immediately alters `GameRecord`, so `prisma migrate deploy` fails with P3018 on an empty database.
- The current local `prisma/dev.db` reports all 35 migrations as unapplied, confirming that the existing prelaunch database was created through `db push` and startup schema guards rather than Prisma Migrate history.
- Several current Prisma models were historically supplied by startup schema guards, so merely prepending the old 2026-05 schema may still leave migration/schema drift.
- Prisma's documented workflow for adopting Migrate on an existing data-bearing database is a full initial baseline plus `prisma migrate resolve --applied <baseline>` on the existing database.

## Requirements

- Preserve the Phase 0/1 authentication and dependency hardening unchanged.
- Replace the broken prelaunch migration chain with a full current-schema baseline ordered first.
- Commit `prisma/migrations/migration_lock.toml` for the SQLite provider.
- Provide an automated verification command that uses only disposable databases and covers:
  - empty database -> `prisma migrate deploy`;
  - legacy/current-schema database -> seed sentinel data -> mark baseline applied -> deploy -> sentinel data preserved;
  - both resulting schemas match `prisma/schema.prisma`.
- Document the one-time existing-database adoption procedure with backup, stopped-service, schema verification, `migrate resolve`, and deploy steps.
- Never reset, migrate, or mutate the user's real `prisma/dev.db` during implementation or verification.
- Keep production topology and public registration behavior unchanged.

## Acceptance Criteria

- [x] `prisma migrate deploy` succeeds against a brand-new temporary SQLite database.
- [x] The fresh migrated database has no schema diff from `prisma/schema.prisma`.
- [x] A disposable legacy database containing sentinel user data can adopt the baseline and deploy without data loss.
- [x] Re-running deploy after success is idempotent and reports no pending migrations.
- [x] The active migration history contains a current full baseline and `migration_lock.toml`.
- [x] Deployment documentation clearly separates fresh installation from one-time existing-database adoption.
- [x] Automated tests reject accidental use of the repository development database as a verification target.
- [x] Relevant lint/tests/build/system-design checks pass, with unrelated inherited failures reported separately.

## Definition of Done

- Migration baseline and disposable verification tooling are committed on the Phase 2 branch.
- Fresh and legacy-adoption verification paths both pass without touching real data.
- Database guidelines and system-design/deployment documentation reflect the new contract.
- The task is archived and the worktree is clean.

## Technical Approach

- Generate a single `0_init`-style baseline from the current Prisma schema rather than attempting to repair 35 incomplete historical deltas.
- Remove the broken migration files from the active migration history; their content remains recoverable from Git history.
- Use official Prisma CLI operations in the verifier: `db execute` applies `0_init` SQL to construct a disposable same-schema fixture without migration history, `migrate resolve --applied` adopts the baseline, `migrate deploy` applies/confirms history, and `migrate diff` checks schema parity.
- Create all verification databases under a unique disposable `.tmp` directory and clean them in `finally`.
- Existing real deployments follow a documented operator-controlled backup-and-baseline sequence; no application startup code automatically edits `_prisma_migrations`.

## Decision (ADR-lite)

**Context**: The project began with `prisma db push` and startup guards, then accumulated incremental migrations without an initial migration. The chain cannot create a database and does not fully represent the current schema.

**Decision**: Before public launch, squash the inactive/broken migration history into one full current-schema baseline. Fresh databases apply it; existing prelaunch databases first verify compatibility and mark it applied.

**Consequences**: Fresh deploys become deterministic and future migrations have a valid source of truth. Existing databases require one explicit, backed-up adoption step. Any external database that already has non-empty Prisma migration history must stop for manual review instead of applying this procedure blindly.

## Out of Scope

- Resetting or changing the user's real development database.
- PostgreSQL migration, multi-instance deployment, or SQLite-to-PostgreSQL conversion.
- Phase 3 stability fixtures, rate-limit isolation, capacity tuning, backups automation, monitoring, or rollout rehearsal.
- Product data changes, registration restrictions, UI work, or unrelated CSS debt.

## Research References

- [`research/prisma-baseline-strategy.md`](research/prisma-baseline-strategy.md) — official baselining workflow mapped to this repository.

## Technical Notes

- Primary paths: `prisma/schema.prisma`, `prisma/migrations/`, `scripts/verify-migration-baseline.mjs`, `package.json`, `docs/deployment.md`, `docs/system-design.md`, `docs/system-design/02-data-models.md`, and `.trellis/spec/backend/database-guidelines.md`.
- Historical pre-migration schema can be recovered from `c26a542b^`; active migration history remains recoverable from Git after replacement.
- The current main database was inspected read-only with `prisma migrate status`; all 35 old migrations are pending.

## Validation Evidence

- `npm run verify:migrations` passes fresh deploy, repeated deploy, existing-schema adoption, sentinel preservation, migration status, and schema diff checks.
- `npx vitest run server/schemaIntegrity.test.js scripts/migrationBaselineVerification.test.js`: 21 tests passed.
- Full unit suite excluding the inherited CSS debt gate: 286 files and 2024 tests passed.
- `npm run lint`, `npm run build`, `npm run check:production`, and `npm run docs:system-design` passed.
- `npm run check` reaches one inherited failure only: CSS `totalBytes` is 1,217,982 versus the recorded 1,215,814 ceiling. Phase 2 does not change `src/styles`.
