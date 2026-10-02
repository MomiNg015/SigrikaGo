# Restore Match Countdown Test Button

## Goal

Bring back the development-only match action that lets testers quickly force a live game into byo-yomi, with behavior matching the current testing need: one click should put both players into byo-yomi.

## Requirements

* Show room test tools by default in development builds while keeping them hidden in production builds.
* Keep the existing `test-enter-byo-yomi` action surface and button label/icon.
* Make `test-enter-byo-yomi` force both room players into byo-yomi, not only the acting player.
* Keep test tools visible in both desktop and mobile room action areas.
* Preserve the production safety boundary: production must not allow debug test actions.

## Acceptance Criteria

* [x] Unit tests cover both players entering byo-yomi from the debug action.
* [x] Static room tests cover development-only test tool visibility and mobile action dock visibility.
* [x] Production config validation still rejects enabled debug test actions in production.
* [x] System design docs mention the development-only room test shortcut behavior.

## Definition of Done

* Focused tests pass.
* `npm run docs:system-design` runs after docs changes.
* Existing unrelated dirty files are left untouched.

## Out of Scope

* Adding a new production gameplay action.
* Changing normal clock timing, byo-yomi countdown, or room phase rules.
* Redesigning the action bar beyond restoring this testing utility.

## Technical Notes

* Existing files already include `TestTools.jsx`, `RoomBattleStage` callbacks, and server `test-enter-byo-yomi` handling.
* Current implementation only resets the acting player's time.
* Current mobile CSS hides `.mobile-tab-panel .test-tools`.
