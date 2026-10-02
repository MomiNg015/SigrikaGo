# Fix Mobile Room Request Toast Board Shift

## Goal

Prevent the mobile board from visibly changing position when timed room request toasts appear for draw requests, counting requests, received draw/counting requests, or counting result confirmation.

## Requirements

* Timed room request toasts must keep their existing content, actions, progress bar, auto-dismiss behavior, and accessibility live-region semantics.
* On mobile, showing or hiding those toasts must not participate in the room screen layout tree or change board sizing/position.
* Desktop behavior must remain visually equivalent.
* Project system design documentation must be updated and regenerated.

## Acceptance Criteria

* [ ] `TimedRoomRequestToast` renders through `document.body` in browser environments.
* [ ] Server/static rendering remains safe for existing tests.
* [ ] Existing request toast tests still pass and include a regression guard for the portal.
* [ ] `docs/system-design.md` and generated `docs/system-design.html` reflect the layout behavior.

## Definition of Done

* Relevant unit tests pass.
* System design HTML is regenerated with `npm run docs:system-design`.
* Changes are scoped to the request toast layout behavior and docs.

## Out of Scope

* Redesigning toast content, copy, timing, or gameplay request flow.
* Changing global app toasts or unrelated modals.

## Technical Notes

* Relevant files: `src/room/requestToasts/TimedRoomRequestToast.jsx`, `src/room/requestToasts/timedRoomRequests.test.js`, `docs/system-design.md`.
* Current mobile room board size is heavily viewport-derived; keeping the request toast outside `.mobile-room-screen` avoids layout tree participation and reduces reflow risk.
