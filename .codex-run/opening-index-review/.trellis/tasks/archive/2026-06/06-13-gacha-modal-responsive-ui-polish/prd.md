# Gacha Modal Responsive UI Polish

## Goal

Polish the player-facing `GachaModal` into a Bright School compatible responsive capsule counter: stronger desktop composition, mobile-safe single-column operation, no horizontal overflow, and clearer draw controls. Keep gacha logic, API payloads, pool data, and reward settlement unchanged.

## Requirements

- Redesign the player gacha modal layout primarily through CSS, with only small semantic JSX wrappers/classes if needed.
- Desktop layout should feel like a playful Bright School capsule counter with clear pool selection, central machine/prize stage, and a distinct wallet/action control area.
- Mobile layout must fit within the safe-area viewport, avoid horizontal scroll, keep pool tabs accessible as a compact top scroller, and keep draw actions reachable.
- Prize, history, and result nested dialogs must scroll internally on mobile so action controls are not hidden behind the viewport.
- Ten-pull results must remain a desktop 5-column, 2-row grid and become mobile-friendly with compact adaptive cards.
- Bright School theme overrides must preserve the design without breaking the mobile base layout.
- Update `docs/system-design.md`; regenerate `docs/system-design.html` through the existing docs script or aggregate check.

## Acceptance Criteria

- [ ] `GachaModal` renders the existing pool tabs, featured stage, wallet, prize/history buttons, machine animation, and draw buttons.
- [ ] Desktop CSS keeps `.gacha-result-grid.ten-pull` at `repeat(5, minmax(0, 1fr))`.
- [ ] Mobile CSS defines dedicated rules for `.gacha-modal`, `.gacha-pool-tabs`, `.gacha-main`, and `.gacha-draw-actions` under the final mobile safety layer.
- [ ] Bright School commerce CSS includes mobile gacha overrides with selector strength sufficient to beat existing themed rules.
- [ ] No new dependency or image asset is added.
- [ ] `docs/system-design.md` documents the new responsive gacha modal layout contract.

## Definition of Done

- Update focused markup/CSS/tests/docs.
- Run `npm test -- src/modals/GachaModal.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js`.
- Run `npm run build`.
- Run `npm run check` before handoff if feasible.

## Technical Approach

Use the existing `commerce-settings.css` as the base gacha contract, `mobile-adaptive.css` as the final mobile safety layer imported after theme files, and `themes/bright-school/commerce.css` for Bright School-specific polish. Preserve helper functions and draw behavior in `GachaModal.jsx`.

## Decision (ADR-lite)

Context: The current player gacha modal is a fixed desktop-heavy two-column layout and has no dedicated mobile adaptation.

Decision: Implement a CSS-first responsive redesign with minimal JSX class additions. Put mobile survival rules in `mobile-adaptive.css` because it is imported after Bright School theme layers.

Consequences: The change stays low-risk for gacha logic and API behavior, but static CSS contract tests must be updated to lock the new layout ownership.

## Out of Scope

- Admin gacha pool editor changes.
- Backend/API/gacha settlement changes.
- New art assets, new dependencies, or a new theme system.

## Technical Notes

- Main component: `src/modals/GachaModal.jsx`.
- Base gacha styles: `src/styles/commerce-settings.css`.
- Bright School polish: `src/styles/themes/bright-school/commerce.css`.
- Final mobile safety layer: `src/styles/mobile-adaptive.css`.
- Existing tests: `src/modals/GachaModal.test.js`, `src/styles/styleContract.test.js`, `src/styles/themeContract.test.js`.
- Project docs requirement from `AGENTS.md`: every update must synchronize `docs/system-design.md`.
