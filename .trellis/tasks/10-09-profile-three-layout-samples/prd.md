# 履历三套布局设计样板

## Goal
Provide three distinct, polished, interactive profile layout samples grounded in the current Bright School design. User explicitly permits layout changes and asks for three samples before choosing a final direction.

## Requirements
- Preserve existing profile content: identity, achievement/personalization actions, Spark/standard/gomoku tabs, rank, total/win/loss/draw/rate statistics, recent results, character records and replay action.
- Reuse project fonts, ink/paper/pink/mint/blue palette and current Q avatar assets.
- Three distinct layouts: sidebar dossier, horizontal compact profile, two-page notebook.
- Isolated HTML/CSS/JS under docs/design-samples/profile-layouts-2026-10-09. No production integration this round.
- Support desktop and portrait phone preview, keyboard controls, real sample mode switching, empty mode and sample dialogs.
- Mark fixture data explicitly in preview controls. Update system-design entry and regenerate HTML.

## Acceptance Criteria
- [x] Three distinct full-size layouts reachable from one comparison page.
- [x] Desktop 1440x900 and portrait 390x844 / 360x640 have no horizontal overflow.
- [x] Images and local fonts decode successfully; tabs and dialogs work.
- [x] Screenshots captured and visually inspected for each layout.
- [x] Documentation generated.

## Scope and decisions
This is an exploration follow-up; no blocking questions. Preserve production profile behavior and unrelated WIP. Fixture data is internally consistent and isolated. Profile uses current complete-head avatars. No backend requests or personal data needed. Social-profile integration and final production implementation follow selection.

## References
- src/modals/ProfileResumeView.jsx
- src/modals/ResumeModal.jsx
- PRODUCT.md and DESIGN.md
- .trellis/spec/frontend/identity-bust-contract.md
- Existing 2026-10-09 real profile screenshot

## Validation result
Nine browser layout/viewport checks passed; scoped ESLint and system-design generation passed. Desktop and portrait screenshots manually reviewed. Design hook font/radius drift fixed; intentional sample tint findings classified in README. Samples remain uncommitted for user layout selection; existing shared documentation WIP preserved.
