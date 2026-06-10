# Desktop Home UI Polish

## Goal

Improve the desktop Bright School home screen so the player plaque, manual entry label, and top header feel consistent and do not show debug/status clutter.

## Requirements

* On wide desktop layouts, the current user's name must not collide with or visually touch the avatar/portrait area in the player plaque.
* The `部员手册` sticker label on the desktop home stage must use the same rounded interface font family as nearby controls, not the mono HUD font.
* Remove the visible `LOBBY_ROOM (•̀ᴗ•́)و` status pill from the home header.
* Keep the existing mobile header menu and mobile home layout behavior intact.
* Update `docs/system-design.md` for the home screen contract.

## Acceptance Criteria

* [ ] At a desktop viewport around `1468x674`, the player plaque has clear horizontal separation between avatar and username text.
* [ ] The manual entry label renders with the project's rounded UI font stack and remains on one line.
* [ ] The home header no longer renders `.home-lobby-status` or `LOBBY_ROOM`.
* [ ] Existing home screen tests are updated to match the new contract.
* [ ] `docs/system-design.md` and generated system-design HTML are updated.

## Definition of Done

* Tests added or updated where appropriate.
* Lint/typecheck/build verification is run for the touched frontend surface.
* Docs updated if behavior changes.
* Changes are committed without unrelated local files.

## Technical Approach

Remove the status pill from `HomeHeader.jsx`, update the Bright School desktop CSS for the tactical player plaque and hologram manual label, adjust contract tests, and record the changed desktop home layout in `docs/system-design.md`.

## Out of Scope

* Reworking the full home stage layout.
* Changing mobile portrait guard behavior.
* Changing matchmaking, house manual, or user data behavior.

## Technical Notes

* Relevant files: `src/home/components/HomeHeader.jsx`, `src/styles/themes/bright-school/home.css`, `src/styles/hud-components.css`, `src/home/HomeScreen.test.jsx`, `docs/system-design.md`.
* The project rule requires every update to synchronize `docs/system-design.md`.
