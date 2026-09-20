# Battle UI scoped rollback

## Final user-directed scope
- Home follow-up: reorganize portrait ranking rows in a consistent reading order and prevent ordinary button text wrapping, especially friend action groups.
- Desktop follow-up: keep metadata, development tools, utility buttons and exit aligned on one row; optional groups and long names must not increase header height.
- Follow-up: member details match friend details; portrait dock tabs anchor to the action-tab baseline and grow downward without moving board/player information.
- Subsequent explicit exception: restore portrait skill-button default/selected depth, preserving shared multicolor backgrounds and depressed selection without glow.
- Restore the visual design from branch starting commit 5e897757. All beautification experiments, including skill-shadow overrides, are withdrawn.
- Retain icon-only development tools in the header, with accessible labels and the existing action/visibility guards.
- Keep the header on one row without increasing its height.
- Keep operation hints removed on desktop and mobile, including the shared tutorial stage.
- Preserve unrelated untracked files under .codex-run.

## Validation
Compare the final diff against 5e897757, run room/header/tutorial/style/document tests, lint, build and built CSS checks.
