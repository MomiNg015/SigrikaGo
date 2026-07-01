# Fix admin system settings persistence

## Goal

Fix the admin console system settings form so edits are actually persisted and remain visible after refresh, then inspect other admin forms for the same save-without-persistence failure mode.

## What I Already Know

* User reports: in Admin -> System Settings, changing content and saving has no effect after refresh; values revert to the previous state.
* This is a bugfix, not a redesign; keep UI changes minimal and preserve existing admin styling unless the root cause requires feedback/state adjustments.
* Project instructions require updating `docs/system-design.md` for every update and regenerating `docs/system-design.html` with `npm run docs:system-design`.

## Requirements

* Identify the root cause before changing code.
* Fix system settings persistence end to end.
* Check other admin forms for similar save paths that update local UI but do not persist to durable state.
* Preserve both mobile and desktop admin behavior where the touched frontend code is responsive.
* Add or update focused tests where the repo has suitable coverage.
* Update system design docs and regenerate the HTML system design artifact.

## Acceptance Criteria

* [ ] Editing Admin -> System Settings and saving writes to the actual persistence layer.
* [ ] Reloading the admin console shows the saved system settings values.
* [ ] Similar admin form save handlers are inspected and any matching persistence bug found in scope is fixed.
* [ ] Relevant tests, lint, type checks, and docs generation are run or clearly reported if unavailable.

## Definition of Done

* Root cause is documented in the final response.
* Code changes are narrowly scoped to the affected admin save/persistence paths.
* `docs/system-design.md` and generated `docs/system-design.html` are updated.
* Trellis quality checks are completed.

## Out of Scope

* Broad admin console redesign.
* New system settings fields unrelated to the persistence bug.
* Reworking unrelated active Trellis tasks or existing dirty files.

## Technical Notes

* Start by tracing Admin -> System Settings form state, save handler, API/local storage/service persistence, and reload hydration.
* Then search admin form submit/save handlers for similar local-only updates.
