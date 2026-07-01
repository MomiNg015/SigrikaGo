# CSS depollution and standardization

## Goal

Clean up SigrikaGo's CSS architecture by removing early broad fallback pollution while preserving the current player-facing and admin-facing visual behavior. This is the first-stage cleanup: depollution, contracts, and documentation, not a full Tailwind migration.

## Requirements

- Preserve current desktop, mobile, layout, modal, board, skill presentation, Pixi canvas, and admin visuals unless the current visual is caused by old HUD/Startorch fallback pollution.
- Keep the root CSS import order stable, including Tailwind before `themes.css` and `mobile-adaptive.css` as the final theme safety layer.
- Remove broad Bright School fallback selectors such as `[class*="panel"]`, `[class*="card"]`, `[class*="item"]`, `[class*="row"]`, and matching broad pseudo-element resets from the theme contract.
- Remove empty or obsolete pollution files and rename the remaining late Bright School cleanup structure toward explicit semantic surface contracts.
- Replace known broad substring selectors in HUD/Bright School CSS with explicit classes, including settings/auth/lock/decor/owned surfaces.
- Tighten Bright School reset rules so they target known contaminated surfaces rather than clearing shadows or pseudo-elements globally.
- Keep Tailwind v4 as a prefixed `tw:` no-preflight utility layer and document it as a long-term staged migration path only.
- Update CSS architecture guidance for future agents in `.trellis/spec/frontend/`, `src/styles/README.md`, and system design docs.
- Update CSS contract tests so polluted selectors are rejected instead of protected.

## Acceptance Criteria

- [ ] Static CSS contracts pass.
- [ ] Tests reject broad Bright School fallback selectors and global all-element shadow resets.
- [ ] CSS no longer imports `firewall/generic-surfaces.css`, `firewall/generic-pseudo-elements.css`, or the empty anti-tech addendum.
- [ ] Remaining late Bright School cleanup files use explicit owner-oriented names and selectors.
- [ ] Tailwind guidance states `tw:` utilities are allowed only for low-risk surfaces in this phase.
- [ ] `docs/system-design.html` is regenerated.
- [ ] Board, room, mobile, and skill presentation verification still passes.

## Definition of Done

- Relevant unit/contract tests are added or updated before production CSS changes.
- `npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js` passes.
- `npm run verify:battle-fixes` passes.
- `npm run build`, `npm run docs:system-design`, and `npm test -- docs/systemDesignHtml.test.js` pass.
- Run or attempt `npm run verify:stability -- tests/stability/skill-effects.spec.js`; record any environmental blocker if it cannot complete.
- Final handoff reports any unrun heavyweight check explicitly.

## Technical Approach

Use the existing CSS inventory and contract-test harness as the safety rail. First update tests to define the new contract, watch the focused tests fail, then move/delete CSS entries and update documentation until the contract and focused verification pass.

The implementation should not migrate existing room, board, skill, final-mobile, or Bright School surfaces to Tailwind. Tailwind remains a long-term, no-preflight, prefixed utility option for future low-risk surfaces.

## Decision (ADR-lite)

**Context**: The CSS tree is already split into small import-only files, but old emergency cleanup layers still contain broad fallback selectors and global resets that pollute unrelated UI and force later `!important` counter-fixes.

**Decision**: Treat broad fallback selectors and all-element Bright School resets as forbidden technical debt. Keep necessary visual reset behavior only through explicit, scoped, owner-oriented selectors and update tests/docs to enforce that contract.

**Consequences**: This reduces future style bleed and makes new themes safer, but does not eliminate all `!important` usage in one pass. High-risk room, board, skill, and final-mobile layers remain conservative.

## Out of Scope

- Full Tailwind conversion.
- New visual theme implementation.
- React component API changes.
- Backend/API/data model changes.
- Intentional redesign of existing player/admin surfaces.

## Technical Notes

- Current branch: `codex/css-tidy`.
- Existing root CSS entry: `src/styles.css`.
- Current CSS architecture inventory: `src/styles/cssLayerInventory.js`.
- Existing static contract tests: `src/styles/cssLayerInventory.test.js`, `src/styles/styleContract.test.js`, `src/styles/themeContract.test.js`, `src/styles/hudComponents.test.js`.
- High-risk protected areas: `room/board/**`, `room/**`, `mobile-room/**`, Bright School effects, Pixi canvas presentation, and final mobile safety layers.
- System design update required by project instructions for CSS architecture/theme technical-debt changes.
