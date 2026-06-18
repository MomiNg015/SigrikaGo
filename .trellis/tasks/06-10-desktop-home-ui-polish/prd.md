# Desktop Home UI Polish

## Goal

Improve the desktop Bright School home screen so the home stage remains stable across wide, compact, and micro desktop widths while preserving the agreed visual hierarchy: match entry first, manual entry and player plaque second, utility dock third.

## Requirements

* On wide desktop layouts, the current user's name must not collide with or visually touch the avatar/portrait area in the player plaque.
* The current-user plaque must be clickable and open a modal titled `履历`.
* Move replay access, overall battle record, rank, and coins from `部员手册` into the new `履历` modal.
* Keep `部员手册` focused on character selection/details and decoration selection only.
* Apply the `履历`/manual split consistently on desktop and mobile.
* The `部员手册` sticker label on the desktop home stage must use the same rounded interface font family as nearby controls, not the mono HUD font.
* Remove the visible `LOBBY_ROOM (•̀ᴗ•́)و` status pill from the home header.
* Keep the existing mobile header menu and mobile home layout behavior intact.
* Replace the desktop home stage's overlap-prone layout with explicit `wide desktop`, `compact desktop`, `micro desktop`, and mobile breakpoints.
* Treat `>=1181px` as wide desktop with no horizontal scroll and the match entry as the largest visual target.
* Treat `1024px-1180px` as compact desktop with no horizontal scroll, named grid areas, and vertical page scrolling when height is constrained.
* Treat `701px-1023px` as micro desktop with a controlled `960px` minimum stage width and horizontal scrolling only inside the home stage panel, not the page body.
* Keep `<=700px` on the existing mobile home layout path.
* Keep all core clickable entries in normal CSS grid flow; only decorative layers may float.
* Keep the player plaque's internal structure fixed: avatar, identity, and mode stats stay on one row; content may scale within readable minimums, and the outer layout must give the plaque room before it can overflow.
* Let low-height desktop windows scroll vertically instead of compressing or clipping the home stage.
* Keep the manual entry visible as a secondary image entry that may shrink but must not crop or become a utility button.
* Keep the utility dock as six equal tertiary actions without changing its information architecture.
* Keep the footer fixed only where it cannot cover core home entries; compact, micro, and low-height desktop layouts must make room for it or let it flow after the stage.
* Update `docs/system-design.md` or the relevant `docs/system-design/` page for the home screen contract, then regenerate `docs/system-design.html`.

## Acceptance Criteria

* [ ] At a desktop viewport around `1468x674`, the player plaque has clear horizontal separation between avatar and username text.
* [ ] At `1920x1080`, `1440x900`, and `1366x768`, the desktop home stage has no page-level horizontal overflow and keeps match/manual/plaque/utility entries non-overlapping.
* [ ] At `1280x720`, vertical scrolling is allowed but core entries remain in normal grid flow and the footer does not cover them.
* [ ] At `1024x768`, compact desktop has no page-level horizontal overflow.
* [ ] Below `1024px` but above mobile width, the page body remains horizontally contained while the home stage panel exposes a controlled horizontal scrollbar around a `960px` stage.
* [ ] The default micro desktop view prioritizes the player plaque and match entry before the utility dock.
* [ ] The manual entry label renders with the project's rounded UI font stack and remains on one line.
* [ ] The home header no longer renders `.home-lobby-status` or `LOBBY_ROOM`.
* [ ] Clicking the current-user plaque opens `履历`.
* [ ] `履历` contains battle record, rank, coins, character record access, and replay access.
* [ ] `部员手册` no longer renders replay, battle record, rank, or coins.
* [ ] Existing home screen tests are updated to match the new contract.
* [ ] `docs/system-design.md` or a relevant `docs/system-design/` page and generated system-design HTML are updated.
* [ ] Browser verification covers `1920x1080`, `1440x900`, `1366x768`, `1280x720`, `1024x768`, and a micro desktop width below `1024px`.

## Definition of Done

* Tests added or updated where appropriate.
* Lint/typecheck/build verification is run for the touched frontend surface.
* Docs updated if behavior changes.
* Changes are committed without unrelated local files.

## Technical Approach

Keep the existing home component contract, but move desktop layout authority into the home terminal/final responsive CSS layers. Use named grid areas for all core clickable entries, reserve `mobile-adaptive/home-narrow-desktop.css` for compact and micro desktop safety, and keep theme-specific Bright School files focused on visual treatment. Add or update CSS contract tests before implementation.

## Decision (ADR-lite)

**Context**: The desktop home stage was using a mix of base grid rules, Bright School offsets, low-height overrides, and final `!important` safety patches. Different desktop widths could therefore force player plaque, manual entry, match entry, utility dock, and footer into conflicting spatial assumptions.

**Decision**: Use four explicit responsive modes: `>=1181px` wide desktop, `1024px-1180px` compact desktop, `701px-1023px` micro desktop with a `960px` controlled horizontal stage, and `<=700px` mobile. Core clickable entries must live in normal grid flow. Low-height desktop windows may scroll vertically. The player plaque keeps a fixed one-row internal structure and readable responsive scaling; outer layout gives it room.

**Consequences**: Wide and compact desktop stay free of page-level horizontal scrolling. Micro desktop accepts a localized horizontal scrollbar to preserve fixed desktop structure below `1024px`. Future home layout changes must update this contract and the system design documentation.

## Out of Scope

* Changing mobile portrait guard behavior.
* Changing matchmaking, house manual, or user data behavior.
* Reordering, hiding, or grouping the six utility dock actions.
* Adding JavaScript wheel hijacking for micro desktop horizontal scrolling.

## Technical Notes

* Relevant files: `src/home/components/HomeHeader.jsx`, `src/styles/themes/bright-school/home.css`, `src/styles/hud-components.css`, `src/home/HomeScreen.test.jsx`, `docs/system-design.md`.
* The project rule requires every update to synchronize `docs/system-design.md`.
