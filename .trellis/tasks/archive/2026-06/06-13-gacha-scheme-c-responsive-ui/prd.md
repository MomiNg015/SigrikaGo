# Gacha Scheme C Responsive UI

## Goal

Implement the selected Scheme C visual direction for the player-facing gacha modal on both desktop and mobile.

Scheme C is a warm school-festival and candy-capsule style. It should feel distinct from ordinary admin panels while still fitting the project's Bright School visual language.

## Requirements

- Keep all existing gacha behavior, data flow, draw pricing, wallet display, prize/history dialogs, and result dialog contracts intact.
- Desktop gacha modal should use a festival-ticket left pool rail, a central candy capsule machine, a featured prize stage, wallet, round prize/history actions, and single/ten draw buttons.
- Mobile gacha modal must be usable in a single-column layout with horizontally scrollable pool tabs, compact featured stage, visible wallet, and reachable draw buttons.
- The new visual system should be scoped to the player gacha modal so admin gacha management and unrelated modals are not restyled accidentally.
- Use CSS animation and microinteraction polish for the capsule machine without blocking reduced functionality when drawing is disabled.
- Update tests that own the gacha markup/CSS contract.
- Update `docs/system-design.md` with the chosen Scheme C responsive modal behavior.

## Acceptance Criteria

- `GachaModal` exposes a clear Scheme C scope class and renders a festival marquee/featured prize copy.
- Desktop CSS keeps the modal in a two-column composition and gives ten-pull results their existing five-column desktop grid.
- Mobile CSS under a max-width responsive layer switches the player modal to one column, turns pool tabs into a horizontal strip, and keeps draw controls visible.
- Static tests cover the Scheme C scope, marquee, responsive CSS contract, and existing reward result behavior.
- `npm test -- src/modals/GachaModal.test.js src/modals/FriendsModal.test.jsx` passes.
- `npm run check` passes.
