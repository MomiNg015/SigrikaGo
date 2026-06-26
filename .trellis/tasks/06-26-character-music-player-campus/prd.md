# Improve Character Detail Music Player

## Goal

Fix the perceptible delay when playing character-detail BGM previews and restyle the player into a Bright School-compatible campus club radio/cassette control across desktop and mobile.

## Requirements

- Prewarm and decode the current character BGM before the user taps play.
- Replace the boolean preview state with explicit `idle`, `loading`, `playing`, and `error` UI states.
- Reuse the existing Web Audio preview path, buffer cache, BGM pause request, volume handling, intro-loop scheduling, and pause/resume offset behavior.
- Cache in-flight audio buffer loads so rapid taps or track changes do not duplicate `fetch` or `decodeAudioData`.
- Provide immediate tap/loading feedback, release background BGM pause on failure, and keep errors non-blocking.
- Restyle the existing player as a compact campus club radio/cassette control with clear focus, disabled, loading, playing, and error states.
- Update desktop, phone, Bright School desktop, Bright School portrait mobile, and final mobile safety CSS together.
- Update `docs/system-design.md` and `docs/system-design/05-assets-audio-preload.md`, then regenerate `docs/system-design.html`.

## Acceptance Criteria

- [ ] Opening a character detail starts prewarming the selected BGM without changing persisted user data.
- [ ] Clicking play gives immediate visual feedback and does not wait for the full fetch/decode path before the control visibly responds.
- [ ] Pausing and resuming preserves the existing intro-loop offset behavior.
- [ ] Failed preload/play attempts release the background BGM pause and show an error state without throwing into React.
- [ ] Desktop and mobile layouts keep stable dimensions and at least a 44px play touch target.
- [ ] Bright School theme keeps the new campus visual treatment after its later override layers.
- [ ] Focus, disabled, loading, playing, and reduced-motion states are covered in CSS.
- [ ] Focused tests and docs generation pass, or any unrelated pre-existing WIP failures are clearly identified.

## Technical Approach

- Extend `src/audio/CharacterMusicPreview.jsx` with a preview status state and prewarm helpers around the existing `loadPreviewBuffers` and `loadPreviewBuffer` flow.
- Store `bufferPromises` in `createPreviewState()` next to `bufferCache` so concurrent prewarm/play calls share one promise per source.
- Trigger prewarm from a `useEffect` keyed by the active track playback shape, and guard stale async completions with a local cancellation flag.
- Keep play scheduling in `playPreview()` and only change when UI status is set; do not introduce a separate `Audio` fallback or a new audio channel.
- Restyle the current `.character-music-*` class surface rather than changing the public component API.
- Update contract tests for audio scheduling/cache behavior and CSS selectors.

## Out of Scope

- No backend/API changes.
- No data model or persisted music-selection changes.
- No new audio files, image assets, or asset formats.
- No broad refactor of BGM, voice, or startup preload architecture.
- No unrelated cleanup of existing dirty WIP files.

## Technical Notes

- Current implementation fetches and decodes BGM only inside `playPreview()`, then flips `playing` after scheduling succeeds.
- Relevant files include `src/audio/CharacterMusicPreview.jsx`, `src/audio/CharacterMusicPreview.test.jsx`, `src/styles/modals/character-opening.css`, `src/styles/modals/phone.css`, `src/styles/mobile-adaptive/phone-core.css`, `src/styles/themes/bright-school/component-repairs/warehouse-character.css`, `src/styles/themes/bright-school/mobile/house-profile/character-detail-music.css`, and `src/styles/mobile-adaptive/bright-school-portrait/character-detail.css`.
- The project has existing uncommitted WIP across many files. This task should preserve unrelated changes.
