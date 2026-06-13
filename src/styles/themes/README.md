# Player Theme CSS Layout

The player-facing skin is loaded from `src/styles/themes.css` after all base, modal, HUD, and mobile styles. Bright School is the only registered skin and the default fallback for old or unknown saved preferences.

Import order:

1. `shared.css` - common theme variables and player-only theme wiring.
2. `isolation.css` - neutralizes inherited HUD effects for the Bright School skin.
3. `theme-components.css` - shared semantic component states such as timer tracks, result badges, replay outcomes, and skill chips.
4. `bright-school.css` - Bright School entry map.
5. `mobile-adaptive.css` - final mobile safety layer imported from `themes.css`.

Rules for new skins:

- Add a theme id in `src/app/visualTheme.js`; `VISUAL_THEME_IDS`, `visualThemeClassName()`, `visualThemeScopeSelector()`, and `visualThemeCssImportPath()` are the registry contract used by tests. Keep `bright-school` as the default unless a product decision changes the default skin.
- Copy `_new-theme-template.css` to a real theme file, or use an import-only folder entry like Bright School when the skin needs several layers.
- Import the new file in `themes.css` after `isolation.css` using the same path returned by `visualThemeCssImportPath(<id>)`.
- Keep selectors scoped to `.app-shell.player-theme-enabled.theme-<id>`; folder-based themes must still include that scope somewhere in their imported CSS tree.
- Run `npm test -- src/app/visualTheme.test.js src/styles/themeContract.test.js` before starting detailed visual polish.
- Do not edit React class names, state, routes, socket flows, or click handlers for theme-only work.
- If a skin needs many overrides, use a folder with an import-only entry file like `bright-school.css`.

Bright School high-frequency edit path:

- Use the focused files under `bright-school/component-repairs/` for normal visual polish; keep `bright-school/component-repairs.css` import-only.
- Use `bright-school/qa-guard.css` only as the import-only compatibility entry for late guard layers.
- Put overflow, clarity, and focus fixes in focused files under `bright-school/quality-base/`; keep `bright-school/quality-base.css` import-only. Shop/warehouse/profile commerce surfaces belong in `commerce.css`; lobby and plaque work in `home.css`; battle/replay room surfaces in `room.css`; handbook/settings/modal cleanup in `modals.css`; phone/tablet layout rules in `mobile.css`, with portrait battle-room rules delegated again to `mobile/room/`; and skill glow/keyframes/scoring effects in `effects.css`.
- Avoid editing `bright-school/firewall/` unless a new family of inherited HUD bleed-through appears; keep `bright-school/firewall.css` import-only.
