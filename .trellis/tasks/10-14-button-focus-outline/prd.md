# Remove ordinary button focus outlines

## Goal
Remove the extra dark focus outline on ordinary player buttons, including close actions, as explicitly requested by the user.

## Requirements
- Remove the ordinary Bright School button owner's focus outline, including native fallback outlines.
- Preserve borders, shadows, hover/press feedback and keyboard/modal focus behavior.
- Keep specialized artwork controls and input fields outside this change.

## Acceptance Criteria
- Ordinary close/action buttons have no extra outline while focused on desktop and portrait mobile.
- Existing focus trapping, Escape and focus restoration still pass.
- Update system design and regenerate its HTML.

## Technical Approach
The ordinary button state owner currently adds a 2px ink outline at a 3px offset on :focus-visible. Reset outline on :focus in that same owner. Do not alter ModalDialog focus management.

## Out of Scope
Layout, modal behavior, input-field focus styling, specialized image/card focus styling and unrelated working-tree changes.

## Verification
- Lint, production build, built CSS contracts and system-design HTML generation passed.
- 154 focused assertions passed, including all button state and ModalDialog behavior tests.
- CSS inventory has two unrelated failures: current total CSS size exceeds its baseline, and `mobile-adaptive/match-mode-title-layout.css` contains an unregistered 360px query. This fix reduces CSS and adds no media queries; do not absorb unrelated changes.
- Chromium checked the actual production LeaderboardModal through the existing isolated preview at 1440x1000 and 390x844: initial and keyboard focus retain the close button, with `outline-style: none`, its original 3px border and 3px hard shadow.
