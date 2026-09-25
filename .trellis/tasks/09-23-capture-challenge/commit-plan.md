# Proposed scoped commit

`feat: add capture challenge practice and leaderboard`

Only the feature files below are included. `docs/system-design.md` and `docs/system-design.html` already contained unrelated WIP: stage only this feature's summary and generated chapter additions, preserving all pre-existing hunks in the worktree. Do not stage `.codex-run/` artifacts.

- `.trellis/spec/backend/practice-room-contract.md`
- `docs/system-design.md`
- `docs/system-design.html`
- `docs/system-design/03-backend-realtime-api.md`
- `docs/system-design/04-data-model-and-domain.md`
- `prisma/schema.prisma`
- `prisma/migrations/20260923000000_capture_challenge/migration.sql`
- `scripts/migrationBaselineVerification.test.js`
- `server/captureChallenge.js`
- `server/captureChallengeSchema.js`
- `server/captureChallenge.test.js`
- `server/practiceRoomAutomation.js`
- `server/practiceRoomAutomation.test.js`
- `server/publicRoutes.js`
- `server/publicRoutes.test.js`
- `server/roomCloseLifecycle.js`
- `server/roomFactory.js`
- `server/roomGameActions.js`
- `server/roomRestoreLifecycle.js`
- `server/roomRestoreLifecycle.test.js`
- `server/roomResultPersistence.js`
- `server/roomScoringFlow.js`
- `server/roomSkillResolution.js`
- `server/roomTestActions.js`
- `server/roomView.js`
- `server/rooms.js`
- `server/serverStartup.js`
- `server/serverStartup.test.js`
- `server/socketPracticeEvents.js`
- `server/socketPracticeEvents.test.js`
- `src/home/HomeScreen.jsx`
- `src/modals/CaptureChallenge.dom.test.jsx`
- `src/modals/LeaderboardModal.jsx`
- `src/modals/gameLifecycle/OpeningModal.jsx`
- `src/modals/gameLifecycle/ResultModal.jsx`
- `src/modals/leaderboard/LeaderboardRow.jsx`
- `src/room/ActionBar.test.js`
- `src/room/RoomBattleStage.jsx`
- `src/room/header/RoomHeader.jsx`
- `src/shared/captureChallenge.js`
- `src/styles/commerce/social-profile/leaderboard-table.css`
- `src/styles/cssLayerInventory.js`
- `src/styles/modals/result-modal.css`
- `src/styles/themes/bright-school/modals/result-room-popovers.css`

Include this task's PRD, validation notes and task metadata; archive and journal only after the work commit.

## Excluded existing WIP

All other currently dirty files remain excluded, including rainbow-candy story/admin snapshot changes, announcement/log tab work, handbook/mobile layout changes, RoomScreen and its tests, tutorial tests, backend quality-guideline edits, other task directories and local run artifacts.

追加调整涉及：server/roomRequestLifecycle.js、src/styles/mobile-adaptive/window-bookmark-content.css、src/styles/modals/result-reward-motion.css、src/styles/themes/bright-school/quality-base/button-color-roles.css、src/styles/themes/bright-school/quality-base/button-color-states.css，以及原任务已列文件。
