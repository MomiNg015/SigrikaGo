# Add Chisa Character Voices

## Goal

Make the supplied Chisa OGG voice assets available in the game as Chisa's skill voice and system voices.

## Requirements

- Copy the supplied `C:/codex/musicsour/cVoice/chisa/*.ogg` files into the runtime voice asset directory.
- Use existing runtime naming conventions: `/assets/voice/chisa_<event>.ogg`.
- Configure Chisa skill-cast voice.
- Configure Chisa system voices for sortie, match start, byo-yomi start, remaining byo-yomi periods, countdown 10 through 1, and result win/loss/draw.
- Update system design documentation for the new Chisa voice coverage.

## Acceptance Criteria

- `resolveSkillVoice({ characterId: "chisa" })` resolves `/assets/voice/chisa_skill_cast.ogg`.
- `CHARACTER_SYSTEM_VOICES.chisa` contains the supplied system voice events.
- Voice preload tests include Chisa voices through existing shared voice maps.
- System design HTML is regenerated.

## Out of Scope

- No audio conversion is needed because the supplied files are already OGG.
- No changes to BGM or character gameplay behavior.
