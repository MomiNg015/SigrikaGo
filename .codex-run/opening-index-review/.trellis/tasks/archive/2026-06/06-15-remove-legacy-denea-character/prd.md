# Remove legacy Denea character data

## Goal

Remove the old Denea/legacy Denia character identity so the project has one durable canonical character slug: `denia`. The cleanup may delete game records that reference the legacy identity, but must not delete or degrade the current correct `denia` character, assets, skill behavior, item effects, voice/music bindings, or UI display.

## What I already know

* The user's target is the old wrong character identity named "denea" in the request, with the correct current identity being `denia`.
* Repository search found no exact `denea` slug, but found the historical alias `danea` and multiple compatibility paths that map `danea` to `denia`.
* `src/shared/characterAliases.js` currently maps `danea -> denia`.
* `src/shared/characterFallback.js` still defines the old fallback character under `danea`.
* `prisma/schema.prisma` still defaults `User.ownedCharacters` to `sigrika,danea,aemeath`, which can reseed legacy ownership for new users.
* Public character listing, frontend merge logic, profile stats, achievements, leaderboard, user assets, and room selection already canonicalize legacy character ids in several places.
* `GameRecord.blackCharacter` and `GameRecord.whiteCharacter` store character slug snapshots, so related legacy match records can be identified by exact old slugs.
* The SigrikaGo project instruction requires system design docs to be updated when runtime behavior, data model, or architecture changes, then `npm run docs:system-design` must regenerate `docs/system-design.html`.

## Assumptions

* The actual legacy slug in the codebase is `danea`; `denea` should also be treated as a defensive old spelling if it exists in user data.
* Existing correct `denia` rows, assets, game records, shop/gacha prizes, music, item effects, and achievements must remain.
* Users who only have legacy `danea` ownership should keep canonical `denia` ownership where the cleanup updates user asset state, rather than losing the correct character.

## Requirements

* Replace remaining built-in defaults and fallback definitions so canonical `denia` is the only built-in Denia character slug.
* Remove legacy `danea`/`denea` compatibility paths that can make the old character reappear in public character lists or frontend merges.
* Add an idempotent server-side data cleanup that removes old `Character` rows for legacy slugs and related `CharacterSkill` rows through cascade behavior.
* Normalize user-facing ownership/selection fields away from `danea`/`denea` to `denia` where preserving correct access is appropriate.
* Delete game records whose `blackCharacter` or `whiteCharacter` exactly references legacy `danea` or `denea`, as permitted by the user.
* Remove or update tests that assert legacy alias behavior, replacing them with tests that assert legacy data is cleaned and does not surface.
* Update `docs/system-design.md` or the relevant `docs/system-design/` split docs, then run `npm run docs:system-design`.

## Decision (ADR-lite)

**Context**: The project currently carries an old Denia identity under legacy slug `danea`, while the user identified the old version as `denea` and the correct current slug as `denia`. The old slug can still appear through defaults, fallbacks, aliases, and historic match records.

**Decision**: Use hard cleanup while preserving correct Denia access. Treat both `danea` and `denea` as legacy slugs. Delete legacy character rows and legacy match records, normalize user-owned and selected character data to `denia`, and remove compatibility code that can surface the old identity.

**Consequences**: Users do not lose access to the correct `denia` when their stored ownership used the legacy slug, but replay/history entries that referenced the old slug are intentionally removed. Canonical `denia` assets and behavior remain untouched.

## Acceptance Criteria

* [ ] Searching runtime source for `danea`/`denea` finds no active compatibility path that can surface an old Denia character.
* [ ] New users default to owning `denia`, not `danea`.
* [ ] Startup cleanup deletes database `Character` rows with slug `danea` or `denea`.
* [ ] Startup cleanup deletes `GameRecord` rows referencing `danea` or `denea` in either color.
* [ ] Startup cleanup is idempotent and safe when no legacy rows exist.
* [ ] Correct `denia` remains available in character lists, selection, shop/gacha ownership, skills, candy effects, music/voice, and replays that already reference `denia`.
* [ ] Focused backend/shared tests pass for character cleanup, user asset parsing, public user payloads, and records affected by the changed behavior.
* [ ] System design HTML is regenerated.

## Out of Scope

* Deleting current canonical `denia` assets or behavior.
* Rewriting unrelated character art filenames such as `Danea_centered.webp` unless code behavior requires it.
* Manual production database operations outside the app's idempotent cleanup path.
* Broad replay/statistics redesign beyond deleting legacy records explicitly allowed for this cleanup.

## Technical Notes

* Likely impacted files include `src/shared/characterAliases.js`, `src/shared/characterFallback.js`, `src/shared/characters.js`, `prisma/schema.prisma`, `server/characters.js`, startup wiring in `server/serverStartup.js`, and tests under `server/` and `src/shared/`.
* `CharacterSkill` cascades on `Character` deletion in Prisma, so deleting old `Character` rows should remove their skill rows.
* `GameRecord` has no relation to `Character`; legacy record deletion must target `blackCharacter` and `whiteCharacter` directly.
* Existing docs already mention historical `danea` compatibility; those facts need to be replaced with the new cleanup behavior.
