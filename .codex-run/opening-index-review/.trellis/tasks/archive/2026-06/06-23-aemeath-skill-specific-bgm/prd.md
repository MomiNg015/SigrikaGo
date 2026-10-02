# Configure Aemeath Skill-Specific BGM

## Goal

Make Aemeath's base skill "小爱出击" use the new `aemeath0` intro/loop BGM, while keeping the previous Aemeath `lhl_*` BGM as the fixed BGM for the derived "远航星" skill.

## What I Already Know

* Source files are already OGG files:
  * `C:/codex/musicsour/cVoice/aemeath/aemeath0_once.ogg`
  * `C:/codex/musicsour/cVoice/aemeath/aemeath0_loop.ogg`
* Existing runtime BGM assets live under `public/assets/music/`.
* `src/shared/musicLibrary.js` already defines:
  * `aemeath-skill-default`, currently using `/assets/music/lhl_intro_once.ogg` + `/assets/music/lhl_loop.ogg`.
  * `aemeath-voyage-star-default`, currently fixed to effect type `voyage-star`, `selectable: false`, and also using `/assets/music/lhl_intro_once.ogg` + `/assets/music/lhl_loop.ogg`.
* `src/shared/derivedSkills.js` defines `VOYAGE_STAR_MUSIC_TRACK_ID = "aemeath-voyage-star-default"`.
* Skill preview BGM resolution already prefers `skillPreview.musicTrackId`, so "远航星" can keep a fixed BGM independent of the player's normal Aemeath skill BGM selection.

## Requirements

* Copy the two provided `aemeath0` OGG files into `public/assets/music/` with stable project asset names.
* Configure `aemeath-skill-default` / "小爱出击" to use the new `aemeath0` once and loop files.
* Keep `aemeath-voyage-star-default` / "远航星" using the previous `lhl_intro_once.ogg` and `lhl_loop.ogg` files.
* Allow `aemeath-voyage-star-default` to appear in Aemeath's regular character BGM selection list.
* Keep Voyage Star skill previews fixed to `aemeath-voyage-star-default` even if the player selects a different regular Aemeath BGM.
* Ensure preload helpers continue to include both the normal Aemeath skill BGM and the fixed Voyage Star BGM.
* Update system design docs because the resource/audio behavior changes.

## Acceptance Criteria

* [ ] `aemeath-skill-default` plays the new `aemeath0` once file, then loops the new `aemeath0` loop file.
* [ ] `aemeath-voyage-star-default` still plays `lhl_intro_once.ogg`, then loops `lhl_loop.ogg`.
* [ ] Resolving a Voyage Star skill preview with `musicTrackId: "aemeath-voyage-star-default"` returns the Voyage Star fixed BGM.
* [ ] Regular Aemeath skill BGM selection includes both the new "小爱出击" BGM and the previous "远航星" BGM.
* [ ] Voyage Star skill previews still force `aemeath-voyage-star-default` even if the player selects another Aemeath BGM.
* [ ] Relevant tests and `npm run check` pass.

## Definition of Done

* Audio files copied without modifying source files.
* Tests updated for the split Aemeath/Voyage Star BGM behavior.
* `docs/system-design.md`, `docs/system-design/05-assets-audio-preload.md`, and generated `docs/system-design.html` updated.
* Full project check passes.

## Technical Approach

Use the existing two-track setup. The base Aemeath track remains `aemeath-skill-default` and gets new audio sources. The existing derived fixed track `aemeath-voyage-star-default` keeps the previous `lhl_*` sources, becomes selectable like other Aemeath skill BGM options, and continues to be selected by `musicTrackId` from Voyage Star previews.

## Out of Scope

* Changing Aemeath skill rules, costs, visuals, or voice lines.
* Adding a UI picker entry for the Voyage Star fixed BGM.
* Re-encoding, normalizing, or editing the supplied OGG files.

## Technical Notes

* Relevant files inspected:
  * `src/shared/musicLibrary.js`
  * `src/shared/derivedSkills.js`
  * `docs/system-design.md`
  * `docs/system-design/05-assets-audio-preload.md`
* Current working tree has many unrelated dirty files; implementation should only touch files required for this audio configuration.
