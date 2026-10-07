# Window focus BGM

## Goal
Make background music feel muffled behind a door while a home or battle window is open.

## Requirements
- Apply a smooth low-pass filter and subtle volume reduction without restarting music.
- Cover app overlays and locally owned ModalDialog windows, including nested windows.
- Restore clarity only after all windows close; preserve mute, voice ducking and preview pause.
- HTML fallback retains volume attenuation when filtering is unavailable.
- Update docs/system-design.md and generated HTML.

## Acceptance Criteria
- Normal BGM is clear; focused BGM uses 900 Hz cutoff and 0.72 gain with 500 ms transitions.
- Nested windows, track changes, mute and ducking retain correct focus state.
- Audio regression tests, lint and production build pass.

## Technical Approach
Use an owner-counted focus subscription from ModalDialog plus app overlay state, and a shared filter/gain bus in the BGM context. Keep focus effects separate from existing track fade/duck gain.

## Out of Scope
Changing voice/SFX, music assets, or browser-tab focus behavior.
