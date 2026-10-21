# Match mobile room header buttons

## Request
The pale-red room exit looks inconsistent next to the mobile menu. Preserve the requested exit color while matching their visual weight.

## Scope
- Keep both controls at 44px with the same radius, border, icon color and alignment.
- Use the shared ordinary-button state owner for both; preserve their distinct semantic fills and remove mobile hard shadows in every interaction state.
- Keep a small, consistent press response. Do not change desktop or room behavior.
- Verify the rendered production CSS at 390px and 320px; update existing documentation and only commit this task's changes.

## Cause
Adding the danger role opted the exit into the shared state owner, whose specificity beats the existing mobile flat reset. The menu was not using that owner.

## Validation
- Real browser checks passed at 1440, 1024, 390 and 320px. Mobile assertions cover equal bounds, border, radius, ink, no rest/hover/press shadow, pale-red exit fill and the shared 2px press movement. Visually reviewed the 390px production-component screenshot.
- Header/semantic-button tests: 8 passed; CSS contracts: 143 passed.
- Battle gate: 442 passed, plus 4 documentation render tests; real Pixi stability: 4 passed across desktop and mobile.
- ESLint, production build and built-CSS contracts passed. Documentation regenerated.
- Updated the existing frontend quality contract to prevent semantic button roles from bypassing the local mobile flat-control treatment. No new palette or shadow constants, and no design-hook findings.
- Only this task's documentation hunks staged; unrelated profile/application edits preserved.
