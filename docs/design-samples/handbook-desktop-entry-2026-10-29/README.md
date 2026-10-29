# Desktop handbook alternating entry sample

Open `/docs/design-samples/handbook-desktop-entry-2026-10-29/` on the local Vite server.

This review artifact mounts the real `HouseModal` with the normal roster and theme. Whole slanted strips alternate entry from the top and bottom of the existing clipped board. Each strip travels for 300ms with a 40ms stagger, so ten finish in 660ms. The strong ease-out curve settles without bounce. The toolbar provides replay and 0.4x slow observation; hover, details and close/reopen remain available.

Only this page imports `sample.css`. Phone widths inherit production styles and reduced motion omits the new translation. Portraits are decoded before opening; the bootstrap rejects all `/api/` requests, so the fixture cannot save account changes. Production integration awaits user review.

Run `node docs/design-samples/handbook-desktop-entry-2026-10-29/verify.mjs` with Vite on port 5173. Browser evidence is written to `.tmp/handbook-entry-check/` by default (`HANDBOOK_ENTRY_OUTPUT` overrides the destination). It checks 1440x900, 1920x1080, 390x844 and 360x640, including direction/timing, replay, hover, detail clicks, last mobile strip reachability, reduced motion, console errors and blocked API traffic.
