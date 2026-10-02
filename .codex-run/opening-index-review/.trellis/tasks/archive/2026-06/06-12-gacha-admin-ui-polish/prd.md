# PRD: Gacha Admin UI Polish

## Goal

Improve the admin gacha management interface so pool editing feels like a clear operations console instead of a raw form grid.

## Requirements

- Keep the existing gacha data model and admin save behavior unchanged.
- Make numeric fields self-explanatory with visible units and helper context.
- Make prize rows easier to scan with a resource preview, resource selector, quantity, probability, featured-prize toggle, and type badge.
- Keep the drawer visible and usable on desktop and narrow screens.
- Preserve the current Bright School/admin visual language while giving the gacha editor a distinct, polished operations-console treatment.
- Sync `docs/system-design.md` with the UI contract change.

## Design Direction

- Product type: admin panel / game operations tool.
- Tone: quiet, dense, readable control console with restrained teal and warm-gold accents.
- UX priorities from frontend-design and ui-ux-pro-max: visible labels, stable responsive layout, 44px-friendly controls, clear hierarchy, no horizontal overflow, and purposeful hover/focus states.

## Acceptance Criteria

- Prize editor includes a clear header explaining probability units.
- Each prize row exposes a resource thumbnail/fallback mark and grouped controls.
- Quantity and probability fields keep visible unit suffixes.
- Featured-prize selection is visually distinct from ordinary labels.
- CSS remains scoped to `.admin-gacha-board` / `.admin-gacha-*`.
- Targeted tests, full test suite, build, and system design docs generation pass.
