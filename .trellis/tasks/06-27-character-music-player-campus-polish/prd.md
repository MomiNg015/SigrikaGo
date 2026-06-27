# Polish character music player interaction and campus style

## Goal

Improve the character detail music player so hovering and clicking the play button feels responsive, then restyle the player into a Bright School-compatible campus product design. Use Rough.js where it adds hand-drawn notebook texture without making interaction performance worse.

## What I Already Know

* The player is rendered by `src/audio/CharacterMusicPreview.jsx` inside `CharacterDetailDialog` in `src/modals/house/HouseNestedDialogs.jsx`.
* Current playback waits for WebAudio buffer fetch/decode before setting `playing`, so the first click can feel delayed.
* The current player styles live in `src/styles/modals/character-opening.css`, Bright School desktop overrides in `src/styles/themes/bright-school/component-repairs/warehouse-character.css`, and mobile overrides in `src/styles/themes/bright-school/mobile/house-profile/character-detail-music.css` plus `src/styles/mobile-adaptive/bright-school-portrait/character-detail.css`.
* `roughjs` is already present in `package.json` and `package-lock.json`.
* Project rules require both desktop and mobile treatment for frontend changes.
* Project rules require `docs/system-design.md` to be updated every time, and if behavior/design facts change, the corresponding system-design chapter and generated HTML should be updated.

## Assumptions

* "角色详情里的音乐播放器" means the player shown beside the character name in the house/manual character detail dialog.
* "Product design" means a polished in-product component design, not a marketing page.
* The Rough.js usage should be lightweight: generated once per relevant size/state as decoration, not recalculated on hover or every click.

## Requirements

* Remove obvious perceived stutter on hover and click of the character music play button.
* Keep click feedback immediate even when the first audio buffer is still loading/decoding.
* Preserve existing pause/resume behavior, background music ducking/pause behavior, and track selection.
* Add a campus-themed player visual for Bright School desktop.
* Add a separate mobile layout treatment so the player fits portrait character detail dialogs without overlap or horizontal scroll.
* Use Rough.js for a hand-drawn campus/notebook accent in a way that does not introduce interaction-time rendering cost.
* Keep controls accessible with stable button labels, disabled state, focus-visible state, and touch-friendly sizing.
* Update focused tests for playback state/markup and CSS contracts.
* Update `docs/system-design.md` and run `npm run docs:system-design`.

## Acceptance Criteria

* [ ] Hovering the play button changes only composited properties or precomputed styles; it does not cause layout resizing.
* [ ] Clicking play gives immediate visual feedback/loading state before audio decode completes.
* [ ] Playback starts after decode as before, and failed playback releases the background music pause request.
* [ ] Desktop Bright School player reads as a small campus music control, not a plain pill.
* [ ] Mobile Bright School player has its own dimensions/spacing and remains usable in portrait.
* [ ] Rough.js output is mounted as a stable decorative layer and is pointer-transparent/aria-hidden.
* [ ] Relevant unit/CSS tests pass.
* [ ] `npm run docs:system-design` succeeds.

## Definition of Done

* Tests added or updated where behavior/CSS contracts changed.
* Lint/type/build or targeted project checks run as appropriate.
* System design docs updated and generated HTML refreshed.
* Existing unrelated dirty files are not reverted or silently included in this task.

## Technical Approach

Recommended MVP approach:

* Extend `CharacterMusicPreview` with an explicit pending/loading state so click feedback is immediate while `playPreview` loads buffers.
* Optionally warm the selected track after mount/track change if doing so can be scoped and cancellation-safe.
* Add a small reusable Rough.js-backed decorative component for the player frame or waveform paper strip, rendered with a stable seed and memoized dimensions.
* Style the player as a campus hand-drawn control: notebook paper surface, ink border, small sticker-like play control, subtle waveform/tape line, clear focus/disabled states.
* Keep hover/active motion to `transform`, `opacity`, and color changes with reduced-motion support.
* Update desktop and mobile CSS overrides separately.

## Decision (ADR-lite)

**Context**: The user reported stutter specifically on hover/click and asked for a less plain campus-style player using product design and Rough.js.

**Decision**: Prefer a lightweight component-level redesign over a broad modal redesign. Use Rough.js only for stable decorative layers, and fix the responsiveness with playback state changes rather than masking latency with heavier animation.

**Consequences**: The player becomes more polished and responsive without changing the broader audio runtime. If deeper audio latency remains in slow networks, a later task can add shared audio prefetching across character detail openings.

## Out of Scope

* Rebuilding the full character detail modal.
* Changing the global background music runtime.
* Adding new music assets.
* Reworking the admin music manager.

## Technical Notes

* Inspected `src/audio/CharacterMusicPreview.jsx`.
* Inspected `src/modals/house/HouseNestedDialogs.jsx`.
* Inspected `src/styles/modals/character-opening.css`.
* Inspected `src/styles/themes/bright-school/component-repairs/warehouse-character.css`.
* Inspected mobile Bright School character detail overrides.
