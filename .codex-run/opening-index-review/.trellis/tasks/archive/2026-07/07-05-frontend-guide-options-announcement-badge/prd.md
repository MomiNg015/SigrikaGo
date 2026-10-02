# Fix tutorial options overflow and mobile announcement badge

## Goal

Fix two scoped frontend regressions without redesigning the existing Bright School UI: tutorial battle user options must not show a horizontal scrollbar, and the mobile home announcement unread dot must anchor to the announcement button's top-right corner like the mailbox badge.

## Requirements

- Tutorial battle user option controls must fit within their owning action area on desktop and mobile without exposing horizontal scrolling.
- Tutorial option labels should wrap or shrink inside their buttons rather than forcing the option row wider than the viewport.
- Mobile announcement entry unread badge must be positioned relative to the announcement button, in the button's top-right corner, matching the mailbox badge model.
- Desktop announcement/mailbox button layout must remain stable and must not gain accidental badge overlap or layout shift.
- Changes must preserve existing visual style, colors, button semantics, and interaction feedback.

## Acceptance Criteria

- [ ] The effective tutorial battle CSS prevents horizontal overflow for the user option/action area.
- [ ] A regression test covers the tutorial option overflow contract.
- [ ] The mobile announcement badge uses the same button-anchored top-right positioning model as mailbox.
- [ ] A regression test covers announcement badge positioning without weakening mailbox badge behavior.
- [ ] Focused tests pass for the touched tutorial/home style contracts.

## Definition of Done

- Tests are added or updated before production code changes where practical.
- Desktop and mobile contracts are checked together.
- `docs/system-design.md` or a relevant `docs/system-design/` page is updated if the fix changes documented UI/theme behavior.
- `npm run docs:system-design` is run if system-design docs change.

## Technical Approach

Use the existing CSS ownership model. First locate the tutorial battle route CSS and the home/utility entry badge CSS. Add the narrowest owner selectors needed to prevent horizontal overflow and to make the mobile announcement badge relative to its button. Prefer existing mailbox badge patterns over new positioning conventions.

## Out of Scope

- Redesigning the tutorial battle action bar.
- Changing announcement or mailbox unread-state data logic.
- Broad CSS cleanup, theme restructuring, or Tailwind migration.
- Changing unrelated home utility entry layout or assets.

## Technical Notes

- Project frontend instructions require `frontend-design`, `ui-ux-pro-max`, and `interaction-design` for frontend issues.
- Relevant UX constraints: no horizontal scroll on mobile, stable touch targets, button badges should be tied to their trigger, and motion/feedback should not change layout dimensions.
- Relevant Trellis specs: `.trellis/spec/frontend/css-architecture.md`, `.trellis/spec/frontend/quality-guidelines.md`, and `.trellis/spec/guides/code-reuse-thinking-guide.md`.
- Memory notes for tutorial battle action areas say changes should stay scoped to the tutorial battle action bar and related tests/docs.
