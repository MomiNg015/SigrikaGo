# Add Changli Countdown 4 Voice

## Goal

Add the supplied Changli countdown 4 OGG asset to the existing Changli character voice mapping.

## Requirements

- Copy `C:/codex/musicsour/cVoice/changli/countdown_4.ogg` into the runtime voice asset directory as `/assets/voice/changli_countdown_4.ogg`.
- Configure Changli's `countdown-4` system voice to use that asset.
- Update tests and system design documentation so Changli no longer documents countdown 4 as missing.

## Acceptance Criteria

- `CHARACTER_SYSTEM_VOICES.changli["countdown-4"]` resolves `/assets/voice/changli_countdown_4.ogg`.
- Related voice tests pass.
- System design HTML is regenerated.

## Out of Scope

- No audio conversion is needed because the supplied file is already OGG.
