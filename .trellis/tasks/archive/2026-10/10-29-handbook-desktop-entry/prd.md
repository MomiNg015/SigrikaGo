# Ship desktop handbook alternating entry

## Goal and approval
The user approved the 2026-10-29 prototype and requested production integration. Preserve its alternating top/bottom strip travel, 300ms duration, 40ms catalog-order stagger and 660ms total for ten members.

## Requirements
- Animate whole strips inside the existing board clip on desktop (>768px).
- Keep portrait geometry, hover/focus expansion, direct detail activation and ownership unchanged.
- Reopen/re-mounted character tabs play entry; hover and detail close do not restart it.
- Preserve mobile and corrupted handbook behavior. Reduced motion omits this entry.
- Move the approved motion into one bounded production CSS owner; the sample reuses it with only a slow-play timing override.
- Preserve unrelated WIP and synchronize system design and the handbook contract.

## Acceptance
- [x] Real fixture browser checks prove direction, timing, clipping, reopen and stable post-entry interactions.
- [x] Mobile, reduced motion and corruption have no new entry motion.
- [x] Handbook/style tests, lint, build/built-CSS checks pass.
- [x] Documentation and sample match production; scoped commit and session record complete.

## Implementation
Add handbook-strip-entry.css to the existing import-only handbook entry. CSS media queries own desktop/reduced-motion conditions; no new runtime timers, state, dependency, image copies or blocking event handlers. Keep the existing component lifecycle. Validate against the real handbook fixture rather than sample-only styles.

## Verification
- npm test -- src/styles src/modals/house/HouseCharacterGrid.dom.test.jsx src/modals/house/HouseHandbook.dom.test.jsx: 182 passed.
- Full handbook Playwright suite: 29 passed, including five new production entry cases.
- The shared-motion sample verifier: four viewport cases passed without API traffic or page errors.
- npm run lint, npm run build, npm run check:built-css and npm run docs:system-design passed. Existing asset-placeholder and ExcelJS chunk-size build warnings remain outside this change.
- Design hook layout-transition finding is a false positive on an existing negative test assertion that forbids width/height ease transitions; the new entry animates transform only. No waiver or suppression added.
- Home guide regression: 15 checkpoint cases and 50 full-tour highlights passed; no API traffic or page errors.
