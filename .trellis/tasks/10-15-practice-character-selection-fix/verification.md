# Verification

## Final master consolidation
The earlier full-check limitations listed below are historical and now resolved. Full-project lint passed; the full unit run completed 448 files / 3280 tests with only one stale generated-document assertion failing, then all 4 tests in that file passed after regeneration. Portraits, admin snapshot, production build, built CSS, production configuration and documentation generation passed. The user authorized committing all pending formal project work to master; no push or deployment was requested.

## Change
- Practice character selection saves the selected ID without showing a Start footer; the difficulty dialog retains its Start action.
- The shared server selection resolver replaces both selectedCharacter and characterConfig using the validated catalog, leaving the account unchanged.
- Regression coverage creates actual practice rooms for beginner/intermediate/advanced and capture challenge, checking room/game snapshots, skill uses and resolved opening audio URL.

## Passed
- Targeted regression: 9 files, 117 tests. Final voice-event assertion refinement: all 17 practice socket tests rerun successfully.
- Full-project lint, plus final changed-test lint.
- Production build (existing large-chunk warning only).
- Portrait normalization and visible bounds, admin snapshot, built CSS contracts and production configuration.
- System design Markdown synchronization and generated HTML.
- Scoped git diff whitespace check.

## Full check limitation
`npm run check` stopped at the test stage: 445 files passed, 4 failed; 3275 tests passed, 5 failed. The remaining gate commands were run separately and passed.

Failures are outside the files modified for this fix:
- `src/styles/cssLayerInventory.test.js`: importantCount 9935 exceeds 9930; missing reduced-motion registration for base/login-asset-preload.css; unregistered 360px match-mode title breakpoint.
- `src/styles/handbookStrips.test.js`: expected old handbook font fallback string.
- `src/modals/house/CharacterDetailDialog.dom.test.jsx`: candy portrait standard-figure class expectation.
- Archived Trellis commit fixture ReplayList suite cannot import its missing WindowLoadingState.jsx.

Existing workspace changes were preserved. No commit, push or deployment performed. The fix applies to newly created rooms; existing room snapshots are not rewritten.

Logs: `.tmp/practice-selection-regression-after.log`, `.tmp/practice-selection-final-test.log`, `.tmp/practice-selection-check.log`, `.tmp/practice-selection-build.log`.
