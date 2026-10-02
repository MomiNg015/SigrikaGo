# Countdown mix path research

## Current path

- `useRoomAudioEffects` watches the active player's timer and emits `countdown-10` through `countdown-1` once per second in the last ten seconds of byo-yomi.
- `playSystemVoice` resolves character audio or TTS and forwards both to the shared voice playback helpers.
- `playback.jsx` currently treats every voice identically: it starts the global voice duck counter, applies the shared RMS-normalized dry/wet reverb chain for decoded audio, then schedules duck release after playback ends.
- `backgroundDucking.js` lowers ordinary voice playback to the shared 0.35 ratio with a 120ms transition; release begins after a 180ms delay. One-second countdown cadence therefore repeatedly crosses the release/attack boundary.

## Existing extension point

- `requestBackgroundMusicDuck({ ratio, attackMs, releaseMs })` already returns an idempotent release callback and combines overlapping requests by taking the lowest ratio.
- A room-owned request can therefore hold a stable shallow floor across the entire 10-to-1 countdown without changing normal voice or recruitment-cinematic behavior.

## Chosen minimum approach

- Hold one room-owned request at ratio 0.7 across the final ten seconds, with a moderate attack and 900ms release.
- Mark only countdown-number system voices with a dedicated playback profile that bypasses per-clip voice ducking and the reverb branch while preserving normalization and user voice volume.
- Derive activation from timer state and release explicitly on every non-matching render plus unmount, avoiding per-second effect cleanup churn.

## Alternatives deferred

- A global 1200-1500ms duck release debounce would reduce pumping but make unrelated short voices suppress BGM too long.
- Frequency-selective or envelope-following sidechain processing could preserve more musical energy, but it requires a more invasive shared audio graph and browser-level listening QA.

## Superseding listening experiment

After the stable-countdown-duck version was implemented and verified, the user requested a cleaner comparison: remove all voice/TTS-driven BGM attenuation and change new-user defaults to `100 / 60 / 100 / 100`. The final task direction therefore removes both the shared voice-active counter and the room-owned countdown request. Explicit non-voice scene requests, such as the recruitment cinematic, remain supported. Countdown decoded audio stays dry so this experiment changes BGM interaction without also reverting the countdown effect profile.
