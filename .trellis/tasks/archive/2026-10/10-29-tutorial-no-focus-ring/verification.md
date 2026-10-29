# Verification

- Removed tutorial target outlines and header-history focus frames; scoped CSS variables disable the old guided-actions option outline/halo without changing other story surfaces. Original guided-actions colors and 13px radius flagged by the design hook are unchanged historical values, not additions; no suppression or palette change was made.
- Continuation occupies the counting key with a Play icon. Manual waits, explicit continue phase, preview skip and a single continue-only choice preserve their original callbacks. Overlays disable input, real answer choices still replace the region, and duplicate continuation is guarded.
- Final focused unit run: 5 suites / 57 tests passed. Meaningful DOM coverage proves counting is not called, only Continue is enabled, and normal counting returns. Helper tests cover continuation sources and locks.
- Focus refinement passed 18 real focused-control cases at 1440/390/320, including no option halo/header outline and unchanged normal-battle focus.
- Final real tutorial verifier passed 30 state/viewport cases, all five guided actions, duplicate pass/continue clicks, continuation-to-board and choice transitions, header history bounds/Escape/focus/dismissal. Viewed the 390px Continue state and the focus-free skill pod.
- Existing battle regression gate: 22 suites / 443 tests plus 4 system-design tests passed for the focus refinement. After continuation changes, final lint, build, built CSS contracts, regenerated system-design and its 4 tests passed.
- One intermediate browser run was invalidated by Vite reload while docs/source were being edited; reran against stable sources and it passed. The existing ActionBar source-string assertion was updated for the dynamic counting label; DOM behavior was separately verified.
- Full repository check was not repeated; the preceding task's unrelated e2eIsolation worker-exit limitation remains recorded in that task.

## Scope

Only tutorial UI behavior, its shared optional props, fixtures, docs/spec and exact CSS delta are staged. Current TutorialBattleScreen preload WIP remains in the working file. Staged docs HTML is rendered from staged Markdown, excluding unrelated local notes. CSS delta is +75 normalized bytes and +1 important declaration, no new files/colors/motion.
