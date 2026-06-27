# Style Entry Contract

`src/styles.css` is the only global CSS entry imported by React. Keep it as an ordered map of broad style domains:

1. `base.css` delegates shared foundation, preload, controls, topbar, home, and feedback rules to `src/styles/base/`.
2. admin, lobby, room, modal, commerce/settings, and responsive domain files
3. mobile and terminal compatibility files
4. `hud-components.css`
5. `themes.css` as the final root layer

## Player Theme Registry

Player-facing theme metadata lives in `src/app/visualTheme.js`.

- `VISUAL_THEME_OPTIONS` is the complete settings list, including future disabled options.
- `VISUAL_THEMES` and `VISUAL_THEME_IDS` contain only currently available themes.
- `sanitizeVisualTheme()` must continue to fall back to `bright-school` for unknown, legacy, or future-disabled ids.
- Settings UI should render from `VISUAL_THEME_OPTIONS`, not from a local copy.

## Theme Layer Order

The active theme stack is intentionally conservative:

1. `themes/shared.css` for theme-neutral shared tokens and component affordances.
2. `themes/isolation.css` for legacy anti-bleed cleanup.
3. `themes/theme-components.css` for shared theme component contracts.
4. `themes/bright-school.css` for the current default player theme.
5. `mobile-adaptive.css` as the last mobile safety layer.

Do not move `mobile-adaptive.css` earlier in the cascade. It is the final override layer for phone and narrow tablet usability.

## Layer Inventory

Round-2 CSS cleanup planning is encoded in `src/styles/cssLayerInventory.js` and guarded by `src/styles/cssLayerInventory.test.js`.

The inventory divides CSS into five practical buckets:

- `reorganizable-shared-domains`: low-to-medium risk import-only domains for Round 3 cleanup.
- `high-risk-gameplay-room`: room, board, mobile-room, and battlefield skin surfaces that affect play behavior.
- `bright-school-theme-overrides`: Bright School-specific cascade repairs and high-specificity guards.
- `final-mobile-safety`: final phone, portrait, landscape, and narrow-desktop safety layers.
- `skill-presentation-protected`: Pixi canvas, DOM board effects, skill marks, row slash, targeting, and reduced-motion surfaces.

Round 3 cleanup candidates must not include files listed by `high-risk-gameplay-room`, `skill-presentation-protected`, or `CSS_PROTECTED_SURFACES`.

Round 3 has split these shared-domain debt files into import-only sub-entries without changing rule values:

- `base/home-stage-artboard.css` -> `base/home-stage-artboard/`
- `base/home-legacy-grid.css` -> `base/home-legacy-grid/`
- `hud-components/pop-tech-terminal.css` -> `hud-components/pop-tech-terminal/`
- `mobile-modals/phone-house-resume.css` -> `mobile-modals/phone-house-resume/`
- `modals/mailbox.css` -> `modals/mailbox/`
- `commerce/recruitment/board.css` -> `commerce/recruitment/board/`

`CSS_ROUND3_SHARED_SPLITS` records these boundaries, and `cssLayerInventory.test.js` verifies each split entry remains import-only and stays out of gameplay or skill protected files.

Round 4 regression gates are recorded in `CSS_ROUND4_REGRESSION_CHECKS`:

- Static CSS contracts: `npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js`
- Focused board/skill units: `npm run verify:battle-fixes`
- Desktop and mobile Pixi visual stability path: `npm run verify:stability -- tests/stability/skill-effects.spec.js`

## Gameplay And Skill Presentation Guard

Board and skill presentation CSS is protected during theme refactors. Broad button, media, pseudo-element, transform, z-index, or min-size rules must not override:

- `.board .point` transparent button behavior
- `.board-lines` SVG sizing and visible stroke
- `.board-effects-canvas` presentation-only Pixi canvas
- `.board-wrap` skill state classes such as targeting, erased, spray, flip, row-slash, and color-illusion states
- Bright School effect entries under `src/styles/themes/bright-school/effects/`

If a CSS refactor touches any of those selectors or files, run the board/room visual and contract tests before treating it as safe.

Rules for future CSS work:

- Add new player themes through `themes.css` and `src/styles/themes/`, not directly in `styles.css`.
- Add future theme names to `VISUAL_THEME_OPTIONS`; only set `available: true` when the theme entry is imported and visually verified.
- Split large domain files by moving rules into a clearly named top-level domain file only when it belongs in the root order.
- If a split creates nested CSS, keep it under an approved import entry directory such as `src/styles/base/`, `src/styles/room/`, `src/styles/modals/`, `src/styles/commerce/`, `src/styles/home-terminal/`, `src/styles/mobile-home/`, `src/styles/responsive/`, `src/styles/mobile-room/`, `src/styles/hud-components/`, `src/styles/mobile-adaptive/`, or `src/styles/themes/`, and update the contract test with the import order.
- Run `npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js` after changing CSS entry files. Run `npm run verify:battle-fixes` before handing off board, skill, room, mobile, or broad CSS refactors.
