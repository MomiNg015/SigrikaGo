# Compact profile empty state and guided actions

## Requirements
- Self resume and social details show only a small 暂无 placeholder when character records are empty; omit table headers and table shell.
- Story choices/continue and tutorial action buttons share gold fill and an animated multicolor exterior ring.
- Keep disabled states, existing handlers, board target rings, mobile wrapping and reduced motion intact.

## Acceptance
- Both profile contexts omit the table for empty data and restore records after mode changes.
- Enabled guided actions are gold on desktop and portrait mobile; disabled actions have no animated ring.
- Run relevant tests, lint, build and generated system-design docs.

## Scope
Existing components and CSS only; no API or gameplay changes. Existing theme owners require a late scoped CSS rule. No unresolved requirements.

## Follow-up: watch count badge
- Prevent flex shrinking of the existing equal-width/height count badge. Keep its size and palette, verify portrait and desktop.
