# Mobile battle visual polish

## Goal
Refine the existing portrait Bright School battle interface on a new branch, following the reviewed first-tier proposal.

## Agreed scope
- Follow-up: move development test actions to accessible icon-only header buttons; preserve existing development/player and phase/skill locks, with a right-aligned second mobile header row.
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
- First pass implemented on `codex/mobile-battle-polish`; left uncommitted for visual review.
- Real header/stage/action components inspected with simulated players at 360x640, 390x844 and 412x915; long-name and waiting states checked, skill targeting toggles correctly.
- At 390px the board remains 356px before and after; desktop action typography remains 16px.
- 162 focused room/style/document checks pass. Lint and production build pass; system-design HTML regenerated.
- Full suite reports two unrelated existing assertion failures: HouseModal expects an old cream background in unchanged actions-tabs.css; ShopModal scans all mobile CSS and rejects an existing home-student-id width. Both conflicting source facts exist at HEAD. Do not change unrelated surfaces in this preview task.
- Preview screenshots and fixture are under the pre-existing untracked `.codex-run/` directory.
- Follow-up verified: desktop and mobile have zero `.operation-hint` nodes; 176 room/tutorial/style/document tests and lint pass. The operation panel keeps a single row with no hint gap.
- Header tools: 158 focused checks and lint pass. Desktop controls align with the utility row; 360px portrait retains 44x44 buttons without horizontal overflow. Event tests verify all three payloads and disabled actions.
