# 主界面新手引导

## Goal
Implement the user-approved home tour after initial story/tutorial exit, including a one-time rollout to existing accounts.

## Requirements
- Preserve all dialogue and sequence from 主界面引导.docx: handbook, Sigrika detail, matching/practice, resume, player choice, recruitment, shop, mailbox, farewell.
- Reuse tutorial dialogue presentation. Dim the screen, animate a rectangular spotlight, require the highlighted action, block unrelated interactions, and automatically close introduced windows.
- Allow skipping without adding replay. Refresh restarts unfinished tours. Defer during story/battle/recovery.
- Persist pending/active/completed/skipped state. Finish or skip atomically sends two single-attachment mails: campus poster x3 and radio ticket x3, once per account.
- Defer welcome mail toast until tour settlement. Preserve existing welcome mail.
- Fixed code-owned script, no admin editor changes. Desktop and portrait mobile support.

## Acceptance Criteria
- New/existing users, story skip, restart, account switch and retries behave correctly.
- Spotlight never advances without its target. Unrelated purchase/match/claim input cannot pass through.
- Concurrent settlement cannot duplicate mails; failures remain retryable.
- Desktop and portrait visual checks, focused tests, project quality checks and generated system design documentation pass.

## Constraints
Preserve all unrelated dirty files. User has approved the complete implementation plan in chat.
