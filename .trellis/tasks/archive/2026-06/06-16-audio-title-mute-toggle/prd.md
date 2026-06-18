# Audio Title Mute Toggle

## Goal

Add a direct mute interaction to the Settings > Audio panel. Clicking an audio row title should mute that audio module without moving its slider; moving the slider manually should unmute that module and restore the normal slider color.

## What I Already Know

* Settings audio controls are rendered by `src/modals/SettingsModal.jsx`.
* Audio settings are persisted from app state through `src/app/useAudioSettingsPersistence.js`.
* Effective playback volume is centralized in `src/audio/audioSettings.js` through `audioVolume(settings, channel)`.
* The current settings shape is `{ master, bgm, sfx, voice }`, with slider values stored as 0-100 percentages.
* Existing CSS hooks include `.volume-row` and `.audio-slider-item` in `src/styles/commerce/shop-settings/settings-panel.css` and theme override layers.
* Frontend spec guidance says muted SFX must not create playback contexts, so the mute state must affect `audioVolume()`, not only the UI.

## Requirements

* In Settings > Audio, the title area for each audio module is clickable.
* Clicking an unmuted title toggles that module into muted state.
* Clicking a muted title toggles that module back to unmuted state.
* Muting a module does not change the stored slider percentage.
* While a module is muted, its slider keeps the same thumb position but visually reads as disabled/muted through a gray treatment.
* Manually moving a muted module's slider clears that module's muted state and restores the normal slider treatment.
* Effective playback volume for a muted channel is `0`.
* Existing slider values remain backward-compatible for users with old persisted settings.

## Acceptance Criteria

* [ ] Server-side render/static markup tests cover the title mute controls and muted class hooks.
* [ ] Audio settings unit tests cover per-channel muted state returning zero volume without changing percent defaults.
* [ ] Slider change logic removes the muted flag for that channel.
* [ ] Muted slider styling is represented in base settings CSS and remains scoped to settings audio rows.
* [ ] Existing settings/theme tests keep passing.

## Definition of Done

* Tests added or updated for the component and audio settings helper.
* Targeted tests pass for `src/modals/SettingsModal.test.jsx` and `src/audio/audioSettings.test.js`.
* Lint/type/check command is run as appropriate for touched files.
* System design docs are updated if this is considered an audio runtime behavior contract change.

## Out of Scope

* Adding a dedicated mute icon button beside each slider.
* Adding global keyboard shortcuts for mute/unmute.
* Changing the meaning or range of existing 0-100 slider percentages.
* Reworking the broader settings modal layout.

## Technical Approach

Recommended approach: extend audio settings with optional per-channel mute flags, for example `muted: { bgm: true }`, while keeping numeric slider values unchanged. `audioVolume(settings, channel)` should return `0` when `settings.muted?.[channel]` is true, then keep the current master/channel percentage calculation otherwise. `SettingsModal` should render the audio title as a semantic button inside the row, toggle that muted flag on click, and clear the flag inside the existing range `onChange`.

## Technical Notes

* Relevant component: `src/modals/SettingsModal.jsx`.
* Relevant tests: `src/modals/SettingsModal.test.jsx`, `src/audio/audioSettings.test.js`.
* Relevant CSS: `src/styles/commerce/shop-settings/settings-panel.css`.
* Relevant frontend specs read: `.trellis/spec/frontend/index.md`, `.trellis/spec/frontend/component-guidelines.md`, `.trellis/spec/frontend/state-management.md`, `.trellis/spec/frontend/quality-guidelines.md`.
