# Paper drawer toast with LXGW

## Goal and selection
The user requested three alternatives with upper-left entry and withdrawal, then selected variant 1 and requested the existing LXGW font. Integrate the clean paper drawer into the production Toast component and preserve unrelated work.

## Requirements
- Warm white paper, subtle border/shadow, semantic icon/title, left-aligned message, manual close and bottom lifetime line.
- Both title and body use the existing LXGW Marker Gothic asset through --font-window-title.
- Safe-area upper-left placement, horizontal entrance and withdrawal, portrait wrapping down to 320px.
- Preserve showToast(message, tone), the five-entry newest-first queue, default 2600ms hold and 400ms withdrawal.
- Hover and keyboard focus pause the remaining hold; manual close and unmount clean up without duplicate callbacks.
- Reduced motion removes translation while preserving the lifetime line, including both portrait blanket reset layers.
- Keep the three-direction sample for provenance and provide a full-theme production-component preview.
- Update system design, CSS debt inventory and the relevant executable styling contract.

## Acceptance criteria
- [x] Selected design is used by the production ToastStack.
- [x] Computed title/body fonts resolve to loaded LXGW under the complete theme.
- [x] Desktop, 390px and 320px long-copy layouts fit without horizontal overflow.
- [x] Automatic/manual exit, hover/focus overlap, latest callback and Strict Mode behavior are covered.
- [x] Shared and portrait reduced-motion owners preserve informative progress timing.
- [x] System-design Markdown and generated HTML agree.

## Verification
- Initial exploration: 57 browser checks across all three alternatives.
- Production: full-theme browser checks for font loading, semantic colors, close chrome, safe-area bounds, long copy, desktop/portrait reduced motion, leftward exit and three-second removal.
- Five meaningful DOM lifecycle tests plus updated style contracts.
- Targeted verification: 35 tests passed, including CSS inventory and generated documentation.
- Lint, production build, built-CSS checks, portrait assets and production configuration validation passed.
- Full repository check encountered existing local character/admin-snapshot divergence. This task does not change the snapshot, exporter, character catalog or local admin configuration. The initially stale generated-doc failure was corrected by regeneration and passed its targeted rerun.

## Scope boundaries
No new font asset, dependency, backend behavior, room-request notification, message API or queue-cap changes. Unrelated profile/board samples, eslint edits and their mixed system-design sections must remain outside this commit.

## References
- src/modals/FeedbackModals.jsx
- src/modals/FeedbackModals.dom.test.jsx
- src/styles/commerce/warehouse-toast/toast-stack.css
- .trellis/spec/frontend/css-architecture.md
- docs/design-samples/toast-top-left-2026-10-20/production.html
