# Rename changelog tab

## Goal
Rename the announcement window's “更新日志” tab to “日志” on desktop and mobile.

## Requirements
- Update the shared tab label; retain the changelog ID and existing behavior.
- Update existing tab-name assertions and system-design documentation.

## Acceptance Criteria
- The tab is accessible as “日志”.
- Existing announcement and bookmark tab tests pass.

## Out of Scope
- No API, layout, empty-state, or content changes.

## Spec Review
One-off copy change; no new architectural or reusable coding contracts.
