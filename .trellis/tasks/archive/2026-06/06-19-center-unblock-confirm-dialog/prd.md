# center-unblock-confirm-dialog

## Goal

Fix the confirmation dialog shown when removing a user from the blacklist so it stays centered in the viewport, matching the already-correct profile report dialog behavior.

## Requirements

- Center the blacklist-removal confirmation dialog in the visible interface on desktop and mobile.
- Keep the same fix available for other `confirm-inline-modal` confirmation overlays that share this modal shell, including friend-removal confirmation.
- Preserve existing confirm/cancel behavior and social API calls.
- Do not touch unrelated nameplate, achievement, or system-design work currently dirty in the worktree.

## Acceptance Criteria

- [ ] The blacklist removal confirmation dialog uses fixed viewport centering.
- [ ] The friend removal confirmation dialog keeps the same centered modal contract.
- [ ] The modal width remains bounded to the viewport on desktop and mobile.
- [ ] Regression tests cover the centered `confirm-inline-modal` contract.
- [ ] Relevant tests pass.

## Out of Scope

- Changing social relationship behavior.
- Changing report dialog content or positioning.
- Redesigning confirmation panel copy or buttons.

## Technical Notes

- Related markup: `src/modals/friends/FriendsOverlays.jsx`, `src/room/RoomPeopleList.jsx`.
- Related CSS: `.room-floating-modal.confirm-inline-modal`, currently in modal/room style layers.
