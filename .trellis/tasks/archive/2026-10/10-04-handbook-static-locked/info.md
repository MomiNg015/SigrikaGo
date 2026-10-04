# Outcome and verification

Normal handbook locked slots keep their order and silhouettes but hide all names/tooltips/effect actions. Missing Baconbits keeps only its anonymous static artwork. Native disabled state and ownership guards prevent both activation and wrapper hover preview; mobile question marks occupy the opposite label area.

Desktop portrait positioning uses the actual flex width as its sole driver. `HANDBOOK_STRIP_LAYOUT` supplies slant 28, gap 3 and expanded grow 6 to both the helper and CSS. One unchanged calc expression maps the resting width to a centered face and the expanded width to a 30% face anchor. This avoids percentage multiplication and differing animation timing; image dimensions and eye lines remain fixed. The slightly wider preview and 30px label inset keep the right-shifted artwork clear of the name.

Verification completed:

- Relevant unit/DOM/CSS/docs checks: 180 cases passed across the initial 10-suite run and targeted reruns. The old SSR identity expectation was updated to the new disabled/anonymous rule; the final six affected suites passed 70/70.
- Production handbook browser suite: 15/15 passed at 1440x1024, 1440x768, 390x844 and 360x640. All owned details still open directly; six locked slots remain disabled under native click/tap/hover and programmatic click/focus. Mobile question centers are checked against the alternating opposite sides.
- Animation regression samples actual rendered image positions every frame for the first, middle and last desktop standard portraits, verifying one-way travel, fixed width and eye line, and the final face anchor.
- Visual review: larger right-shifted Sigrika and short-screen Nabomo leave readable lower-right labels; static mobile silhouettes/questions and missing-data row fit the scrolling paper window. Updated the three changed review screenshots; no account writes were made.
- CSS metrics match the recorded baseline: 1,592,898 normalized bytes, +448 bytes and two scoped precedence declarations (disabled opacity, mobile question color). No new files, literal colors, breakpoint/motion or stacking families. Concrete owners remain within the file-size gate.
- Lint and task-context validation passed; system design and the executable handbook contract were synchronized.
- Real home-onboarding browser regressions: 6/6 passed on desktop and two mobile viewports, including the owned Sigrika programmatic detail activation. Output is isolated in `.tmp/e2e-home-handbook-static`, preserving the tracked historical reports.
- Production build and built CSS contracts passed. The existing public-asset resolution and large-chunk warnings remain unchanged; no claim of a clean full-repository gate is made. Final diff whitespace checks passed.

Full repository checks were not rerun. Previous unrelated proxy/service environment failures are outside this UI correction. Browser checks use Chrome; no cross-browser claim is made.
