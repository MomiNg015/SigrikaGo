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
* [x] Board skill SFX cue scheduling and timer cleanup are isolated from the React/Pixi host component.
* [x] Vite production build splits React, Socket.IO client, and lazy Pixi runtime chunks so the entry JS no longer triggers the previous large-chunk warning.
* [x] Room-level Socket.IO broadcast delivery is isolated from `server/rooms.js` behind a dedicated backend boundary.
* [x] Room interval/timeout bookkeeping is isolated from `server/rooms.js` behind a dedicated backend timer boundary.
* [x] Shared room participant and online-state queries are isolated behind a backend presence boundary.
* [x] Matchmaking waiting-player queue state is isolated behind a dedicated backend queue boundary.
* [x] Initial room object creation and mode-specific room-user projection are isolated behind a backend factory boundary.
* [x] Skill system-message formatting is isolated from `server/rooms.js` behind a dedicated backend message boundary.
* [x] Generic room system-message appends and restored disconnect notice deduplication are isolated behind a backend message-log boundary.
* [x] Room action point-target validation is isolated from `server/rooms.js` behind a dedicated backend validation boundary.
* [x] Finished-room close scheduling and empty-active-room invalidation are isolated from `server/rooms.js` behind a backend close lifecycle boundary.
* [x] Opening, passive-skill, counting, draw, and result-review deadline scheduling are isolated from `server/rooms.js` behind a backend deadline scheduler boundary.
* [x] Finished-room result persistence is isolated from `server/rooms.js` behind a backend result persistence boundary.

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

### Batch 7 Completed

* Added `src/room/boardSkillEffectSoundScheduler.js` to own board skill SFX cue timer scheduling and cleanup.
* Updated `BoardSkillEffects` to delegate SFX timer creation and clearing, keeping the React host focused on overlay lifecycle.
* Added scheduler tests for catalog cue timing, reduced-motion suppression, and cleanup of scheduled timer ids.
* Updated `docs/system-design.md` and frontend component guidelines for the board skill SFX scheduler contract.

### Batch 8 Completed

* Added Vite manual chunks for React, Socket.IO client runtime, and lazy Pixi runtime in `vite.config.js`.
* Set the production build chunk warning limit to document the intentionally lazy/prewarmed Pixi chunk while keeping entry JS split below the default warning target.
* Added `scripts/viteBuildConfig.test.js` to lock manual chunk routing and prevent a catch-all vendor chunk from reintroducing circular chunk warnings.
* Verified `npm run build` no longer emits the previous large chunk warning; the entry JS is split into smaller runtime chunks and Pixi remains lazy.
* Updated `docs/system-design.md` and frontend quality guidelines for the build chunking contract.

### Batch 9 Completed

* Added `server/roomBroadcasts.js` as the room-level Socket.IO delivery boundary for `room:update`, `room:clock`, `error:toast`, and `room:closed`.
* Kept `server/rooms.js` compatible by preserving its `broadcastRoom` and `roomView` exports while delegating participant iteration, viewer-specific room views, clock payloads, and close/toast emits.
* Added `server/roomBroadcasts.test.js` for connected-participant filtering, room update persistence timing, lightweight clock payload cloning, toast delivery, and close delivery.
* Updated `docs/system-design.md` and backend quality guidelines for the room broadcast boundary contract.

### Batch 10 Completed

* Added `server/roomTimers.js` as the room interval/timeout bookkeeping boundary for tracked room lifecycle timers.
* Kept `server/rooms.js` compatible by preserving its `clearRoomTimers` export while delegating `timerId`, `timeoutIds`, interval clearing, timeout registration, timeout auto-removal, and single-timeout cancellation.
* Added `server/roomTimers.test.js` for timeout registration/removal, single-timeout cancellation, interval clearing, and full room timer cleanup.
* Updated `docs/system-design.md` and backend quality guidelines for the room timer boundary contract.

### Batch 11 Completed

* Added `server/roomPresence.js` as the shared room participant and connection-state boundary.
* Updated `server/roomBroadcasts.js` and `server/rooms.js` to reuse the presence boundary for participant ordering, online counts, watch summaries, connected-participant checks, and all-players-disconnected checks.
* Added `server/roomPresence.test.js` for participant ordering, online counts, connected participant detection, all-player disconnect behavior, and watch summaries.
* Updated `docs/system-design.md` and backend quality guidelines for the room presence boundary contract.

### Batch 12 Completed

* Added `server/roomMatchmakingQueue.js` as the waiting-player queue boundary for matchmaking state.
* Updated `server/rooms.js` to delegate queue listing, counts, per-mode counts, join deduplication, same-mode matching, leave cleanup, and socket disconnect cleanup to the queue boundary while keeping room creation and match delivery in the room lifecycle module.
* Added `server/roomMatchmakingQueue.test.js` for mode counts, same-mode matching, deduplication, custom `canPair` filtering, user/socket removal, and queue clearing.
* Updated `docs/system-design.md` and backend quality guidelines for the room matchmaking queue boundary contract.

### Batch 13 Completed

* Added `server/roomSkillMessages.js` as the skill system-message formatting boundary.
* Updated `server/rooms.js` to delegate skill use notices, custom skill message template replacement, point labels, and stone labels to the message boundary while keeping append timing in the room lifecycle module.
* Added `server/roomSkillMessages.test.js` for point labels, stone labels, template replacement, custom skill messages, flip-stone target-color text, and hidden-hand fallback text.
* Updated `docs/system-design.md` and backend quality guidelines for the room skill message boundary contract.

### Batch 14 Completed

* Added `server/roomFactory.js` as the initial room object and room-player construction boundary.
* Updated `server/rooms.js` to delegate room code generation, black/white assignment, opening game state creation, initial timer/deadline fields, initial clock fields, and mode-specific user projection to the factory boundary.
* Added `server/roomFactory.test.js` for deterministic room creation, player color assignment, mode stats projection, standard mode defaults, room-player shape, and room code collision retry.
* Updated `docs/system-design.md` and backend quality guidelines for the room factory boundary contract.

### Batch 15 Completed

* Added `server/roomSystemMessages.js` as the generic room system-message mutation boundary.
* Updated `server/rooms.js` to delegate system message object construction, notice-list appends, and restored disconnect notice deduplication to the message-log boundary.
* Added `server/roomActionValidation.js` as the room action point-target validation boundary.
* Updated game-action and standard-action entry points to reuse the validation boundary instead of importing point validation directly.
* Added targeted tests for system message shape, restored disconnect notices, notice-list appends, and room action point validation.
* Updated `docs/system-design.md` and backend quality guidelines for the new message-log and action-validation contracts.

### Batch 16 Completed

* Added `server/roomCloseLifecycle.js` as the finished-room and empty-active-room close lifecycle boundary.
* Updated `server/rooms.js` to delegate close scheduling, connected-participant close extension, `room:closed` payload construction, persisted-room deletion, empty-room invalidation, and empty-room close cancellation to the close lifecycle boundary.
* Kept room lifecycle decisions in `server/rooms.js` while injecting persistence, timer, broadcast, record-save, and presence dependencies into the close lifecycle module for focused tests.
* Added `server/roomCloseLifecycle.test.js` for close delays, unsaved record save trigger, participant-based close extension, final close payload/deletion, empty-room invalidation, and empty-room timeout cancellation.
* Updated `docs/system-design.md` and backend quality guidelines for the room close lifecycle contract.

### Batch 17 Completed

* Added `server/roomDeadlineScheduler.js` as the room deadline timer scheduling boundary.
* Updated `server/rooms.js` to delegate opening completion scheduling, initial passive-skill scheduling, counting timeout, draw timeout, result-review timeout, and restored pending deadline scheduling to the deadline scheduler boundary.
* Kept actual room phase entry decisions and clock ticking in `server/rooms.js`, while deadline delay math and timeout reset rules live behind injected room lookup, timer, broadcast, and lifecycle callbacks.
* Added `server/roomDeadlineScheduler.test.js` for opening delay, passive-skill delay, counting timeout, draw timeout, result-review timeout, and restored pending-deadline selection.
* Updated `docs/system-design.md` and backend quality guidelines for the room deadline scheduler contract.

### Batch 18 Completed

* Added `server/roomResultPersistence.js` as the finished-room result persistence boundary.
* Updated `server/rooms.js` to delegate invalid-result skipping, `GameRecord` creation, draw mode-stat increments, decisive reward writes, mode-stat upserts, progress ledger entries, and item-effect cleanup operation composition to the result persistence boundary.
* Kept close lifecycle timing in `server/rooms.js` / `server/roomCloseLifecycle.js`, with result saving injected as a persistence callback.
* Added `server/roomResultPersistence.test.js` for invalid-result no-op persistence, draw mode-stat mutation, mode-stat upsert shape, and progress ledger payloads.
* Updated `docs/system-design.md` and backend quality guidelines for the room result persistence contract.

### Batch 19 Completed

* Expanded `server/roomSkillResolution.js` from pending-resolution math into the skill preview lifecycle boundary.
* Updated `server/rooms.js` to delegate active skill preview start, passive skill preview start, pending skill resolution scheduling, pending preview payload metadata, and completion side effects to the skill lifecycle boundary.
* Kept action routing, opening completion, restored-room timer resume, and room persistence triggers in `server/rooms.js`.
* Added `server/roomSkillResolution.test.js` coverage for pending preview metadata and scheduled resolution completion side effects.
* Updated `docs/system-design.md` and backend quality guidelines for the room skill resolution contract.

### Batch 20 Completed

* Added `server/roomClockLifecycle.js` as the per-room clock tick lifecycle boundary.
* Updated `server/rooms.js` to delegate playing-phase interval callbacks, disconnected-player empty-room scheduling handoff, timeout finish mutation, and clock-vs-room broadcast choice to the clock lifecycle boundary.
* Kept room creation, opening completion, restore-time clock start decisions, and persistence triggers in `server/rooms.js`.
* Added `server/roomClockLifecycle.test.js` for lightweight clock broadcasts, removed-room interval cleanup, disconnected-room handoff, and timeout finish broadcasts.
* Updated `docs/system-design.md` and backend quality guidelines for the room clock lifecycle contract.

### Batch 21 Completed

* Added `server/roomRestoreLifecycle.js` as the restored-room timer resume boundary.
* Updated `server/rooms.js` to delegate finished-room close-window recovery, opening deadline recovery, restored pending skill preview recovery, active deadline scheduling, and empty-room close scheduling to the restore lifecycle boundary.
* Kept persisted room listing, snapshot hydration, restored-room registration, and forced post-restore persistence in `server/rooms.js`.
* Added `server/roomRestoreLifecycle.test.js` for expired finished rooms, rescheduled finished rooms, opening recovery, pending skill preview recovery, invalid pending-skill fallback, and active deadline scheduling.
* Updated `docs/system-design.md` and backend quality guidelines for the room restore lifecycle contract.

### Batch 22 Completed

* Added `server/roomConnectionLifecycle.js` as the room socket connection-state boundary.
* Updated `server/rooms.js` to delegate player reconnects, spectator joins, socket disconnect cleanup, spectator leave, finished-player leave-as-spectator cleanup, empty-room close handoff, and forced connection-state persistence to the connection lifecycle boundary.
* Kept socket event routing, matchmaking room creation, action routing, and room persistence implementation in `server/rooms.js`.
* Added `server/roomConnectionLifecycle.test.js` for player reconnects, idempotent spectator joins, disconnect cleanup, finished-room disconnect notice suppression, explicit spectator leave, and finished-player leave cleanup.
* Updated `docs/system-design.md` and backend quality guidelines for the room connection lifecycle contract.

### Batch 23 Completed

* Added `server/roomRequestLifecycle.js` as the counting/draw/scoring request entry boundary.
* Updated `server/rooms.js` to delegate counting requests/responses, draw requests/responses, scoring action room/player lookup, phase precondition checks, scoring point validation, and dispatch into `server/roomScoringFlow.js` to the request lifecycle boundary.
* Kept standard game action routing, skill action routing, chat mutation, and broadcast/persistence wrappers in `server/rooms.js`.
* Added `server/roomRequestLifecycle.test.js` for invalid room-code handling, counting request dispatch, draw response phase checks, accepted draw close scheduling, scoring point validation, and result-review phase checks.

### Batch 24 Completed

* Added `server/roomCreationLifecycle.js` as the room creation orchestration boundary.
* Updated `server/rooms.js` to delegate matched matchmaking room creation and direct duel room creation, including initial room registration, forced persistence, clock startup, opening scheduling, `match:found` delivery, creation notices, and initial room broadcast.
* Kept queue status/list helpers, matchmaking leave cleanup, socket event routing, action routing, and room map ownership in `server/rooms.js`.
* Added `server/roomCreationLifecycle.test.js` for unmatched joins, matched matchmaking creation side effects, direct-room mode normalization, matchmaking cleanup, emitted match payloads, and creation broadcasts.
* Updated `docs/system-design.md` and backend quality guidelines for the room creation lifecycle contract.

### Batch 25 Completed

* Added `server/roomActionLifecycle.js` as the gameplay action entry routing boundary.
* Updated `server/rooms.js` to delegate room-code validation, room lookup, point validation, player lookup, pending-skill rejection, test-action dispatch, skill-action dispatch, and standard action dependency wiring to the action lifecycle.
* Removed stale `rooms.js` imports/constants left behind by earlier lifecycle extractions.
* Added `server/roomActionLifecycle.test.js` for validation ordering, test-action state application, skill dispatch, and standard-action dependency wiring.
* Updated `docs/system-design.md` and backend quality guidelines for the room action lifecycle contract.

### Batch 26 Completed

* Added `server/roomChatLifecycle.js` as the room chat entry mutation boundary.
* Updated `server/rooms.js` to delegate room-code validation, text normalization, room lookup, chat message shape, message id creation, move-number capture, and timestamps to the chat lifecycle.
* Added `server/roomChatLifecycle.test.js` for invalid room-code short-circuiting, invalid text handling, missing rooms, and successful normalized chat append behavior.
* Updated `docs/system-design.md` and backend quality guidelines for the room chat lifecycle contract.

### Batch 27 Completed

* Added `server/roomQueries.js` as the room read-model/query boundary.
* Updated `server/rooms.js` to delegate active-room filtering, watch-room projection, active membership checks, and user-to-room lookup while keeping ownership of the in-memory room map.
* Added `server/roomQueries.test.js` for finished-room filtering, watch-room payload shape, mode fallback, participant summary delegation, active-room membership, and specific/global user-room lookup.
* Updated `docs/system-design.md` and backend quality guidelines for the room queries contract.

### Batch 28 Completed

* Added `server/roomPersistenceRestoreLifecycle.js` as the persisted-room restore orchestration boundary.
* Updated `server/rooms.js` to delegate persisted-row loading, snapshot parsing/hydration, restored disconnect notices, in-memory registration, restore-time timer handoff, force persistence, and bad-row isolation to the restore orchestration module.
* Added `server/roomPersistenceRestoreLifecycle.test.js` for normal restore registration, no-code skips, no-persist close-on-restore behavior, and continuing past bad persisted rows.
* Updated `docs/system-design.md` and backend quality guidelines for the persisted-room restore lifecycle contract.

### Batch 29 Completed

* Added `server/roomOpeningLifecycle.js` as the room opening transition boundary.
* Updated `server/rooms.js` to delegate opening-to-playing phase mutation, game-start notice append, `lastTick` refresh, full room broadcast, and initial passive-skill trigger handoff to the opening lifecycle while preserving existing exported wrappers.
* Added `server/roomOpeningLifecycle.test.js` for opening completion, non-opening no-op behavior, and direct initial passive-skill trigger delegation.
* Updated `docs/system-design.md` and backend quality guidelines for the room opening lifecycle contract.

### Batch 30 Completed

* Added `server/roomRuntime.js` as the runtime persistence/broadcast adapter boundary.
* Updated `server/rooms.js` to compose shared `persistRoom`, `broadcastRoom`, and `broadcastToast` callbacks through the runtime adapter instead of defining local wrapper functions.
* Added `server/roomRuntime.test.js` for persistence option wiring, default force behavior, full-room broadcast persistence injection, and room toast forwarding.
* Updated `docs/system-design.md` and backend quality guidelines for the room runtime contract.

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
