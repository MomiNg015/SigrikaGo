# Announcement and mailbox paper windows

## Scope and owners

The approved paper design applies only to ordinary Bright School under `.information-center-modal.information-center-paper`. Keep corruption and other themes on their existing surfaces. `InformationCenterLayout` retains the shared navigation, focus, inert panes and title stickers; domain components retain loading, retry, pagination, read mutations, attachment portals, claim and delete handlers.

`src/styles/mobile-adaptive/information-center.css` is an import-only existing entry. Its five bounded children own paper surfaces, mail details, mobile alignment, paper feedback and existing navigation safety. Keep the navigation fallback separate from theme-specific overrides. `card-screenprints.css` remains the sole owner of reading-print paint; paper owners only change background colors. Mail status is real DOM text, hidden in base styles and enabled only in the paper theme; the existing accessible row label remains authoritative.

## Complete rows and scroll

`useInformationListRows(items)` returns the ref attached directly to the domain `<ul>`. CSS opts into sizing with `--information-paper-fit: 1`. After data mounts or changes, container resize and font readiness, measure content height, gaps, clamped title and metadata, padding and borders. Fit an integer number of rows (minimum 108px before content measurement) and write only `--information-paper-row-height`. Use stable `<li>` snap anchors while buttons translate on hover and press. Reserve bottom/right space for ink shadows.

Do not use a global MutationObserver or copy the prototype adapter into production. Ignore zero geometry; remove the inline height when the theme opts out or the effect unmounts, disconnect ResizeObserver and the resize listener, and ignore late font-ready callbacks after disposal. Empty-to-loaded and category/message updates must reattach to the actual list.

## Mobile and motion

At 768px and below, keep list-first navigation and the original 260ms list/detail transition. Back and close share one header grid row, centered vertically in equal 36px columns and boxes. Neither control is independently absolutely positioned. Hide the unavailable back button while reserving its column; opening a detail focuses back and returning restores the selected row. Retain safe-area clearance, external announcement bookmarks, reader shadow gutters and the scrollable prose/attachment split. In the existing mobile family, height <=650px clamps unusually long detail titles to three lines to preserve readable body space.

Announcement detail still uses its 200ms entrance. Mail header/body/shelf retain 420ms entrance with 0/100/200ms delays. New paper hover/press feedback is 150ms and hover is fine-pointer-only. Reduced motion disables the new transitions while retaining the established global behavior. Never replace original entrance keyframes with a generic paper animation.

## Verification

- `useInformationListRows.dom.test.jsx`: async mounting, resize, content-based minimum, empty cleanup and theme opt-out.
- Existing announcement/recovery/mailbox DOM tests: real domain behavior and error flows.
- `tests/e2e/information-paper.spec.js` with its dedicated config: desktop, intermediate and 320/360/390px portrait sizes; native wheel/end-row completeness; exact mobile button alignment and keyboard focus; long/empty data; read/category, attachment/claim/delete/close flows; hover/press, motion and theme isolation.
- `docs/design-samples/information-paper-2026-10-22/production.html` renders real components with production CSS and isolated API fixtures. It must not load `paper.css` or the prototype sizing adapter. Fixtures never enter the application entry.
- Record only the task-owned CSS delta; preserve other checkout work. Run CSS contracts, production build and built-CSS checks when changing these owners.
