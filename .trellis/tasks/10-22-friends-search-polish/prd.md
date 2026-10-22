# Friends search bar polish

## Goal and decisions
The user dislikes the current separate pill input and small icon button. Replace them with one full-width paper search bar, a muted leading search icon and a clearly labelled tool-color search button. Match the companion cards' ink border, modest corners and hard shadow. Preserve the left bookmark tabs, card layout, username lookup, Enter submit, labels and input limits. This is a focused visual follow-up; existing requirements resolve the design direction without further questions.

## Scope
FriendsToolbar markup and a scoped final search style owner; update CSS import/inventory registration, existing friend contract and system design entry. Preserve unrelated WIP. No new APIs, filtering, dependencies or broad theme changes.

## Acceptance
- [x] Unified search bar, readable button and input at desktop and 320/390px portrait widths.
- [x] Hover/press feedback, visible input focus and reduced-motion support.
- [x] Existing keyboard/search semantics and companion regressions remain valid.
- [x] Scoped checks, current screenshots and documentation are updated.

## Validation plan
Reuse existing FriendsModal DOM/static tests, CSS inventory/import contracts and seven companion browser regressions. Inspect desktop and narrow screenshots early. No new mirrored style tests; verify the native form through its existing behavior tests and browser interaction. Prior full check limitations (development-proxy 5-second timeout and local admin snapshot drift) are unrelated and already recorded.

## Design hook review
Changed the initial 5px inner button corners to the documented 4px paper-corner scale. The flagged left border is a same-ink separator between a text field and its submit control, not a decorative side-tab accent; retain it intentionally. The palette warnings in styleContract.test.js refer to pre-existing assertion fixtures; this task adds only one import assertion and no palette literals. No suppressions were added.

Existing sample.css findings belong to the historical three-direction exploration; this follow-up does not edit that stylesheet or copy its palette into production. The historical toolbar is frozen locally so the baseline demo retains its original two-control geometry.

## Results
Scoped 97 tests passed; the final static/inventory rerun passed all 29 tests. All 7 existing companion browser regressions passed with six updated screenshots. A browser probe additionally verified unboxed input styles, regular text weight, native Enter/click username lookup, focus ring, hover/press/reduced-motion and 1440/390/320px control bounds. ESLint, production build and built CSS checks passed. The first browser launch's esbuild service stopped during startup; a fresh launch passed. System design HTML regenerated. No full repository rerun for this local visual follow-up.
