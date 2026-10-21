# Verification

## Final scope

- Implemented the approved LXGW size tiers for window text, profile labels, battle labels and desktop admin hints. Existing WuWa, IRIS and profile identity-card heights are preserved.
- The user rejected the shop product-card redesign and requested the pre-remediation version. Removed the entire new shop CSS owner, its import, redesign-specific tests and screenshot. Product-card source files have no diff from `c591b0f7`.
- Compared rendered card text at 1440, 390 and 320px against the saved pre-remediation browser measurements: all 20 sampled product text nodes at each width match their previous font family, size, effective scale, weight, leading and spacing. Visually checked the restored 390px card arrangement. Other shop explanatory text remains in scope.

## Passed checks

- `npm run lint`; focused ESLint on the final browser test file after removing shop cases.
- `npm run verify:battle-fixes`: 443 tests plus 4 documentation tests.
- Focused style/theme coverage passed during implementation; final `npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js`: 78 tests.
- Browser regression covered 32 distinct cases across entry surfaces, battle presentation, typography exceptions, prose readability and the new font-size cases. The final five profile/battle font-size cases were rerun after the shop rollback and passed at desktop and portrait widths.
- `npm run verify:stability -- --skip-build tests/stability/skill-effects.spec.js`: 4 desktop/mobile skill-effect cases.
- Final `npm run build`, `npm run check:built-css` and `npm run docs:system-design` passed after the rollback.
- Manual browser review included actual winning selectors, ancestor transforms, long text, error geometry, replay, practice and desktop admin hints. New profile and practice screenshots are retained with the audit.

## Corrections and limits

- Corrected 320px auth hint wrapping without changing error-state layout; corrected clock-label wrapping while keeping 24px WuWa clock digits; corrected development header tools to use a separate grid row.
- One direct `npx vitest` invocation unintentionally collected old test copies under `.codex-run`. Reran through the repository's `npm test` wrapper with its standard exclusions; both current style suites passed. No archived copies were edited.
- Build retains the existing two unresolved public-asset placeholder warnings and large-chunk warning. This task does not change those assets or bundling.
- Tests used production components with local fixture data, not live accounts. No deployment was performed. The pre-existing shop card text-size concern remains as an audit finding because the user requested preserving those cards.
- Existing unrelated profile features, sample designs, backend changes and their documentation remain outside this commit.
