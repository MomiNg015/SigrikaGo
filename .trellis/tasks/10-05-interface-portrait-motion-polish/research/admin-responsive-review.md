# Admin responsive review

## Evidence and source ownership

The isolated actual application journey opened all21 admin routes at1440×900 and390×844, waiting for their read endpoints before capture. Initial phone screenshots showed a230px sidebar and roughly100px main pane: the admin module lazily imports its own stylesheet after global responsive rules, so its desktop grid replaced the earlier one-column rule.

`admin/shell-layout.css` now owns its900px breakpoint. The narrow shell has a native horizontal navigation rail, a single remaining-height main scroller and a wrapping heading. Desktop remains a230px sidebar plus content. The existing shell adds549 normalized bytes, one media file and no important declarations, palette or high layers. Announcement checkbox sizing and neutral muted-copy isolation were repaired separately in their existing owners.

Actual navigation also exposed retained main scroll when switching pages. `AdminShell` keeps the same section and children state; a tab-keyed layout effect resets only its vertical scroll before the new page paints. Same-page refreshes/edits preserve position and state. The DOM regression verifies both cases; the real journey deliberately scrolls long pages before changing tabs and checks the new page starts at zero.

## Validation

- AdminShell9 DOM/static tests passed.
- All21 phone routes passed before and after scroll repair in isolated runs; checkbox remains an inline native18px control with clickable label, and muted copy uses the admin gray-blue palette.
- Desktop21-route journey passed after repair.
- The stable final development journey passed all four maintained cases: player windows at 1440/390 and all 21 admin routes at 1440×900/390×844. Evidence: `.tmp/interface-polish/final-dev-review.log` (`4 passed (56.5s)`). The admin cases check route headings, successful responses on subsequent navigation, zero initial main scroll, absence of error panels, scoped muted-copy color and announcement checkbox geometry.
- The stable production-build journey also passed all four maintained cases, including all 21 admin routes at both widths. Evidence: `.tmp/interface-polish/production-review-final.log` (`4 passed (56.7s)`), with 74 captures across the player/admin journey reported by the root. The capture helper checks effective visible image area after viewport and ancestor clipping, excluding offscreen lazy images.
- An earlier development run stalled before the initial phone admin sidebar while source was being edited; its cause was not established. The unchanged phone rerun and final stable journeys passed. This transient run is not a verified source defect and is not attributed solely to HMR. Development and production-build evidence remain distinct from the aggregate application E2E gate recorded in the root's final review.
- Capture folder: `.tmp/interface-polish/live/`; production build captures use a separate environment-selected folder.

Read data and temporary labels are from isolated test databases. No administrative save, publish or production-account operation was performed in this review.

## Registry reconciliation

One earlier CSS tally was one normalized byte behind the disk. The battle-label handoff compared its5980-byte assigned snapshot with5999; HEAD has5979 bytes. The registry now records the actual+20-byte diff againstHEAD, while the label behavior and6000-byte guard are unchanged. Exact consolidated metrics are recomputed after each integration freeze.
