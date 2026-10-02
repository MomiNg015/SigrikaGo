# Add Aemeath Full-White Burst Sound

## Goal

Convert the supplied `キラッ2.mp3` into a project OGG asset and play it exactly when the Aemeath recruitment cinematic reaches the fully white concealed-swap frame.

## What I already know

- Source: `C:/codex/musicsour/effectAudio/キラッ2.mp3`.
- The source is a 1.985-second, 44.1 kHz, stereo MP3.
- Project sound effects conventionally live under `/assets/music/*.ogg` and play through `playEffectSound()`.
- `flashSoundUrl` already exists in the Aemeath cinematic payload but is currently empty.
- The current flash sound timer fires at `glowAtMs = 5800`; the fully white concealed swap is `concealedSwapAtMs = 6250`.

## Assumptions

- Preserve the full source duration, channel count, and sample rate; only transcode the codec/container.
- Use a descriptive ASCII asset path under `public/assets/music/`.
- Reuse `flashSoundUrl` and move its trigger to `concealedSwapAtMs` rather than adding another payload field.

## Requirements

- Convert the supplied MP3 to OGG Vorbis without modifying the source file.
- Configure the Aemeath cinematic to preload and play the new OGG.
- Trigger playback at the fully opaque white frame (`concealedSwapAtMs`).
- Continue honoring player effect-volume settings and cinematic interruption cleanup.
- Do not include unrelated nameplate or authentication-loading work.

## Acceptance Criteria

- [x] The committed OGG is readable as Vorbis, remains stereo at 44.1 kHz, and is approximately the source duration.
- [x] `flashSoundUrl` resolves to the committed asset.
- [x] The flash timer uses `concealedSwapAtMs`, not `glowAtMs`.
- [x] Tests cover asset wiring and the concealed-swap timing contract.
- [x] `npm run check` passes.

## Definition of Done

- Tests and production build pass.
- Recruitment cinematic spec and system-design docs reflect the sound asset and trigger point.
- The task is committed separately from unrelated worktree changes.

## Out of Scope

- Adding flight, hover, unlock, or result sound assets.
- Editing, trimming, normalizing, or layering the supplied sound beyond OGG transcoding.
- Adding admin-configurable cinematic sound fields.

## Decision

Reuse the existing `flashSoundUrl` payload slot and retime its playback from glow start to the fully white concealed-swap frame. This keeps the stable cinematic payload compact while matching the user's explicit request for a full-white burst sound.

## Technical Notes

- Relevant files: `src/shared/recruitment.js`, `src/modals/recruitment/RecruitmentCinematicOverlay.jsx`, `src/modals/RecruitmentModal.test.js`.
- FFmpeg and FFprobe are available at `C:/Program Files/ffmpeg/bin/`.
