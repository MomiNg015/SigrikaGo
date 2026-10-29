# Commit resource readiness, audio and theme settings

## Authorization
The user selected groups 1, 2 and 3 from the current working-tree inventory: resource loading, audio, and settings layout. Commit these existing changes plus their directly related tests, specs and documentation. Preserve all design samples, promotional video work, unrelated ESLint sample entries and deleted historical screenshots.

## Scope
- Strict login/battle/tutorial resource readiness, image decode, home window/font warmup, truthful progress and retry UI.
- Actual voice/effect decoder caches and user-gesture audio context unlock.
- One theme choice per row on desktop and portrait phones.
- Repair only issues uncovered while verifying these changes; synchronize stale supporting tests/documentation with already committed tutorial behavior.

## Acceptance
- [x] Review dependencies and exact staged scope.
- [x] Related browser tests and all npm run check stages pass, with targeted reruns for corrected failures.
- [x] Stage related system-design sections without unrelated sample/PV changes; render HTML from staged sources.
- [x] Commit selected changes and preserve unrelated WIP.

## Verification evidence
- Deployment-loading browser suite: 5 passed at desktop, 390px and 320px, including a held required image, actual decoded audio-cache reuse and tutorial minimum-time/resource gating. Screenshot review confirmed the three theme rows at 320px.
- Full check ran 477 test files: 475 passed, one generated-document mismatch, and one unrelated E2E-isolation worker exited unexpectedly. Regenerated system-design HTML; the document suite and scripts/e2eIsolation.test.js were rerun together: 2 files / 7 tests passed. The original run reported 3463 passed tests before those targeted repairs.
- Lint, portrait normalization and 39 visible bounds, isolated admin-snapshot round-trip, build, built-CSS contracts, production configuration and documentation generation all passed. Existing Vite placeholder/chunk warnings remain.
- Staged documentation was generated from staged Markdown only. Unrelated design/PV documents, sample lint entries and historical screenshot deletions remain outside the commit.
