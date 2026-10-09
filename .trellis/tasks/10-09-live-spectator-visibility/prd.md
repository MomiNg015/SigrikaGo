# Live spectator combined skill visibility

## Goal
Lock ongoing matches to a public spectator perspective affected by both players' visual skills.

## Requirements
- User confirmed ongoing live watching and history browsing both remain locked until the match finishes.
- Hide either player's unexposed hidden hands and apply either player's color illusions through the existing shared game projection with a null viewer color.
- Ongoing spectator payloads contain no alternate player perspective.
- Finished rooms and standalone replays retain perspective switching.
- Preserve player perspectives and phase-specific illusion expiration.

## Acceptance Criteria
- Server projection hides both owners' hidden hands and applies both owners' illusions without mutating canonical state.
- Ongoing spectator controls cannot switch perspective, including historical browsing and programmatic setter calls.
- Finished rooms and record replays still switch perspectives.
- Regression tests, lint, build and generated system-design documentation pass.

## Technical Notes
- server/roomView.js constructs per-viewer payloads.
- src/shared/game.js gameViewForColor already supports a null spectator color.
- src/room/view/useRoomBoardView.js owns live/history projection and perspective controls.
- Existing unrelated working tree edits must be preserved.

## Validation Results
- Spectator regression tests: 22 passed; final hook callback change rechecked with 8 passing hook tests.
- Full project lint passed; final changed JavaScript passed targeted lint.
- Final production build passed and system-design HTML regenerated; all 4 document tests passed after regeneration.
- Full check stopped at the test stage: 3099 passed, 3 failed, 4 unhandled errors. Document synchronization was subsequently repaired. Remaining failures concern the unrelated CSS file baseline (719 versus 718) and capture-challenge / home audio mocks (missing stopVoicePlayback and non-Promise audio.play). This task does not modify those CSS or audio surfaces.
- No commit performed; original unrelated WIP remains in place.
