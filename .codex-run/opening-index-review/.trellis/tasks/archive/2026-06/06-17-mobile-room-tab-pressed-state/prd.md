# Mobile Room Tab Pressed State

## Goal

Fix the mobile room function-area tab press/selected visual so tabs without drop shadows do not shift position when pressed. The selected/pressed state should read through background color only, matching tab behavior and avoiding jitter in the bottom mobile control area.

## Requirements

* Scope the change to mobile room function-area tabs, including the chat tab shown in the browser comment.
* Remove transform/offset-based pressed or selected feedback for these tabs when the mobile no-shadow treatment is active.
* Preserve the existing selected/background color distinction.
* Do not change desktop tab/button behavior.

## Acceptance Criteria

* [ ] On mobile, pressing/selecting function-area tabs does not move the tab vertically or horizontally.
* [ ] The selected tab still changes background color clearly.
* [ ] Existing mobile room layout remains stable at 393px-wide portrait viewports.
* [ ] CSS contract tests are updated if this behavior is covered by static style assertions.
* [ ] Project checks pass.

## Definition of Done

* Relevant CSS updated with minimal scope.
* Tests/docs updated where required by project conventions.
* `npm run check` passes.

## Out of Scope

* Redesigning the mobile room tab bar.
* Changing desktop button pressed effects.
* Changing room replay controls or chat content behavior.

## Technical Notes

* Browser evidence points to `button#mobile-room-tab-chat` in the mobile room tab strip.
* The implementation should follow existing mobile-room and Bright School override layering.
