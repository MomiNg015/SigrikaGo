# Fix skill effect end flash

## Goal

Remove the brief white flash that appears near the end of board skill presentations by fixing the live Pixi preparation/playback boundary and fading residual renderer layers before cleanup.

## What I Already Know

* The regression is visible in character skill board-effect presentations and was not present before the recent Pixi skill-effect stability work.
* `src/room/BoardSkillEffects.jsx` currently starts Pixi app initialization and renderer asset loading during the banner window, but playback can proceed after `app.init()` before `Assets.load()` finishes for image-backed renderers.
* PixiJS v8 `Sprite.from()` reads from the asset cache; it does not fetch a URL. Image-backed renderers must load their textures before visible playback.
* `src/room/boardSkillEffectRegistry.js` contains persistent tail opacity in `playProtocolTakeover()` and `playMeteorErase()` that can still be visible at `progress=1`, then disappear abruptly when the canvas is removed.
* The fix touches protected room/board/skill presentation surfaces, so it needs focused tests and system-design documentation updates.

## Requirements

* Asset-backed Pixi board effects must not enter visible playback until the Pixi app and all renderer-declared image assets are ready.
* `BoardSkillEffects` must continue preparing Pixi during the banner window and keep the canvas pointer-transparent.
* Renderer asset failure should still be contained to the effect layer and must not blank or block the room.
* Protocol takeover and meteor erase residual Pixi layers must fade to transparent before the host cleanup removes the canvas.
* `BoardSkillEffects` must detach the visible Pixi canvas from the DOM before destroying the Pixi/WebGL app, so mobile context teardown cannot paint a white frame in the composed page.
* Existing skill timing, pending-skill handoff, board interaction, and mobile/desktop board geometry must remain unchanged.

## Acceptance Criteria

* [ ] `preparePixiEffect().ready` waits for renderer image asset loading before returning the playable runtime.
* [ ] A regression test fails on the old behavior where the real canvas is ready before renderer assets finish.
* [x] Protocol takeover target-lock opacity reaches zero by the final frame.
* [x] Protocol takeover and meteor erase temporary Pixi residue is transparent before cleanup.
* [x] Pixi app cleanup detaches `.board-effects-canvas` before `app.destroy()` runs.
* [ ] No visible DOM/CSS fallback animation is reintroduced for failed Pixi effects.
* [ ] System-design docs describe the resource-ready playback contract and no-residual-tail cleanup contract.

## Definition of Done

* Focused tests added or updated before production code changes.
* Targeted room/skill tests pass.
* `npm run docs:system-design` runs after docs changes.
* Existing unrelated dirty worktree changes are preserved and excluded from this task.

## Technical Approach

Restore the safer preparation boundary in `BoardSkillEffects.jsx`: start app init and asset loading eagerly during the banner, but make the playable `ready` promise resolve only after both have completed. Then tighten targeted renderer alpha math in `boardSkillEffectRegistry.js` so known residual layers reach zero opacity before the canvas is removed. Keep this scoped to the effect lifecycle and renderer opacity formulas; do not redesign the skill animations.

## Out of Scope

* Reworking skill rules, server resolution timing, or pending-skill payload shape.
* Replacing Pixi renderers with CSS/DOM fallback visuals.
* Broad Bright School, mobile room, or board CSS cleanup.
* Changing normal board interaction, targeting, scoring, or replay semantics.

## Technical Notes

* Relevant code: `src/room/BoardSkillEffects.jsx`, `src/room/boardSkillEffectRegistry.js`, `src/room/boardSkillEffectAssets.js`, `src/shared/skillPresentation.js`.
* Relevant tests: `src/room/BoardSkillEffects.test.js`, potential focused registry/source tests for renderer tail alpha contracts.
* Relevant docs: `docs/system-design.md` and possibly `docs/system-design/05-assets-audio-preload.md`.
