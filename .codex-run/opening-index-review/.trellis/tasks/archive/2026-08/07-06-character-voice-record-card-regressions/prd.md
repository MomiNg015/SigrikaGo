# Fix character sortie voice regression

## Goal

Fix the house/manual audio regression: selecting a sortie character should let the sortie voice finish even if the house manual closes.

## Requirements

* Keep character detail voice cleanup when the nested character detail dialog closes.
* Do not call the global voice-stop cleanup when the top-level house manual closes, because sortie voice playback can be started immediately before selection/close flows.
* Preserve sortie selection behavior: play the sortie system voice before calling `onSelectCharacter`.

## Acceptance Criteria

* [ ] Closing the nested character detail dialog still stops active detail voice playback.
* [ ] Closing the top-level house manual does not invoke `stopVoicePlayback()`.
* [ ] Sortie voice still plays before character selection.

## Definition of Done

* Focused tests updated for voice cleanup.
* Relevant frontend tests pass.
* System design docs updated only if the implementation changes system-level behavior or documented theme structure.

## Technical Approach

* Update `HouseModal.jsx` so `closeCharacterDetail()` owns voice stopping, while `closeHouseModal()` only closes the manual.
* Update `HouseModal.test.js` to assert the narrower cleanup contract.

## Decision (ADR-lite)

**Context**: The audio playback module has a global `stopVoicePlayback()` helper. Using it on the whole house modal closes every voice, including the sortie voice started by the sortie button.

**Decision**: Keep voice cleanup at the nested detail-dialog boundary only.

**Consequences**: Detail previews remain interruptible, and sortie voice can finish naturally. If future modals add their own detail voice previews, they should own cleanup at the preview surface rather than at unrelated parent modal boundaries.

## Out of Scope

* Changing voice playback mixing or introducing per-channel voice handles.
* Changing character record styling or record data calculations; the earlier character-record styling change was reverted by user request.

## Technical Notes

* `src/modals/HouseModal.jsx` currently imports and calls `stopVoicePlayback()` from both `closeCharacterDetail()` and `closeHouseModal()`.
* `src/modals/house/houseStats.js` plays `SYSTEM_VOICE_EVENTS.sortie` before calling `onSelectCharacter`.
* Frontend spec references: `.trellis/spec/frontend/css-architecture.md`, `.trellis/spec/frontend/quality-guidelines.md`.
