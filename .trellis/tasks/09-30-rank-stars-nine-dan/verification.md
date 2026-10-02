# Verification — 2026-09-30

Implementation is complete; the actual application database has not been reset and the backend was not restarted.

- Relevant test selection: 304 cases. 303 initially passed; one static ResultModal source assertion was updated from rating sign to combined progression sign, then all 17 cases in that file passed.
- Full suite before the final focused fixes: 2738 passed, 9 failed. Generated system-design HTML mismatch was fixed and verified. Remaining eight failures are in unrelated replay/style contracts: social.test.js (2), HouseModal.test.js (2), ShopModal.test.js (1), RoomScreen.test.js (1), styleContract.test.js oversized preexisting player-status.css (1), themeContract.test.js (1).
- Re-running social.test.js with HEAD:server/social.js loaded through a temporary Vite plugin reproduced the same two replay failures. Other failures concern unchanged styles or pre-existing profile/layout WIP. No baseline suppression was added.
- Passed: lint, build, built CSS contracts, portrait validation, admin snapshot comparison, production configuration validation, incremental migration verification and git diff --check.
- SQLite integration tests prove default values, atomic reset/receipt rollback, one-time migration, all-mode reset, asset and achievement preservation, and unsettled snapshot reset without rewriting completed saved snapshots.
- Settlement tests cover concurrent requests, transaction-failure retry, permanent six-dan award and mode isolation.
- Headless Edge rendered actual profile, leaderboard and battle components at 1280px and portrait 360/390/412px. No page errors or document overflow; star slot rows are 4, 3+3 and 4+4. Test fixtures/screenshots stay under ignored-from-tests .codex-run/.
- New CSS owner budget records only its own added file/import bytes and palette fallbacks.

Deployment: back up the database, run Prisma migrate deploy, and start the updated backend. Startup performs the approved one-time reset to 3段 / 2 stars. Preserve the private migration receipt. Unrelated working-tree changes were retained; no commit or deployment was made.
