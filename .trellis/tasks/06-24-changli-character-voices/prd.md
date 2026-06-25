# Add Changli Character Voices

## Goal

Make the supplied Changli OGG voice assets available in the game, including a Gomoku-specific match-start voice.

## Requirements

- Copy the supplied `C:/codex/musicsour/cVoice/changli/*.ogg` files into the runtime voice asset directory.
- Use existing runtime naming conventions: `/assets/voice/changli_<event>.ogg`.
- Configure Changli skill-cast voice.
- Configure Changli system voices for sortie, normal match start, Gomoku match start, byo-yomi start, remaining byo-yomi periods, supplied countdown voices, and result win/loss/draw.
- When Changli starts a Gomoku match, use `changli_wuzi_match_start.ogg` instead of `changli_match_start.ogg`.
- Keep normal match-start voice behavior for non-Gomoku modes.
- Update system design documentation for the new Changli voice coverage and Gomoku-specific start voice.

## Acceptance Criteria

- `resolveSkillVoice({ characterId: "changli" })` resolves `/assets/voice/changli_skill_cast.ogg`.
- `resolveSystemVoice("game-start", { character: changli, params: { mode: "gomoku" } })` resolves `/assets/voice/changli_wuzi_match_start.ogg`.
- `resolveSystemVoice("game-start", { character: changli, params: { mode: "spark" } })` resolves `/assets/voice/changli_match_start.ogg`.
- Existing voice preload helpers include Changli voice paths through the shared voice maps.
- System design HTML is regenerated.

## Out of Scope

- No audio conversion is needed because the supplied files are already OGG.
- `countdown_4.ogg` is not supplied in this request, so Changli countdown 4 falls back to the existing TTS behavior.
