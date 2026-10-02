# Refine Aemeath Rainbow Move Effect

## Goal

Replace the current generic circular rainbow burst with a polished, board-native Aemeath effect that visually reads as a stone triggering rainbow pixel energy along the Go grid lines.

## Requirements

- Keep the existing Aemeath item-effect trigger, room data flow, latest-move targeting, and effect lifetime semantics intact.
- Replace the conic-gradient circle and orbiting square particles with a point-centered digital composition:
  - an immediate pixel flash at the played intersection;
  - horizontal and vertical light traces that propagate along the board grid lines;
  - seven discrete color echoes with Aemeath-style cyan/pink electronic accents;
  - a short, decisive exit that leaves the stone and board unobstructed.
- The effect must not replace, recolor, or move the played stone.
- The effect must remain pointer-transparent and must not block later moves.
- The visual must remain legible at desktop and portrait-mobile board sizes.
- The visual origin must coincide with the rendered stone center in the full Bright School room cascade; a half-cell right/down displacement is a release-blocking defect.
- Every directional trace must attenuate from the source toward the board edge: strongest/most opaque at the stone, progressively lighter and more transparent outward.
- Provide a non-animated, compact reduced-motion fallback that still communicates a rainbow grid response.
- Use only bounded CSS/DOM presentation work; do not add a new raster/GIF dependency for this effect.

## Acceptance Criteria

- [x] The previous circular conic-gradient ring and dashed circular outline are absent.
- [x] At the visible peak, the source intersection is unmistakable and colored traces align with both board axes.
- [x] Browser-computed center coordinates for the stone and effect root match within 1 CSS pixel under the real themed app-shell classes.
- [x] Each ray visibly fades from a bright center into a transparent tail; no direction is rendered as an equally bright color bar.
- [x] Seven colored pixel echoes are visible as distinct electronic fragments rather than a smooth rainbow wheel.
- [x] The effect is confined to the latest Aemeath move, appears above the stone without changing it, and remains `pointer-events: none`.
- [x] The animation uses transform/opacity-based motion with a bounded sub-second duration and no continuous loop.
- [x] `prefers-reduced-motion: reduce` disables motion and shows a compact static grid/pixel mark.
- [x] Browser screenshots at desktop and portrait-mobile sizes show no clipping, board displacement, or obscured adjacent controls.
- [x] Board rendering tests, style contracts, documentation generation, and the repository quality gate pass.

## Definition of Done

- Production JSX/CSS and focused tests are updated.
- The effect is visually inspected in-browser at multiple animation phases and at desktop/mobile board sizes.
- CSS inventory wording/baselines, Trellis visual contracts, and system-design documentation reflect the revised effect.
- `npm run check` passes.

## Technical Approach

Keep the existing keyed effect root in `Board.jsx`, but give it semantic child layers for a core, four directional grid-axis traces, distance-attenuated intersection nodes, and seven color echoes. Animate only the small, isolated layers with transforms and opacity. Keep ownership in dedicated `aemeath-rainbow-move*.css` files; the only theme-specific rule narrowly clears the Bright School portrait shell's inherited trace-width cap.

## Decision (ADR-lite)

**Context:** The current effect uses a conic-gradient circle, dashed orbit, and generic square scatter. It reads as a reusable web rainbow/loading treatment rather than an Aemeath or Go-board event.

**Decision:** Use a grid-circuit motif tied to the played intersection: a crisp source pulse, orthogonal line propagation, and staggered pixel echoes. Rainbow is expressed as discrete spectral channels, while cyan/pink light provides Aemeath's electronic identity.

**Consequences:** The JSX gains a few decorative child spans, but the effect becomes structurally testable and can align to board geometry. CSS stays isolated, pointer-transparent, and dependency-free.

### Visual QA correction

The first preview omitted the production Bright School app-shell/theme ancestry, so its apparent centering did not prove real-room centering. All subsequent browser QA must wrap the actual `Board` with the production theme classes and numerically compare `.stone` and `.aemeath-rainbow-move` centers before visual signoff.

## Out of Scope

- Changes to the candy story text, rejection probability, inventory settlement, effect duration across games, or Aemeath gameplay rules.
- Changes to other characters' candy effects.
- Audio, GIF, canvas/Pixi, or new image assets.
- Broader board or theme redesign.

## Technical Notes

- Owners: `src/styles/room/board/aemeath-rainbow-move.css` and `aemeath-rainbow-move-particles.css`.
- Existing renderer: `src/room/Board.jsx`; focused contract: `src/room/Board.test.js`.
- Protected-surface rules require narrow owner selectors, reduced-motion coverage, and visual verification.
- The effect is a single hero feedback moment; it should be energetic but not continuous or interaction-blocking.
