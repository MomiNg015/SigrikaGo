# Add second home BGM random playback

## Goal

Add the supplied `main_bgm_1_once.ogg` and `main_bgm_1_loop.ogg` files as the second main-screen BGM, and make each entry into the home screen choose one available home BGM at random.

## Requirements

* Copy the supplied audio files into the runtime music asset directory under stable `/assets/music/` paths.
* Register a second default-unlocked, non-purchasable home BGM track in the shared music catalog.
* When the app enters `view === "home"`, select one usable home BGM at random from the home tracks available to the current user.
* Keep the chosen track stable while the user remains on the same home visit, including ordinary re-renders.
* Re-randomize on the next distinct entry into the home view.
* Preserve battle, result, tutorial battle, and skill BGM behavior.
* Keep startup preload coverage for all accessible home BGM sources.
* Update the system-design audio/resource documentation and regenerate `docs/system-design.html`.

## Acceptance Criteria

* [ ] `MUSIC_TRACKS` contains the original `home-default` and a second home BGM using the supplied intro/loop files.
* [ ] `resolveBackgroundMusic({ view: "home" })` can resolve both default home tracks through a deterministic random input in tests.
* [ ] The app-level background music hook keeps a home visit's random result stable and chooses again after leaving and re-entering home.
* [ ] Login preload includes the new home BGM intro and loop sources for users who can access default music.
* [ ] Existing room, skill, result-modal, and tutorial battle music tests remain valid.
* [ ] `docs/system-design.md`, `docs/system-design/05-assets-audio-preload.md`, and generated `docs/system-design.html` reflect the new home BGM randomization contract.

## Definition of Done

* Targeted tests for the resolver, hook, and preload manifest pass.
* `npm run docs:system-design` has been run after doc edits.
* Broader project check is run or any inability to run it is reported.

## Technical Approach

Add the second home track as static catalog data, then extend home BGM resolution to use a random pick among usable home tracks when no valid explicit home selection is supplied. The app hook will provide and retain a per-home-entry random value so randomization happens at the home view boundary rather than during every render. Preload already expands playback sources from every visible/default track, so adding the track to `MUSIC_TRACKS` should automatically include both new files.

## Decision (ADR-lite)

**Context**: The current app resolves home BGM through `src/shared/musicLibrary.js`, while `src/app/useBackgroundMusicTrack.js` owns app-level view context.

**Decision**: Keep the music catalog static and perform random home selection through the existing resolver, with `useBackgroundMusicTrack` supplying a stable random value for each home entry.

**Consequences**: This avoids changing the low-level WebAudio player and keeps future home tracks automatically eligible for random playback, while preserving explicit selected home music if that is configured later.

## Out of Scope

* Admin upload/create/delete support for music tracks.
* New music selection UI.
* Changes to desktop or mobile visual layout.
* Changes to skill, battle, result, voice, or SFX playback behavior.

## Technical Notes

* Existing first home BGM: `public/assets/music/main_bgm.ogg` via `MUSIC_TRACKS["home-default"]`.
* Supplied source files:
  * `C:/codex/musicsour/mainAudio/main_bgm_1_once.ogg`
  * `C:/codex/musicsour/mainAudio/main_bgm_1_loop.ogg`
* Likely impacted files:
  * `src/shared/musicLibrary.js`
  * `src/app/useBackgroundMusicTrack.js`
  * `src/shared/musicLibrary.test.js`
  * `src/shared/preloadAssets.test.js`
  * `docs/system-design.md`
  * `docs/system-design/05-assets-audio-preload.md`
