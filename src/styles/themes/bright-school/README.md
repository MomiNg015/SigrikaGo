# Bright School Theme CSS Layers

This folder owns only the player-facing Bright School skin. Keep selectors scoped to:

``.app-shell.player-theme-enabled.theme-bright-school``

Use duplicated specificity only for late override layers:

``.app-shell.player-theme-enabled.theme-bright-school.theme-bright-school``

Layer order:

1. `base.css` - import-only core cream paper entry delegating root paper, broad panels, home, room/chat/board, forms/cards, preload, and scrollbar rules to `base/`.
2. `gallery-polish.css` - static gallery parity and visible hand-drawn polish.
3. `surface-contracts.css` - import-only explicit contracts for inherited HUD cleanup and known Bright School surfaces.
4. `component-repairs.css` - import-only entry for intentional notebook details restored after surface contracts.
5. `qa-guard.css` - final UI/UX guard for overflow, clarity, focus, touch targets, and mobile safety.

Focused import-only entries:

- `base.css` delegates early Bright School foundation rules to `base/`.
- `surface-contracts.css` delegates explicit root, surface, control, form, badge, announcement, and known HUD cleanup rules to `surface-contracts/`.
- `commerce.css` delegates player-facing commerce overlays to `commerce/`.
- `home.css` delegates Bright School lobby canvas, panel, player card, student ID, manual label, and responsive lobby rules to `home/`.
- `mobile.css` delegates portrait mobile layout and interaction fixes to `mobile/`.
- `mobile/room.css` delegates portrait battle-room rules to `mobile/room/`.
- `component-repairs.css` delegates late component repair rules to `component-repairs/`.
- `quality-base.css` delegates UI/UX audit and visual refinement rules to `quality-base/`.

For frequent visual iteration, edit the focused file under `component-repairs/` that owns the surface. Keep `component-repairs.css` import-only. For inherited HUD cleanup, edit the focused file under `surface-contracts/` and use explicit owner selectors only. For systemic safety fixes, edit `qa-guard.css`. Avoid changing React class names for theme-only work.
