# Fix Mobile Replay Scroll And Mailbox Badge

## Goal

Fix two mobile UI regressions without changing the wider application architecture: the profile/detail replay list must be vertically scrollable on phone portrait layouts, and the mobile mailbox unread count must render as a corner badge instead of participating in the menu button text layout.

## Requirements

- Mobile profile/detail replay dialogs keep the header visible and let the replay list scroll inside the dialog.
- Replay list rows remain card-like on mobile and keep existing desktop behavior unchanged.
- Mobile mailbox menu unread count is positioned like the desktop topbar badge, with a stable touch target and no text wrapping/layout shift.
- Desktop mailbox badge behavior remains unchanged.
- Update the system design documentation per project instructions.

## Acceptance Criteria

- [ ] `src/modals/ReplayList.test.jsx` covers the mobile profile replay scroll container contract.
- [ ] `src/home/HomeScreen.test.jsx` covers the mobile mailbox badge being absolutely positioned rather than a static menu-grid cell.
- [ ] Focused tests for replay list and home header pass.
- [ ] `npm run docs:system-design` regenerates `docs/system-design.html`.

## Definition of Done

- Tests added or updated before production CSS changes.
- Focused test commands pass.
- System-design docs and generated HTML are updated.

## Technical Approach

Use CSS-only fixes in existing mobile safety layers. The replay dialog should bound `.profile-replay-list-scroll` with a `minmax(0, 1fr)` grid/flex contract and keep the inner replay table from stealing layout height. The mobile mailbox badge should reuse the absolute badge visual model with `position: absolute`, `top/right` offsets, fixed numeric dimensions, and no contribution to the menu button grid.

## Out of Scope

- No API, data model, mailbox semantics, or replay data changes.
- No redesign of desktop profile dialogs or desktop topbar buttons.

## Technical Notes

- Relevant files: `src/styles/mobile-adaptive/bright-school-overrides/replay-dialog.css`, `src/styles/themes/bright-school/mobile/home-shell/top-strip-menu.css`, `src/styles/home-terminal/top-strip.css`, `src/modals/ReplayList.test.jsx`, `src/home/HomeScreen.test.jsx`.
- The `ui-ux-pro-max` helper script symlink is broken in this environment, so the skill guidance was applied from the loaded `SKILL.md`: stable layout bounds, 44px touch targets, no layout shift from badges, and mobile scroll containment.
