# Resume window bookmark tabs

## Goal and accepted design
The user approved the sample, then explicitly narrowed implementation to the resume window only. All initial edits to other windows were reverted. Keep existing content, data actions and title art. Use actual LXGW text; desktop horizontal labels and portrait upright labels.

## Scope
Only ResumeModal opts in. Other player windows, profiles, room, admin and corrupted/other themes retain their inline controls. Mobile shell gutters reserve the rail; at 320–360px portrait, icon-only header actions retain accessible labels, the avatar shrinks, and the replay control wraps while preserving its touch target.

## Implementation
Use one shared tab wrapper that preserves legacy markup outside opted-in Bright School hosts and portals the rail to the owning window in Bright School. Preserve IDs, handlers, pending/disabled state and keyboard navigation. Shell gutters reserve visible bookmark area; content owns scrolling. No new third-party dependencies.

## Acceptance
- [x] Shared tabs retain callbacks, disabled guards, IDs, selection and keyboard focus.
- [x] Theme and room opt-outs restore the original inline layout.
- [x] Desktop and narrow portrait shells show unclipped title, rail and content; long rails scroll.
- [x] Scoped checks, build, asset/config checks pass; docs/spec and generated HTML are current. Full suite has one verified pre-existing ShopModal CSS assertion failure.
- [x] Scoped implementation committed as 226b906f; .codex-run previews preserved.

## Verification
- 116 focused tests pass; full suite 2532 passed / 1 failed. Existing `ShopModal.test.js:728` reads aggregate mobile CSS and rejects a width declaration already in `HEAD:src/styles/mobile-adaptive/home-student-id-layout.css:133`; no shop/home code was changed.
- ESLint, production build, built CSS contracts, portrait normalization, admin snapshot and production configuration checks pass.
- Browser checks used the actual ResumeModal with local fixture data at 1440x900, 800x600, 390x844 and 320x568. Mode changes updated fixture ratings; pending arrows did not trigger extra changes; the last record stayed reachable after scrolling.
- Design-hook literals in the existing ShopModal/style contract tests are unrelated fixture assertions. New interface text/focus/pencil colors reuse existing ink tokens; paper fills retain the approved sample colors.
