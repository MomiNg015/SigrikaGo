# Home Lobby Interface Adjustments

## Goal

Apply focused lobby UI refinements requested by the user across desktop and mobile without changing the broader home layout or theme architecture.

## Requirements

* Make the default home utility backgrounds for `招募` and `观战` match the ordinary utility button background instead of reading as special-colored default states.
* Render the home subtitle's English/Latin text with the existing WuWa-derived accent font while keeping Chinese text on the normal UI font.
* Replace the header online-count text label with an icon plus number, and remove the online tag's background and border so it reads as transparent HUD text.
* In the match-mode picker, replace the right-side `匹配中` text with an icon plus player count arranged horizontally inside the count tag.
* Increase the message-board textarea default height to about three times the current visible size, while keeping mobile within the viewport.
* Keep desktop and mobile treatments aligned for every changed surface.

## Acceptance Criteria

* [x] Home header markup renders the online tag as icon plus numeric count and no longer includes `在线人数：`.
* [x] Match-mode picker options render an icon plus count and no longer show a `匹配中` text label.
* [x] `home-brand-subtitle` uses the existing `Sigrika Accent Latin` font path for Latin glyphs.
* [x] Message-board textarea has a larger desktop minimum height and an adjusted mobile clamp.
* [x] The affected CSS remains in existing domain files and does not create new mixed-import entry files.
* [x] Relevant tests and system-design docs are updated.

## Definition of Done

* Run focused unit/CSS contract tests for touched home/modal/style surfaces.
* Run `npm run docs:system-design` after updating system-design docs.
* Run the project quality gate where feasible and report any unrelated legacy failures separately.

## Technical Approach

Use existing component and CSS boundaries:

* `src/home/components/HomeHeader.jsx` owns the online-count label.
* `src/home/HomeScreen.jsx` owns the match-mode picker markup.
* `src/home/components/HomeUtilityDock.jsx` owns utility tone class assignment.
* `src/styles/base/home-stage-artboard/chrome.css`, `src/styles/home-terminal/top-strip.css`, and Bright School home/mobile overrides own top-strip styling.
* `src/styles/modals/replay-mode-resume/match-mode-tabs.css` and `src/styles/mobile-adaptive/phone-core/match-mode.css` own match-mode count styling.
* `src/styles/base/message-feedback.css` and compact modal safety CSS own message-board textarea sizing.

## Decision (ADR-lite)

Context: The requested changes are local UI refinements on an existing home lobby, not a redesign.

Decision: Keep the existing visual system and change only the specific component markup/classes and CSS rules needed for desktop/mobile parity.

Consequences: This minimizes visual drift and leaves theme import contracts intact; tests need updates because several current assertions intentionally check the older visible labels.

## Out of Scope

* Reworking the home lobby layout, entry art, matching flow, recruitment modal, watch modal, or theme palette.
* Changing backend lobby statistics or feedback submission behavior.

## Technical Notes

* Existing accent font is declared in `src/styles/base/foundation.css` as `Sigrika Accent Latin` and maps to `/assets/fonts/WuWa-Lahai-Roi-Regular.ttf`.
* `src/home/HomeScreen.test.jsx` already covers top strip, utility toolbox, match-mode picker, mobile layout, and recruitment entry contracts.
* `docs/system-design/02-frontend-architecture.md` records the home top strip and match-mode picker behavior.
