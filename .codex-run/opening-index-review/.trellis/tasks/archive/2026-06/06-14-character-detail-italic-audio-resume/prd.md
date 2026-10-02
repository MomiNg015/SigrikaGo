# Character Detail Italic Color And Audio Resume

## Goal

Fix two character detail issues: make the italic character description text purple on both desktop and mobile, and make character BGM preview plus lobby background music resume from the paused position instead of restarting from the beginning.

## Requirements

- In the character detail dialog, `.character-description` remains italic and displays in purple across desktop and mobile.
- Bright School theme overrides must not wash the character description back to brown/ink color.
- Pausing character music preview and pressing play again should resume from the paused offset for single, looped, and intro-loop playback.
- Background music paused by character music preview should resume from its paused offset when the preview is paused/stopped, not restart from the track beginning.
- Track changes still reset playback offset to the beginning.

## Acceptance Criteria

- [ ] Character detail description CSS contains an explicit purple color in the shared modal style.
- [ ] Bright School theme contains a matching high-specificity purple override for `.character-description`.
- [ ] Character music preview tests cover pause offset accumulation and offset scheduling.
- [ ] Background music tests cover pause offset retention and resumed scheduling with offset.
- [ ] Existing house/manual and audio tests continue passing.

## Definition of Done

- Tests added or updated for the changed behavior.
- `npm test` passes for relevant audio/house tests, and broader verification is run before completion.
- System design docs are updated only if this introduces new architecture/API/data-model facts.
- Trellis task is committed and ready for finish-work.

## Technical Approach

- Keep UI changes CSS-only so desktop and mobile share the same semantic class.
- Add a high-specificity Bright School rule because existing theme files override detail-copy paragraph colors.
- Preserve playback offsets in audio state on pause.
- Schedule background music from the saved offset rather than relying only on suspending and resuming the browser audio context.

## Out of Scope

- No new music controls, upload behavior, or music catalog changes.
- No redesign of the character detail dialog layout.
- No backend/API changes.

## Technical Notes

- Character detail markup lives in `src/modals/house/HouseNestedDialogs.jsx`.
- Shared modal styles live in `src/styles/modals/character-opening.css`.
- Bright School high-specificity repairs live under `src/styles/themes/bright-school/`.
- Character preview audio lives in `src/audio/CharacterMusicPreview.jsx`.
- Lobby/background BGM lives in `src/audio/backgroundMusic.jsx`.
