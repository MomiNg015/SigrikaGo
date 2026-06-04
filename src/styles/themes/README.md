# Player Theme CSS Layout

Player-facing skins are loaded from `src/styles/themes.css` after all base, modal, HUD, and mobile styles.

Import order:

1. `shared.css` - common theme variables and player-only theme wiring.
2. `isolation.css` - neutralizes inherited HUD effects for every non-current skin.
3. `current.css` - current anime pop-tech HUD skin.
4. `original.css` - original plain UI restore skin.
5. `bright-school.css` - Bright School entry map.

Rules for new skins:

- Add a theme id in `src/app/visualTheme.js`.
- Copy `_new-theme-template.css` to a real theme file.
- Import the new file in `themes.css` after `isolation.css`.
- Keep selectors scoped to `.app-shell.player-theme-enabled.theme-<id>`.
- Do not edit React class names, state, routes, socket flows, or click handlers for theme-only work.
- If a skin needs many overrides, use a folder with an import-only entry file like `bright-school.css`.

Bright School high-frequency edit path:

- Use `bright-school/component-repairs.css` for normal visual polish.
- Use `bright-school/qa-guard.css` for overflow, clarity, focus, touch target, or mobile safety fixes.
- Avoid editing `bright-school/firewall.css` unless a new family of inherited HUD bleed-through appears.
