# Fix Replay Time Column Truncation

## Goal

Desktop replay-list time values should display completely instead of being truncated with an ellipsis, while keeping the existing mobile card layout stable.

## Requirements

- Expand the desktop replay table time column enough for the formatted `zh-CN` date/time string.
- Remove desktop-only ellipsis behavior from the replay time text.
- Preserve mobile replay-card behavior and avoid introducing horizontal overflow on phone layouts.
- Add or update a CSS contract test that guards the desktop time-column behavior.
- Update `docs/system-design.md` and regenerate `docs/system-design.html` per project instructions.

## Acceptance Criteria

- [ ] Desktop `.replay-time-cell` text no longer has `text-overflow: ellipsis`.
- [ ] Desktop replay table column definitions reserve enough width for full timestamps.
- [ ] Existing mobile replay list/card assertions still pass.
- [ ] Targeted replay-list tests pass.
- [ ] System design HTML is regenerated.

## Definition of Done

- Targeted tests run successfully.
- `npm run docs:system-design` runs successfully.
- Only replay-list styling/tests, required docs, and this task record are changed for this fix.

## Out of Scope

- Changing replay date formatting.
- Redesigning replay rows, outcome colors, or player-name truncation.
- Backend replay record changes.

## Technical Notes

- Issue source: `src/styles/modals/replay-mode-resume/replay-list-table.css` uses a narrow first column and ellipsis on `.replay-time-cell > span:last-child`.
- Mobile replay layouts are controlled by `src/styles/mobile-modals/phone-replay-profile.css`, `src/styles/modals/phone.css`, and final Bright School mobile overrides.
