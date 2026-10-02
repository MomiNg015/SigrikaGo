# Add Mornye Character Voices

## Goal

Add the supplied Mornye voice pack to the project and wire `detail.ogg` to the character detail description interaction, stopping that voice when the detail window closes.

## Requirements

- Copy the supplied OGG files from `C:/codex/musicsour/cVoice/morning/` into `public/assets/voice/` using the existing canonical character id `mornye`.
- Configure Mornye voice mappings for sortie, game start, byo-yomi start/remaining periods, countdown 10 through 1, results, skill cast, and house detail.
- `detail.ogg` becomes `/assets/voice/mornye_detail.ogg` and maps to the existing `house-detail` system voice event.
- Clicking the description area in Mornye's character detail plays the detail voice through the voice channel.
- Closing the character detail window stops that detail voice playback.
- Preserve existing generic detail playback behavior for other characters.
- Update system design docs and regenerate `docs/system-design.html`.

## Acceptance Criteria

- [ ] Mornye voice assets exist under `public/assets/voice/mornye_*.ogg`.
- [ ] `CHARACTER_SKILL_VOICES.mornye` resolves to `/assets/voice/mornye_skill_cast.ogg`.
- [ ] `CHARACTER_SYSTEM_VOICES.mornye` includes `house-detail` and all supplied character events.
- [ ] Closing a character detail window stops active detail voice playback.
- [ ] Relevant tests pass.
- [ ] `npm run docs:system-design` and `npm run build` pass.

## Definition of Done

- Focused unit/component tests cover Mornye mappings and close-stop behavior.
- Docs reflect the voice pack and detail voice stop behavior.
- No unrelated dirty files are reverted.

## Out of Scope

- Audio loudness normalization or silence trimming.
- Admin-configurable detail voice uploads.
- Changing the visual layout of the character detail modal.

## Technical Notes

- Existing detail playback entry: `src/modals/HouseModal.jsx` uses `playSystemVoice(SYSTEM_VOICE_EVENTS.houseDetail, ...)` when clicking `.character-description`.
- Playback stop support exists in `src/audio/playback.jsx` as active voice stopping internals; expose or reuse it carefully so closing the detail modal can stop voice audio without affecting BGM.
