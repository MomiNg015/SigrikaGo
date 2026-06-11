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
- `UserModeStats { userId, mode, rating, wins, losses, draws }` with unique `(userId, mode)`
- Runtime mode ids must come from `src/shared/gameModes.js`, not duplicated string lists.

#### 3. Contracts
- Accepted mode ids: `spark`, `standard`. Unknown or missing ids normalize to `spark`.
- `spark` mirrors legacy `User.rating`, `User.wins`, and `User.losses` for backward compatibility.
- `standard` keeps rating and record data in `UserModeStats`; do not write standard wins/losses/rating into legacy `User` fields.
- `GameRecord.mode` must be written for every saved room result, including draw records.

#### 4. Validation & Error Matrix
- Missing mode in old data -> treat as `spark`.
- Invalid mode from socket/API input -> normalize to `spark`.
- Result is invalid before the record threshold -> no `GameRecord`, no `UserModeStats`, no reward writes.
- Result is a draw after the threshold -> create the record and increment mode `draws`, but do not apply rating or coin rewards.

#### 5. Good/Base/Bad Cases
- Good: `joinMatchmaking({ mode: "standard" })` only pairs with standard queued players and saves records as `standard`.
- Base: old records without `mode` still appear in spark-only history and leaderboard views.
- Bad: leaderboard filters by mode but room persistence saves all records as `spark`.

#### 6. Tests Required
- Shared mode config normalization and ordering.
- Matchmaking queue isolation by mode.
- Game record persistence includes `mode`.
- Mode-specific leaderboard/profile/history filters.
- Draw persistence increments `UserModeStats.draws` without reward writes.

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

## Naming Conventions

<!-- Table names, column names, index names -->

(To be filled by the team)

---

## Common Mistakes

<!-- Database-related mistakes your team has made -->

(To be filled by the team)
