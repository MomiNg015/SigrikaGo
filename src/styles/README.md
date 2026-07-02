# Style Entry Contract

`src/styles.css` is the only global CSS entry imported by React. Keep it as an ordered map of broad style domains:

1. `base.css` delegates shared foundation, preload, controls, topbar, home, and feedback rules to `src/styles/base/`.
2. admin, lobby, room, modal, commerce/settings, and responsive domain files
3. mobile and terminal compatibility files
4. `hud-components.css`
5. `tailwind.css` as a prefixed, low-intrusion utility layer with project tokens in `tailwind/tokens.css`
6. `themes.css` as the final root layer

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

## Utility Layer Decision

Tailwind CSS v4 is installed, but only as the low-intrusion `src/styles/tailwind.css` utility layer. It is imported after `hud-components.css` and immediately before `themes.css`, imports `tailwindcss/theme.css`, `./tailwind/tokens.css`, and `tailwindcss/utilities.css` with `prefix(tw)` on Tailwind imports, and deliberately omits preflight/global resets. Because Tailwind is imported as individual files to omit preflight, the utilities import must keep `source("../")` so `src/` JSX pilot classes generate real CSS.

Full execution plan: `.trellis/tasks/07-01-tailwind-migration-roadmap/tailwind-full-migration-plan.md`. Use that file as the task-by-task handoff before broad Tailwind migration, protected gameplay migration, or any reevaluation of `tw:`/preflight policy.

`src/styles/tailwind/tokens.css` is the Phase 1 semantic token scaffold and the current Phase 6 Bright School token bridge. It must stay `@theme inline`, must not import other CSS, and should reference existing project CSS variables or stable Sigrika values instead of inventing a parallel palette.

Use `tw:` utilities only for new low-risk surfaces. The long-term route is staged:

1. Phase 1 keeps existing visuals stable, records the roadmap, adds semantic tokens, and guards import order, no-preflight, and protected-surface exclusions with tests. It must not migrate JSX or existing business UI.
2. Phase 2 pilots `tw:` utilities in new or isolated admin/tooling surfaces.
3. Phase 3 creates UI primitives before broad feature migration.
4. Phase 4 migrates repeated modal, list, card, tab, and form internals one domain at a time.
5. Phase 5 migrates home, lobby, and commerce main-flow non-gameplay layouts after primitives are stable.
6. Phase 6 tokenises Bright School so theme CSS becomes variables plus explicit owner repairs.
7. Phase 7 reduces final mobile safety layers only after matching desktop/mobile component ownership exists.

Do not migrate existing room gameplay, board geometry, board point buttons, Pixi canvas hosts, skill-presentation keyframes/DOM marks, Bright School final mobile safety, or mobile gameplay controls to Tailwind without a focused migration plan and visual regression checks. Future player themes remain CSS-entry based through `themes.css` until the theme is imported, scoped, and visually verified. Tailwind preflight stays disabled and the `tw:` prefix stays required unless a later explicit architecture change replaces those contracts.

Current Phase 2 pilot: `src/admin/AdminAudit.jsx` uses `AdminTableScroll`, backed by the `ScrollArea` primitive, for the admin-only audit table shell. The old `.audit-table-wrap` audit-specific CSS is gone, and the shared `.admin-table-wrap` no longer owns horizontal overflow while preserving its visual shell rules. This pilot is intentionally limited to isolated admin route surfaces; it does not authorize player-facing, room, board, skill, Pixi, or final-mobile migration.

Current Phase 3 primitives: `src/ui/primitives/ScrollArea.jsx` centralizes overflow utilities, `src/admin/adminComponents.jsx` wraps it as `AdminTableScroll` for all admin table shells, `src/ui/primitives/Badge.jsx` centralizes low-risk inline badge layout utilities while existing CSS still owns visual treatments, `src/ui/primitives/EmptyState.jsx` centralizes admin table empty-cell alignment/spacing through `AdminTableEmpty`, and `src/ui/primitives/Button.jsx` centralizes only action alignment utilities through the admin-only `AdminActionButton` wrapper. The wrapper maps semantic admin variants back to existing `.primary-action`, `.secondary-action`, and `.danger-action` classes; it does not authorize player-facing button restyling. `src/ui/classNames.js` is the local class composition helper for primitives; add a dependency only if this helper becomes insufficient.

Current Phase 4 pilot: `src/modals/modalComponents.jsx` exposes `ModalActionButton`, a modal-domain wrapper around `Button` that maps semantic modal variants back to existing `.primary-action`, `.secondary-action`, and `.danger-action` visual classes. `ConfirmModal` in `src/modals/FeedbackModals.jsx`, the submit action in `src/modals/MessageBoardModal.jsx`, simple retry/load-more secondary actions in `src/modals/AnnouncementModal.jsx`, the save action in `src/modals/PersonalizationModal.jsx`, the mailbox attachment claim action in `src/modals/MailboxModal.jsx`, the duel-mode cancel action in `src/modals/friends/FriendsOverlays.jsx`, and the profile report submit action in `src/modals/UserProfileCard.jsx` are the first consumers. This pilot moves only alignment utilities through Tailwind; shared modal/action, mailbox, and friends/profile CSS still owns visual styling, list/detail layout, paper background, match-mode option buttons, profile confirm panels, profile social action buttons, and mobile treatment until a full modal surface is migrated with focused desktop/mobile tests.

Current Phase 5 pilot: `src/home/homeComponents.jsx` exposes `HomeActionButton`, a home-flow wrapper around `Button` that maps semantic home variants back to existing `.primary-action`, `.secondary-action`, and `.danger-action` visual classes. `MatchModePicker` in `src/home/HomeScreen.jsx` uses it only for the cancel action. This pilot moves only alignment utilities through Tailwind; home/modal/mobile CSS still owns match-mode layout, option buttons, spacing, artboard behavior, decorative imagery, colors, borders, shadows, typography, and responsive safety until a full home/lobby/commerce surface is migrated with focused desktop/mobile tests.

Current Phase 6 pilot: `src/styles/tailwind/tokens.css` exposes existing Bright School paper, clean surface, ink, border, accent, and paper-shadow variables as semantic Tailwind tokens. The value owners remain `src/styles/themes/bright-school/surface-contracts/final-root-surfaces.css` and `src/styles/themes/bright-school/quality-base/refinement-foundation.css`; do not move owner selectors or change rule values as part of tokenization.

Current Phase 7 pilot: `src/styles/cssLayerInventory.js` registers `mobile-adaptive.css` as the final guard reduction candidate only. The final mobile layer remains after `themes.css` until replacement component ownership has phone portrait, small landscape, narrow desktop, and regular desktop coverage.

## Layer Inventory

Round-2 CSS cleanup planning is encoded in `src/styles/cssLayerInventory.js` and guarded by `src/styles/cssLayerInventory.test.js`.

`CSS_DEBT_BASELINE` records the 2026-07-02 all-`src/styles` non-growth baseline for file count, total CSS bytes, `!important` usage, hardcoded hex values, media-query files, reduced-motion files, and high z-index files. It is not a visual target; it is a guardrail for staged cleanup. Future CSS cleanup should reduce these numbers or update the contract with a documented reason, without changing the current interface appearance.

`CSS_Z_INDEX_CONTRACT`, `CSS_MOTION_CONTRACT`, and `CSS_BREAKPOINT_CONTRACT` are the current expansion contracts for layered UI work. New z-index values at or above 1000 must be registered as legacy/system overlays or moved onto an existing named layer. Motion-heavy CSS should use the shared theme/Tailwind timing tokens where practical, prefer `transform` and `opacity`, and keep reduced-motion coverage near the owning family. New media-query families must be added to the breakpoint contract with desktop and mobile rationale instead of introducing one-off responsive ranges.

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
- `modals/character-opening.css` -> `modals/character-opening/`
- `responsive/phone-portrait-room.css` -> `responsive/phone-portrait-room/`
- `modals/mailbox.css` -> `modals/mailbox/`
- `commerce/recruitment/board.css` -> `commerce/recruitment/board/`

`CSS_ROUND3_SHARED_SPLITS` records these boundaries, and `cssLayerInventory.test.js` verifies each split entry remains import-only and stays out of gameplay or skill protected files.

Final mobile safety cleanup is tracked separately because `mobile-adaptive.css` stays after `themes.css` and may override desktop and mobile theme rules:

- `mobile-adaptive/mobile-profile-records.css` -> `mobile-adaptive/mobile-profile-records/`
- `mobile-adaptive/phone-core.css` -> `mobile-adaptive/phone-core/`
- `mobile-adaptive/phone-gacha.css` -> `mobile-adaptive/phone-gacha/`
- `mobile-adaptive/bright-school-overrides/leaderboard-cards.css` -> `mobile-adaptive/bright-school-overrides/leaderboard-cards/`
- `mobile-adaptive/bright-school-portrait/resume-modal-layout.css` -> `mobile-adaptive/bright-school-portrait/resume-modal-layout/`
- `mobile-adaptive/bright-school-portrait/settings-tabs.css` -> `mobile-adaptive/bright-school-portrait/settings-tabs/`

`CSS_FINAL_MOBILE_SAFETY_SPLITS` records these boundaries, and `cssLayerInventory.test.js` verifies each split entry remains import-only inside the final mobile safety bucket.

Theme overlay cleanup is tracked separately from shared-domain and final-mobile cleanup:

- `themes/shared.css` -> `themes/shared/`
- `themes/theme-components.css` -> `themes/theme-components/`
- `themes/bright-school/component-repairs/foundation-home.css` -> `themes/bright-school/component-repairs/foundation-home/`
- `themes/bright-school/component-repairs/warehouse-character.css` -> `themes/bright-school/component-repairs/warehouse-character/`
- `themes/bright-school/component-repairs/notebook-polish.css` -> `themes/bright-school/component-repairs/notebook-polish/`
- `themes/bright-school/mobile/room/shell-header-menu.css` -> `themes/bright-school/mobile/room/shell-header-menu/`
- `themes/bright-school/mobile/room/viewport-player-strips.css` -> `themes/bright-school/mobile/room/viewport-player-strips/`
- `themes/bright-school/mobile/room/dock-actions.css` -> `themes/bright-school/mobile/room/dock-actions/`

`CSS_THEME_OVERLAY_SPLITS` records these boundaries, and `cssLayerInventory.test.js` verifies each split entry remains import-only inside the Bright School/theme overlay bucket.

Gameplay and room cleanup is tracked separately from shared-domain and theme cleanup because those selectors affect active room controls:

- `room/actions-requests.css` -> `room/actions-requests/`
- `mobile-room/portrait-room.css` -> `mobile-room/portrait-room/`
- `room-terminal/players-timers-skills.css` -> `room-terminal/players-timers-skills/`

`CSS_GAMEPLAY_ROOM_SPLITS` records these boundaries, and `cssLayerInventory.test.js` verifies each split entry remains import-only inside the high-risk gameplay room bucket.

Round 4 regression gates are recorded in `CSS_ROUND4_REGRESSION_CHECKS`:

- Static CSS contracts: `npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js`
- Focused board/skill units: `npm run verify:battle-fixes`
- Desktop and mobile Pixi visual stability path: `npm run verify:stability -- tests/stability/skill-effects.spec.js`

Full-repo cleanup completion gates are recorded in `CSS_FULL_REPO_CLEANUP_VERIFICATION_GATES`:

- Every CSS cleanup stage runs the static CSS contracts.
- Room, board, skill, mobile, or broad CSS changes run `npm run verify:battle-fixes`.
- Skill-presentation, Pixi canvas, or protected board effect changes run `npm run verify:stability -- tests/stability/skill-effects.spec.js`.
- Final handoff runs `npm run check`, which includes the full unit suite, production build, production config check, and system design HTML generation.

## Gameplay And Skill Presentation Guard

Board and skill presentation CSS is protected during theme refactors. Broad button, media, pseudo-element, transform, z-index, or min-size rules must not override:

- `.board .point` transparent button behavior
- `.board-lines` SVG sizing and visible stroke
- `.board-effects-canvas` presentation-only Pixi canvas
- `.board-wrap` skill state classes such as targeting, erased, spray, flip, row-slash, and color-illusion states
- Bright School effect entries under `src/styles/themes/bright-school/effects/`

If a CSS refactor touches any of those selectors or files, run the board/room visual and contract tests before treating it as safe.

Protected skill presentation cleanup is tracked separately from gameplay room cleanup:

- `room/board/stones-skill-effects.css` -> `room/board/stones-skill-effects/`
- `themes/bright-school/quality-base/refinement-board.css` -> `themes/bright-school/quality-base/refinement-board/`

`CSS_SKILL_PRESENTATION_SPLITS` records these boundaries, and `cssLayerInventory.test.js` verifies each split remains import-only inside the skill-presentation protected bucket.

Rules for future CSS work:

- Add new player themes through `themes.css` and `src/styles/themes/`, not directly in `styles.css`.
- Add future theme names to `VISUAL_THEME_OPTIONS`; only set `available: true` when the theme entry is imported and visually verified.
- Split large domain files by moving rules into a clearly named top-level domain file only when it belongs in the root order.
- If a split creates nested CSS, keep it under an approved import entry directory such as `src/styles/base/`, `src/styles/room/`, `src/styles/modals/`, `src/styles/commerce/`, `src/styles/home-terminal/`, `src/styles/mobile-home/`, `src/styles/responsive/`, `src/styles/mobile-room/`, `src/styles/hud-components/`, `src/styles/mobile-adaptive/`, or `src/styles/themes/`, and update the contract test with the import order.
- Use explicit owner selectors for theme cleanup. Do not add broad `[class*="..."]` fallback selectors, all-element theme resets, or empty compatibility CSS files.
- Run `npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js` after changing CSS entry files. Run `npm run verify:battle-fixes` before handing off board, skill, room, mobile, or broad CSS refactors.
