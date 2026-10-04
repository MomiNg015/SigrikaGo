# Verification

The handbook uses production components and styles in the isolated fixture; no account writes or sortie-selection changes were performed.

- `npm test --` with the 10 relevant Grid, HouseHandbook, HouseModal, strip helper, portrait resolver, strip CSS, inventory, style, home-onboarding DOM and generated-doc suites: **180/180 passed**. The repository's standard exclusions prevent old `.codex-run` checkouts from matching the filters.
- `npx playwright test --config tests/e2e/handbook-puzzle.config.js`: **14/14 passed**, including all ten direct hit targets at four viewports, anonymous missing-data details, native touch cancel, a lower-half touch on an already-hovered target, collapsed focus return, genuine mouse re-hover, fixed larger desktop art and eye lines, and the final narrow row's hover exit.
- `npx playwright test --config tests/e2e/home-onboarding.config.js`: **6/6 passed**, including the real component tour on desktop and two mobile sizes, plus avatar stability during typing. Its historical tracked output directory was restored after the run; the new handbook screenshots are kept in the current design-samples directory.
- Read-only review found no blocking issue in activation, focus, guide activation, timer/observer cleanup or bounded stylesheet ownership.
- `npm run lint`, `npm run build` and `npm run check:built-css`: **passed**. The production build retained the existing unresolved-public-asset and large-chunk warnings; this correction does not expand their scope. Generated system-design HTML and diff whitespace checks also passed.
- Chrome screenshots: desktop rest/expanded, 390px rest/expanded, 360px final row, candy and unavailable mascot. No horizontal overflow; matte theme fill and native button transform remain stable. `docs/design-samples/handbook-strips/` contains the seven current images.
- CSS inventory: **1,592,450 normalized bytes**, a **265-byte reduction** from the previous baseline; no additional files, important declarations, palette literals, breakpoint/motion or stacking families.

The touch fix keeps native hit geometry stable until click, clears the preview before opening details, suppresses restored focus preview once, and filters automatic mouse re-entry after the overlay disappears. A real nonzero mouse movement can re-arm preview; a touch compatibility event cannot. The re-hover browser check waits for the closing row animation to finish before moving back into it.

This turn does not re-run the full repository check. The previous full check's five unrelated proxy/service environment failures remain outside this UI correction; feature checks must not be reported as a clean full-repository gate. Browsers other than Chrome were not exercised.
