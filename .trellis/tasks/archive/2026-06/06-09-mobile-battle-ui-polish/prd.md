# Mobile battle UI polish

## Goal

Review and improve the mobile battle room so it feels cleaner and more intentional while preserving gameplay reliability. The layout must keep the board playable, keep both player information strips complete, keep the functional dock complete, and prevent room controls, modals, tabs, action buttons, timers, portraits, and board content from covering each other on phone-sized screens.

## What I already know

* The user specifically requested `ui-ux-pro-max + frontend-design` for the review and visual polish.
* The target surface is the mobile battle room, especially layout beauty, element overlap prevention, complete information areas, complete function areas, and an unobstructed board.
* The current mobile battle room is implemented by `src/room/RoomBattleStage.jsx` using `.mobile-room-viewport.mobile-battle-layout`.
* The mobile battle layout renders four vertical zones: opponent player info, board viewport, self player info, and a bottom mobile room dock.
* The header mobile menu is implemented in `src/room/header/RoomHeader.jsx`.
* Mobile room CSS is spread across `src/styles/mobile-room.css`, `src/styles/mobile-adaptive.css`, `src/styles/room.css`, `src/styles/responsive.css`, `src/styles/room-terminal.css`, and Bright School theme overrides in `src/styles/themes/bright-school/mobile.css`.
* Recent fixes already removed the mobile chat panel exit button, right-aligned the chat trigger, lowered mobile room menu stacking, restored shared message-board close-button stacking, removed many Bright School mobile room shadows, and centered icon-only action buttons.
* `AGENTS.md` requires every update to sync `docs/system-design.md`.

## Assumptions

* The main theme to polish is the currently active Bright School/player-theme-enabled mobile room, while shared mobile CSS should remain robust for non-themed surfaces.
* The first pass should preserve existing room JSX and improve CSS/layout contracts unless JSX changes are clearly needed for information completeness or accessibility.
* The board must remain the priority content: it should keep a stable square aspect ratio, stay inside the viewport, and not be covered by overlays during normal play.
* The dock should remain tabbed on mobile, with actions/members/chat available without pushing the board off-screen.

## Open Questions

* None. The user selected the full-screen compact game console direction on 2026-06-09.

## Requirements

* Audit the mobile battle layout at common phone dimensions, including around 393x852, 393x824, 384x824, and 375x667.
* Prevent overlap among header controls, player info strips, board, bottom dock, modals, and transient menus.
* Ensure both player info strips keep the important elements visible: portrait/result badge, player name, rank, rating, capture/dead-stone stats, timer, timer track, and skill chip.
* Ensure the functional dock keeps all expected controls available in normal play, replay, scoring/counting, members, and chat states.
* Ensure normal board interaction is not blocked by the header, player info, dock, menus, hints, or overlays when no modal is intentionally active.
* Improve visual hierarchy and polish using the existing Bright School aesthetic without adding noisy decoration, large shadows, or layout-shifting effects.
* Remove border-shadow/drop-shadow/text-shadow treatment from battle-room labels and controls, including header tags, player chips, timer controls, action buttons, menu buttons, and chat controls, while preserving board point and stone visuals.
* Keep touch targets practical for mobile use, especially header icons, tabs, and action buttons.
* Preserve desktop behavior unless a change is explicitly scoped to mobile.
* Update `docs/system-design.md` and regenerate `docs/system-design.html`.
* Optimize for a fixed full-screen compact game console layout: the mobile battle surface should fit inside `100dvh`, keep the board centered as the main play target, and avoid page-level scrolling during normal play.

## Acceptance Criteria

* [ ] At 393x852 and 375x667 mobile viewports, the room header, opponent info, board, self info, and dock all fit without incoherent overlap.
* [ ] The normal mobile battle screen uses a fixed `100dvh` game-console layout rather than relying on page scrolling.
* [ ] The board stays square, centered, and playable; point buttons are not covered by non-modal UI during normal play.
* [ ] Player info strips show complete core information without clipping important labels or covering the portrait/result badge.
* [ ] The action panel shows all expected action buttons or replay controls with icons centered and labels readable when labels are present.
* [ ] Battle-room labels and control buttons render flat with borders only; no box/drop/text shadows are applied to room tags or action controls.
* [ ] Members and chat panels remain reachable and do not reintroduce a mobile in-panel exit-room button.
* [ ] Mobile menus and modals have sane stacking: active modals can close normally; room menu controls do not float above modal content.
* [ ] Relevant layout contracts are covered by unit/static tests.
* [ ] `npm run docs:system-design` passes.
* [ ] Targeted Vitest coverage for room/mobile/modal layout passes.

## Definition of Done

* Tests added or updated for the mobile layout contracts.
* Relevant lint/type/test commands are run or any skipped command is explained.
* `docs/system-design.md` and generated `docs/system-design.html` are updated.
* Work is kept scoped to mobile battle UI and directly related tests/docs.

## Out of Scope

* Redesigning desktop room layout.
* Changing game rules, socket behavior, scoring logic, or backend APIs.
* Adding new visual assets unless an existing asset constraint makes it necessary.
* Replacing the existing theme system.

## Technical Notes

* Relevant code inspected:
  * `src/room/RoomBattleStage.jsx`
  * `src/room/header/RoomHeader.jsx`
  * `src/styles/mobile-room.css`
  * `src/styles/mobile-adaptive.css`
  * `src/styles/themes/bright-school/mobile.css`
  * `docs/system-design.md`
* Relevant Trellis specs:
  * `.trellis/spec/frontend/index.md`
  * `.trellis/spec/guides/index.md`
* Frontend spec files are currently index-level placeholders, so this PRD includes explicit layout and testing criteria.
