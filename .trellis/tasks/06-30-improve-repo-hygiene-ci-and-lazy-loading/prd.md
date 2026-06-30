# Improve Repo Hygiene, CI, and Lazy Loading

## Goal

Reduce avoidable repository bloat and make future optimization work safer by tightening generated artifact handling, adding an automated project quality gate, and code-splitting low-frequency frontend surfaces without changing gameplay behavior.

## Requirements

* Add ignore rules for generated local outputs and Codex development logs.
* Stop tracking generated output artifacts and local log files that are not intended source assets.
* Add a GitHub Actions workflow that runs the existing project quality gate on pull requests and pushes.
* Lazy-load low-frequency frontend surfaces first, prioritizing admin, tutorial, and non-core overlay/modal bundles.
* Keep room/gameplay behavior unchanged.
* Update `docs/system-design.md` because this changes repository artifact policy, deployment/CI behavior, and frontend loading architecture.
* Run `npm run docs:system-design` after documentation updates.

## Acceptance Criteria

* [x] `.gitignore` covers generated `outputs/` content and local `.codex-dev*.log` files.
* [x] Previously tracked generated outputs/logs selected for cleanup are removed from the Git index without deleting local working copies.
* [x] `.github/workflows/` contains a CI workflow for `npm ci`, `npm test`, `npm run build`, and `npm run docs:system-design`.
* [x] Admin/tutorial/low-frequency overlays are lazy-loaded where this can be done without changing user-facing behavior.
* [x] `docs/system-design.md` reflects the artifact, CI, and lazy-loading decisions.
* [x] `npm test`, `npm run build`, and `npm run docs:system-design` pass.

## Definition of Done

* Tests/build/docs generation pass locally.
* No unrelated refactors are included.
* No gameplay effect registry or room interaction behavior is changed.
* Dirty working tree contains only this task's intentional changes.

## Out of Scope

* Rewriting CSS cascade layers or reducing `!important` usage.
* Splitting `boardSkillEffectRegistry.js`.
* Refactoring `AdminOnboardingStory.jsx` internals beyond route-level lazy loading.
* Rewriting database migration/schema guard strategy.
* Pushing or opening a pull request.

## Technical Notes

* Review found `outputs/` contains tracked generated skill GIF frames and large binary assets while `.gitignore` only ignores `output/`.
* `scripts/export-skill-gifs.mjs` defaults generated GIF work to `outputs/skill-gifs`.
* `AppRoutes.jsx` statically imports admin/tutorial/room surfaces; `AppOverlays.jsx` statically imports many low-frequency modal components.
* Current project `check` script runs tests, build, config validation, and system design docs generation, but there is no GitHub Actions workflow.
