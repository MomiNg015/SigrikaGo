# Future Goal Backlog: Full-Repo CSS Cleanup

Baseline: checked after commit `abed55f5` (`refactor css theme layers and safeguards`) on 2026-06-27.

This note records the remaining large blocks for a future long-running goal. It is a planning record, not an implementation change.

## Goal Execution Status

Completed in the long-running CSS cleanup goal on branch `codex/full-repo-css-cleanup`.

- Blocks 1-5 were executed as import-only CSS splits across shared domains, final mobile safety layers, Bright School overlays, room/gameplay CSS, and protected skill-presentation CSS.
- Block 6 was resolved by keeping Tailwind CSS v4 as an already-installed, low-intrusion `tw:` utility layer through `src/styles/tailwind.css`; existing Bright School, room, board, skill-presentation, and final-mobile CSS remain CSS-entry owned unless a future focused migration adds visual checks.
- Block 7 was expanded into `CSS_FULL_REPO_CLEANUP_VERIFICATION_GATES`, which records the CSS contract, battle-fix, desktop/mobile Pixi stability, and final `npm run check` gates.
- Block 8 was handled before the goal by keeping unrelated `.codex-run/` and `.impeccable/` worktree noise untracked and unstaged.

Residual risk after this cleanup is not rule movement inside the committed CSS splits, which is covered by import-order and protected-surface contracts. The remaining visual risk is that the project still uses functional desktop/mobile Playwright stability checks rather than broad screenshot-baseline coverage for every page.

## Already Done

- Player theme metadata now has one registry in `src/app/visualTheme.js`.
- CSS layer inventory and protected-surface contracts now live in `src/styles/cssLayerInventory.js`.
- Round 3 import-only splits are complete for:
  - `src/styles/base/home-stage-artboard.css`
  - `src/styles/modals/mailbox.css`
  - `src/styles/commerce/recruitment/board.css`
- Round 4 regression gates are recorded in `CSS_ROUND4_REGRESSION_CHECKS`.

## Confirmed Remaining Large Blocks

1. Low-risk shared-domain CSS split pass

   Scope: continue import-only splitting and naming cleanup for non-gameplay shared CSS.

   Confirmed debt examples from the current size guard:

   - `src/styles/base/home-legacy-grid.css`
   - `src/styles/hud-components/pop-tech-terminal.css`
   - `src/styles/mobile-modals/phone-house-resume.css`
   - `src/styles/modals/character-opening.css`
   - `src/styles/responsive/phone-portrait-room.css`

   Boundary: do not mix this with board, room, skill, or Bright School late repair cleanup.

2. Final mobile and narrow-desktop safety layer pass

   Scope: split and document the final mobile safety layer while preserving its position after `themes.css`.

   Confirmed debt examples:

   - `src/styles/mobile-adaptive/bright-school-overrides/leaderboard-cards.css`
   - `src/styles/mobile-adaptive/bright-school-portrait/resume-modal-layout.css`
   - `src/styles/mobile-adaptive/bright-school-portrait/settings-tabs.css`
   - `src/styles/mobile-adaptive/mobile-profile-records.css`
   - `src/styles/mobile-adaptive/phone-core.css`
   - `src/styles/mobile-adaptive/phone-gacha.css`

   Boundary: every change here needs both mobile and desktop checks because this layer is the final override after active themes.

3. Bright School theme overlay pass

   Scope: separate shared theme contracts, Bright School component repairs, quality guards, and high-specificity mobile-room overrides.

   Confirmed debt examples:

   - `src/styles/themes/shared.css`
   - `src/styles/themes/theme-components.css`
   - `src/styles/themes/bright-school/component-repairs/foundation-home.css`
   - `src/styles/themes/bright-school/component-repairs/notebook-polish.css`
   - `src/styles/themes/bright-school/component-repairs/warehouse-character.css`
   - `src/styles/themes/bright-school/mobile/room/dock-actions.css`
   - `src/styles/themes/bright-school/mobile/room/shell-header-menu.css`
   - `src/styles/themes/bright-school/mobile/room/viewport-player-strips.css`

   Boundary: keep high-specificity repairs unless visual tests prove they are obsolete.

4. Gameplay and room CSS pass

   Scope: clean room, mobile-room, and room-terminal CSS one surface at a time.

   Confirmed debt examples:

   - `src/styles/mobile-room/portrait-room.css`
   - `src/styles/room-terminal/players-timers-skills.css`
   - `src/styles/room/actions-requests.css`

   Boundary: this is behavior-facing CSS. Do not batch with generic button, panel, media, or mobile cleanup.

5. Skill presentation protected pass

   Scope: only refactor board/skill presentation CSS with dedicated visual and timing regression checks.

   Confirmed protected examples:

   - `src/styles/room/board/stones-skill-effects.css`
   - `src/styles/room/board/effects-canvas-motion.css`
   - `src/styles/room/board/row-slash.css`
   - `src/styles/room/board/row-slash-stone-effects.css`
   - `src/styles/themes/bright-school/effects.css`
   - `src/styles/themes/bright-school/quality-base/refinement-board.css`

   Boundary: this pass must verify board point buttons, SVG grid visibility, Pixi canvas mounting, row slash, persistent skill marks, reduced motion, and SFX timing.

6. Theme token and future-theme readiness pass

   Scope: decide whether to introduce a low-intrusion utility layer or keep future themes fully CSS-entry based.

   Notes:

   - Tailwind CSS was discussed as possible assistance, but the committed CSS refactor did not enable Tailwind.
   - If Tailwind or another utility layer is adopted, do it as a separate dependency and entry-order goal.
   - New player themes should stay disabled in `VISUAL_THEME_OPTIONS` until imported, scoped, and visually verified.

7. CSS contract and visual verification expansion pass

   Scope: keep `styleContract.test.js`, `themeContract.test.js`, and `cssLayerInventory.test.js` aligned with each cleanup step.

   Required verification levels:

   - Static CSS contracts for import order, import-only entries, and oversized-file limits.
   - `npm run verify:battle-fixes` for board, room, skill, and broad CSS changes.
   - `npm run verify:stability -- tests/stability/skill-effects.spec.js` for Pixi/skill visual stability.
   - Representative desktop and mobile screenshots before treating high-risk CSS cleanup as done.

8. Dirty worktree separation before starting the goal

   Current workspace has unrelated uncommitted changes outside this CSS cleanup commit, including server, audio, home, Tailwind/Rough.js, and other task folders. Before starting a sustained goal, either isolate the next goal in a fresh branch/worktree or explicitly decide which dirty changes belong to that goal.

## Recommended Goal Shape

Use one long-running goal with milestones, but commit in small slices:

1. Shared low-risk splits.
2. Final mobile safety splits.
3. Bright School overlay normalization.
4. Room/gameplay CSS cleanup.
5. Skill presentation cleanup.
6. Optional utility/token layer decision.

Each milestone should preserve the current UI and update system-design docs when it changes architecture, style boundaries, or technical debt facts.
