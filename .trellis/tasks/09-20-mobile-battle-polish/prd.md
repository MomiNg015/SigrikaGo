# Mobile battle visual polish

## Goal
Refine the existing portrait Bright School battle interface on a new branch, following the reviewed first-tier proposal.

## Agreed scope
- Superseding direction: retain the campus notebook identity (grid paper, ink outlines, pastel controls). Refine card/board thickness, shadow consistency and proportions within that style. The user rejected the previous generic white/thin-gray-border direction.
- Follow-up: elevate portrait battle visual hierarchy using clean paper, fine outlines, quieter secondary controls and softer board depth. Correct skill shadow consistency across default, pressed, selected and disabled states; preserve single-row header and existing assets.
- Follow-up: move development test actions to accessible icon-only header buttons; preserve existing development/player and phase/skill locks, with a single mobile header row without increasing header height.
- Follow-up: remove the operation-hint block from both desktop and mobile battle layouts, including the shared tutorial stage. Keep actionable confirmations and tutorial choices.
- Keep action order, game behavior, board geometry and desktop layout.
- Improve action-label readability, reduce nested player-stat chrome, soften the active-turn fill and lighten dock tabs.
- Retain the campus palette, existing button states, floating-layer and shadow clearance contracts.
- Do not redesign special corrupted battles or tutorial choice buttons.

## Acceptance
- Inspect real components at 360x640, 390x844 and 412x915, including header, long names, skill targeting and disabled actions.
- Existing room/style tests pass; lint, production CSS check and build pass.
- Update system-design summary and regenerate HTML.

## Decision
The user authorized a first implementation after the review; no additional preference decision blocks this reversible visual pass.

## Validation and handoff
- Campus revision: 320/360/390/412px browser checks retain 60px header, no horizontal overflow and visible player-card shadow clearance. Skill defaults to a 3px shadow, selected to a depressed 1px shadow, and disabled to no shadow. Updated preview: `.codex-run/battle-campus-390.png`.
- First pass implemented on `codex/mobile-battle-polish`; left uncommitted for visual review.
- Real header/stage/action components inspected with simulated players at 360x640, 390x844 and 412x915; long-name and waiting states checked, skill targeting toggles correctly.
- At 390px the board remains 356px before and after; desktop action typography remains 16px.
- 162 focused room/style/document checks pass. Lint and production build pass; system-design HTML regenerated.
- Full suite reports two unrelated existing assertion failures: HouseModal expects an old cream background in unchanged actions-tabs.css; ShopModal scans all mobile CSS and rejects an existing home-student-id width. Both conflicting source facts exist at HEAD. Do not change unrelated surfaces in this preview task.
- Preview screenshots and fixture are under the pre-existing untracked `.codex-run/` directory.
- Follow-up verified: desktop and mobile have zero `.operation-hint` nodes; 176 room/tutorial/style/document tests and lint pass. The operation panel keeps a single row with no hint gap.
- Header tools: 158 focused checks and lint pass. Desktop controls align with the utility row; 360px portrait retains 44x44 buttons without horizontal overflow. Event tests verify all three payloads and disabled actions.
- Superseding mobile layout: user requires no header height increase. At 320/360/390/412px, all five header controls share the same Y position and the header is 60px tall. Test controls are 32x44; room metadata stays on one horizontally scrollable line.
- Refined pass: 173 related checks and lint pass. Browser verifies default raised skill shadow, depressed selected state without old glow/pseudo-element, disabled shadow none, reduced-motion transition 0.001s, and no horizontal overflow at 320/360/390/412px. Header remains 60px and action panel stays inside each viewport. Typography reuses the existing UI font token instead of introducing a new face.
