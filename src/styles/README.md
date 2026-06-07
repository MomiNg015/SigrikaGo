# Style Entry Contract

`src/styles.css` is the only global CSS entry imported by React. Keep it as an ordered map of broad style domains:

1. `base.css`
2. admin, lobby, room, modal, commerce/settings, and responsive domain files
3. mobile and terminal compatibility files
4. `hud-components.css`
5. `themes.css` as the final root layer

Rules for future CSS work:

- Add new player themes through `themes.css` and `src/styles/themes/`, not directly in `styles.css`.
- Split large domain files by moving rules into a clearly named top-level domain file only when it belongs in the root order.
- If a split creates nested CSS, keep it under `src/styles/themes/` unless a new import entry and contract test are added.
- Run `npm test -- src/styles/styleContract.test.js src/styles/themeContract.test.js` after changing CSS entry files.
