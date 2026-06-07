# Bright School Theme CSS Layers

This folder owns only the player-facing Bright School skin. Keep selectors scoped to:

``.app-shell.player-theme-enabled.theme-bright-school``

Use duplicated specificity only for late override layers:

``.app-shell.player-theme-enabled.theme-bright-school.theme-bright-school``

Layer order:

1. `base.css` - core cream paper visual language and broad component styling.
2. `contrast-purge.css` - early readability cleanup from the first Bright School pass.
3. `gallery-polish.css` - static gallery parity and visible hand-drawn polish.
4. `specificity-overrides.css` - higher specificity fixes for inherited base/HUD CSS.
5. `radical-purge.css` - stronger de-tech cleanup for obvious HUD bleed-through.
6. `firewall.css` - generic scoped reset for missed nested surfaces.
7. `component-repairs.css` - intentional notebook details restored after the firewall.
8. `qa-guard.css` - final UI/UX guard for overflow, clarity, focus, touch targets, and mobile safety.

For frequent visual iteration, edit `component-repairs.css` first. For systemic safety fixes, edit `qa-guard.css`. Avoid changing React class names for theme-only work.
