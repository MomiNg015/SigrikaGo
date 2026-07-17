# CSS Architecture

> Project-specific contracts for SigrikaGo stylesheet work.

## Scope

Use this guide before changing `src/styles/**`, player theme CSS, HUD compatibility CSS, mobile safety layers, or CSS contract tests. The current goal is depollution and maintainability without visual redesign.

## Layer Order

`src/styles.css` is the only global CSS entry imported by React. Keep it as an import map:

1. Shared foundation and domain entries such as `base.css`, `lobby.css`, `room.css`, `modals.css`, `commerce-settings.css`, and responsive/mobile entries.
2. Terminal/HUD compatibility entries.
3. `hud-components.css`.
4. `tailwind.css` as a prefixed utility layer.
5. `themes.css`.

`src/styles/themes.css` keeps theme styles after HUD compatibility and imports `mobile-adaptive.css` last. Do not move `mobile-adaptive.css` earlier; it is the final phone, portrait, landscape, and narrow-desktop safety layer.

## Bright School Contract

Bright School is the default player theme. Its entry map is:

1. `themes/bright-school/base.css`
2. `themes/bright-school/gallery-polish.css`
3. `themes/bright-school/surface-contracts.css`
4. `themes/bright-school/component-repairs.css`
5. `themes/bright-school/qa-guard.css`

`surface-contracts.css` replaces the old broad fallback cleanup stack. It may reset inherited HUD effects only through explicit owner selectors and known surface contracts. It must not reintroduce purge/firewall naming, broad substring selectors, or all-element theme resets.

## Selector Rules

Allowed patterns:

- Explicit owner selectors such as `.settings-modal-content`, `.announcement-list-row`, `.lock-character-card`, `.store-owned-tag`.
- Scoped theme selectors under `.app-shell.player-theme-enabled.theme-bright-school`.
- Duplicated Bright School specificity only for late override layers that must beat earlier `!important` rules.
- Board and skill selectors owned by their domain files, not by generic theme resets.

Forbidden patterns:

- Broad theme substring fallbacks such as `[class*="panel"]`, `[class*="card"]`, `[class*="item"]`, `[class*="row"]`, `[class*="dock"]`, `[class*="setting"]`, `[class*="lock"]`, `[class*="decor"]`, or `[class*="owned"]`.
- Theme-scoped `*` resets for `box-shadow`, `text-shadow`, `filter`, `transform`, backgrounds, or pseudo-elements.
- Generic room `button`, `img`, `svg`, `span`, or pseudo-element resets that can catch board points, stones, Pixi canvases, skill overlays, or final mobile controls.
- Empty compatibility files kept only as a fallback hook.

If an inherited HUD artifact still leaks through, add the smallest explicit selector in the owning domain or `surface-contracts/` file, then add or update a CSS contract test that checks both the intended rule and the forbidden broad fallback absence.

## Protected Surfaces

Treat these as high-risk during cleanup:

- `src/styles/room/board/**`
- `src/styles/themes/bright-school/effects/**`
- Pixi canvas hosts such as `.board-effects-canvas`
- Board point buttons, SVG grid, stones, scoring marks, row slash, protocol marks, and targeting previews
- `src/styles/mobile-adaptive/**`
- Bright School portrait room/mobile guard layers

Do not migrate or restyle these surfaces unless the task explicitly targets them and includes visual or stability verification.

## Debt And Expansion Contracts

`src/styles/cssLayerInventory.js` owns the current CSS cleanup contracts.

- `CSS_DEBT_BASELINE` is the 2026-07-16 all-`src/styles` non-growth baseline for CSS file count, bytes, `!important`, hardcoded hex values, media-query files, reduced-motion files, and high z-index files. It includes the current hidden player-window scrollbar, mobile music shop card, left-aligned replay-time, story-player padding, dedicated Zahira shop crayon-background owners, the final `bright-school-overrides/auth-login-lockup.css` split, and the exact-asset citrus-sun Semantic Ignition light / wind-tail motion owner. The login split and bespoke nameplate owner record their bounded expansion because folding those rules into shared or broad theme files would weaken ownership; later cleanup should reduce these counts or document why another contract update is necessary. Do not treat the baseline as permission to add visual drift.
- `CSS_Z_INDEX_CONTRACT` registers the existing high z-index overlays. New values at or above `1000` must be registered there or replaced by an existing named layer, preferably a local token such as `--room-floating-z`.
- `CSS_MOTION_CONTRACT` records the current timing token sources and reduced-motion families. Motion-heavy CSS should animate `transform` and `opacity` where possible and keep `prefers-reduced-motion` coverage beside the owning family.
- `CSS_BREAKPOINT_CONTRACT` registers the current responsive media-query families. New breakpoint families need a desktop and mobile rationale plus contract-test registration.

## Tailwind Route

Tailwind v4 is installed only as a low-intrusion utility layer through `src/styles/tailwind.css`.

- The full staged execution plan is `.trellis/tasks/07-01-tailwind-migration-roadmap/tailwind-full-migration-plan.md`; read it before starting any broad Tailwind migration or protected-surface work.
- Keep the `tw:` prefix.
- Keep preflight disabled.
- Keep `src/styles/tailwind.css` import-only. Project semantic tokens live in `src/styles/tailwind/tokens.css` through `@theme inline` and must reference existing CSS variables or stable Sigrika values instead of inventing a second palette. Because preflight is omitted through individual Tailwind imports, keep `source("../")` on the `utilities.css` import so `src/` JSX pilot classes generate actual `tw:` utility CSS.
- Phase 1: baseline, contracts, and token scaffold only; do not migrate existing JSX or UI surfaces.
- Phase 2: pilot `tw:` utilities only in new low-risk surfaces or isolated admin/tooling UI.
- Current Phase 2 pilot: `src/admin/AdminAudit.jsx` uses the `AdminTableScroll` wrapper backed by the `ScrollArea` primitive for the admin-only audit table shell, replacing `.audit-table-wrap` overflow CSS without touching player-facing surfaces.
- Phase 3: build UI primitives before broad feature migration.
- Current Phase 3 primitives: `src/ui/primitives/ScrollArea.jsx` centralizes `tw:max-w-full` and `tw:overflow-x-auto`; `src/admin/adminComponents.jsx` wraps it as `AdminTableScroll` for all admin table shells while `.admin-table-wrap` still owns margin, border, radius, and background. `src/ui/primitives/Badge.jsx` centralizes visually equivalent `tw:inline-flex`, `tw:items-center`, and `tw:justify-center`; `src/ui/primitives/EmptyState.jsx` centralizes `tw:text-center`, `tw:px-3`, and `tw:py-6` for admin table empty cells through `AdminTableEmpty`; and `src/ui/primitives/Button.jsx` centralizes only action alignment utilities through `AdminActionButton` while existing admin CSS still owns `.primary-action`, `.secondary-action`, and `.danger-action` visuals. Feature components should consume these primitives or local wrappers instead of owning repeated raw utility strings.
- Phase 4: migrate repeated modal/list/card/form internals one domain at a time.
- Current Phase 4 pilot: `src/modals/modalComponents.jsx` wraps `Button` as `ModalActionButton`; the same modal domain now provides `InformationCenterLayout` for the announcement/mailbox desktop master-detail and mobile list-detail structure on top of `ModalDialog`. `src/styles/modals/information-center.css` owns neutral structure, while announcement/mailbox files own content visuals and `src/styles/mobile-adaptive/information-center.css` owns final post-theme safe-area and pane transitions. This does not authorize migrating unrelated player modals, action visuals, commerce cards, or gameplay controls.
- Phase 5: migrate home, lobby, and commerce main-flow non-gameplay layouts after primitives are stable.
- Current Phase 5 pilot: `src/home/homeComponents.jsx` wraps `Button` as `HomeActionButton`; `src/home/HomeScreen.jsx` uses it only for the match-mode picker cancel action. This moves only action alignment utilities through the primitive layer; existing home/modal/mobile CSS still owns match-mode layout, option buttons, spacing, artboard behavior, decorative imagery, colors, borders, shadows, typography, and responsive safety. Do not migrate home entry cards, home utility entries, player plaque art, match-mode option buttons, commerce cards, or gameplay controls from this pilot without focused desktop/mobile tests and visual checks.
- Phase 6: tokenise Bright School so theme CSS becomes variables plus explicit owner repairs.
- Phase 7: reduce final mobile safety layers only after matching desktop/mobile component ownership exists.
- Current Phase 6 pilot: `src/styles/tailwind/tokens.css` exposes Bright School paper, clean surface, ink, border, accent, and paper-shadow variables as semantic Tailwind tokens. Bright School value ownership stays in `src/styles/themes/bright-school/surface-contracts/final-root-surfaces.css` and `src/styles/themes/bright-school/quality-base/refinement-foundation.css`; do not move owner selectors or change visual values as part of this token scaffold.
- Current Phase 7 pilot: `src/styles/cssLayerInventory.js` only records the `mobile-adaptive` final guard reduction candidate. `mobile-adaptive.css` remains the final post-theme guard until replacement component ownership has phone portrait, small landscape, narrow desktop, and regular desktop coverage.
- Board, room, skill presentation, Bright School final mobile safety, and Pixi-related CSS stay CSS-entry owned until they have dedicated visual regression coverage.

## Verification

After changing CSS architecture, run the focused static contracts:

```bash
npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js src/styles/hudComponents.test.js
```

For room, board, skill, mobile, or broad theme changes, also run:

```bash
npm run verify:battle-fixes
npm run verify:stability -- tests/stability/skill-effects.spec.js
```

Run `npm run docs:system-design` whenever CSS architecture, theme structure, or technical-debt guidance changes.
