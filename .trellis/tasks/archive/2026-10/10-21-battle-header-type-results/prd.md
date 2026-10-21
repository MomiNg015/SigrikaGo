# Battle header, numbers and outcome colors

## User requirements
- Desktop header places black and white player information in two rows, like mobile.
- Align black/white, username and rank in three left-aligned shared columns.
- Use LXGW for numbers outside the board; preserve board numeric typography.
- Ordinary result windows use pale green for the current player's win and pale red for loss; keep draw background unchanged.
- Top-right room exit becomes pale red.

## Implementation boundaries
- Expose separate player name/rank fields from the existing room-view helper, preserving combined labels for accessibility and the special duel header.
- Update existing component CSS owners and explicit button roles, retaining gameplay and result classification.
- Verify real desktop/mobile room components, results and computed fonts with production CSS; retain special-scene styling.
- Update docs/system-design.md, corresponding chapter and existing specs; commit only scoped changes.

## Outcome
- Added structured player name/rank rows while preserving combined accessible labels and special-duel presentation. Shared grid columns align desktop and phone rows.
- Reused the existing LXGW face for numeric UI areas, with board selectors excluded. Kept mobile regular weights and covered portaled chat/tooltips.
- Result success/danger paper tints preserve the grid; draw keeps the existing base. Exit uses the semantic danger role and obsolete blue theme paint was removed.
- Palette hook review: unchanged black/white board-state and existing control colors are intentional. The new exit fallback colors are deliberately pale red per the user; the active theme uses the existing success/danger tokens. No hook suppression was added.

## Verification
- Six production-CSS browser cases passed: 1440/1024/390/320px header columns, numeric font winners, board-coordinate font exclusion, danger exit and win/loss/draw colors at desktop/phone widths. Phone spectator checks also verify full names without development-only test tools.
- Inspected desktop, 320px phone and result screenshots.
- `verify:battle-fixes`: 442 tests plus 4 system-design render tests passed. Focused header/result DOM, HUD and semantic-button tests also passed.
- Four real Pixi skill-effect stability cases passed on desktop and mobile Chromium.
- Full ESLint, production build and built CSS contract passed; CSS debt baseline did not grow. All unrelated pre-existing WIP remains outside this change.
