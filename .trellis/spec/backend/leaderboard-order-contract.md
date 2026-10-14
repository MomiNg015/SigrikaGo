# Unique Leaderboard Order

## Scope / Trigger
Leaderboard score ordering, podium membership, settlement, capture profile rank and arrival-time migrations.

## Signatures
- `compareLeaderboardStanding(a,b)` and `standingReachedAt(before,after,now)` in `server/leaderboardOrder.js`.
- `UserModeStats.leaderboardReachedAt DateTime?`; `CaptureChallengeBest.reachedAt DateTime` with composite captures/reachedAt/userId index.
- `capturePredecessors({userId,captures,reachedAt})` is the common Prisma count predicate for settlement and profile.
- `GET /api/leaderboard` still returns `ranking`; values now are consecutive unique positions.

## Contracts
- Keep rank/progress/wins/exact-rate priority. Arrival is the last score tie-break, then immutable ID only for identical stored timestamps. Renaming cannot change priority.
- Persist the current comparable standing's arrival in the existing settlement transaction. Update when that tuple changes or the player first becomes eligible; unchanged zero-win floors preserve time. Modes remain independent. Admin progress changes refresh time; no-op progress edits do not.
- Capture arrival changes only at first entry or strictly greater personal best. Repeating a best keeps its time and costume; a lower attempt is ranked as a new attempt without replacing the best. Retries return the durable historical settlement receipt unchanged.
- Podium consumes only the first three server-ordered players and labels gold/silver/bronze 1/2/3, even for a legacy tied payload. Remaining list begins at fourth; no frontend alphabetical sorting.
- Migration is additive. Ordinary legacy arrival uses the last mode stats updatedAt because exact past arrival was not recorded. Capture legacy arrival uses the earliest result matching that best; absent history uses epoch zero, then ID. Normalize legacy textual SQLite timestamps to epoch milliseconds for capture SQL comparisons. Startup guards are idempotent; preserve counters, assets and historical receipts.

## Validation & Error Matrix
- Same score, different arrival -> earlier first; same timestamp -> stable ID.
- Failed settlement -> rollback time with scores and permit retry; refresh/restart must not refresh time.
- Missing historical timestamp -> documented fallback, never claim reconstructed precision.
- Fewer than three players -> only existing placements; five equal scores -> three podium entries and two rows.

## Good / Base / Bad Cases
Base: earlier 20-capture best precedes a later 20-capture best even when its ID sorts later. Good: a repeat of that best preserves both arrival and costume. Bad: use updatedAt on every request or restart, or keep competition ranking 1/2/2/4.

## Tests Required
`leaderboardOrder.test.js`: old SQLite schema through migration and startup paths, textual timestamps, earliest matching record, no reset on second startup, profile/list agreement. `leaderboard.test.js`: existing priority, per-mode arrival and rename stability. `roomRewards.test.js`: no-op floor, exact-rate change and first eligibility. `captureChallenge.test.js`: equal scores, strict improvement, retries and pinned rank. `LeaderboardRanking.dom.test.jsx`: hard three-place podium with legacy tied payloads. Browser verify five equal scores on desktop and portrait mobile.

## Wrong vs Correct
Wrong: filter every `ranking <= 3` into the podium and count only strictly greater captures for profile rank.
Correct: unique service order with persisted arrival, shared capture predecessor predicate, and the first three entries in the podium.
