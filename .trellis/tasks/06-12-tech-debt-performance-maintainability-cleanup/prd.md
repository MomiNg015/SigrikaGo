# Tech debt performance maintainability cleanup

## Goal

Reduce near-term interaction jank and make future feature work cheaper by addressing the highest-leverage technical debt found in the static audit: startup asset loading, room update/render pressure, skill effect extensibility, UI feedback micro-jank, CSS ownership, quality command coverage, and system design documentation drift.

## What I already know

* The user asked whether all eight audited issues can be handled, then agreed to proceed.
* The current project rule requires `docs/system-design.md` to be updated whenever project behavior/architecture is updated.
* The safest implementation order is staged rather than a single sweeping rewrite.
* `src/shared/preloadAssets.js` currently preloads images and many audio assets with a single `Promise.all`, while local `public/assets` contains roughly 48.55MB of `.ogg` files and 17.16MB of `.png` files.
* `src/app/socketHandlers.js` applies full `room:update` payloads via `setRoom`, and `server/rooms.js` broadcasts full per-viewer room views after most game actions.
* `src/room/Board.jsx` renders every board point as a button and depends on the whole `game` object identity for memoization.
* Skill behavior and presentation are spread across admin validation, shared rules, server room preview/resolution, Pixi board effects, and audio cues.
* `src/app/InteractionFeedback.jsx` restarts disabled feedback animation through a forced layout read.
* Bright School and shared styles rely on large global CSS files and ordered override layers.
* `package.json` has separate `test`, `build`, `test:e2e`, `check:production`, and docs scripts, but no single project `check` entry.

## Assumptions

* We will implement this as staged work, starting with low-risk, high-return changes.
* The first MVP batch should not change socket protocol semantics or visual design unless required for performance.
* Larger architecture work, such as room patch events and CSS module migration, should be planned but not forced into the first batch.

## Requirements

* Scope the initial implementation to Batch 1 MVP, then continue with low-risk Batch 2 interaction/render optimizations.
* Add a project-level quality command that runs the core verification steps expected before handoff.
* Improve login/startup asset preloading so first-screen resources are prioritized and non-critical assets do not all fetch/decode at once.
* Preserve existing preload progress behavior while making it less sensitive to the total number of optional assets.
* Update tests around preload asset grouping/progress and the new quality script behavior where practical.
* Update `docs/system-design.md` and regenerate `docs/system-design.html` for implemented behavior.
* Keep changes compatible with current React/Vite/Express setup and avoid new heavy dependencies.

## Acceptance Criteria

* [x] `npm run check` exists and documents/executes the intended core quality gate.
* [x] Login preload separates critical assets from deferred/non-critical assets or otherwise limits concurrent work.
* [x] Existing preload tests pass with updated expectations.
* [x] The app still reaches the home screen after login preload and preserves the visible progress indicator.
* [x] `docs/system-design.md` describes the implemented technical-debt cleanup.
* [x] `docs/system-design.html` is regenerated from Markdown.
* [x] `npm test` passes for affected tests, and any additional feasible verification is run.
* [x] Interaction feedback restarts unavailable shake animation without a forced layout read.
* [x] Board points use point-level memoization with stable handler refs so parent handler churn does not re-render every intersection.
* [x] Regression tests cover the unavailable feedback restart contract and board point comparator behavior.
* [x] Full `room:update` snapshots are structurally shared before entering React state.
* [x] Duplicate room snapshots can return the current room reference, and unchanged point/player entries keep stable references.
* [x] Skill effect metadata has a shared catalog used by admin options, validation, targeting, active effect lists, and SFX cues.
* [x] Skill-enabled boards prewarm Pixi during idle time and reuse the same module promise for the first skill animation.
* [x] Concrete board skill animation implementations are behind a renderer registry instead of living inside the React host component.

## Definition of Done

* Tests added or updated for changed behavior.
* Core checks run and results reported.
* Documentation synchronized.
* Implementation is staged to minimize regression risk.
* Known follow-up debt remains explicitly documented instead of half-implemented.

## Out of Scope For First Batch

* Replacing full `room:update` with socket patch events.
* Large CSS module or component-style migration.
* Full `skillEffectCatalog` migration across admin, rules, server, board effects, and audio.
* Broad room lifecycle extraction from `server/rooms.js`.
* Visual redesign of the home, room, modal, or theme surfaces.

## Technical Approach

### Batch 1 Recommended MVP

* Add a single `check` script that chains existing core checks.
* Refactor preload helpers to classify assets into critical and deferred groups.
* Limit preload concurrency for heavier/deferred fetch/decode work.
* Keep current home transition behavior and progress UI stable.
* Update tests and system design docs.

### Batch 2 Completed

* Replaced the forced-layout disabled feedback animation restart in `src/app/InteractionFeedback.jsx` with a next-frame class re-add and timer fallback.
* Extracted memoized board point buttons in `src/room/Board.jsx`.
* Passed click/scoring/neutral handlers through a stable `handlersRef` so the point comparator can ignore handler identity without preserving stale closures.
* Added targeted tests in `src/app/InteractionFeedback.test.js` and `src/room/Board.test.js`.
* Updated `docs/system-design.md` and frontend quality guidelines for the new maintenance contracts.

### Batch 3 Completed

* Added `src/app/roomSnapshot.js` to structurally share same-room socket snapshots.
* Updated `room:update` handling in `src/app/socketHandlers.js` to use a functional room state setter with `applyRoomSnapshot`.
* Preserved reconnect audio-baseline behavior while allowing duplicate snapshots to reuse the current room object.
* Added targeted tests in `src/app/roomSnapshot.test.js` and updated socket handler tests for the functional setter.
* Updated `docs/system-design.md` and frontend state-management guidelines for the room snapshot sharing contract.

### Batch 4 Completed

* Added `src/shared/skillEffectCatalog.js` as the shared source for skill effect labels, default target rules, active/passive classification, board-effect metadata, and board SFX cue timing.
* Updated admin character effect options, server character validation/seeding, server fallback skill config, skill normalization, board target preview, active skill type exports, and skill-effect sound cues to read catalog metadata.
* Added catalog and server registry tests to lock effect ordering, target rules, admin options, validation messages, active effect lists, and sound cues.
* Updated `docs/system-design.md` and frontend component guidelines for the skill effect catalog contract.

### Batch 5 Completed

* Added `src/room/pixiPrewarm.js` to schedule idle Pixi module loading and share the loaded promise with live board skill effects.
* Updated `BoardSkillEffects` to use `loadPixiModule()` for actual animations and to schedule prewarm without blocking board render.
* Passed `prewarm={game.skillEnabled !== false}` from `Board`, so standard no-skill boards do not load Pixi early.
* Added targeted tests for prewarm cancellation, shared import promises, board-effect rendering, and the skill-enabled prewarm prop contract.
* Updated `docs/system-design.md` and frontend component guidelines for the Pixi prewarm contract.

### Batch 6 Completed

* Added `src/room/boardSkillEffectRegistry.js` as the board skill animation registry and moved concrete Pixi renderers out of `BoardSkillEffects.jsx`.
* Added `src/room/boardSkillEffectGeometry.js` so React tests and Pixi renderers share the same board-size-aware coordinate helpers.
* Kept `BoardSkillEffects` focused on host markup, Pixi lifecycle, timing, SFX scheduling, and prewarm wiring.
* Added registry tests that lock catalog board-effect coverage, full-board hidden-hand metadata, and unknown-effect no-op behavior.
* Updated `docs/system-design.md` and frontend component guidelines for the board effect registry contract.

### Later Batches

* Reduce room render fan-out beyond client-side structural sharing, such as protocol-level room patch events if profiling shows enough benefit.
* Continue migrating concrete skill preview/animation implementations behind the catalog when adding new effects.
* Move room updates toward reducer/patch semantics.
* Gradually shrink global CSS override layers by assigning ownership to component-level style contracts.

## Open Questions

* None for Batch 1 MVP.

## Decision (ADR-lite)

**Context**: The full eight-item technical debt list spans startup performance, socket protocol shape, board rendering, skill architecture, CSS ownership, and quality tooling. Implementing all items in one pass would create a large regression surface.

**Decision**: Implement Batch 1 MVP first: quality command, startup preload layering/concurrency control, affected tests, and system design documentation.

**Consequences**: This should reduce near-term login/startup jank and make handoff checks clearer while leaving larger room protocol, board rendering, skill catalog, and CSS ownership work as explicit follow-up debt.

## Technical Notes

* Key files likely impacted in Batch 1:
  * `package.json`
  * `src/shared/preloadAssets.js`
  * `src/shared/preloadAssets.test.js`
  * `src/app/useStartupPreload.js`
  * `docs/system-design.md`
  * `docs/system-design.html`
* Relevant follow-up files for later batches:
  * `src/app/socketHandlers.js`
  * `server/rooms.js`
  * `src/room/Board.jsx`
  * `src/room/BoardSkillEffects.jsx`
  * `src/audio/skillEffectSounds.js`
  * `src/app/InteractionFeedback.jsx`
  * `src/styles/**/*.css`
