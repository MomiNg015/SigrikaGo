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

## Tailwind Route

Tailwind v4 is installed only as a low-intrusion utility layer through `src/styles/tailwind.css`.

- Keep the `tw:` prefix.
- Keep preflight disabled.
- Phase 1: document contracts and keep existing CSS visuals stable.
- Phase 2: pilot `tw:` utilities only in new low-risk surfaces or isolated admin/tooling UI.
- Phase 3: consider shared modal/list/card migration after desktop and mobile visual baselines exist.
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
