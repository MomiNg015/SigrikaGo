# Settings Interface Theme Buttons

## Goal

Update Settings > Interface so the theme selector presents three player-facing theme buttons on both desktop and mobile, while only the current Bright School theme is selectable today.

## Requirements

- Remove the small "页面风格" heading from the Interface tab.
- Render three theme buttons from left to right:
  - "没经费的简朴围棋部风格"
  - "中规中矩的围棋部风格"
  - "莫塔里家族赞助的奢华风格"
- The first theme is selected by default and maps to the existing Bright School theme.
- Clicking the second or third theme does not change the theme and shows a toast: "敬请期待~".
- Desktop and mobile layouts both use a three-column button grid.
- Mobile Settings > Interface uses a taller, viewport-bounded modal state so the three theme buttons fit without an inner vertical scrollbar.
- Keep accessible native button semantics, visible selected state, and touch-friendly button sizing.

## Acceptance Criteria

- [ ] Settings > Interface no longer renders "页面风格".
- [ ] Static markup exposes all three theme button labels in order.
- [ ] The first button is selected for the default `bright-school` theme.
- [ ] Future theme buttons call the notice/toast callback with "敬请期待~".
- [ ] Desktop and mobile CSS keep `.theme-choice-grid` at three columns with stable touch targets.
- [ ] Portrait mobile Interface tab does not show an inner vertical scrollbar for the three theme choices.
- [ ] System design docs are updated and `npm run docs:system-design` is run.

## Definition of Done

- Focused unit/static tests pass for `SettingsModal`.
- Relevant CSS contract tests pass.
- Docs HTML is regenerated.

## Technical Approach

- Keep actual persisted theme ids unchanged; add player-facing theme option metadata inside `SettingsModal`.
- Add `onNotice` to `SettingsModal` and wire it from `AppOverlays` to the existing app toast queue.
- Adjust settings panel CSS and final Bright School portrait mobile CSS so theme buttons stay three columns on desktop and mobile.

## Out of Scope

- Implementing the second or third visual themes.
- Changing theme persistence, CSS import registration, or app shell theme class behavior.

## Technical Notes

- Relevant files: `src/modals/SettingsModal.jsx`, `src/modals/SettingsModal.test.jsx`, `src/styles/commerce/shop-settings/settings-panel.css`, `src/styles/mobile-adaptive/bright-school-portrait/settings-tabs.css`, `src/app/AppOverlays.jsx`, `docs/system-design.md`, `docs/system-design/06-ui-theme-mobile.md`.
- `ui-ux-pro-max` local search script was unavailable, so design guidance was applied from the skill text: 44px touch targets, explicit selected state, non-blocking toast feedback, and mobile/desktop responsive parity.
