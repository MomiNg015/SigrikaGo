# Standard Game Mode

## Goal

Add a second match mode, `标准对弈`, for desktop and mobile play. The existing fantasy rules become `星炬对弈`; the new standard mode is a 19-line no-skill Go game with separate mode-specific records, rating, rank, leaderboard, replays, and watch lists.

## Requirements

* Follow the Trellis workflow for this task: implement from this PRD, load project specs before editing, verify with tests/build, update `docs/system-design.md`, update Trellis specs if new durable conventions are learned, and commit the completed work.
* Apply `ui-ux-pro-max` and `frontend-design` guidance for all changed frontend surfaces: desktop and mobile layouts must fit the existing Bright School style, maintain accessible focus/labels, keep touch targets at least 44px, avoid horizontal overflow, and preserve readable Chinese labels.
* The home match entry remains the large main-screen match button, but clicking it opens a mode-selection modal instead of immediately joining matchmaking.
* Mode selection order is fixed: `星炬对弈` first, `标准对弈` second.
* Each mode button shows its title, a small rule summary under the title, and the current matching count for that mode on the right.
* Star mode rules: 13路, 5分钟30秒3次, 黑贴2又3/4子, skills enabled.
* Standard mode rules: 19路, 5分钟30秒3次, 黑贴3又3/4子, no skills.
* Standard rooms keep player cosmetic identity such as selected character portrait, stone decoration, and audio where applicable, but all skill gameplay is disabled.
* Standard room UI must directly remove the skill action button and both players' skill labels. It must also remove skill name display, 除子, 超频, and scoring overclock descriptions.
* Standard board is a real 19-line Go board with 9 star points.
* Scoring in standard mode uses black komi 3又3/4子 and no skill/overclock formula terms.
* Records, rank, rating, leaderboard, replays, and watch lists are mode-specific. Existing historical data belongs to `星炬对弈`.
* Tabs for mode-specific content always show `星炬对弈` before `标准对弈`.
* Friend duel requests prompt the sender to choose mode; the receiver can see which mode was requested.

## Acceptance Criteria

* [ ] Clicking the home match button opens a desktop/mobile-safe mode selector with the two modes, rule copy, and per-mode matching counts.
* [ ] `match:join` with one mode cannot pair against a player waiting for the other mode.
* [ ] `lobby:stats` exposes per-mode matching counts.
* [ ] Standard rooms create 19x19 games, render 9 star points, and reject skill actions server-side.
* [ ] Standard room UI does not render the skill action button, either player's skill chip/label, 除子, 超频, or overclock scoring text.
* [ ] Star rooms preserve the current 13路 skill-enabled experience.
* [ ] Game records save a mode; old records default to star mode.
* [ ] Rating, rank, wins, losses, draws, leaderboard, replay lists, user profile stats, and watch lists filter by selected mode.
* [ ] Friend duel sender and receiver both see the chosen mode.
* [ ] `docs/system-design.md` is updated.
* [ ] Relevant unit tests, `npm test`, and `npm run build` pass or any remaining failure is clearly documented.

## Technical Approach

Create a shared game-mode configuration and make both backend and frontend consume it. Thread `mode` through matchmaking, direct duel, room creation, persistence, room views, game records, scoring, replay reconstruction, watch lists, and profile/leaderboard APIs. Add per-mode user stats while keeping the legacy user rating fields as star-mode compatibility mirrors during this change. Refactor board sizing helpers to read `game.size` instead of the global 13-line default.

For frontend UI, extend the existing Bright School modal/control language rather than introducing a new visual system. Use compact segmented tabs for mode switching in stats/list surfaces, large vertical mode buttons in the home/friend selectors, stable grid dimensions for the 19-line board, and mobile-specific guards so labels and controls do not overlap.

## Test Plan

* Add failing tests first for shared mode config, board sizing/star points, standard scoring, matchmaking mode isolation, standard skill rejection, leaderboard/profile mode filtering, and UI rendering of standard no-skill controls.
* Run targeted tests while implementing:
  * `npm test -- src/shared/gameModes.test.js src/shared/gameBoard.test.js src/shared/gameScoring.test.js`
  * `npm test -- server/rooms.test.js server/leaderboard.test.js server/social.test.js`
  * `npm test -- src/room/Board.test.js src/room/ActionBar.test.js src/room/PlayerInfo.test.js src/home/HomeScreen.test.jsx`
* Run final `npm test` and `npm run build`.
* Browser-check desktop and mobile for home mode selector, standard room, star room, leaderboard tabs, replay tabs, watch tabs, and friend duel mode flow.

## Out of Scope

* Adding more than the two requested modes.
* Splitting coins by mode.
* Changing the existing time control.
* Removing character cosmetics from standard mode.
