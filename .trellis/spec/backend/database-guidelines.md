# Database Guidelines

> Database patterns and conventions for this project.

---

## Overview

<!--
Document your project's database conventions here.

Questions to answer:
- What ORM/query library do you use?
- How are migrations managed?
- What are the naming conventions for tables/columns?
- How do you handle transactions?
-->

(To be filled by the team)

---

## Query Patterns

<!-- How should queries be written? Batch operations? -->

(To be filled by the team)

---

## Migrations

<!-- How to create and run migrations -->

### Scenario: Game Mode Persistence

#### 1. Scope / Trigger
- Trigger: any feature that adds or changes a playable game mode, ranking bucket, replay filter, matchmaking queue, or room result contract.
- This is a cross-layer contract because the value is written by matchmaking/duel room creation, stored on game records, exposed through API filters, and rendered by frontend tabs.

#### 2. Signatures
- `GameRecord.mode String @default("spark")`
- `UserModeStats { userId, mode, rating, rank, recentResults, wins, losses, draws }` with unique `(userId, mode)`
- `ensureGameModeSchema(prisma)` must run during server startup before auth/profile routes can read users with `modeStats`.
- Runtime mode ids must come from `src/shared/gameModes.js`, not duplicated string lists.

#### 3. Contracts
- Accepted mode ids: `spark`, `standard`. Unknown or missing ids normalize to `spark`.
- `spark` mirrors legacy `User.rating`, `User.wins`, and `User.losses` for backward compatibility.
- `spark` also mirrors legacy `User.rank` after decisive results, but mode rank source of truth is `UserModeStats.rank`.
- `standard` keeps rating, rank, recent result window, and record data in `UserModeStats`; do not write standard wins/losses/rating/rank into legacy `User` fields.
- Rank is independent from rating. New users/new mode rows default to `3段`; decisive mode results append `win`/`loss` to `recentResults` from old to new, promote at 7 wins, demote at 8 losses, cap at `9段`/`18级`, and clear `recentResults` after a promotion or demotion trigger.
- `GameRecord.mode` must be written for every saved room result, including draw records.
- Older SQLite development databases must be upgraded in place at startup: create `UserModeStats`, add `GameRecord.mode`, add `UserModeStats.rank`/`recentResults`, and backfill one `spark` row per existing user before login/profile reads include `modeStats`.

#### 4. Validation & Error Matrix
- Missing mode in old data -> treat as `spark`.
- Missing `UserModeStats` table or `GameRecord.mode` column in a dev SQLite database -> `ensureGameModeSchema` creates/backfills them at startup; login must not fail before a manual migration command runs.
- Invalid mode from socket/API input -> normalize to `spark`.
- Result is invalid before the record threshold -> no `GameRecord`, no `UserModeStats`, no reward writes.
- Result is a draw after the threshold -> create the record and increment mode `draws`, but do not apply rating, coin, rank, or recent-result updates.

#### 5. Good/Base/Bad Cases
- Good: `joinMatchmaking({ mode: "standard" })` only pairs with standard queued players and saves records as `standard`.
- Base: old records without `mode` still appear in spark-only history and leaderboard views.
- Bad: leaderboard filters by mode but room persistence saves all records as `spark`.

#### 6. Tests Required
- Shared mode config normalization and ordering.
- Matchmaking queue isolation by mode.
- Game record persistence includes `mode`.
- Startup schema guard creates missing mode tables/columns and backfills legacy spark data.
- Mode-specific leaderboard/profile/history filters.
- Draw persistence increments `UserModeStats.draws` without reward writes.
- Rank progression tests cover 7-win promotion, 8-loss demotion, cap/floor behavior, and clearing `recentResults` after a trigger.

#### 7. Wrong vs Correct

Wrong:

```js
prisma.gameRecord.create({ data: { roomCode, blackUserId, whiteUserId } });
```

Correct:

```js
const mode = normalizeGameModeId(room.mode ?? room.game.mode);
prisma.gameRecord.create({ data: { roomCode, blackUserId, whiteUserId, mode } });
```

---

### Scenario: Gacha Featured Prize Persistence

#### 1. Scope / Trigger
- Trigger: any change to gacha pool schema, admin gacha save flow, player/admin gacha payload projection, or startup schema guards.
- Featured prizes are display metadata stored on `GachaPool`; they must not affect draw probability or reward settlement.

#### 2. Signatures
- `GachaPool.featuredPrizeIds String?`: JSON string array of `GachaPrize.id` values.
- `GachaPool.featuredPrizeId String?`: legacy first-featured compatibility mirror.
- `ensureGachaSchema(prisma)` must create `featuredPrizeIds` on fresh SQLite databases and add it to older dev databases with `ALTER TABLE "GachaPool" ADD COLUMN "featuredPrizeIds" TEXT`.

#### 3. Contracts
- Create/update gacha pool mutations recreate prize rows, then persist featured ids after the new prize ids exist.
- `featuredPrizeIds` stores every selected featured prize id in admin selection order.
- `featuredPrizeId` mirrors `featuredPrizeIds[0] ?? null` for older readers.
- Empty featured selection stores both `featuredPrizeIds: null` and `featuredPrizeId: null`.
- Payload projection may read `featuredPrizeIds`; if missing, it may fall back to legacy `featuredPrizeId`.

#### 4. Validation & Error Matrix
- `featuredPrizeIndexes: []` -> valid, store no featured ids.
- Any featured index outside the submitted prize array -> reject before writing.
- Stored JSON parse failure -> ignore the malformed list or fall back to comma splitting; do not invent `prizes[0]`.
- Missing `featuredPrizeIds` column in an older dev database -> startup guard adds it before gacha routes use Prisma models.

#### 5. Good/Base/Bad Cases
- Good: two selected admin prize rows persist as `featuredPrizeIds: "[\"prize-a\",\"prize-b\"]"` and `featuredPrizeId: "prize-a"`.
- Base: older pools with only `featuredPrizeId` still expose a one-item `featuredPrizes` array.
- Bad: storing only the first selected featured prize and dropping the rest.
- Bad: deriving featured prizes from array position after persistence, because prize ids change when admin updates recreate prize rows.

#### 6. Tests Required
- Admin management tests assert multiple featured indexes validate.
- Gacha payload tests assert `featuredPrizes` returns all stored featured ids and keeps `featuredPrize` as the first item.
- Schema integrity tests assert Prisma schema and migration SQL include `featuredPrizeIds`.
- Startup schema tests assert `ensureGachaSchema()` adds `featuredPrizeIds` to old `GachaPool` tables.

#### 7. Wrong vs Correct

Wrong:

```js
await tx.gachaPool.update({ data: { featuredPrizeId: createdPrizes[input.featuredPrizeIndex]?.id ?? null } });
```

Correct:

```js
const ids = featuredPrizeIndexes.map((index) => createdPrizes[index]?.id).filter(Boolean);
await tx.gachaPool.update({
  data: {
    featuredPrizeId: ids[0] ?? null,
    featuredPrizeIds: ids.length ? JSON.stringify(ids) : null
  }
});
```

---

### Scenario: Music Track Display Name Settings

#### 1. Scope / Trigger
- Trigger: any change to music track display names, admin music management, music prize payloads, shop music labels, or startup schema guards for music settings.
- This is a cross-layer contract because static audio configuration, database overrides, public/admin APIs, audit logging, and frontend music selectors all share the same track id namespace.

#### 2. Signatures
- `MusicTrackSetting { id, displayName, createdAt, updatedAt }`
- `id` must match an existing static `MUSIC_TRACKS` key from `src/shared/musicLibrary.js`.
- `ensureMusicTrackSettingsSchema(prisma)` must run during server startup before public or admin music track routes are used.
- Music list helpers should return the static track payload plus `defaultName` and the effective display `name`.

#### 3. Contracts
- `MUSIC_TRACKS` remains the source of truth for playable track ids, type, character binding, unlock flags, purchase flags, playback mode, and audio paths.
- `MusicTrackSetting` stores only display-name overrides. It must not create tracks or change audio behavior.
- Blank, missing, or whitespace-only `displayName` values fall back to the static `track.name`.
- Public `GET /api/music-tracks` is available to authenticated players so gameplay, shop, and gacha displays share the same effective names.
- Admin `GET /api/admin/music-tracks` and `PATCH /api/admin/music-tracks/:id` must use the same merge helper as the public route.
- Admin updates must write a `music-track.update` audit entry.

#### 4. Validation & Error Matrix
- Unknown track id -> reject before writing a database row.
- Missing `MusicTrackSetting` table in an older SQLite development database -> startup guard creates it in place.
- Missing Prisma delegate in a narrow unit test mock -> list helpers may fall back to static names, but update helpers still require the delegate.
- Overlong display names -> normalize to the accepted display-name length before persistence.
- Empty display name -> valid, stores an empty override and renders the static default name.

#### 5. Good/Base/Bad Cases
- Good: editing `main-home` to `Lobby Theme` changes the shown name while keeping the original `src`, `loop`, and `type` fields.
- Base: no row exists for a track, so API payload returns `name: track.name` and `defaultName: track.name`.
- Bad: admin PATCH accepts a new id and creates a playable track that is not in `MUSIC_TRACKS`.
- Bad: frontend dropdowns import `MUSIC_TRACKS` directly after the merged catalog has already been loaded.

#### 6. Tests Required
- Schema guard creates the table and remains idempotent.
- Public/admin list routes merge static defaults with stored overrides.
- Admin PATCH rejects unknown ids, accepts valid display names, and writes audit logs.
- Music resolver helper preserves playback configuration while replacing only the effective display name.
- Admin tab rendering and save flow refresh the list after a successful update.
- Gacha music prize options and character BGM selectors use the injected merged catalog.

#### 7. Wrong vs Correct

Wrong:

```js
await prisma.musicTrackSetting.upsert({ where: { id: req.params.id }, data: req.body });
```

Correct:

```js
if (!MUSIC_TRACKS[trackId]) {
  throw routeError(404, "TRACK_NOT_FOUND", "Music track not found.");
}

const displayName = normalizeDisplayName(body.displayName);
await prisma.musicTrackSetting.upsert({
  where: { id: trackId },
  create: { id: trackId, displayName },
  update: { displayName }
});
```

---

### Scenario: Achievement Persistence And Personalization Equipment

#### 1. Scope / Trigger
- Trigger: any change to achievements, achievement reward assets, player achievement equipment, reward-source resources, commerce/gacha achievement unlocks, or startup schema guards for achievement tables.
- This is a cross-layer contract because code/seeded achievement definitions drive backend domain evaluation, admin edits only display/reward/sort metadata, player APIs expose achieved state, and frontend profile overlays render/equip achievement rewards.

#### 2. Signatures
- `Achievement { id, key, name, description, conditionType, conditionParams, rewardAssetId?, isEnabled, createdAt, updatedAt }`
- `AchievementRewardAsset { id, type, name, description?, imageUrl?, textValue?, sourceType?, sourceId?, currencyType?, amount?, isEnabled, createdAt, updatedAt }`
- `UserAchievement { id, userId, achievementId, achievedAt, rewardGrantedAt? }` with unique `(userId, achievementId)`.
- `AchievementCounter { id, userId, type, value }` with unique `(userId, type)`.
- `UserAchievementEquipment { userId, titleAssetId?, badgeAssetId?, nameplateAssetId?, updatedAt }`
- `ensureAchievementSchema(prisma)` must run during startup before player/admin achievement routes or public profile payloads use these models.
- `seedBuiltinAchievements(prisma)` runs after `ensureAchievementSchema(prisma)` and creates missing code-owned achievements/reward assets without overwriting existing rows. It also creates missing `UserAchievement` rows for admin users for every built-in achievement, with `rewardGrantedAt` set, so newly added built-in achievement cosmetics are immediately available to admins.
- Because it adds `Character.source`, `Decoration.source`, and `ShopItem.source` to older SQLite databases, it must also run before any seed task or query that reads those Prisma models.

#### 3. Contracts
- Static gameplay/resource data remains authoritative unless an enabled achievement reward asset points at a `source=achievement` resource.
- Achievement goals are code-owned: admin HTTP routes must not create/delete achievements or mutate `key`, `conditionType`, `conditionParams`, `enabled`, or `deletedAt`; admin PATCH may only update `name`, `content`, `rewardAssetId`, and `sortOrder`.
- Built-in trigger-event achievements should be seeded as missing-only rows so startup does not overwrite later admin display/reward/sort edits.
- Mode-and-character achievements should use a reusable condition type such as `mode_character_wins` with JSON params `{ "mode": "spark", "characterId": "sigrika", "value": 100 }` instead of hard-coding a one-off evaluator branch.
- Resource reward assets of type `character`, `decoration`, and `item` must only target records with `source === "achievement"`; they must not silently grant default/shop resources.
- Reward grants must be idempotent: an already achieved row with `rewardGrantedAt` set must not grant currency/assets again.
- Player `GET /api/achievements` returns all enabled achievements merged with the current user's `isAchieved`, `achievedAt`, and reward display payload, plus only the unlocks newly achieved during that request.
- Player `GET/PATCH /api/me/achievement-equipment` may equip only unlocked enabled reward assets whose type matches the slot (`title`, `badge`, `nameplate`).
- Public profile payloads may expose compact equipped achievement asset ids/display data, but must not include every achievement or counter row. When a UI needs to render equipped cosmetics immediately, return both the equipment id fields and the selected reward asset payloads (`achievementEquipmentAssets` / `equipmentAssets`) so the frontend does not have to re-query name, text, or `imageUrl`.
- Commerce/gacha/item-use responses should include `achievementUnlocks` only when at least one achievement was newly achieved.

#### 4. Validation & Error Matrix
- Unknown admin achievement id -> `404 ACHIEVEMENT_NOT_FOUND`.
- Direct admin achievement create/delete -> `405` because achievement goals are code-managed.
- Code-owned field in admin achievement update -> reject before writing the achievement.
- Unknown reward asset id on achievement update -> reject before writing the achievement.
- Unknown or disabled equipment asset -> reject equipment update.
- Equipment asset not unlocked by the user -> reject equipment update.
- Equipment asset type does not match the slot -> reject equipment update.
- Missing achievement tables in an older SQLite database -> startup guard creates them in place.
- Missing `source` columns in an older SQLite database -> startup guard must add them before `seedCharacters()` or shop seed/query code runs.
- Narrow unit-test Prisma mocks with no achievement delegates -> stats/evaluation helpers should return empty unlocks or zero stats instead of crashing unrelated route tests.

#### 5. Good/Base/Bad Cases
- Good: using a rainbow bean candy on Denia evaluates the trigger event, creates one `UserAchievement`, grants its reward once, and returns one unlock toast payload.
- Good: the built-in `denia-rainbow-bean-candy` achievement unlocks only when `ACHIEVEMENT_TRIGGER_EVENTS.deniaRainbowBeanCandy` is passed after the achievement exists, not when the player merely opens the achievement list later.
- Base: a player with no achievements receives enabled achievements with `isAchieved: false`, empty `achievedAt`, and zero stats.
- Bad: adding an achievement by writing a `UserAchievement` row directly without running reward grant logic.
- Bad: letting a badge slot equip a `title` asset or an asset the user has not unlocked.

#### 6. Tests Required
- Schema guard tests assert tables/indexes/source columns are created and the guard is idempotent.
- Server startup tests assert `ensureAchievementSchema()` runs before `seedCharacters()` and `seedBuiltinShopItems()`.
- Admin route/domain tests assert unknown track/resource ids and disabled assets are rejected and audit actions are written.
- Player list tests assert enabled achievements merge default state, achieved state, reward display, and new unlocks.
- Equipment tests assert locked, disabled, wrong-type, and valid unlocked assets.
- Commerce/gacha/item-use tests assert `achievementUnlocks` appears only when new achievements unlock.
- Public profile/social tests assert only compact equipment/stat fields are exposed.

#### 7. Wrong vs Correct

Wrong:

```js
await prisma.userAchievement.create({ data: { userId, achievementId } });
await grantAchievementReward(prisma, userId, rewardAsset);
```

Correct:

```js
const unlocks = await evaluateAchievementsForUser({ prisma, userId, triggerEvent });
if (unlocks.length) {
  res.json({ ...payload, achievementUnlocks: unlocks });
}
```

---

### Scenario: Legacy Character Slug Cleanup

#### 1. Scope / Trigger
- Trigger: any change that retires, renames, or canonicalizes a persisted character slug.
- This is a startup data contract because character slugs exist in static fallbacks, Prisma defaults, user legacy fields, structured user assets, catalog targets, reward targets, and game-record snapshots.

#### 2. Signatures
- `cleanupLegacyDeniaCharacterData(prisma)` runs from `initializeServerData()` after achievement schema/seed work and before `seedCharacters()`.
- Legacy Denia slugs are `danea` and `denea`; canonical Denia slug is `denia`.
- `User.ownedCharacters` default must use canonical slugs only, for example `sigrika,denia,aemeath`.

#### 3. Contracts
- Retired character slugs should be handled by an idempotent startup cleanup instead of long-lived frontend/backend alias mapping.
- Cleanup must preserve correct canonical access where appropriate: legacy user `selectedCharacter`, `ownedCharacters`, and `UserCharacter` rows migrate to the canonical slug.
- Cleanup may delete historical records only when the product decision explicitly allows it; for retired Denia slugs, `GameRecord` rows with either color set to a legacy slug are deleted.
- Catalog and reward targets that point at the retired character should be rewritten to the canonical slug rather than left as broken ids.
- Public character listing must defensively omit retired slugs so a stale database row cannot reappear in player-facing catalogs.

#### 4. Validation & Error Matrix
- No legacy rows exist -> cleanup is a no-op and startup continues.
- User owns both legacy and canonical rows -> keep one canonical `UserCharacter` row with the maximum known `chainCount`.
- User legacy CSV contains both old spellings and canonical slug -> serialize one canonical slug.
- Old `Character` row exists with a cascading `CharacterSkill` -> deleting the character row removes the skill through the model relation.
- Narrow unit-test Prisma mocks omit optional delegates -> cleanup should skip missing operations or perform only available deletes.

#### 5. Good/Base/Bad Cases
- Good: startup migrates `ownedCharacters: "sigrika,danea"` to `"sigrika,denia"` and deletes `GameRecord` rows where `blackCharacter` or `whiteCharacter` is `danea`.
- Base: a clean database with only `denia` changes nothing.
- Bad: keeping `danea -> denia` in shared alias code forever, because stale API rows can keep surfacing a duplicate character.
- Bad: deleting legacy ownership without granting canonical `denia` when the intent is to preserve access.

#### 6. Tests Required
- Focused cleanup tests cover slug normalization, user field migration, structured row merge, catalog target rewrites, game-record deletion, character deletion, and narrow mocks.
- Server startup tests assert cleanup runs before `seedCharacters()`.
- Shared character and selection tests assert canonical `denia` is the built-in fallback and retired slugs do not resolve through static alias paths.
- Public character tests assert retired slugs are omitted from `/api/characters`.

#### 7. Wrong vs Correct

Wrong:

```js
export const CHARACTER_ALIASES = { danea: "denia" };
```

Correct:

```js
await cleanupLegacyDeniaCharacterData(prisma);
await seedCharacters(prisma);
```

---

## Naming Conventions

<!-- Table names, column names, index names -->

(To be filled by the team)

---

## Common Mistakes

<!-- Database-related mistakes your team has made -->

(To be filled by the team)
