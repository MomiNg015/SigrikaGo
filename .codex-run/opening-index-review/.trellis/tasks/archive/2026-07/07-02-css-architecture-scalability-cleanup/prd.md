# CSS Architecture Scalability Cleanup

## Goal

Complete the staged CSS architecture cleanup for SigrikaGo without changing the current visual appearance. The work should make future UI expansion safer by turning CSS debt, cascade ownership, motion, z-index, responsive breakpoints, Bright School overrides, and final mobile safety layers into explicit contracts backed by tests and documentation.

## User-Facing Constraint

Do not redesign the interface. Existing desktop and mobile visuals must remain owned by the current CSS unless a focused slice explicitly moves only low-risk layout/alignment ownership into an existing primitive or domain wrapper.

## Scope

### Phase 1: CSS Debt Metrics And Contract Hardening

- Record the current `src/styles` debt baseline for file count, CSS bytes, `!important`, hardcoded hex colors, media-query files, reduced-motion files, and high z-index files.
- Treat the baseline as a non-growth contract for future cleanup.
- Keep the existing 6000-byte CSS size guard active.

### Phase 2: z-index, Motion, And Breakpoint Contracts

- Register the existing high z-index values and require future values at or above 1000 to be named or explicitly documented.
- Document motion token sources, accepted timing ranges, transform/opacity preference, and reduced-motion families.
- Register the responsive breakpoint families currently used by the CSS tree.

### Phase 3: Non-Gameplay Component Surface Ownership

- Continue only low-risk ownership moves already represented by primitives and domain wrappers.
- Valid surfaces: admin/tooling, shared modal action alignment, admin table/empty/badge primitives, and narrow home-flow action alignment.
- Existing CSS remains the visual owner for colors, borders, spacing, typography, disabled states, shadows, and mobile treatment.

### Phase 4: Bright School Tokenization And Override Reduction

- Keep Bright School value ownership in theme CSS while exposing semantic Tailwind tokens for future primitive use.
- Preserve explicit owner selectors.
- Continue banning broad fallback selectors such as `[class*="card"]`, `[class*="row"]`, `[class*="item"]`, and all-element theme resets.

### Phase 5: Final Mobile Safety Layer Reduction

- Keep `mobile-adaptive.css` as the final post-theme guard.
- Register reduction candidates only after matching desktop and mobile component ownership exists.
- Required viewport evidence for future reductions: phone portrait, small landscape, narrow desktop, and regular desktop.

### Phase 6: Documentation And Verification Consolidation

- Update `src/styles/README.md`, `.trellis/spec/frontend/css-architecture.md`, and system-design docs when CSS architecture facts change.
- Run the system-design generator after documentation changes.
- Preserve the final verification gates for static CSS contracts, build/check, and protected room/skill/mobile surfaces.

## Out Of Scope

- Tailwind preflight.
- Removing the `tw:` prefix.
- Visual redesign.
- Broad player-facing migration.
- Room board geometry.
- Board point buttons.
- Pixi canvas hosts.
- Skill presentation DOM/keyframes.
- Bright School final mobile safety removal without replacement coverage.
- Mobile gameplay controls.

## Acceptance Criteria

- CSS debt, z-index, motion, and breakpoint contracts are exported from `src/styles/cssLayerInventory.js` and enforced by `src/styles/cssLayerInventory.test.js`.
- Existing Tailwind phased migration, Bright School token bridge, and final mobile safety contracts continue to pass.
- Documentation describes the new contracts and the no-visual-drift cleanup strategy.
- Required commands pass:
  - `npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js src/styles/hudComponents.test.js`
  - `npm run docs:system-design`
  - `npm run build`
- `npm run check` is attempted before final handoff. If it fails for pre-existing unrelated debt, the failure boundary must be reported separately from new-change validation.

## Verification Notes

Run `npm run verify:battle-fixes` and `npm run verify:stability -- tests/stability/skill-effects.spec.js` only if the implementation touches room, board, skill, Pixi, broad mobile, or protected presentation CSS. This task's contract-only baseline work should not touch those visual surfaces.
