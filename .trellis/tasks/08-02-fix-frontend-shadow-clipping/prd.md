# Fix frontend shadow clipping

## Goal

Fix visible edge clipping in the existing Bright School player UI and desktop admin shell without redesigning the surfaces, reducing the established hard-shadow language, or changing application behavior.

## Requirements

- Mobile portrait modal backdrops must size from the available content box instead of `100vw`, reserve safe-area-aware right and bottom shadow gutters, and keep native vertical scrolling and overscroll containment.
- Shop, settings, warehouse, other shared modals, and nested mobile dialogs must keep their existing shadow strength while rendering the full right and bottom shadow.
- Terminal cyan scrollbar styling must no longer use a repository-wide universal selector. Bright School document-root scrollbars must use the paper-theme palette, while desktop admin scroll owners use neutral admin tokens.
- The home player avatar must keep its rounded crop while its portrait shadow renders outside the clipping mask; the character-chain badge must remain independent.
- Desktop admin sidebar/main shadows must fit inside the admin shell by reserving right/bottom shadow space and recalculating the scroll-owner height without changing the information layout.
- Update the UI/mobile design documentation and regenerate `docs/system-design.html`.

## Acceptance Criteria

- [x] At 360x800, 390x844, and 412x915 portrait viewports, shop, settings, warehouse, and nested detail dialogs show complete right/bottom shadows with no horizontal document overflow.
- [x] Modal close controls, safe areas, and native vertical scrolling continue to work.
- [x] Bright School root scrollbars use theme colors; admin sidebar/main scrollbars use neutral colors; cyan terminal scrollbars remain scoped to the terminal/HUD surface.
- [x] The home avatar image remains cropped to the same rounded frame, the portrait shadow is not clipped, and the chain badge is not included in that shadow.
- [x] At 1440x900, admin sidebar/main shadows are not clipped and both independent scroll regions remain usable.
- [x] CSS/DOM contract tests cover modal sizing/gutters, scrollbar scope, avatar mask structure, and admin shadow gutters.
- [x] Relevant tests, lint, production build, and `npm run docs:system-design` pass.

## Definition of Done

- Implementation and regression tests are complete.
- `docs/system-design.md` and the relevant UI/mobile design chapter reflect the boundary contract.
- Generated system-design HTML is current.
- No unrelated visual layout, animation, data, or API behavior changes are included.

## Technical Approach

- Use fixed backdrops with `inset: 0`, border-box sizing, safe-area-aware asymmetric padding, and child dialogs sized to `width/max-width: 100%` of the padded content box. Reserve at least the existing shop shadow's 9px right and 11px bottom extent.
- Scope legacy terminal scrollbar rules to the terminal/HUD owner. Add explicit Bright School root and admin descendant scrollbar owners so the document root cannot inherit the cyan terminal palette.
- Add a portrait-only mask element inside `.plaque-avatar`; keep the badge as its sibling. Apply the drop shadow after the portrait has been clipped by the mask.
- Add an admin shadow-gutter token to the shell's right/bottom padding and include it in sidebar/main max-height calculations.

## Decision (ADR-lite)

**Context**: The defects come from viewport-based modal sizing inside padded/scrolling backdrops, globally scoped scrollbar CSS, and effects applied inside clipping owners.

**Decision**: Size against actual containing blocks, explicitly reserve effect space, and separate content clipping from effect rendering.

**Consequences**: Mobile dialogs lose a small amount of usable width/height equal to the preserved shadow gutter; the visible styling remains unchanged and overflow behavior becomes deterministic.

## Out of Scope

- IRIS entry overlap/repositioning.
- General visual redesign, new motion, or typography changes.
- Mobile adaptation of the admin console.
- Public API, persistence, deployment, or data-model changes.

## Technical Notes

- Bright School mobile modal owners live under `src/styles/themes/bright-school/mobile/modal-shell/` and can override generic rules with `!important`.
- Preserve `overflow-y: auto`, `overscroll-behavior: contain`, and `-webkit-overflow-scrolling: touch` while adjusting modal geometry.
- CSS changes may require refreshing the measured baseline in `src/styles/cssLayerInventory.js` from the failing inventory test output.
- Project instructions require synchronized system-design docs for theme/mobile boundary changes.

## Verification Result

- Focused contracts: 150 tests passed.
- Battle/theme verification: 427 tests passed; system-design HTML checks passed.
- Full Vitest suite: 331 files and 2313 tests passed; lint, portrait checks, production build, built-CSS contracts, production-config validation, and system-design generation passed.
- Browser QA passed at 360x800, 390x844, 412x915, and admin 1440x900. The mobile document stayed at viewport width, the 9x11 shop shadow retained clearance, settings kept native vertical scrolling, and admin kept its independent panel scroll owners.
- The aggregate `npm run check` stops only at `check:admin-snapshot` because the ignored local `prisma/dev.db` contains an unrelated stale `siteSettings` admin snapshot. This task deliberately does not export that local configuration.
