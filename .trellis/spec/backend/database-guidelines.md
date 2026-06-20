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

### Scenario: Site Setting Public Configuration

#### 1. Scope / Trigger
- Trigger: any change to public site settings, admin system settings fields, `/api/site-settings`, `/api/admin/site-settings`, or frontend lobby/about/footer copy that is backed by `SiteSetting`.
- Site settings are a cross-layer key/value contract: shared defaults define allowed keys, backend sanitizes and persists them, public/admin APIs return the merged values, and frontend components render them.

#### 2. Signatures
- `DEFAULT_SITE_SETTINGS` in `src/shared/siteSettings.js` is the source of truth for supported keys and fallback values.
- `SITE_SETTING_KEYS = Object.keys(DEFAULT_SITE_SETTINGS)` in `server/siteSettings.js`.
- Current keys: `homeTitle`, `homeSubtitle`, `aboutText`, `footerText`, `preloadTips`, and `ratingRules`.
- `footerText` supports Markdown-style links in the frontend only: `[label](https://example.com)`.
- `preloadTips` stores one loading-screen tip per line. The frontend parses non-empty trimmed lines, chooses one random tip for the preload screen, and rotates to another random tip every 10 seconds while the preload view stays mounted.
- `ratingRules` stores JSON for dynamic rating deltas, rank-gap scaling, optional anti-boosting, rank-change rating bonuses/penalties, and friendly-match coin reward limits.

#### 3. Contracts
- `ensureDefaultSiteSettings(prisma)` must upsert every key from `DEFAULT_SITE_SETTINGS` without overwriting already configured values.
- `getPublicSiteSettings(prisma)` must ignore unknown database rows and merge only supported keys over shared defaults.
- `updateSiteSettings({ prisma, adminUser, body })` must sanitize every supported key, upsert each value, and write one `site-settings.update` audit entry.
- New settings fields must be added to `DEFAULT_SITE_SETTINGS`, `SITE_SETTING_LIMITS`, admin settings UI, public/admin route tests, frontend rendering tests, and system-design docs together.
- The frontend must render `footerText` links through a constrained parser rather than arbitrary HTML.
- Loading-screen tips must stay plain text. Do not parse HTML or Markdown for `preloadTips`; React text rendering should escape all configured content.
- `ratingRules` must be normalized through `normalizeRatingRules()` on both admin save and backend sanitize paths; backend persistence stores the normalized JSON string.

#### 4. Validation & Error Matrix
- Missing key in request body -> sanitize to the shared default for that key.
- Blank or whitespace-only value -> fall back to the shared default.
- Overlong value -> trim and slice to the key-specific `SITE_SETTING_LIMITS` length.
- Unknown stored key -> ignored by `rowsToSettings`.
- Footer text containing raw HTML -> React escapes it as text; it must not be inserted with `dangerouslySetInnerHTML`.
- Footer Markdown link with non-HTTP protocol -> stays plain text because only `http://` and `https://` links are recognized.
- Blank `preloadTips` request value -> falls back to `DEFAULT_SITE_SETTINGS.preloadTips`.
- `preloadTips` containing blank lines -> blank lines are ignored by the frontend parser.
- Invalid or partial `ratingRules` JSON -> merge with `DEFAULT_RATING_RULES` and clamp numeric values before storage.

#### 5. Good/Base/Bad Cases
- Good: adding `footerText` updates shared defaults, backend limits, admin textarea, public settings merge tests, admin route tests, and home footer rendering tests in one change.
- Good: adding `preloadTips` updates shared defaults, backend limits, admin textarea, public settings merge tests, admin route tests, preload component tests, style contract tests, and system-design docs in one change.
- Good: adding `ratingRules` updates shared defaults, backend limits, admin structured controls, settlement tests, admin/site settings tests, and system-design docs in one change.
- Base: an old database without `footerText` rows serves the shared default until an admin saves a custom footer.
- Bad: accepting arbitrary HTML for the footer to make links work.
- Bad: adding a field only to the admin form while `SITE_SETTING_KEYS` still rejects it.
- Bad: hard-coding loading tips only in `AssetPreloadScreen`, because admins cannot change them through the existing system settings flow.

#### 6. Tests Required
- Backend defaults tests assert `ensureDefaultSiteSettings()` seeds every supported key.
- Admin route tests assert PATCH/GET round-trip for newly added keys.
- Public settings loader tests assert API values merge over defaults without dropping new keys.
- Frontend component tests assert configured footer text renders and raw HTML stays escaped.
- Preload component tests assert configured tips are parsed from newline text and render below the progress bar.
- CSS/static tests assert desktop footer remains viewport-fixed and mobile footer remains in normal document flow when those layout contracts are affected.
- CSS/static tests assert final theme safety layers preserve the borderless preload panel when theme panel rules would otherwise add a frame.
- Rating-rule tests assert sanitized defaults and admin-saved values cannot persist malformed/clashing rule objects.

#### 7. Wrong vs Correct

Wrong:

```jsx
<footer dangerouslySetInnerHTML={{ __html: settings.footerText }} />
```

Correct:

```jsx
<HomeFooter footerText={siteSettings.footerText} />
```

`HomeFooter` parses only safe Markdown link syntax and lets React escape all other text.

Wrong:

```jsx
const tips = ["tip A", "tip B"];
<AssetPreloadScreen tips={tips} />
```

Correct:

```jsx
<AssetPreloadScreen tipsText={siteSettings.preloadTips} />
```

`preloadTips` stays in the same `SiteSetting` key/value contract as other public system settings.

Wrong:

```js
const rules = JSON.parse(settings.ratingRules);
```

Correct:

```js
const rules = ratingRulesFromSettings(settings);
```

`ratingRulesFromSettings()` handles missing, malformed, and partial stored values through the shared normalizer.

### Scenario: Rated Results And Friendly Match Persistence

#### 1. Scope / Trigger
- Trigger: any change to room creation source, result settlement, rating/rank/coin rewards, replay APIs, public profile stats, or leaderboard stats.
- This is a cross-layer contract because room metadata is created by matchmaking/duel flows, stored on `GameRecord`, included in snapshots/API responses, and rendered by result/replay UI.

#### 2. Signatures
- `createRoom(first, second, { rated = true, matchSource = "matchmaking" })`
- `GameRecord.rated Boolean @default(true)`
- `GameRecord.matchSource String @default("matchmaking")`
- `GameRecord.blackRatingDelta`, `whiteRatingDelta`, `blackCoinsDelta`, `whiteCoinsDelta`, `blackRankDelta`, `whiteRankDelta`
- `room.game.resultRewards[userId] = { rating, coins, rank, rewardLimitReached, outcome, rated, matchSource }`
- `src/shared/ratingRules.js` owns dynamic rating calculation, anti-boost multipliers, friendly coin rewards, and settings normalization.

#### 3. Contracts
- Random matchmaking rooms must be `rated: true` and `matchSource: "matchmaking"`.
- Direct/private duel rooms must be `rated: false` and `matchSource: "duel"`.
- Rated games update rating, coins, mode stats, recent ten-game rank windows, public profile stats, and leaderboard stats.
- Friendly games do not update rating, mode stats, rank windows, public profile stats, or leaderboard stats.
- Friendly games are still persisted as `GameRecord` rows, included in replay lists, and marked in replay UI.
- Friendly coin rewards are limited per user per server day, using Asia/Shanghai day boundaries by default.
- Rated rank movement still uses decisive results only: 7 wins promote, 8 losses demote, draws do not enter `recentResults`.
- Promotion/demotion applies the configured fixed rating delta in addition to the game rating delta.
- Anti-boosting is configurable and may be disabled for launch; when enabled, it scales repeat-opponent rating deltas without suppressing replay persistence.

#### 4. Validation & Error Matrix
- Missing `rated` on old records -> treat as rated for backward compatibility.
- Missing `matchSource` on old records -> treat as `matchmaking`.
- Friendly game after daily reward limit -> persist replay and store zero friendly coin delta for that user.
- Draw in rated game -> may move rating through Elo actual score `0.5`, increments draw stats, and does not enter rank recent-results.
- Malformed `ratingRules` -> normalize to defaults and clamp limits before settlement.

#### 5. Good/Base/Bad Cases
- Good: direct duel creates a replay with `rated=false`, shows a handshake marker, but leaves profile stats unchanged.
- Good: matchmaking between uneven ranks applies rank-gap scaling so high-rank farming low-rank opponents is less profitable and riskier.
- Base: old records without `rated` remain visible in leaderboard/profile history as rated records.
- Bad: checking `matchSource === "duel"` in one profile query while leaderboard forgets to exclude friendly rows.
- Bad: awarding friendly-match coins from frontend state instead of audited server settlement.

#### 6. Tests Required
- Room factory/lifecycle tests assert matchmaking and direct-room metadata.
- Room view and replay route tests assert `rated`, `matchSource`, and audit deltas are exposed.
- Settlement tests assert rated dynamic deltas, rank-change rating delta, draw behavior, friendly no-stat behavior, and friendly daily coin limit.
- Leaderboard/profile tests assert friendly records are excluded from public stats while replay lists still include them.
- Frontend result/replay tests assert friendly result copy, reward-limit copy, and handshake replay marker.
- Schema integrity tests assert Prisma schema and migration include every new audit field.

#### 7. Wrong vs Correct

Wrong:

```js
const ratingDelta = winner ? 20 : -20;
await prisma.gameRecord.create({ data: { roomCode, blackUserId, whiteUserId } });
```

Correct:

```js
const rules = ratingRulesFromSettings(settings);
const ratingDelta = resultRewardDelta(color, winnerColor, { self, opponent, rules });
await prisma.gameRecord.create({
  data: { roomCode, blackUserId, whiteUserId, rated: room.rated !== false, matchSource: room.matchSource, blackRatingDelta, whiteRatingDelta }
});
```

Wrong:

```js
const profileRecords = await prisma.gameRecord.findMany({ where: { OR: userRecordWhere(userId) } });
```

Correct:

```js
const profileRecords = await prisma.gameRecord.findMany({
  where: { rated: true, OR: userRecordWhere(userId) }
});
```

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
- Accepted mode ids: `spark`, `standard`, and `gomoku`. Unknown or missing ids normalize to `spark`.
- `spark` mirrors legacy `User.rating`, `User.wins`, and `User.losses` for backward compatibility.
- `spark` also mirrors legacy `User.rank` after decisive results, but mode rank source of truth is `UserModeStats.rank`.
- Non-spark modes such as `standard` and `gomoku` keep rating, rank, recent result window, and record data in `UserModeStats`; do not write their wins/losses/draws/rating/rank into legacy `User` fields.
- Rank is independent from rating. New users/new mode rows default to `3段`; decisive mode results append `win`/`loss` to `recentResults` from old to new, promote at 7 wins, demote at 8 losses, cap at `9段`/`18级`, and clear `recentResults` after a promotion or demotion trigger.
- `GameRecord.mode` must be written for every saved room result, including draw records.
- Older SQLite development databases must be upgraded in place at startup: create `UserModeStats`, add `GameRecord.mode`, add `UserModeStats.rank`/`recentResults`, and backfill required shared mode rows (`spark`, `standard`, `gomoku`) per existing user before login/profile reads include `modeStats`.

#### 4. Validation & Error Matrix
- Missing mode in old data -> treat as `spark`.
- Missing `UserModeStats` table or `GameRecord.mode` column in a dev SQLite database -> `ensureGameModeSchema` creates/backfills them at startup; login must not fail before a manual migration command runs.
- Invalid mode from socket/API input -> normalize to `spark`.
- Result is invalid before the record threshold -> no `GameRecord`, no `UserModeStats`, no reward writes.
- Result is a draw after the threshold -> create the record and increment mode `draws`, but do not apply rating, coin, rank, or recent-result updates.

#### 5. Good/Base/Bad Cases
- Good: `joinMatchmaking({ mode: "gomoku" })` only pairs with gomoku queued players and saves records as `gomoku`.
- Base: old records without `mode` still appear in spark-only history and leaderboard views.
- Bad: leaderboard filters by mode but room persistence saves all records as `spark`.

#### 6. Tests Required
- Shared mode config normalization and ordering.
- Matchmaking queue isolation by mode.
- Game record persistence includes `mode`.
- Startup schema guard creates missing mode tables/columns and backfills legacy spark data plus default non-spark mode rows.
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

### Scenario: Recruitment Task Start, Candidate Ownership, And Ready Badge Contract

#### 1. Scope / Trigger
- Trigger: any change to recruitment item start rules, `RecruitmentTask` status projection, `/api/recruitment`, `/api/recruitment/start`, `/api/recruitment/fast-forward`, or the home recruitment entry ready indicator.
- Recruitment is a cross-layer contract because one API call consumes inventory, creates a persisted task, exposes a computed pending/ready status, and drives a home-shell notification after the modal may be closed.

#### 2. Signatures
- `POST /api/recruitment/start` accepts `{ itemType }`.
- `POST /api/recruitment/fast-forward` accepts no body and returns `{ task }`; it is a development test tool only.
- `GET /api/recruitment` returns `{ items, task, config }`.
- `task.status` is projected as `"pending"` before `readyAt`, `"ready"` after `readyAt`, and `"claimed"` only after claim.
- `RecruitmentTask { userId, itemType, status, resultType, resultCharacterSlug?, responseText, startedAt, readyAt, claimedAt? }`.
- `App.jsx` stores the current recruitment task for badge timing and receives updates through `onRecruitmentStatusChange(task)`.

#### 3. Contracts
- Start must reject immediately when the selected recruitment item has no unowned candidates for that user.
- Remaining candidates must be computed from `publicUserAssets(user).ownedCharacters`, with `userCharacters` included in the user query, so structured `UserCharacter` rows and legacy `ownedCharacters` strings cannot diverge for recruitment eligibility.
- That rejection must happen before consuming the item or creating `RecruitmentTask`.
- The rejection message is player-facing: `好像已经没有可以用该道具招募的角色了`.
- Only one active recruitment task is allowed per user.
- A pending task's result is decided at start time, but result details remain hidden until claim.
- The home recruitment entry red dot appears only when `task.status === "ready"`.
- The app shell must schedule a client-side refresh from `task.readyAt`, in addition to periodic polling, so closing the modal during the countdown still produces the ready red dot shortly after the countdown ends.
- Fast-forward is a removable test tool: backend access must use `canUseDebugTestActions(env)`, and the frontend clock icon must be hidden unless `import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_TOOLS === "true"`.
- Fast-forward must only shorten a pending task to five seconds remaining; it must not extend tasks that already have less time remaining.

#### 4. Validation & Error Matrix
- Unknown `itemType` -> `400`.
- Active pending recruitment exists -> `400`.
- Selected item has zero remaining candidates, including candidates present only in `UserCharacter` rows -> `400` with the exact player-facing no-candidate message.
- User has no selected item quantity -> `400`.
- Fast-forward outside enabled development test tools -> `403`.
- Pending task reaches `readyAt` while modal is closed -> app refreshes `/api/recruitment` and sets the home red dot.
- Pending task is still before `readyAt` -> no red dot.

#### 5. Good/Base/Bad Cases
- Good: a player owns QiuYuan and ChangLi through structured `UserCharacter` rows, then using `radio-recruitment-ticket` shows the no-candidate message and keeps the item count unchanged.
- Good: a player starts recruitment, closes the modal, waits until `readyAt`, and sees the home recruitment button red dot without waiting for the next long polling interval.
- Good: in development with test tools enabled, a tester clicks the countdown clock icon and the task moves to five seconds remaining.
- Base: periodic `/api/recruitment` polling still repairs stale client state after tab sleep or missed timers.
- Bad: checking only the legacy `ownedCharacters` string for recruitment candidates while public user payloads merge structured rows.
- Bad: consuming the item first and refunding it only after discovering all candidates are owned.
- Bad: exposing fast-forward in production or relying only on a 30-second polling interval for the ready red dot.

#### 6. Tests Required
- Backend recruitment tests assert the no-candidate start path rejects with the exact message and does not update the user or create a task.
- Backend recruitment tests assert structured `UserCharacter` rows block recruitment for already-owned candidates.
- Backend recruitment tests assert fast-forward requires enabled development test tools and moves pending tasks to five seconds remaining.
- Route tests assert `/api/recruitment/fast-forward` forwards the authenticated user id.
- App shell tests assert pending recruitment task state is stored and `readyAt` schedules a refresh that can set `recruitmentReady`.
- Modal/source tests assert the countdown clock action is behind the explicit dev test-tool flag.
- Home screen tests assert the recruitment entry renders a red dot only when `recruitmentReady` is true.

#### 7. Wrong vs Correct

Wrong:

```js
const ownedCharacters = parseCharacterAssetList(user.ownedCharacters);
const candidateIds = item.candidates.filter((id) => !ownedCharacters.includes(id));
```

Correct:

```js
const user = await tx.user.findUnique({ where: { id: userId }, include: { userCharacters: true } });
const ownedCharacters = publicUserAssets(user).ownedCharacters;
const candidateIds = item.candidates.filter((id) => !ownedCharacters.includes(id));
```

Wrong:

```jsx
<button className="recruitment-fast-forward-button" onClick={fastForward} />
```

Correct:

```jsx
{canFastForward && (
  <button className="recruitment-fast-forward-button" onClick={fastForward} />
)}
```

Wrong:

```jsx
setInterval(refreshRecruitmentBadge, 30000);
```

Correct:

```jsx
const remainingMs = new Date(recruitmentBadgeTask.readyAt).getTime() - Date.now();
window.setTimeout(refreshRecruitmentBadge, Math.max(0, remainingMs) + 400);
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

### Scenario: User Profile Likes And Reports

#### 1. Scope / Trigger
- Trigger: any change to public user profile like/report buttons, `/api/users/:id/like`, `/api/users/:id/report`, `/api/admin/user-reports`, profile payloads, or the `UserProfileLike` / `UserReport` schema.
- This is cross-layer because storage enforces daily limits, social routes expose mutations, profile payloads expose count/state, and admin UI reads submitted reports.

#### 2. Signatures
- `UserProfileLike { id, likerUserId, targetUserId, dayKey, createdAt }` with unique `(likerUserId, targetUserId, dayKey)`.
- `UserReport { id, reporterUserId, reportedUserId, reporterUsername, reportedUsername, content, createdAt }`.
- `POST /api/users/:id/like` returns `{ likeCount, likedToday }`.
- `POST /api/users/:id/report` accepts `{ content }` and returns `{ report }`.
- `GET /api/admin/user-reports` returns `{ reports }`, latest 100 by `createdAt desc`.

#### 3. Contracts
- Server-side daily like limits use Asia/Shanghai natural days. Store the normalized `YYYY-MM-DD` key in `dayKey`; do not trust client dates.
- Liking and reporting self are rejected before database writes.
- Friend/blacklist relationship does not block liking or reporting.
- Like insertion should be idempotent for the same day through the unique key and `INSERT OR IGNORE`, then re-read count/state.
- Report content reuses feedback content validation: trim, remove control characters, require non-empty, and cap at 400 characters.
- Store reporter/reported usernames as snapshots so admin review stays readable after future username changes.
- Use raw SQL helpers for new social tables when runtime code must work before a regenerated Prisma client delegate is available.
- Startup schema guard and Prisma migration must both create the tables and indexes.

#### 4. Validation & Error Matrix
- `likerUserId === targetUserId` -> `400`.
- `reporter.id === reportedUserId` -> `400`.
- Target user missing -> `404`.
- Blank report content after trim/control stripping -> validation error from the feedback validator.
- Duplicate like for same liker/target/day -> no new row, response still returns current `{ likeCount, likedToday: true }`.
- Missing tables in older SQLite dev databases -> startup guard creates them in place.

#### 5. Good/Base/Bad Cases
- Good: a viewer likes another user once, sees the count increment, and receives `likedToday: true`.
- Good: a blacklisted user can still submit a report, because moderation reporting is independent from social relation state.
- Base: unauthenticated users cannot hit the authenticated mutation routes.
- Bad: computing the daily limit in the browser or with the host local timezone.
- Bad: only storing `reporterUserId` and `reportedUserId` without username snapshots for admin review.

#### 6. Tests Required
- Domain tests for Asia/Shanghai `dayKey`, duplicate-like behavior, self-like/self-report rejection, report content sanitation, and admin report list mapping.
- Route handler tests for delegated like/report arguments and mounted authenticated routes.
- Schema integrity tests for Prisma models and migration SQL.
- Admin UI tests for the `reports` tab and read-only report table.
- Profile component tests for disabled self/already-liked states and icon-only actions.

#### 7. Wrong vs Correct

Wrong:

```js
const dayKey = new Date().toISOString().slice(0, 10);
await prisma.userProfileLike.create({ data: { likerUserId, targetUserId, dayKey } });
```

Correct:

```js
const dayKey = profileLikeDayKey(now);
await prisma.$executeRaw`
  INSERT OR IGNORE INTO UserProfileLike (id, likerUserId, targetUserId, dayKey, createdAt)
  VALUES (${id}, ${likerUserId}, ${targetUserId}, ${dayKey}, ${now})
`;
```

<!-- Table names, column names, index names -->

(To be filled by the team)

---

## Common Mistakes

<!-- Database-related mistakes your team has made -->

(To be filled by the team)
