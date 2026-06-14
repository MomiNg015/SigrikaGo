# Style Entry Contract

`src/styles.css` is the only global CSS entry imported by React. Keep it as an ordered map of broad style domains:

1. `base.css` delegates shared foundation, preload, controls, topbar, home, and feedback rules to `src/styles/base/`.
2. admin, lobby, room, modal, commerce/settings, and responsive domain files
3. mobile and terminal compatibility files
4. `hud-components.css`
5. `themes.css` as the final root layer

Rules for future CSS work:

- Add new player themes through `themes.css` and `src/styles/themes/`, not directly in `styles.css`.
- Split large domain files by moving rules into a clearly named top-level domain file only when it belongs in the root order.
- If a split creates nested CSS, keep it under an approved import entry directory such as `src/styles/base/`, `src/styles/room/`, `src/styles/modals/`, `src/styles/commerce/`, `src/styles/responsive/`, `src/styles/mobile-room/`, `src/styles/hud-components/`, `src/styles/mobile-adaptive/`, or `src/styles/themes/`, and update the contract test with the import order.
- Run `npm test -- src/styles/styleContract.test.js src/styles/themeContract.test.js` after changing CSS entry files.
