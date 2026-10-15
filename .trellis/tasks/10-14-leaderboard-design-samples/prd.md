# Leaderboard review and three design samples

## Goal
Review the current leaderboard and deliver three interactive visual directions for desktop and portrait mobile, for user comparison before production integration.

## Requirements
- Revision 5: user explicitly accepts the three-person centered-champion podium and identifies fourth-place-onward row composition as the problem. Only restyle list/personal rows: placement on avatar, cohesive identity, compact rank progress using shared rules, prominent right-aligned rate and secondary wins. Freeze top-three composition.
- Revision 4: replace the two-tier mobile list with one horizontal strip: placement, avatar/name/rank group, wins, win rate. Apply the same strip to personal rank; preserve the podium and selected-winner strip.
- Revision 3: mobile podium ordinary match records show wins and win rate only, including selected top-three detail, list and pinned personal rank. Reflow into identity above rank plus paired metrics. Keep desktop full records and capture challenge unchanged.
- Revision 2: user prefers the podium direction but requests a mobile redesign. Keep desktop composition; use compact three-place portrait platforms with a selectable shared statistics strip, wider player identity rows and a slimmer personal ranking. Continue as an isolated sample.
- Preserve Bright School identity, existing title artwork, four modes, character portraits, rank/stars/points, record metrics and pinned current-user row.
- Three distinct compositions: campus honor list, podium, compact score ledger.
- Isolated fixtures only; production components and APIs remain unchanged.
- Include a current-component preview for evidence, tied ranks, long names, empty/error/loading and unranked-current-user states.
- Provide review findings and tradeoffs; update the system-design entry and generated HTML.

## Acceptance Criteria
- [x] Three samples reachable from a comparison page with desktop/mobile controls.
- [x] Mode switching, close/reopen and edge-state controls work locally.
- [x] Visual and interaction checks at 1440px and 320/360/390px portrait; no horizontal overflow or broken art.
- [x] Evidence screenshots and concise review recorded.

## Decisions and scope
The request authorizes design exploration; no production redesign, ranking algorithm change, new live statistics, season/reward system or new API is included. Future integration can reuse shared identity/rank/portrait components. Tied ranks retain server ranking, and absent personal rows do not invent a placement. Existing unrelated WIP is preserved.

## Technical approach
Use an isolated Vite-served React page under docs/design-samples/leaderboard-2026-10-14, following neighboring design samples. Reuse shared character/rank/identity components. Current preview mounts LeaderboardModal with an isolated fetch stub. CSS remains local. Inline Codex workflow uses directly loaded specs.

## References
- src/modals/LeaderboardModal.jsx
- src/modals/leaderboard/LeaderboardRow.jsx
- server/leaderboard.js
- .trellis/spec/frontend/window-title-stickers.md
- .trellis/spec/frontend/css-architecture.md
- PRODUCT.md and DESIGN.md

## Validation result
84 browser combinations passed; sample JSX lint passed using the production modal rule set; 19 current-workspace leaderboard tests passed. System-design HTML regenerated. Production integration awaits the user's selection; no commit created.

Revision 6: Remove the redundant selected-winner strip and selection controls. Show wins/rate directly within each mobile podium, capture count for capture mode, then begin the list at fourth place. Preserve accepted row layout.
