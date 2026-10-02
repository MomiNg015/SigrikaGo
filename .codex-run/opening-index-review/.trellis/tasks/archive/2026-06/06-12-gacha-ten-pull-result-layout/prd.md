# Gacha Ten-Pull Reward Result Layout

## Goal

Improve the desktop gacha ten-pull result dialog so rewards are readable and visually recognizable. Ten rewards should present as a balanced 2-row by 5-column grid on desktop, and each card should show the obtained resource image and player-facing name instead of internal English ids.

## Requirements

- Desktop ten-pull result dialogs render reward cards in exactly 5 columns, producing 2 rows for 10 rewards.
- Single-pull dialogs and narrow/mobile viewports may keep adaptive columns so the dialog remains usable.
- Each reward card shows a stable visual:
  - resource rewards use their configured `imageUrl` when available;
  - coin rewards use a local coin-bag image;
  - missing non-coin images use a small type fallback instead of the old blue orb.
- Each reward card shows a player-facing label from reward `name`, falling back to type labels only if no name is available.
- Quantities remain visible, including coin amounts, item quantities, duplicate blue-gem conversions, and character chain increments.
- Instant draw responses include reward display fields needed by the frontend.
- Update system design docs for the reward result display contract.

## Acceptance Criteria

- [ ] A ten-pull result with 10 rewards produces markup/CSS that supports a desktop 2x5 layout.
- [ ] Coin rewards render a coin-bag image and display a readable coin label.
- [ ] Item/character/decor/music rewards prefer display names over target ids such as `rainbow-bean-candy` or `nabomo`.
- [ ] Existing gacha modal tests cover the reward label/image behavior and CSS grid contract.
- [ ] Backend gacha draw tests cover display fields on immediate rewards.
- [ ] `npm run check` passes.

## Definition of Done

- Tests added or updated for the changed contract.
- Lint/type/build/docs checks pass through the project check command.
- `docs/system-design.md` is synchronized.

## Out of Scope

- Changing draw probabilities or reward settlement rules.
- Redesigning the main gacha machine screen.
- Adding a new post-draw animation sequence.

## Technical Notes

- Frontend entry point: `src/modals/GachaModal.jsx`.
- Gacha helper labels live in `src/modals/gacha/gachaHelpers.js`.
- Gacha result CSS lives in `src/styles/commerce-settings.css`.
- Immediate reward payloads are produced by `server/gacha.js`.
