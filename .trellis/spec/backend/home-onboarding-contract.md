
# Home onboarding contract

## Scope / Trigger
Changes to the fixed home tour, initial story exit, or introductory reward settlement.

## Signatures
`GET /api/home-onboarding` returns `{status, eligible}`. `POST /api/home-onboarding/start` returns the same state. `POST /api/home-onboarding/finish` accepts `{outcome: "completed" | "skipped"}` and returns `{status, awarded}`. All routes require authentication and derive the user ID from the session.
`User.homeOnboardingStatus` defaults to pending; active tours restart after interruption. `homeOnboardingFinishedAt` and `onboardingExitedAt` are nullable timestamps. Both formal migration and startup compatibility guard must preserve existing accounts.

## Contracts
- New accounts finish/skip the story before the home tour. Old auto-shown users receive an exit backfill only when the column is introduced. Never repeat that backfill on ordinary startup.
- A conditional active-to-terminal update and both mailbox inserts share one transaction. Rewards are server constants, not request parameters. Never use notice state as reward eligibility.
- Share NpcDialogue and TypewriterText with teaching battles. Keep fixed home script separate from the generic story editor.
- Spotlight uses stable data-home-guide targets and real existing callbacks. Only the tour-owned activation may cross the input guard. Practice is explanatory only. Missing targets wait, with skip always accessible.
- Ordinary dialogue sits at the top; action dialogue follows above/below its target. The icon-only skip stays top-right. Player replies replace the NPC dialogue and are viewport-centered. The guide must never change backdrop padding, modal geometry or global layout variables; only the floating dialogue may move. Every highlighted button, including the non-action practice introduction, participates in dialogue avoidance. Mobile mailbox reveals the real menu. Escape cannot close underlying windows. Account changes invalidate in-flight responses.

## Validation / Errors
Invalid outcome -> 400. Finish before start -> 409. Terminal replay -> awarded false, no new mail. Failed second insert -> rollback first insert and terminal state. API failure -> retry without consuming the tour.

## Good / Base / Bad
Good: two tabs settle simultaneously and create exactly two messages total. Base: skip closes the tour and refreshes the badge. Bad: refresh consumes the tour, or old-account backfill runs on every boot.

## Required Tests
SQLite tests assert concurrent writes, rollback, fixed attachments and story eligibility. Hook tests assert interruption, account switch, exit ordering and retry. Browser checks exercise every real window at desktop and 390x844/360x640, verify no target/dialogue overlap and no accidental match actions.

## Wrong vs Correct
Wrong: read a nullable reward timestamp, insert mails, then update status outside a transaction.
Correct: transactionally claim `homeOnboardingStatus = active` with updateMany and insert both mails only when count is one.

## Development replay
Vite DEV permits a session-local replay after each story exit, including terminal accounts. Never reset server reward state. Terminal finish returns awarded false; do not show a new-mail toast. Production retains one-time behavior. Bind replay requests to account identity and defer to normal availability guards.
