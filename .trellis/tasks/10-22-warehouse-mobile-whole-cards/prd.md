# Compact warehouse detail and whole-card scrolling

## Goal and scope
Refine the existing warehouse template only. The user finds mobile detail too tall and wants scrolling to settle on whole item cards instead of clipped half cards.

## Decisions
- Keep one item per row, current quantities, hard shadows, hover/press feedback, circular detail backdrop and artwork rotation. Removed categories and paging stay removed.
- On portrait phones use a compact side-by-side artwork/text area with a full-width bottom action row, approximately 196–226px tall.
- Size directory rows to fit an integer number of complete cards in the available viewport. Use native vertical scroll snapping so stopping at the middle or end leaves both edge cards complete, including shadow gutters.
- Fit rows after container resize and reopening; preserve selection and local fixture behavior. Apply whole-card scrolling to desktop too.
- Existing template requests are sufficient authorization. No new product choices, account mutations or production changes.

## Evidence and approach
The former mobile body uses 1fr/1.65fr, giving the detail most of the window. Fixed minimum list rows plus a fractional remaining list height cause half cards at the boundary. Native snap alone would fix only the leading edge; measure the list with ResizeObserver and divide its content height among a whole number of rows. Keep the observer in this isolated template and disconnect on close/unmount. No existing reusable whole-row sizing hook found in shared/modal code.

## Acceptance
- [x] Mobile detail is visibly compact at 390/360/320px and short portrait; artwork decoration and usable actions remain.
- [x] Initial, arbitrary scroll, last item, resize and reopen states show only complete edge cards after settling.
- [x] Wheel and touch scrolling remain native; long names and four-digit quantities fit.
- [x] Existing sample verification, relevant lint and docs checks pass; screenshots and docs are updated.

## Results
Eight viewport/state checks, scoped ESLint, wheel/touch scrolling, resize/reopen and existing interactions passed. Standard description fits without scrolling at all five normal viewports; long fixture descriptions remain scrollable. Updated eight original screenshots plus a touch-scrolled screenshot. System-design HTML regenerated and all four consistency tests passed. The sizing/snap relationship is recorded in the sample README; no production specification changed.

## Out of scope
Production integration, account data, shared styles, unrelated WIP and redesign of desktop detail.
