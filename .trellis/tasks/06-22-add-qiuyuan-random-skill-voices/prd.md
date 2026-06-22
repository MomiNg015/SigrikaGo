# Add Qiuyuan Random Skill Voices

## Goal

Add two Qiuyuan skill-cast voice assets and make Qiuyuan randomly play one of them when his skill is cast.

## What I Already Know

* Source files are provided as OGG files:
  * `C:/codex/musicsour/cVoice/qiuyuan/skill_cast.ogg`
  * `C:/codex/musicsour/cVoice/qiuyuan/skill_cast_1.ogg`
* Existing skill voice configuration is centralized in `src/shared/musicLibrary.js` via `CHARACTER_SKILL_VOICES`.
* Existing skill-cast playback flows through `SkillBanner` -> `playSystemVoice(SYSTEM_VOICE_EVENTS.skillCast)` -> `resolveSystemVoice` -> `playPreloadedVoiceSound`.
* Existing preload helpers currently assume skill voice values are single paths and will need to flatten arrays.

## Requirements

* Copy the two source OGG files into `public/assets/voice` using stable project asset names.
* Register Qiuyuan skill voices under character id `qiuyuan`.
* Support multiple skill voice candidates for a character.
* Randomly choose one configured Qiuyuan skill voice each time Qiuyuan's skill-cast voice is resolved for playback.
* Preserve existing single-voice behavior for all other characters.
* Ensure login and battle audio preload include all configured Qiuyuan voice candidates.
* Update system design docs because the resource/audio behavior changes.

## Acceptance Criteria

* [ ] `CHARACTER_SKILL_VOICES.qiuyuan` exposes both Qiuyuan skill voice assets.
* [ ] Resolving Qiuyuan skill voice can return either configured asset.
* [ ] Character system voice maps bridge Qiuyuan `skill-cast` to a random playable audio path.
* [ ] Startup and battle preload include both Qiuyuan skill voice files.
* [ ] Existing characters with single skill voice paths continue to resolve exactly as before.
* [ ] Targeted tests and `npm run check` pass.

## Definition of Done

* Tests added/updated for random skill voice resolution and preload flattening.
* Source audio copied without changing source files.
* `docs/system-design.md`, `docs/system-design/05-assets-audio-preload.md`, and generated `docs/system-design.html` updated.
* Full project check passes.

## Technical Approach

Recommended approach: allow `CHARACTER_SKILL_VOICES[characterId]` to be either a string or an array of strings. Add small shared helpers to flatten voice source lists for preload and choose one source for playback resolution. This keeps current single-voice characters compatible while adding random variation only where configured.

## Out of Scope

* Adding Qiuyuan result, countdown, sortie, or other system voices.
* Adding UI controls to choose a specific Qiuyuan skill voice variant.
* Normalizing or editing the provided audio loudness.

## Technical Notes

* Relevant files inspected:
  * `src/shared/musicLibrary.js`
  * `src/audio/systemVoicePlayback.js`
  * `src/modals/SkillBanner.jsx`
  * `src/shared/preloadAssets.js`
  * `src/shared/musicLibrary.test.js`
  * `src/shared/preloadAssets.test.js`
* Source asset sizes were found locally and both source files exist.
