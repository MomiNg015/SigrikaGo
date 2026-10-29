# Tutorial action colors

## Goal
Continue uses the same warm yellow as the original continuation button. Tutorial skill keys are gray unless the current step requires clicking Skill; the count value stays real.

## Decisions
User request is explicit. Reuse existing colors and physical keycaps; normal battle turn locks retain their prior rainbow/charge semantics. Continue remains yellow when shown; no focus frame returns. Scope is visual only, with no gameplay changes.

## Acceptance
- [x] Continue key uses the original yellow gradient on desktop and 320/390 portrait.
- [x] Tutorial skill is gray in dialogue, waiting, non-skill actions and board-targeting; active Skill step is rainbow with charges.
- [x] Actual count and ordinary battle colors are unchanged; scoped docs/CSS inventory and commit are synchronized.

## Accepted follow-up
For user-view tutorials (no player character), show only the generic Skill label outside player-skill nodes. A scripted skill node supplies the actual normalized skill name and execution, including Denia and explicit derived-skill objects. Keep the tutorial user identity; do not assign a persistent character. The sample defaults to this user view.

- [x] User-view generic label, scripted Denia name/execution and restoration verified.

## Centering correction
Center the visible skill icon and label as one vertical group. The charge window remains absolutely positioned in the upper-right; it must not create asymmetric content padding. Verify short and long names on desktop and portrait.
