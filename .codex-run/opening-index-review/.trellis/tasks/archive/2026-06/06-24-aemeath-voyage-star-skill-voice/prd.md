# Add Aemeath Voyage Star Skill Voice

## Goal

Add the supplied `skill_cast_voyage.ogg` as Aemeath's dedicated voice for the derived skill "Voyage Star" while preserving the existing Aemeath generic skill-cast voice for "小爱出击".

## Requirements

- Copy `C:/codex/musicsour/cVoice/aemeath/skill_cast_voyage.ogg` into the public voice assets.
- Use a stable project asset name matching existing conventions: `/assets/voice/aemeath_skill_cast_voyage.ogg`.
- When a skill banner represents Aemeath `effectType: "voyage-star"`, play the dedicated Voyage Star voice.
- Keep Aemeath's ordinary `skill-cast` voice mapped to `/assets/voice/aemeath_skill_cast.ogg`.
- Include the new voice in preload candidates through the existing system voice asset path.
- Update system design docs and regenerate `docs/system-design.html`.

## Acceptance Criteria

- [ ] `resolveSystemVoice("skill-cast", { character, params: { effectType: "voyage-star" } })` resolves the Voyage Star voice before the generic skill voice.
- [ ] Generic Aemeath skill cast still resolves to `/assets/voice/aemeath_skill_cast.ogg`.
- [ ] The new OGG exists under `public/assets/voice/`.
- [ ] Relevant tests pass.
- [ ] `npm run docs:system-design` and `npm run build` pass.

## Definition of Done

- Tests added or updated for effect-specific skill voice resolution.
- Documentation updated for the new voice mapping.
- No unrelated dirty files are reverted or included.

## Out of Scope

- Admin-configurable skill voices.
- Additional derived-skill voice mappings for other characters.
- Audio loudness normalization or trimming.

## Technical Notes

- `SkillBanner.jsx` currently triggers `SYSTEM_VOICE_EVENTS.skillCast`; it should pass `banner.effectType` through `params`.
- `src/shared/systemVoices.js` already supports mode-specific event variants and can use the same pattern for skill-effect-specific variants.
- `CHARACTER_SYSTEM_VOICES` is already included in runtime preload asset collection.
