# replace recruitment audio assets

## Goal

Replace the temporary recruitment sound effects with the three user-provided source MP3 files converted to OGG, preserving the existing SFX playback channel and preload registry.

## Requirements

- Convert `C:/codex/musicsour/effectAudio/????????.mp3` to OGG and use it for successful recruitment results.
- Convert `C:/codex/musicsour/effectAudio/???2.mp3` to OGG and use it for no-response recruitment results.
- Convert `C:/codex/musicsour/effectAudio/????????47.mp3` to OGG and use it for opening the recruitment modal, replacing the current open sound.
- Reuse existing audio constants, SFX channel routing, preload/asset registry patterns, and tests.
- Update system design docs because runtime audio resource behavior changes.

## Acceptance Criteria

- [x] The three converted OGG files exist under `public/assets/music/` with stable ASCII filenames.
- [x] Recruitment success/no-response result sounds route to the converted files.
- [x] Opening the recruitment modal plays the converted open sound once through the existing effect playback path.
- [x] Runtime/preload asset registries include the new recruitment sounds.
- [x] Targeted tests and production build pass.
- [x] System design Markdown and generated HTML are updated.

## Definition of Done

- Tests updated or confirmed for changed constants and routing.
- `npm run docs:system-design` succeeds.
- `npm run build` succeeds.
- No unrelated dirty work is reverted.

## Technical Approach

Use ffmpeg for MP3-to-OGG conversion at game-runtime bitrate. Keep playback in `src/audio/effectPlayback.js` and constants in `src/shared/audioAssets.js`; do not introduce a new audio subsystem.

## Out of Scope

- Changing recruitment UI visuals.
- Editing source MP3 files.
- Adding new user-facing result text or animation.

## Technical Notes

- Relevant files: `src/shared/audioAssets.js`, `src/audio/effectPlayback.js`, `src/audio/playback.jsx`, `src/shared/assetRegistry.js`, `src/modals/RecruitmentModal.jsx`, tests, and system-design docs.
- Frontend specs require reuse of existing constants and playback helpers.
