# Add Lynae Character Voices

## Goal

Make the supplied Lynae OGG voice assets available in the game as Lynae's skill voice and system voices.

## Requirements

- Copy the supplied `C:/codex/musicsour/cVoice/lynae/*.ogg` files into the runtime voice asset directory.
- Use existing runtime naming conventions: `/assets/voice/lynae_<event>.ogg`.
- Configure Lynae skill-cast voice.
- Configure Lynae system voices for sortie, match start, byo-yomi start, remaining byo-yomi periods, countdown 10 through 1, and result win/loss/draw.
- Update system design documentation for the new Lynae voice coverage.

## Acceptance Criteria

- `resolveSkillVoice({ characterId: "lynae" })` resolves `/assets/voice/lynae_skill_cast.ogg`.
- `CHARACTER_SYSTEM_VOICES.lynae` contains the supplied system voice events.
- Voice preload tests include Lynae voices through existing shared voice maps.
- System design HTML is regenerated.

## Out of Scope

- No audio conversion is needed because the supplied files are already OGG.
- No changes to BGM or character gameplay behavior.
