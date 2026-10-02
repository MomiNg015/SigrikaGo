# Cloud Deployment Admin Defaults

## Goal

Make a fresh cloud deployment start with the current non-user admin-managed configuration, so the operator does not need to manually re-enter the current site, catalog, character, shop, gacha, achievement, music, or recruitment settings after deploying.

## What I Already Know

* The user's clarified goal is broader than text-field fallback: in the admin console, everything except user-related data should use the current project state as the deployment default.
* The initial examples were character skill description, character detail description, and skill cast system message, but those are examples of admin-managed configuration rather than the full scope.
* `src/shared/adminDrafts.js` owns the admin UI draft defaults for new character records and serializes drafts into admin API payloads.
* `server/characters.js` validates admin character payloads. It currently requires `skill.name`, `skill.description`, and `systemMessage`.
* `src/shared/skillMessages.js` already exports `DEFAULT_SKILL_SYSTEM_MESSAGE`, and the backend/fallback models use it when a skill system message is absent.
* `prisma/schema.prisma` has database defaults for several empty string fields and for `CharacterSkill.systemMessage`, but `CharacterSkill.name` and `CharacterSkill.description` are still required columns with no DB-level default.
* `src/shared/characterFallback.js` contains builtin character defaults, and `src/shared/characters.js` falls back to builtin character descriptions when API character descriptions are blank.
* Startup initialization already seeds or ensures several admin-managed domains: characters, shop items, site settings, achievements, recruitment schema/config, and music track settings schema.
* `server/adminRoutes.js` exposes non-user admin areas for site settings, characters, decorations, shop items, music tracks, achievements/reward assets, gacha pools, recruitment config, mailbox batches, feedback, reports, audit logs, and analytics.
* Feedback, reports, audit logs, analytics, mailbox batches, live user-owned data, and game records are operational/user history and should not be treated as deploy defaults unless explicitly requested.
* `prisma/dev.db` exists locally and can be used as a source for the current admin-configured state if the implementation needs to generate a seed snapshot.
* The user confirmed that "current state" means the current local backend/admin configuration in `prisma/dev.db`, not only the code-defined builtin defaults.
* Project instructions require updating `docs/system-design.md` for every update and running `npm run docs:system-design`.

## Assumptions

* This task should improve first-run/cloud deployment ergonomics by moving current non-user admin state from local `prisma/dev.db` into code-managed defaults or a seed snapshot.
* Existing deployed/admin-edited data should not be overwritten on server restart unless a row/key is missing or still known to be an old code-managed default.
* Runtime history and user-specific state should remain out of scope.

## Requirements

* Fresh deployments should seed the current non-user admin configuration for:
  * Site settings, including public copy, loading text, skill effect toggle, and rating rules.
  * Characters and skills, including current descriptions, acquisition text, skill descriptions, system messages, costs, params, enabled states, sort order, and derived skill params.
  * Decorations.
  * Shop items.
  * Gacha pools and prizes.
  * Achievement definitions and reward assets.
  * Music track display names.
  * Recruitment config.
* Seeding must be idempotent: it should create missing defaults and preserve existing admin-edited rows.
* If an existing seed path already covers a domain, update that seed/default source instead of adding a second competing source.
* Runtime/user-related admin areas must remain excluded: users, user reports, feedback messages, audit logs, analytics, mailbox sent history, game records, live rooms, purchases, and player inventories.
* The source snapshot should be generated from local `prisma/dev.db` and committed as deterministic code/data so a cloud server does not need access to the developer's local database.
* System design docs must mention the shared defaulting contract, and `docs/system-design.html` must be regenerated.

## Acceptance Criteria

* [x] A fresh empty database initializes with the intended current non-user admin configuration.
* [x] Existing admin-edited rows are not overwritten by restart/default seeding.
* [x] Tests cover idempotent seed behavior for each modified seed/default domain.
* [x] `docs/system-design.md` or a corresponding `docs/system-design/` page is updated.
* [x] `npm run docs:system-design` is run successfully.

## Out Of Scope

* User management defaults or user data migration.
* Copying feedback, reports, audit logs, analytics, game records, mailbox history, live room state, purchases, or player inventories into deployment defaults.
* Adding new admin UI screens unless needed for verification.
* Making required runtime identity fields optional.

## Technical Approach

Recommended approach: export the current non-user admin configuration from `prisma/dev.db` into a deterministic seed snapshot, then wire that snapshot into the existing startup initialization as an idempotent "create missing / preserve existing admin edits" step. Prefer reusing existing domain seed functions where possible, but keep the source of truth explicit so future deploys reproduce the same admin state without copying the local database.

## Technical Notes

* Likely implementation files:
  * `server/serverStartup.js`
  * `server/characters.js`
  * `src/shared/characterFallback.js`
  * `src/shared/siteSettings.js`
  * `src/shared/recruitment.js`
  * `server/shop.js`
  * `server/achievements.js`
  * `server/musicTracks.js`
  * `server/adminGachaManagement.js` / `server/gacha.js` if gacha defaults need seeding
  * `server/serverStartup.test.js`
  * `server/characters.test.js`
  * `docs/system-design.md` or `docs/system-design/04-data-model-and-domain.md`
* Existing related tests:
  * `server/serverStartup.test.js`
  * `server/characters.test.js`
  * `server/shop.test.js`
  * `server/achievements.test.js`
  * `server/siteSettings.test.js`
  * `server/adminGachaManagement.test.js`
* Candidate verification:
  * `npm test -- server/serverStartup.test.js server/characters.test.js server/shop.test.js server/achievements.test.js server/siteSettings.test.js server/adminGachaManagement.test.js`
  * `npm run docs:system-design`
