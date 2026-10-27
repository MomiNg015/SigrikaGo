# Scoped commit verification

- 2026-10-27: complete `npm run check` exited 0. Lint, 463 test files / 3386 tests (427.69 seconds), portrait validation, isolated admin snapshot round-trip, production build, built CSS contracts, production configuration and generated system-design HTML passed.
- An initial check exposed stale generated HTML after the documentation clarification. Regenerated it and reran the complete command successfully.
- All 245 relative module references in the three cumulative candidates resolve; each intermediate CSS file set was measured against its staged inventory.
- Three production commits keep the corrupted-story feature switch disabled and exclude all design samples, PV work and old task artifacts. 179 excluded files have saved content hashes for the post-commit preservation audit.
- Each commit generates staged HTML from its own staged Markdown. The working document keeps the unrelated sample/PV additions.
- This turn does not rerun browser E2E, deploy, push, modify the development database or re-enable features. The build still reports two public-asset placeholder warnings and large chunks; those are not represented as warning-free validation.
