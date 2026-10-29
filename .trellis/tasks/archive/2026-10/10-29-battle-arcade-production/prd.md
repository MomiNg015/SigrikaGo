# Production battle arcade controls

## Goal
Integrate the selected handheld pod into the real Bright School battle action bar, with stronger physical cap/seat detailing and desktop/portrait layouts.

## Accepted requirements
- Skill > counting/resign > pass/draw in visual weight; preserve all five actions and existing handlers, locks and confirmation flow.
- Display effective character skill name on the key. Upper-right IRIS mixed-font counter; rainbow for positive uses, gray at zero. Turn lock does not mean zero uses.
- Visible presses for pointer, touch and keyboard; no movement for disabled actions; clean cancellation/unmount and reduced-motion.
- Improve the sample's simple material treatment with inset key seats, cap bevels, a restrained outline and bottom edge; retain the campus paper/mint vocabulary.
- Desktop and 320/390px portrait. Preserve board geometry and mobile dock height measurement.
- Ordinary Bright School only. Spectator/dead-stone/tutorial override bars, corrupted duel and other themes retain their layouts.

## Acceptance
- [x] Real ActionBar and RoomBattleStage render the selected design with full theme cascade.
- [x] All five actions invoke their original callbacks exactly once; modes, disabled locks and effective skill name/count remain correct.
- [x] Mobile has no overflow/clipped controls; long names and counts fit; keyboard/touch press and canceled pointers tested.
- [x] 140 targeted tests and 443 battle regression tests passed; 20 full-cascade browser states and 20 actual presses passed.
- [x] Docs/specs and generated system-design HTML updated.
- [x] Run the full repository gate and remaining build/resource/config checks; see verification.md for the unrelated worker-exit limitation.
- [x] Scoped commit prepared with only this task's changes; unrelated work preserved.

## Implementation ownership
ActionBar + local action button helper, final scoped Bright School CSS, focused tests and real-component preview. No backend, board or game-rule changes.

## Follow-up: tutorial illustration
Show the current tutorial action region using real TutorialBattleScreen and local node fixtures. Include dialogue/continue, choice, player move, skill-to-board transition, counting and resignation on desktop and portrait. Preserve tutorial implementation and clearly show that it retains its independent step-specific controls.
