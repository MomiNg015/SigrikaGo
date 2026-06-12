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

## Naming Conventions

<!-- Table names, column names, index names -->

(To be filled by the team)

---

## Common Mistakes

<!-- Database-related mistakes your team has made -->

(To be filled by the team)
