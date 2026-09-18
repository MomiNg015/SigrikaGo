# Verification

- Browser QA uses real RoomBattleStage, PlayerInfo, RoomHeader and full CSS in a local fixture with representative players/game state.
- Edge headless portrait 360x800, 390x844, 412x915: both player skill tooltips portal to app-shell; long copy stays within the viewport and scrolls. Document width equals viewport width. Dock shadow has 3px right/4px bottom clearance, and final action row has scrolling padding.
- Backend roomCloseLifecycle tests pass with existing five-minute constants unchanged.
- Full suite: 354 files passed; the remaining PlayerInfo height assertion was updated for available-space sizing and all 17 tests in that file passed on rerun (2515 total tests).
- Existing unrelated uncommitted edits preserved. CSS inventory reflects existing working-tree additions and this task's one new gutter owner.
- Production build and remaining check gates tracked in .codex-temp/mobile-battle/gates.log.

- Final gates passed: lint, all test files after targeted rerun, portrait audit, admin snapshot, build, built CSS, production configuration, generated-doc consistency. Final regression group: 5 files / 99 tests passed. OperationHint-enabled browser fixture also passed all three portrait sizes.
- Work remains uncommitted to preserve the existing mixed working tree.
