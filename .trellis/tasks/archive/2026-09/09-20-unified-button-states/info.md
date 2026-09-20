# Verification and scope

First rollout: ordinary controls in common windows and ordinary room actions. Profile, shop, recruitment special controls and window surface palette migration remain the next stage of the accepted plan.

- Existing color-owner file replaced with one nested state owner; protected legacy motion kept in explicit exclusions.
- Lint passed. Related CSS/window tests passed after correcting old FriendsList HTML assertion and registering actual CSS metrics.
- verify:battle-fixes: 436 tests passed; docs HTML check: 3 passed.
- Final CSS contracts: 118 passed. Production build and built-CSS checks passed.
- CUA real stylesheet preview: five roles, native disabled, ARIA busy/disabled; real FriendsList expanded menu paint matches roles. Actual hover transform is translateY(-1px), keyboard focus has 2px ink outline, busy transform none. 390px portrait sample has no document horizontal overflow.
- Desktop rendering and portrait layout inspected. Fine-pointer media guard is covered in CSS tests; touch hardware and held-pointer capture were not emulated.
- docs/previews/button-states.html is a Vite-served reusable review page. Dev server port 5175 retained for user preview. .codex-run remains excluded.
