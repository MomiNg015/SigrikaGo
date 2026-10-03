# Rank Progression Contract

## Scope / Trigger
Applies to competitive progression, public projections, leaderboards, admin edits, startup migrations, and RankProgress presentation.

## Signatures
- applyRankProgression({ rank, stars, rating, recentResults, outcome }) is the single state transition in src/shared/rankProgression.js.
- User and UserModeStats persist stars (integer, default 2), rank (default 3段), and rating (default 0).
- saveGameRecord({ prisma, room }) shares an in-flight promise per room and restores player progress if its transaction fails.
- migrateRankStars(prisma) runs once, guarded by the private migration.rank-stars-v1 SiteSetting receipt.

## Contracts
- spark, standard and gomoku are independent. Only spark mirrors User rank/stars/rating.
- 18级 through 3段: four slots; 4–6段: six; 7–8段: eight. Below 9段 rating is zero.
- Evaluate promotion/demotion using the state before the game. Full-star win promotes; zero-star loss demotes. Otherwise win/loss changes one star. Target rank starts half full.
- Every entry into 9段 sets 1000 points. Win +200; loss -250 floored at zero. Losing from zero demotes to 8段 with four stars.
- Draw leaves progression and challenge eligibility unchanged; 18级 cannot demote.
- Sort by numeric rank descending, ninth-dan points or stars descending, exact wins/totalGames descending, then wins descending. Exact ties share competition ranking (1,1,3); username/id only stabilize display order. buildLeaderboard returns ranking, consumed by both list rows and the pinned current-user row. Never use rounded displayed percentages or legacy Elo as a tie-breaker.
- A spark six-dan unlock writes permanent Nabomo ownership transactionally. Other modes do not grant it.
- Migration resets all users/modes to 3段 / 2 stars / 0 points, preserving counters and earned assets; updates unsettled room snapshots and converts old rating achievements into equivalent rank thresholds. Receipt and reset are atomic. Never expose or export migration receipts as admin defaults.
- Public room/profile/leaderboard payloads carry stars. Settlement includes rankAfter, starsAfter and ratingAfter.
- Battle PlayerInfo shows only the rank name; dossier/leaderboard progress remains detailed.
- RankProgress renders four slots in one row, six in two rows of three, eight in two rows of four, and only points for ninth dan. Dedicated rating summary cells are removed. Leaderboard span truncation must not cascade into nested progress spans.

## Validation & Error Matrix
- Clamp stars to capacity and points to nonnegative Prisma Int range; malformed rank falls back to 3段.
- Database failure: transaction rolls back; original users, visible rewards and recordSaved remain untouched because calculations use cloned state; propagate error for retry. A unique durable settlement receipt prevents repeated recovery awards. See [Internal Test Release Contract](./internal-test-release-contract.md).
- Migration failure: no receipt or partial reset may commit; startup fails rather than serving mixed progression.
- Repeated successful startup migration: no reset.

## Good / Base / Bad Cases
- Base: 3段 2 stars win => 3段 3 stars.
- Boundary: 3段 3 stars win => full 4 stars; next win => 4段 3 stars.
- Boundary: 9段 100 points loss => 9段 0; next loss => 8段 4 stars.
- Bad: recomputing points from historical win/loss counts or applying Elo opponent adjustments.

## Tests Required
rankProgression.test.js covers limits and transitions; roomResultPersistence.test.js covers concurrency, retries and mode isolation; rankStarsMigration.test.js uses disposable SQLite for schema/default/reset/idempotence/asset preservation; RankProgress.test.jsx covers slots and labels. Check real 360/390/412px layouts and regenerate system-design HTML.

## Wrong vs Correct
Wrong: increment stars and immediately promote when the result reaches capacity.
Correct: inspect the pre-game stars; only an already-full player can promote on a win.
Wrong: dynamically derive owned characters from current rating.
Correct: persist the six-dan award so later demotion cannot revoke it.

## Matchmaking classification
- Ordinary spark/standard/gomoku queues use their own mode rank; rankDistance skips nonexistent zero (1 kyu -> 1 dan is one step).
- Within two steps is eligible immediately. Choose smallest distance, then oldest queuedAt; both distant players must have waited 15000ms before widening. Team keeps independent FIFO and replay-only settlement.
- Queue retries preserve queuedAt. Socket-owned one-shot expansion timers retry without another join event, rechecking admission, authentication and blacklists. Leave/disconnect invalidate pending attempts and clear timers; a retry must still be queued after asynchronous validation, so already-matched users cannot reenter.
- Room creation freezes rated from the initial mode rank distance. Existing rated projection, persistence and settlement are authoritative; do not recalculate from post-game ranks. Distant matchmaking has matchSource=matchmaking and rated=false, using existing friendly coins and no rated record/progression changes.
- Match modal displays the expansion notice at 15s. Opening and room-code labels share roomMatchClassification, using pink/red for rated and mint for friendly; independent practice/story/team modes remain unlabelled.
- Tests: roomMatchmakingQueue.test.js (distance, mode, delay, priority), socketMatchEvents.test.js (automatic retry, leave, disconnect, blacklist), roomCreationLifecycle.test.js (frozen flag), roomResultPersistence.test.js (friendly no progression), leaderboard.test.js (exact ties), MatchClassification.dom.test.jsx (delay and labels).
