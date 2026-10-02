# Interaction Sound Effects And Disabled Feedback

## Goal

Convert the four provided UI effect audio files to OGG assets and wire them into the player UI so available interactions, handbook character details, shop opening, and unavailable interactions each have distinct feedback. Unavailable objects should also show a shake animation whose duration matches the unavailable sound effect.

## What I Already Know

* Source audio files:
  * `C:/codex/musicsour/cVoice/effect/決定ボタンを押す42.mp3`
  * `C:/codex/musicsour/cVoice/effect/説明ウインドウが開く.mp3`
  * `C:/codex/musicsour/cVoice/effect/風鈴1.mp3`
  * `C:/codex/musicsour/cVoice/effect/ビープ音1.mp3`
* Runtime effect playback already exists in `src/audio/effectPlayback.js` and uses the `sfx` audio settings channel.
* Login preloading currently gathers effect assets in `src/shared/preloadAssets.js`.
* The handbook character detail open action lives in `src/modals/HouseModal.jsx`.
* The shop entry button lives in `src/home/components/HomeUtilityDock.jsx`, with modal state wired through `src/app/AppRoutes.jsx`.
* Handbook character cards and sortie buttons live in `src/modals/house/HouseCharacterGrid.jsx`.
* Shop item purchase buttons and shop cards live in `src/modals/shop/ShopItemCard.jsx`.
* Repo instruction: every update must also update `docs/system-design.md`.

## Assumptions

* The target runtime asset directory is `public/assets/music/` for generic UI sound effects, matching current effect sounds.
* The converted asset names should be stable ASCII names:
  * `ui_confirm.ogg`
  * `ui_detail_open.ogg`
  * `ui_shop_open.ogg`
  * `ui_unavailable.ogg`
* "All available interactions" means app-level buttons and role-button elements where a click is accepted, excluding text inputs and disabled controls. This should be implemented with delegated click handling so the project does not need every button to call sound code manually.
* "Unavailable button or card" covers native disabled buttons, aria-disabled/button-like controls, locked handbook cards, empty shop slots, and disabled shop purchase attempts.
* The unavailable shake should be a short CSS animation driven by a temporary class, with duration taken from the converted unavailable audio duration.

## Requirements

* Convert all four source files to project OGG assets.
* Add constants/playback helpers for:
  * available interaction confirm sound
  * handbook detail open sound
  * shop open sound
  * unavailable sound
* Trigger the detail-open sound when opening a character detail in the handbook.
* Trigger the shop-open sound when clicking the home shop entry.
* Trigger the confirm sound for successful general interactions.
* Trigger the unavailable sound and shake feedback for unavailable controls/cards.
* Preserve existing character voice playback, system voice playback, and audio settings volume behavior.
* Preload the new effect assets after login.
* Update docs and tests.

## Acceptance Criteria

* [ ] Four OGG files exist under the project assets directory.
* [ ] Clicking a normal enabled button plays the confirm sound through the `sfx` channel.
* [ ] Opening a handbook character detail plays the detail-open sound.
* [ ] Opening the shop plays the shop-open sound.
* [ ] Clicking disabled/unavailable buttons or locked/unavailable cards plays the unavailable sound and applies a same-duration shake animation to the target object.
* [ ] Existing audio tests and relevant modal/preload tests pass.
* [ ] `npm test` passes.
* [ ] `npm run build` passes.
* [ ] `docs/system-design.md` and generated HTML are updated.

## Out Of Scope

* No new settings UI for per-effect selection.
* No change to character voice files or BGM behavior.
* No deletion of old or unrelated assets.

## Technical Notes

* `effectPlayback.js` already provides shared effect decoding/cache/fallback behavior.
* General interaction sound should avoid double-playing on specialized interactions where a more specific sound is fired.
* Disabled native buttons usually do not emit click events, so unavailable feedback needs pointer-level capture handling.
