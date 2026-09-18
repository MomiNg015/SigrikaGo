# Mobile battle clipping and copy

## Goal
Fix portrait mobile skill tooltip clipping and card/shadow clipping; use the requested tutorial warning and hide room close countdown.

## Requirements
- Portal mobile skill/stat tooltips outside clipped player and board containers, retaining theme and floating layer ordering.
- Reserve right/bottom shadow space for battle viewport and scrollable action content.
- Warning is exactly 请在黄圈位置落子.
- Remove countdown presentation only; retain server five-minute room cleanup.
- Preserve existing uncommitted work, desktop layout, board interactions, and tutorial scrolling.

## Acceptance
- Tooltip is outside player clipping ancestors and remains interactive.
- Portrait board/dock shadows have space; action panel remains scrollable.
- Targeted regressions and project checks pass; system design regenerated.

## Scope
No backend behavior changes or visual redesign. Existing narrow viewport and long tutorial choices are regression cases. No open product questions.
