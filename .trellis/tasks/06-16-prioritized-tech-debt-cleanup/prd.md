# Prioritized tech debt cleanup

## Goal

Reduce SigrikaGo technical debt from highest risk to lower risk, with the first implementation pass focused on changes that improve future feature extension, theme/style extension, high-frequency interaction performance, and player match stability without changing product behavior unnecessarily.

## What I already know

* User wants the debt handled in priority order, not just listed.
* Project instructions require `docs/system-design.md` or the relevant `docs/system-design/` chapter to be updated when architecture, runtime behavior, interfaces, data models, resource systems, theme styling, deployment, or technical debt changes.
* `npm run docs:system-design` must be run after system design docs change.
* Current dirty state before this task only had unrelated untracked generated output directories:
  * `garden-gpt-image-2/`
  * `outputs/denia-username-backgrounds/`
* Existing docs already identify CSS/global cascade, app orchestration, legacy asset mirrors, and realtime room performance as ongoing debt areas.
* Realtime match performance already has useful guardrails: lightweight `room:clock`, centralized room broadcasts, frontend room snapshot structural sharing, room clock merging, board memo, and point-level memo.
* Static inspection found concentrated debt:
  * CSS: 192 style files and roughly 5337 `!important` occurrences, concentrated in Bright School and mobile override layers.
  * Largest non-test JS/JSX files include `server/achievements.js`, `src/shared/game.js`, `server/adminRoutes.js`, `src/room/boardSkillEffectRegistry.js`, `server/gacha.js`, and `src/shared/musicLibrary.js`.
  * `src/app/App.jsx` remains the application orchestration hub for auth, socket, room, audio, overlays, catalogs, settings, and startup state.
  * `src/shared/game.js` still owns core state plus multiple skill implementations directly, making future character/skill additions touch the core rules file.
  * `server/userAssets.js` remains the compatibility boundary for legacy string fields and structured asset relation tables.

## Requirements

* Work from highest priority to lower priority.
* First implementation slice: improve game rules and skill extensibility by reducing direct skill-growth pressure inside `src/shared/game.js`.
* Preserve current user-visible behavior unless a cleanup explicitly requires a behavior change and the change is documented.
* Avoid broad rewrites that make multiple risk areas harder to verify in one pass.
* Keep unrelated untracked/generated files out of the task.
* Update system design docs for any technical debt cleanup or architecture/runtime/style boundary change.
* Run the relevant automated checks for touched areas and `npm run docs:system-design` when docs are updated.

## Candidate Priority Order

1. **CSS override debt and theme extensibility**: reduce high-risk Bright School/mobile `!important` chains or add guardrails that prevent further override sprawl.
2. **Game rules and skill extensibility**: move toward a handler/registry shape so new skills do not keep expanding `src/shared/game.js`.
3. **App orchestration state boundaries**: continue extracting stable app-level state/actions from `src/app/App.jsx`.
4. **Legacy asset mirror migration**: define and reduce compatibility sync risks between legacy string fields and structured asset tables.
5. **Realtime protocol evolution**: prepare for patch/reducer events while preserving full snapshot recovery.
6. **Backend admin/achievement module size**: split large route/domain modules only when it reduces coupling for active work.

## Recommended First Pass

Start with **game rules and skill extensibility** if the goal is future feature expansion and match stability, because it improves the path for every future character/skill while staying more testable than sweeping CSS cleanup. A focused first slice can extract active skill implementations and shared skill mutation helpers from `src/shared/game.js` behind an existing-compatible API, then update tests and docs.

Alternative first pass: **CSS override debt guardrail**. This would improve theme extensibility but is harder to prove with automated tests alone and may require more browser visual checks across desktop/mobile.

## Acceptance Criteria

* [ ] The chosen first priority has a narrow, documented implementation scope.
* [ ] The implementation reduces debt in the selected area without changing unrelated product behavior.
* [ ] Existing tests for the touched area pass.
* [ ] New or updated tests cover the refactored boundary where behavior could regress.
* [ ] `docs/system-design.md` or the relevant `docs/system-design/` chapter is updated.
* [ ] `npm run docs:system-design` has been run after docs edits.
* [ ] Unrelated untracked/generated files are not staged or modified by this work.

## Definition of Done

* Tests added/updated where risk warrants it.
* Project lint/type/build checks run as appropriate for the touched area.
* System design docs regenerated if changed.
* Commit plan excludes unrelated pre-existing dirty files.

## Progress

* Completed first game/skill extensibility slice: `src/shared/game.js` is now a compatibility facade, active skill action/state/stone helpers live in focused shared modules, and `src/shared/gameSkillHandlers.test.js` guards against importing concrete skill actions from the core game module.
* Completed first CSS/theme extensibility slice: `src/styles/home-terminal.css` is now an import-only lobby skin entry with concrete rules delegated to `src/styles/home-terminal/`; `src/styles/styleContract.test.js` and `src/home/HomeScreen.test.jsx` now read/guard the import tree.
* Completed second CSS/theme extensibility slice: `src/styles/mobile-home.css` is now an import-only mobile lobby entry with base portrait/tablet, narrow-phone, and landscape rules delegated to `src/styles/mobile-home/`; `.trellis/spec/frontend/quality-guidelines.md` now records the executable CSS entry contract.
* Verification passed for completed slices through targeted tests and the aggregate `npm run check` gate.

## Out of Scope

* Replacing the visual design system in one pass.
* Rewriting the full realtime protocol in the same pass as another major refactor.
* Removing legacy asset fields without a dedicated migration/rollback plan.
* Restructuring every large backend module at once.

## Open Questions

* None for the first implementation slice.

## Decision (ADR-lite)

**Context**: The project has several active technical debt areas, but future character and skill additions repeatedly touch the core game state module. That increases regression risk for match stability and makes feature expansion harder.

**Decision**: Start with game rules and skill extensibility. Extract a narrow skill implementation boundary from `src/shared/game.js` while preserving the existing public API and behavior.

**Consequences**: This first pass should be testable with existing game and skill tests and should avoid broad UI or protocol changes. CSS/theme cleanup, app orchestration, legacy asset migration, and realtime patch events remain follow-up priorities.

## Technical Notes

* Relevant docs:
  * `docs/system-design.md`
  * `docs/system-design/07-performance-tech-debt.md`
  * `docs/system-design/02-frontend-architecture.md`
  * `docs/system-design/03-backend-realtime-api.md`
  * `docs/system-design/04-data-model-and-domain.md`
  * `docs/system-design/06-ui-theme-mobile.md`
* Relevant specs:
  * `.trellis/spec/frontend/index.md`
  * `.trellis/spec/backend/index.md`
  * `.trellis/spec/guides/code-reuse-thinking-guide.md`
  * `.trellis/spec/guides/cross-layer-thinking-guide.md`
* Candidate touched areas depend on the selected first slice:
  * Game/skill extensibility: `src/shared/game.js`, `src/shared/gameSkillHandlers.js`, `src/shared/gameSkills.js`, related tests.
  * CSS/theme debt: `src/styles/**`, style contract tests, Playwright visual checks.
  * App orchestration: `src/app/App.jsx`, `src/app/use*` hooks, app tests.
  * Asset migration: `server/userAssets.js`, Prisma schema/migrations, commerce/gacha/achievement write paths.
  * Realtime protocol: `server/roomBroadcasts.js`, `server/socket*Events.js`, `src/app/gameSocket.js`, `src/app/roomSnapshot.js`.
