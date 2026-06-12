# Recent Result Rank Progression

## Goal

Replace rating-derived rank progression with recent-result rank progression, and show the latest ranked results in the player plaque and profile/detail surfaces across desktop and mobile.

## What I Already Know

* New users should start at `3段`.
* Rank should no longer be derived from rating/points.
* Rank progression should inspect the latest 10 valid decisive games.
* 7 wins in the latest 10 promotes one rank step, capped at `9段`.
* 8 losses in the latest 10 demotes one rank step, floored at `18级`.
* The latest 10 win/loss results should display under the plaque/profile stats row from old to new.
* Result marks should read as green wins and red losses.
* Desktop and mobile layouts both apply.
* `docs/system-design.md` must be synchronized for every update.

## Decisions

* Rank progression is mode-specific: `spark` and `standard` each keep their own rank, recent decisive result window, and promotion/demotion calculation.
* After a promotion or demotion, that mode's recent win/loss window resets to empty and starts counting again from the next decisive game.

## Requirements

* Persist rank independently of rating for each game mode.
* Stop using `rating` as the source of truth for rank.
* Preserve rating/points as a separate displayed/account metric unless later requirements remove it.
* Update result settlement so valid decisive games can promote/demote the rank for that game's mode according to that mode's latest 10 decisive results.
* Reset a mode's recent decisive result window immediately after that mode promotes or demotes.
* Ignore draws for the win/loss marker display and threshold counts unless explicitly changed.
* Show the latest ranked win/loss sequence for the selected/displayed mode below stats in the current-user plaque and user detail/profile surfaces.

## Acceptance Criteria

* [ ] New registered users default to `3段`.
* [ ] 7 wins in the latest 10 decisive games for a mode promote that mode's rank by one rank/grade step, up to `9段`.
* [ ] 8 losses in the latest 10 decisive games for a mode demote that mode's rank by one rank/grade step, down to `18级`.
* [ ] After promotion/demotion, that mode's displayed recent result markers clear and subsequent games start a new window.
* [ ] Rating changes do not change rank by themselves.
* [ ] Player plaque and detailed profile surfaces render selected/displayed mode latest result markers old-to-new.
* [ ] Desktop and mobile layouts display markers without clipping.
* [ ] `docs/system-design.md` and generated `docs/system-design.html` are updated.

## Definition of Done

* Backend ranking helpers and settlement tests cover promotion, demotion, caps, floors, and draws/invalid games.
* Frontend tests cover marker rendering and CSS contract.
* Focused tests and `npm run build` pass.

## Technical Notes

* Current code derives rank from `rankFromRating(rating)` in `src/shared/ratingRank.js`, `server/db.js`, `server/leaderboard.js`, `server/social.js`, and `src/home/components/PlayerPlaque.jsx`.
* Mode-specific rank likely belongs on `UserModeStats`, which currently stores `mode`, `rating`, `wins`, `losses`, and `draws`.
* Current settlement updates rating through `resultRewardDelta`, `applyResultRewardsToRoomUsers`, `UserModeStats`, `User.rating`, and progress ledger entries.
* `/api/me` already loads all current-user records and can derive recent-result marker history.
* Social profiles and resume/detail views already derive profile records from `GameRecord`.
