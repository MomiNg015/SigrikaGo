# Fix Cloud Home BGM Resume Latency

## Goal

Make the home background music start promptly after login and recover predictably after refresh in production/cloud deployments, within browser autoplay policy limits. The fix should preserve user audio settings, avoid surprise playback while music is disabled or intentionally paused, and keep the existing WebAudio plus HTML audio fallback strategy.

## What I Already Know

* The user reports that after cloud deployment, the main/home BGM often does not sound promptly after login or refresh.
* Home BGM resolves to `home-default`, using `/assets/music/main_bgm.ogg`.
* `BackgroundMusic` is mounted at the app shell level even on login, but when `track` is null it does not create or unlock an `AudioContext`.
* Existing resume triggers listen to `pageshow`, `focus`, `online`, `pointerdown`, `touchstart`, `keydown`, and `visibilitychange`.
* Login submit is a user gesture, but the current BGM track is only resolved after auth, startup preload, catalog loading, asset preload, and `view="home"`.
* That delay can make the eventual `AudioContext.resume()` happen outside the original activation window in stricter production browsers.
* Refresh without any new user gesture cannot be guaranteed to autoplay by browser policy; recovery must be prompt after page lifecycle events or the first interaction.

## Assumptions

* We should not add a visible “click to play music” modal unless the browser still blocks audio after the first post-refresh interaction.
* We should not change default volume, audio settings semantics, or which track is selected.
* The implementation should improve both desktop and mobile browsers.

## Requirements

* Prime/unlock the background music audio runtime during an actual user activation, even if no BGM track is active yet.
* When the app later resolves home BGM after login/preload, reuse the primed runtime so playback can begin promptly.
* After refresh, retry on `pageshow`, focus, visibility restore, network online, and the first user gesture.
* If autoplay remains blocked, keep retry state and avoid white-screen/errors; do not spam repeated schedule attempts.
* Preserve character preview pause behavior and room/battle BGM behavior.
* Add tests for login-before-track activation and refresh/gesture recovery.

## Acceptance Criteria

* [x] Login user activation before `track` is available primes the background audio runtime.
* [x] When home BGM track later becomes available, playback can schedule on the primed context without waiting for another click.
* [x] Refresh recovery still attempts `recoverBackgroundPlayback` on page lifecycle and gesture events.
* [x] Existing pause requests, reconnect recovery, and failed fetch/decode handling still pass tests.
* [x] `npm test` passes for affected audio/app tests.
* [x] `npm run build` passes.

## Definition of Done

* Tests added or updated for the BGM resume behavior.
* System design docs updated if runtime audio behavior changes.
* No unrelated dirty worktree changes are staged or reverted.

## Out of Scope

* Bypassing browser autoplay policy without a user gesture.
* Changing music track catalog, shop music ownership, or BGM selection rules.
* Changing server deployment/Nginx configuration unless investigation proves a missing audio asset or bad MIME/cache header.

## Technical Notes

* Likely files: `src/audio/backgroundMusic.jsx`, `src/audio/playback.test.jsx`, possibly `src/app/useAudioRuntimeState.js` or auth submit wiring if a more explicit activation signal is needed.
* Existing docs mention BGM recovery in `docs/system-design.md` and `docs/system-design/05-assets-audio-preload.md`.
* Relevant frontend spec index: `.trellis/spec/frontend/index.md`.
