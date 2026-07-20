# Prisma Baseline Strategy Research

## Official guidance

- Prisma documents baselining for databases that existed before Prisma Migrate and contain data that must be preserved.
- The recommended workflow is to create one initial migration from empty to the current schema, then run `prisma migrate resolve --applied <baseline>` on an existing database so deploy skips recreating objects already present.
- Prisma treats the migration directory, including `migration_lock.toml`, as the source of truth and recommends committing the entire history.
- `prisma migrate deploy` applies pending migration SQL only; it does not use the Prisma schema to repair drift and does not reset the database.

Official references:

- https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining
- https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/migration-histories
- https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production

## Repository evidence

- `prisma/migrations/202605170001_add_game_record_result_metadata/migration.sql` begins with `ALTER TABLE "GameRecord"`, but no earlier migration creates `GameRecord`.
- There is no committed `prisma/migrations/migration_lock.toml`.
- `prisma migrate status` against the existing local development database reports all 35 migrations as pending.
- The current schema contains models historically introduced through both migration SQL and idempotent startup guards, making a reconstructed partial historical base more complex and less reliable than a current full baseline.

## Considered approaches

### A. Prepend the historical pre-2026-05 schema

- Preserves every incremental migration in active history.
- Still requires proving that later migrations plus startup-only guards reach the current schema.
- Existing databases with no migration records would need all historical migrations marked applied individually.
- Rejected because it preserves an unnecessarily complex, incomplete prelaunch history.

### B. Replace the inactive history with one current full baseline

- Fresh databases deterministically reach the current schema in one migration.
- Existing databases need one explicit `migrate resolve --applied` adoption step after backup and schema verification.
- Old SQL remains recoverable in Git history.
- Recommended because the project is still prelaunch and the inspected existing database has no applied Prisma migrations.

### C. Keep using `prisma db push` in production

- Avoids migration-history repair immediately.
- Provides no reviewed, versioned production migration sequence and weakens rollback/auditability.
- Rejected for deployment readiness.

## Safety boundary

- Verification must run only against unique disposable databases.
- The repository development database is input evidence only and must never be reset or migrated by automated tests.
- Existing databases with any non-baseline rows in `_prisma_migrations` require manual review; do not automatically rewrite their history.
