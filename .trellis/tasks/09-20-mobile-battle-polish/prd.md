# Battle UI scoped rollback

## Final user-directed scope
- Restore the visual design from branch starting commit 5e897757. All beautification experiments, including skill-shadow overrides, are withdrawn.
- Retain icon-only development tools in the header, with accessible labels and the existing action/visibility guards.
- Keep the header on one row without increasing its height.
- Keep operation hints removed on desktop and mobile, including the shared tutorial stage.
- Preserve unrelated untracked files under .codex-run.

## Validation
Compare the final diff against 5e897757, run room/header/tutorial/style/document tests, lint, build and built CSS checks.
