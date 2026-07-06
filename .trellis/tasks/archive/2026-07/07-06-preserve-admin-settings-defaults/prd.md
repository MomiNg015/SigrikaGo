# Preserve Admin Settings Defaults

## Goal

Stop admin-managed public configuration from being lost when the ignored local SQLite database is replaced, rebuilt, or synchronized from stale defaults. Restore currently recoverable catalog credit data, update the committed admin default snapshot from the current local admin state, and add a repeatable export path so future admin saves can be made durable outside `prisma/dev.db`.

## What I Already Know

* `prisma/dev.db` is ignored by Git, so admin saves stored only in SQLite are not durable across database restore/rebuild events.
* `server/adminDefaultSnapshot.js` is the committed non-user admin bootstrap source, but it was generated on 2026-06-25 and is now stale.
* Current startup seeding through `server/adminDefaultSeed.js` preserves existing rows by using empty update payloads for `SiteSetting` and by skipping existing catalog rows.
* Character CV and shop illust fields were saved through audited admin updates on 2026-06-30, then later disappeared from the live SQLite rows without matching `character.update` or `shop-item.update` audit logs.
* Current `SiteSetting` rows include newer values than the committed snapshot, for example `homeSubtitle = SIGRIKAGO` and updated character loading lines.
* Existing project docs already describe `adminDefaultSnapshot` as the non-user admin default source, so this task should update that contract instead of inventing a second defaulting path.
* Project instructions require updating `docs/system-design.md` or the relevant `docs/system-design/` page and running `npm run docs:system-design`.

## Requirements

* Restore currently recoverable character CV metadata and shop illust metadata in the local SQLite database.
* Regenerate `server/adminDefaultSnapshot.js` from the current non-user admin configuration after recovery.
* Add a deterministic script/command to refresh `server/adminDefaultSnapshot.js` from `prisma/dev.db`.
* Keep startup seeding idempotent and non-destructive: fresh databases receive committed defaults; existing admin-edited rows are not overwritten on restart.
* Ensure future edits have an explicit durable workflow: after changing admin settings/catalog defaults locally, run the snapshot export command and commit the resulting snapshot/docs changes.
* Keep users, user-owned assets, purchases, feedback, reports, audit logs, analytics, mailbox history, game records, and live-room state excluded from the snapshot.

## Acceptance Criteria

* [x] Current local DB has recoverable CV/illust values restored.
* [x] `server/adminDefaultSnapshot.js` contains current site settings and restored catalog credits.
* [x] A fresh database would seed those values through the existing `seedAdminDefaultConfig()` path.
* [x] Existing rows remain preserved by restart/default seeding.
* [x] Tests cover the snapshot export shape and/or seed preservation behavior for settings and catalog credit fields.
* [x] System design docs explain the export workflow and preservation contract.
* [x] `npm run docs:system-design` runs successfully.

## Technical Approach

Add a Node script under `scripts/` that reads the same non-user admin tables already captured by `server/adminDefaultSnapshot.js`, serializes a stable `ADMIN_DEFAULT_CONFIG` object, and writes the snapshot file with a generated timestamp comment. Add an npm script for that command. Use the audit log recovery data for the missing local CV/illust values before exporting the snapshot.

## Decision (ADR-lite)

**Context**: Admin settings and catalog credits are runtime-edited in SQLite, but the local SQLite database is intentionally untracked. The existing committed snapshot is the right durable bootstrap source, but it has no repeatable refresh command and can drift.

**Decision**: Keep `server/adminDefaultSnapshot.js` as the single committed bootstrap source, add a deterministic export command to refresh it from local admin state, and keep seeding create-only/preserve-existing.

**Consequences**: Fresh/rebuilt databases get the latest committed admin defaults, while existing runtime edits remain safe from restart overwrites. Future admin changes still require running the export command before commit when those changes should become durable project defaults.

## Out of Scope

* Capturing user accounts, inventories, purchases, gameplay history, feedback, reports, analytics, audit logs, mailbox history, or live room state.
* Adding a new admin UI screen for snapshot export.
* Changing production startup to overwrite existing admin-edited rows.

## Technical Notes

* Related previous task: `.trellis/tasks/archive/2026-06/06-25-cloud-default-config-values/prd.md`.
* Relevant files:
  * `server/adminDefaultSnapshot.js`
  * `server/adminDefaultSeed.js`
  * `server/adminDefaultSeed.test.js`
  * `server/siteSettings.js`
  * `server/characters.js`
  * `server/shop.js`
  * `scripts/`
  * `package.json`
  * `docs/system-design.md`
  * `docs/system-design/04-data-model-and-domain.md`
