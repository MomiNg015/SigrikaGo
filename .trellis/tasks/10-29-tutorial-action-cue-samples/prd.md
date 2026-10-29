# 操作引导强化提示：三套交互样板

## Goal
Provide three directly comparable interactive samples toward a real tutorial button or board point. User selection precedes production integration.

## Accepted scope
- A: repeating focus corners; B: expanding halo; C: hand-drawn pointing/tapping hand.
- Actual TutorialBattleScreen, Bright School styling and existing 20% spotlight dimming.
- Switch variants, skill-button/board-point scenarios, phone/small-phone/desktop viewports; replay and pause motion.
- Cue follows skill-button to board-point progression, disappears on completion, never intercepts input.
- Reduced motion displays a static marker. All experiment code stays under docs/design-samples.

## Acceptance
- [x] Three visually distinct working samples with one-click switching.
- [x] Real button and board-point interaction works through the cue.
- [x] Mobile portrait and desktop cues stay visible and anchored.
- [x] Pause, replay, completion and reduced motion verified.
- [x] Browser preview, screenshots, verification notes and system-design entry delivered.

## Validation
Scoped ESLint and browser geometry/interaction checks at 320, 390 and 1440 px widths. Inspect screenshots for each variant before delivery.

Results: 27 browser combinations passed, including completed actions and button-to-board progression. Picker, pause, replay and all three reduced-motion variants passed with no page errors. Scoped ESLint passed; system-design HTML regenerated and its 4 tests passed. Visual inspection covered all three mobile variants, the review shell and desktop hand placement. The production room scrolls on very short screens; the sample reveals new off-screen targets once and preserves board dimensions. Await user selection before any production rollout.
