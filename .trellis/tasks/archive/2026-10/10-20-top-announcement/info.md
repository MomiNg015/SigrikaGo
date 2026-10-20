# Implementation review

Selected the ink sample and renamed its fixed label to 校园播报. Production uses a shared text normalizer, existing authorized SiteSetting transaction/read/audit path, create-only defaults and a scoped two-row deployment-snapshot addition. Only the two new local defaults were seeded (disabled/blank, preserve existing); no live example notice was published.

HomeScreen renders the strip before its main grid. Real full-theme checks cover desktop and portrait; high-specificity owner rules protect the LXGW font, light copy and mint label. Reduced motion permits native manual reading. Visible-home polling retains last successful settings and protects admin saves from earlier reads.

Verification: 37 real-HomeScreen browser checks at 1440/390/320px; additional minified production-CSS checks at all three widths. Focused server, admin, hook, component and home tests cover save/read/disable/clear, startup preservation, refresh races, overflow, pause and cleanup. Full run: 449 files / 3295 tests passed, two tests failed; both full-run issues (new CSS import expectation and a snapshot test seeing the earlier in-flight module) passed the 73-test focused rerun against the final files.

Lint, portrait checks, build, built-CSS contracts and production config validation pass. The existing character snapshot drift remains isolated; do not regenerate unrelated character defaults. The local Vite browser fixture is a component preview, not a live backend deployment (the development API currently returns 503).

The spec now documents data flow, persistence, lifecycle, full-theme verification and :is() specificity. Design-hook findings in HomeScreen/styleContract tests are old CSS assertion values, not new styling; no suppressions added. Preserve unrelated aemeath/profile artifacts and their docs/ESLint hunks during staging.
