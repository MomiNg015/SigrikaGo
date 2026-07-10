# Polish character music player interaction and campus style

## Goal

Improve the character detail music player so hovering and clicking the play button feels responsive, then restyle the player into a Bright School-compatible campus product design. Use Rough.js where it adds hand-drawn notebook texture without making interaction performance worse.

## What I Already Know

* The player is rendered by `src/audio/CharacterMusicPreview.jsx` inside `CharacterDetailDialog` in `src/modals/house/HouseNestedDialogs.jsx`.
* Current playback waits for WebAudio buffer fetch/decode before setting `playing`, so the first click can feel delayed.
* The shared player styles live in `src/styles/modals/character-music-player.css`, Bright School overrides in `src/styles/themes/bright-school/component-repairs/character-music-player.css`, and mobile constraints in the focused character-detail music files.
* `roughjs` is already present in `package.json` and `package-lock.json`.
* Project rules require both desktop and mobile treatment for frontend changes.
* Project rules require `docs/system-design.md` to be updated every time, and if behavior/design facts change, the corresponding system-design chapter and generated HTML should be updated.
* The current polished implementation still uses a fixed `188px × 38px` player with `overflow: hidden`; its Rough.js frame is also authored against that fixed size.
* When there is one track, the title is forced onto one line with ellipsis; when there are multiple tracks, the title surface becomes a native `<select>`, so the control vocabulary changes with track count.
* The user reports that the current Lucide play icon and title typography do not belong to the surrounding hand-drawn player, the multi-track dropdown looks worse, and long titles lose visible content.
* Derived-skill tracks such as `aemeath-voyage-star-default` carry an `effectType` and are fixed into the derived skill through `musicTrackId`, but `skillMusicOptionsForCharacter` currently mixes them into the same flat character list as base-skill tracks.
* Persisted selections currently provide only one slot, `musicSelections.skill[characterId]`; selecting a derived-skill track from the flat list can therefore mislabel it as the character's base-skill choice even though runtime derived-skill playback still follows its fixed `musicTrackId`.

## Assumptions

* "角色详情里的音乐播放器" means the player shown beside the character name in the house/manual character detail dialog.
* "Product design" means a polished in-product component design, not a marketing page.
* The Rough.js usage should be lightweight: generated once per relevant size/state as decoration, not recalculated on hover or every click.
* This refinement may change the component's compact fixed-height structure, but should not redesign the rest of the character detail dialog.

## Open Questions

* None. The requirements are ready for final confirmation.

## Requirements

* Remove obvious perceived stutter on hover and click of the character music play button.
* Keep click feedback immediate even when the first audio buffer is still loading/decoding.
* Preserve existing pause/resume and background-music pause ownership while deliberately upgrading track selection to support continuous auditioning and recoverable persistence failures.
* Add a campus-themed player visual for Bright School desktop.
* Add a separate mobile layout treatment so the player fits portrait character detail dialogs without overlap or horizontal scroll.
* Use Rough.js for a hand-drawn campus/notebook accent in a way that does not introduce interaction-time rendering cost.
* Keep controls accessible with stable button labels, disabled state, focus-visible state, and touch-friendly sizing.
* Replace the native multi-track `<select>` presentation with a control whose closed and open states use the same visual language as the hand-drawn player.
* Keep every full music title discoverable without relying only on a clipped single-line label; long-title behavior must be deliberate on both desktop and mobile.
* Make the play/pause/loading control feel physically integrated with the player surface rather than like a generic icon button placed on top of it.
* Use a portable cassette-player form: the primary surface owns playback and the current-track label, while a separate hand-drawn track list handles multi-track selection.
* Keep the current-track title on exactly one line; never wrap it. When it exceeds the available label width, reveal it through automatic horizontal scrolling.
* For overflowing titles, use a one-way cycle: pause at the start, scroll left at a steady readable speed, pause at the end, then return to the beginning. Titles that fit remain completely still.
* When multiple tracks are available, make the title label and its down-arrow the disclosure button for the track list; keep the playback button as a separate control.
* When only one track is available, render the same title label as non-interactive content without a misleading disclosure arrow.
* Keep track-list titles on one line as well. Only an overflowing row that is hovered or keyboard-focused may scroll; inactive rows remain still.
* Preserve each full track name in accessible labeling/tooltips so reduced-motion users and non-scrolling states do not lose the underlying text.
* Replace the generic Lucide play/pause glyphs with a cassette-player-style raised round key: hand-drawn ink ring, slightly offset solid key face, solid play triangle, and sturdy pause bars.
* Give hover, focus, press, loading, and playing states through the same physical key vocabulary rather than swapping to a visually unrelated control.
* Keep the player beside the character title on both desktop and mobile; do not move it to a separate full-width row.
* Preserve the compact inline footprint while making the key hit target touch-friendly and letting the marquee absorb narrow title space.
* Open a wider floating hand-drawn track sheet from the compact player, aligned to the player's right edge and constrained to the viewport.
* Show roughly four track rows before the floating sheet gains its own vertical scroll; opening it must not resize or push the character detail layout.
* If a preview is already playing, selecting another track stops the old preview, keeps the preview session active, shows loading feedback, and automatically starts the new track from the beginning.
* If the player is idle, selecting another track updates the selection without starting playback.
* Keep the floating track sheet open after selection so players can audition several tracks in sequence.
* Close the sheet when the title trigger is pressed again, the player loses interaction to an outside click, or the user presses `Escape`; restore focus to the title trigger after keyboard dismissal.
* Handle playback failure inside the player with a concise `播放失败 · 点击重试` state and an explicit retry action.
* Handle selection persistence failure inside the open track sheet: restore the previous selected track, cancel any pending autoplay handoff, keep the sheet open, and show a handwritten error message with retry.
* Scope the hand-drawn portable cassette-player skin to Bright School only.
* Share the semantic behavior layer—marquee measurement, disclosure/listbox interaction, continuous auditioning, loading, error, retry, and accessibility—across player themes without forcing the Bright School visual skin onto them.
* Treat this as a flagship-quality polish pass, covering all interaction states and real desktop/mobile visual verification rather than stopping at the three initially reported symptoms.
* Do not present base-skill and derived-skill tracks as one undifferentiated selection pool; the UI and persistence contract must express which skill event each track belongs to.
* Give the base skill and every derived `effectType` an independent music-selection slot.
* Preserve `musicSelections.skill[characterId]` as the backward-compatible base-skill selection and add derived selections keyed by character and `effectType`.
* Treat a derived definition's existing `musicTrackId` as that slot's default/fallback rather than an immutable override; a valid owned user selection for the same derived slot takes precedence.
* Filter selectable tracks by both character and slot identity so a derived track can never appear in or be persisted to the base-skill pool.
* Put a keyboard-operable skill tab strip at the top of the floating track sheet, with one tab for the base skill and one for each derived skill.
* Label tabs with both type and skill name, such as `普通技·小爱出击` and `派生技·远航星`; show only the active slot's tracks below the tabs.
* Show a compact current-skill marker beside the closed player's scrolling title so users can tell whether they are previewing the base or a derived slot.
* Default the active slot to the character's base skill whenever the character detail opens.
* Preserve the last active skill tab while the same character-detail window remains mounted, including after the track sheet is collapsed; reset the tab when the detail closes or the character changes.
* If a preview is playing, switching skill tabs stops the old preview and automatically loads/plays the target slot's selected track from the beginning; if idle, tab switching does not autoplay.
* Update focused tests for playback state/markup and CSS contracts.
* Update `docs/system-design.md` and run `npm run docs:system-design`.

## Acceptance Criteria

* [ ] Hovering the play button changes only composited properties or precomputed styles; it does not cause layout resizing.
* [ ] Clicking play gives immediate visual feedback/loading state before audio decode completes.
* [ ] Playback starts after decode as before, and failed playback releases the background music pause request.
* [ ] Desktop Bright School player reads as a small campus music control, not a plain pill.
* [ ] Mobile Bright School player has its own dimensions/spacing and remains usable in portrait.
* [ ] Rough.js output is mounted as a stable decorative layer and is pointer-transparent/aria-hidden.
* [ ] Multiple tracks can be identified and selected from a readable, keyboard-operable list without exposing the browser-native select styling.
* [ ] The multi-track title trigger exposes expanded/collapsed state, supports keyboard activation, and does not merge its hit target with play/pause.
* [ ] Long track titles remain on one line and become fully discoverable through overflow-triggered horizontal auto-scroll rather than wrapping or ellipsis-only clipping.
* [ ] Overflowing titles pause at both ends of their one-way scroll cycle; non-overflowing titles do not animate.
* [ ] Track-list rows never wrap; only the hovered or keyboard-focused overflowing row scrolls, and opening the list does not start several simultaneous marquees.
* [ ] Play, pause, loading, hover, focus, active, disabled, and selected-track states share one coherent hand-drawn control vocabulary.
* [ ] The play/pause key no longer renders Lucide line icons and remains optically centered in every state.
* [ ] Desktop and mobile both keep the player beside the character title without overlap, horizontal page scrolling, or a new full-width player row.
* [ ] The floating track sheet is wider than the compact player where space permits, remains fully inside the viewport, and scrolls internally beyond roughly four rows.
* [ ] Selecting a new track while playing automatically continues with the new track from its beginning; selecting while idle does not autoplay.
* [ ] Automatic track switching preserves correct background-music pause ownership and releases it on cancellation or playback failure.
* [ ] Selecting a track does not close the sheet; outside click, trigger toggle, and `Escape` do, with predictable keyboard focus restoration.
* [ ] Audio failure releases background-music pause ownership and exposes a clear retry action rather than silently returning to idle.
* [ ] Selection-save failure rolls the selected row and current title back to the persisted track, keeps the sheet open, and offers retry without starting the failed selection.
* [ ] Bright School receives the hand-drawn cassette/notebook skin; non-Bright-School themes do not inherit its paper, ink, pink, blue, or Rough.js-specific visual treatment.
* [ ] Reduced-motion mode disables automatic marquee motion while keeping complete titles available through accessible text, the track sheet, and manual discovery.
* [ ] Desktop and phone visual QA covers single-track, multi-track, long-title, loading, playing, playback-error, selection-error, keyboard, and reduced-motion states.
* [ ] A derived-skill track cannot be accidentally persisted or played as the base skill merely because both tracks share a character ID.
* [ ] Base-skill and derived-skill choices persist independently, and changing one never replaces another.
* [ ] Existing users retain their base-skill choice without migration; each derived slot falls back to its configured `musicTrackId` until the user chooses another valid track.
* [ ] Battle playback resolves the slot from the actual skill `effectType`, validates ownership/slot membership, and uses the matching user selection before the slot fallback.
* [ ] The skill tab strip exposes correct tab/tabpanel semantics, supports arrow-key navigation, and never mixes selected rows across slots.
* [ ] The closed player identifies the currently previewed skill slot without forcing the music title to wrap.
* [ ] Reopening the sheet during the same character-detail session returns to the last viewed skill tab, while a newly opened detail starts on the base skill.
* [ ] Switching skill tabs while playing continues auditioning with the target slot's selected track; switching while idle remains idle.
* [ ] Rapid tab/track changes cancel stale load and persistence intents so an earlier request cannot overwrite or start playback after a later choice.
* [ ] Relevant unit/CSS tests pass.
* [ ] `npm run docs:system-design` succeeds.

## Definition of Done

* Tests added or updated where behavior/CSS contracts changed.
* Lint/type/build or targeted project checks run as appropriate.
* The real character-detail interaction is visually verified at desktop and phone sizes across the flagship state matrix.
* System design docs updated and generated HTML refreshed.
* Existing unrelated dirty files are not reverted or silently included in this task.

## Technical Approach

Flagship implementation approach:

* Extend `CharacterMusicPreview` with an explicit pending/loading state so click feedback is immediate while `playPreview` loads buffers.
* Add a small reusable Rough.js-backed decorative component for the player frame or waveform paper strip, rendered with a stable seed and memoized dimensions.
* Style the Bright School player as a compact portable cassette control: notebook surface, ink frame, raised round playback key, tape-label title window, and coherent focus/disabled/error states.
* Decouple the primary playback surface from multi-track selection so adding tracks does not swap the title for a browser-native form control.
* Use a semantic title/disclosure control plus an anchored listbox/popover for the portable player's hand-drawn track list.
* Render the title surface as a disclosure button only when `options.length > 1`; otherwise preserve equivalent typography and marquee behavior in a non-interactive label.
* Detect actual title overflow so short titles stay still and long titles alone enter the marquee state; provide a reduced-motion fallback that keeps the full title available from the track list.
* Compute marquee travel from the measured overflow distance so titles move at a consistent readable speed instead of sharing one duration regardless of length.
* Reuse the same measured marquee primitive for the main title and list rows, with an activation mode of `overflow` for the main title and `overflow + hover/focus` for list rows.
* Build the raised key face and solid playback glyphs from stable CSS/markup layers; keep Rough.js to the non-interactive frame/ring decoration so pressing the key does not regenerate paths.
* Retain the existing two-column heading relationship at mobile breakpoints, but revise player height, internal hit areas, and title viewport as needed rather than preserving the exact old `164px × 36px` internals.
* Render the track sheet outside the player's clipped paint containment/overflow context, using a portal or top-layer positioning strategy so the wider list cannot be cut off by the player or modal.
* Carry a pending autoplay intent across the persisted track-selection update so the newly resolved track starts only if the previous preview was playing and the selection request is still current.
* Keep the selected row and `aria-selected` state synchronized while the sheet remains open for consecutive auditions.
* Extend the selection callback contract so the player can await success/failure instead of treating the current fire-and-forget callback as synchronous.
* Preserve the previous track and preview intent until persistence succeeds; on failure, restore the stable state and surface a local error status.
* Separate shared structural/state class hooks from Bright School appearance overrides so theme-specific visuals do not leak through the base component contract.
* Introduce an explicit skill-slot identity based on the base skill versus a derived `effectType`; the final persistence shape and selection permissions depend on the next user decision.
* Extend normalized music selections with a backward-compatible derived-skill map, for example `derivedSkill[characterId][effectType] = trackId`, while retaining the existing base `skill[characterId] = trackId` shape.
* Extend `/api/me/music-selection` with an explicit slot/effect identity and validate that the requested track matches the character, music type, ownership, and base/derived slot before persisting.
* Update `findSkillTrack` to resolve a valid user selection for the exact base/derived slot first, then use preview/configured `musicTrackId` as that slot's fallback; base skills continue through the backward-compatible base slot.
* Split `skillMusicOptionsForCharacter` into slot-aware option groups instead of returning one flat character-level list.
* Derive slot labels from the actual character base skill and `derivedSkillDefinitionsFromSkill` data rather than hard-coding Aemeath/Voyage Star names into the player.
* Keep the skill tabs on one line with bounded horizontal overflow if a future character gains several derived skills.
* Keep active-slot state local to `CharacterMusicPreview`/the mounted detail session; do not add a server field for this temporary UI preference.
* Reuse the request-generation/cancellation guard for both track changes and skill-tab changes so continuous auditioning cannot race across slots.
* Keep hover/active motion to `transform`, `opacity`, and color changes with reduced-motion support.
* Update desktop and mobile CSS overrides separately.

## Decision (ADR-lite)

**Context**: The user reported stutter specifically on hover/click and asked for a less plain campus-style player using product design and Rough.js.

**Decision**: Prefer a lightweight component-level redesign over a broad modal redesign. Use Rough.js only for stable decorative layers, and fix the responsiveness with playback state changes rather than masking latency with heavier animation.

**Consequences**: The player becomes more polished and responsive without changing the broader audio runtime. If deeper audio latency remains in slow networks, a later task can add shared audio prefetching across character detail openings.

**Interaction refinement**: Use the portable cassette-player direction. The current title is always single-line; overflowing titles scroll horizontally instead of wrapping, and multiple tracks live in a separate hand-drawn track list rather than a native `<select>`.

**Marquee refinement**: Only overflowing titles animate. Each cycle pauses at the beginning, scrolls left once at a steady speed, pauses at the end, then resets to the beginning; fitting titles remain static.

**Track-list trigger refinement**: With multiple tracks, the current-title label and down-arrow open the track list while play/pause remains a distinct control. With one track, the label remains visually consistent but non-interactive.

**Track-list title refinement**: All music titles stay on one line. In the open list, only a hovered or keyboard-focused overflowing title scrolls; all other rows stay still.

**Playback-key refinement**: Use a raised round cassette-player key with a hand-drawn ring and solid play/pause shapes. Remove Lucide playback icons and express every state through the same tactile control.

**Responsive placement refinement**: Keep the player inline beside the character title on desktop and mobile. Improve touch sizing and internal layout without moving the component to its own row.

**Track-sheet refinement**: Use a wider floating hand-drawn sheet anchored to the player's right edge. Keep it within the viewport and cap the visible list at about four rows before internal scrolling.

**Track-switch refinement**: While playing, selecting a different track automatically loads and plays it from the beginning. While idle, selection changes without autoplay.

**Track-sheet dismissal refinement**: Keep the sheet open after selection for rapid auditioning. Close it through outside click, trigger toggle, or `Escape`, and restore trigger focus after keyboard dismissal.

**Failure-state refinement**: Playback and selection failures are first-class player states. Playback failure offers retry and releases background-music pause ownership; selection failure rolls back to the persisted track and exposes retry inside the still-open sheet.

**Theme-scope refinement**: Apply the hand-drawn cassette-player skin only in Bright School. Keep the new interaction and accessibility behavior shared without imposing Bright School colors or paper texture on other themes.

**Quality refinement**: Deliver the full flagship state matrix with desktop/mobile interaction and visual QA, focused tests, accessibility coverage, and synchronized system-design documentation.

**Skill-slot refinement**: Base skills and each derived `effectType` own independent selectable music slots. Preserve existing base selections, use configured derived `musicTrackId` values as defaults, and resolve battle music from the skill event's actual slot.

**Skill-tab refinement**: Switch slots through a tab strip at the top of the floating track sheet. Only the active slot's tracks appear, and the compact player carries a short marker for the slot currently being previewed.

**Skill-tab lifetime refinement**: Start each character-detail session on the base skill, retain the active tab while that detail remains open, and reset it when the detail closes or changes character.

**Skill-tab playback refinement**: While playing, changing tabs automatically continues with the target slot's selected track; while idle, changing tabs only changes the preview context.

## Out of Scope

* Rebuilding the full character detail modal.
* Changing the global background music runtime.
* Adding new music assets.
* Reworking the admin music manager.

## Technical Notes

* Inspected `src/audio/CharacterMusicPreview.jsx`.
* Inspected `src/modals/house/HouseNestedDialogs.jsx`.
* Inspected `src/styles/modals/character-music-player.css`.
* Inspected `src/styles/themes/bright-school/component-repairs/character-music-player.css`.
* Inspected mobile Bright School character detail overrides.
* The current built-in catalog exposes at most two owned skill tracks for a character, but the catalog structure can grow and admin-managed display names have no dependable visual length bound.
* `selectCharacterMusic` persists through `POST /api/me/music-selection` and currently exposes no local pending/error contract to `CharacterMusicPreview`; the preview also returns silently to idle when audio loading fails.
* `findSkillTrack` honors `skillPreview.musicTrackId` before user selection, so the current fixed derived-skill track bypasses `musicSelections.skill[characterId]` at battle runtime.
* Inspected `src/shared/derivedSkills.js`, where Voyage Star owns the fixed `aemeath-voyage-star-default` track through its `musicTrackId` field.
