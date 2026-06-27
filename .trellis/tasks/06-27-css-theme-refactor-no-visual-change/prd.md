# Refactor CSS Theme Architecture Without Visual Changes

## Goal

Refactor and organize the current CSS/theme architecture so future interface styles can be added with lower risk, while preserving the current rendered UI exactly for both desktop and mobile.

## What I Already Know

* The user wants CSS organization and extensibility, not a visual redesign.
* Existing styles must not disappear or visually change after refactoring.
* Project instructions require system-design docs to be updated for theme/style architecture changes, and `npm run docs:system-design` must regenerate `docs/system-design.html`.
* Frontend work must consider both mobile and desktop unless explicitly scoped otherwise.
* The root CSS order is guarded: `src/styles.css` imports domain entries and finishes with `src/styles/themes.css`.
* `src/styles/themes.css` currently imports shared theme layers, Bright School, then `src/styles/mobile-adaptive.css` as the final mobile safety layer.
* Player theme registration currently lives in `src/app/visualTheme.js`; only `bright-school` is registered as an available theme.
* `src/modals/SettingsModal.jsx` contains local theme choice data with two unavailable future theme options, so theme registration and theme selector metadata are currently split.
* Existing CSS contract tests already guard root import order, import-only entry files, oversized CSS files, registered theme imports, and Bright School theme scope.
* Static scan findings from current repo state:
  * `src/styles` has about 418 CSS files, about 30k CSS lines, and about 1 MB CSS.
  * `!important` appears about 6237 times.
  * Hard-coded CSS color-like values appear about 3710 times.
  * `theme-bright-school` appears about 3986 times.
  * `--theme-*` definitions appear about 36 times and `var(--theme...)` references about 84 times.
* The current architecture is closer to a Bright School override system than a complete design-token system.
* The working tree is already dirty with many unrelated task and user changes; implementation must preserve those changes and avoid reverting them.

## Assumptions

* The user has chosen a deep CSS organization pass, but existing visual output remains the baseline source of truth.
* Existing visual output should be treated as the baseline source of truth.
* CSS import order and specificity are part of current behavior and must be changed only with explicit verification.
* Any new theme support should start by extracting stable contracts, not by cloning Bright School's high-specificity repair layers.

## Requirements

* Preserve current rendered UI on desktop and mobile.
* Preserve all character skill presentation behavior, including skill banners, board DOM markers, Pixi overlay effects, reduced-motion fallbacks, and SFX/animation timing.
* Preserve current Bright School theme behavior as the default player-facing theme.
* Improve future theme extensibility by consolidating theme metadata and documenting a clear theme entry contract.
* Separate theme-agnostic safety rules from Bright School-specific visual overrides where feasible.
* Deepen the style architecture by introducing clearer token and theme-contract boundaries, prioritizing theme metadata, component-state semantics, mobile safety separation, and documentation.
* Reduce future theme duplication without migrating current UI to Tailwind CSS or a third-party component library.
* Prefer additive, test-guarded refactors over risky selector rewrites.
* Keep existing import-only CSS entry conventions intact unless the PRD explicitly changes them.
* Do not make Tailwind CSS or a component library the first-pass refactor mechanism unless the user explicitly chooses a higher-risk migration path.
* Update system-design docs for any architecture/style-layer changes.

## Acceptance Criteria

* [ ] No intentional visual change to existing desktop UI.
* [ ] No intentional visual change to existing mobile UI.
* [ ] Character skill presentations still render after the refactor, including board overlays and persistent point/row markers.
* [ ] Current `bright-school` theme remains the sanitized default.
* [ ] Theme selector behavior remains unchanged unless a new requirement explicitly changes it.
* [ ] Theme metadata has one source of truth for available and future theme options.
* [ ] The refactor documents which CSS layers are theme-agnostic, Bright School-specific, mobile safety, and gameplay/skill-protected.
* [ ] CSS contract tests pass after the refactor.
* [ ] Visual or screenshot verification is run for representative desktop and mobile surfaces before completion.
* [ ] `npm run docs:system-design` is run after docs updates.
* [ ] A rollback path is clear: changed files are grouped into small, reviewable commits or patches.

## Open Questions

* Which specific surfaces should be used for visual regression coverage beyond the existing contract/unit tests?

## Out of Scope

* No new visual theme should be designed or enabled unless explicitly added later.
* No intentional redesign of Bright School.
* No broad component markup rewrite unless required to preserve style contracts.
* No cleanup of unrelated dirty worktree changes.
* Tailwind/component-library migration is out of scope for the recommended first pass unless explicitly approved.
* First-pass CSS organization should not move or rewrite skill-presentation CSS files unless the change is limited to import entry organization and has targeted skill-effect verification.
* No new player-facing theme is enabled in this task.

## Technical Approach

* Keep current CSS import order behavior stable first, then introduce architecture contracts around it.
* Move theme option metadata toward a single registry so Settings UI, sanitization, tests, and CSS import expectations do not drift.
* Add or refine static tests before/alongside CSS movement so future themes can be added through explicit contracts.
* Tokenize or alias high-value shared semantics where it is low-risk: theme metadata, component state colors, disabled/selected state semantics, motion/focus/touch contracts.
* Avoid broad selector rewrites in gameplay and skill-effect layers unless the refactor is covered by targeted board/room tests.
* Preserve Bright School high-specificity repairs where removing them would create visual risk; document them as legacy guard layers instead of silently flattening them.

## Technical Notes

* Relevant files:
  * `src/styles.css`
  * `src/styles/themes.css`
  * `src/styles/mobile-adaptive.css`
  * `src/styles/themeContract.test.js`
  * `src/styles/styleContract.test.js`
  * `src/app/visualTheme.js`
  * `src/modals/SettingsModal.jsx`
  * `docs/system-design.md`
  * `docs/system-design/06-ui-theme-mobile.md`
* Existing high-risk CSS areas:
  * Bright School isolation, firewall, specificity override, quality/base, mobile final override layers.
  * Final mobile safety layers that mix theme-independent mobile survival rules with Bright School-specific fixes.
  * Theme component semantics with hard-coded result, replay, and skill-chip colors.
  * Board and character skill presentation CSS, especially room board effects, persistent point/row markers, skill action active/disabled effects, and reduced-motion fallbacks.
* Verification should combine static contract tests and representative visual regression checks, because a CSS-only refactor can pass unit tests while subtly changing cascade behavior.
* Tailwind CSS or component libraries can help later with new surfaces and consistent primitive tokens, but they are risky as a first-pass organizing tool because this repo's current UI depends on CSS cascade order, high-specificity theme repairs, import-only entries, and custom game-specific visuals.
* Skill presentation verification should include at least the existing board/room skill tests before any related CSS import or selector boundary changes.
