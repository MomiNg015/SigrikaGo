# Stability And Tech Debt Batch For Issues 1-4

## Goal

Reduce the project fragility exposed by the mailbox overlay regression by handling the first four audit issues in one Trellis task: app-level overlay registration, realtime room stability pressure, legacy user-asset migration boundaries, and the oversized app-shell orchestration surface.

## What I Already Know

* The user wants issues 1-4 from the stability audit handled together with the Trellis workflow.
* The mailbox feature previously broke matchmaking because `match:found`, room resume, and replay entry paths call `closeAllOverlays()` before recording the next room or transition state.
* App-level overlay state is split across `useOverlayState`, `modalDismissal`, `App.jsx`, `useAppActions`, `useOverlayActions`, `AppOverlays`, and route/home props.
* Existing tests include guard coverage for the mailbox-specific setter path, but some checks are source-string assertions instead of generalized overlay contract tests.
* Realtime room behavior already has important guardrails: lightweight `room:clock`, `room:patch`, patch revision recovery, membership indexes for active-room lookup, throttled patch persistence, room snapshot structural sharing, and memoized board/room widgets.
* Full `room:update` remains authoritative for match found, join/resume, moves, skills, phase changes, scoring, timeouts, and patch-gap recovery.
* User assets still use legacy string/JSON fields as the write source for many paths, then synchronize structured relation tables from those fields.
* `App.jsx` still composes auth, preload, socket, room session, match session, overlays, mailbox polling, recruitment badge timing, audio, site settings, route rendering, and overlay rendering.
* Project instructions require system design docs to be updated for architecture, runtime behavior, data model, or technical debt changes, followed by `npm run docs:system-design`.

## Requirements

* Replace app overlay registration with a single canonical registry so overlay keys, show prop names, setter prop names, dismiss ordering, and close-all behavior are derived from one source.
* Refactor `useOverlayState`, `useOverlayActions`, `modalDismissal`, `App.jsx`, and tests so adding a new app-level overlay fails generalized contract tests when any required wiring is missing.
* Keep player-facing overlay behavior unchanged on desktop and mobile: Escape/back closes the top modal, root mobile back confirmation remains active only when no modal is open, and match found/resume/replay still close app overlays before progressing.
* Add low-risk realtime observability/guardrails without changing the room protocol: expose/test centralized room broadcast classifications and preserve existing full snapshot recovery semantics.
* Keep `room:clock`, `room:patch`, membership-index lookup, and forced persistence for authoritative lifecycle updates intact.
* Make the legacy user-asset boundary safer by adding explicit helper contracts for structured-vs-legacy synchronization and tests that prevent new feature writes from silently dropping structured-only rows.
* Do not remove legacy user asset fields in this task; document the migration path and add guardrails for future feature work.
* Reduce `App.jsx` orchestration pressure by extracting focused app hooks for mailbox badge/summary behavior and recruitment-ready badge timing, while keeping the existing UI and data flows unchanged.
* Update `docs/system-design.md` or relevant `docs/system-design/` chapters and run `npm run docs:system-design`.

## Acceptance Criteria

* [ ] All app-level overlay metadata is represented by one canonical registry.
* [ ] `closeAllOverlays()` closes every registry overlay without requiring per-overlay manual setter parameters.
* [ ] `topDismissibleModalKey()` and modal-dismiss tests derive or validate against the registry rather than duplicating a stale manual list.
* [ ] New generalized tests fail if an overlay is present in `AppOverlays`/routes but absent from close-all or dismiss contracts.
* [ ] `match:found`, live `room:resume`, replay entry, auth reset, and account-logout paths continue to close overlays and preserve transition state.
* [ ] Realtime room broadcast/persistence behavior remains unchanged for visible product behavior, with tests documenting which paths force persistence and which patch paths may throttle.
* [ ] User-asset tests cover structured-only rows and legacy field synchronization behavior so future feature writes cannot accidentally erase structured ownership.
* [ ] Mailbox and recruitment app-shell behavior lives in focused hooks rather than adding more orchestration directly to `App.jsx`.
* [ ] Desktop and mobile modal/back behavior remain covered by existing app/modal tests.
* [ ] System design docs mention the new overlay registry, app-shell hook split, realtime guardrail status, and legacy asset migration guardrails.
* [ ] Relevant unit tests pass, and docs HTML is regenerated.

## Stability Follow-Up Scope

After the initial issue 1-4 batch, the user asked to handle match stability first and continue down the priority list. This task now also covers three P0/P1 stability guardrails discovered during the room-runtime audit:

* Valid finished rooms must not close or delete persisted state until result record persistence has succeeded; failed saves should retry instead of silently losing the game result.
* Gameplay action dispatch must reject phase-invalid generic actions before they can mutate opening, skill-preview, scoring/review, or finished rooms.
* Client patch-gap recovery must debounce duplicate resume requests for the same room/revision so weak-network bursts do not add avoidable socket pressure.

## Definition Of Done

* Tests added or updated for every changed contract.
* No product-facing redesign, gameplay rule change, or protocol rewrite.
* Local verification includes targeted frontend app tests, backend room/user-asset tests, and docs generation.
* Dirty files are limited to this task's implementation and documentation.

## Technical Approach

1. Create a shared `src/app/overlayRegistry.js` that owns app overlay metadata: key, show prop, setter prop, and dismiss order.
2. Refactor `useOverlayState` to generate returned show flags and setters from registry metadata while preserving existing prop names.
3. Refactor `useOverlayActions` so `closeAllOverlays()` accepts the complete overlay action object or registry-derived setter map instead of a manually maintained setter list.
4. Refactor modal dismissal ordering to derive from registry metadata while keeping `result` and `matchStart` as special non-overlay modal entries.
5. Add/strengthen tests for registry completeness and critical socket paths that call `closeAllOverlays()`.
6. Add focused realtime guardrail tests around room broadcast persistence classification and membership-index lookup, without changing payload shapes.
7. Add user-asset guard helpers/tests that make the current legacy-driven sync explicit and document the future structured-source migration boundary.
8. Extract mailbox summary polling and recruitment ready refresh timing from `App.jsx` into focused hooks.
9. Update system design docs and run the system design renderer.

## Decision (ADR-lite)

**Context**: The mailbox regression showed that app-level feature additions can break match flow when overlay registration is spread across several manual lists and setter tunnels. The project also has existing realtime and user-asset tech debt, but a full room protocol rewrite or legacy-field removal would be too risky for one batch.

**Decision**: Prioritize executable guardrails and boundary extraction over large behavioral rewrites. Use a canonical overlay registry, document realtime persistence classifications, make legacy asset sync risks test-visible, and split app-shell polling/timing hooks out of `App.jsx`.

**Consequences**: This should reduce the chance of another cross-cutting feature breaking matchmaking while preserving current gameplay behavior. Full move/skill reducer patches and final structured-asset source-of-truth migration remain future tasks.

## Out Of Scope

* Removing legacy `User.owned*` / `itemEffects` fields.
* Rewriting the full realtime move/skill/scoring protocol.
* Multi-process room runtime or external queues.
* Visual redesign of modals, home, room, mailbox, recruitment, or mobile layouts.
* New user-facing mailbox/recruitment features beyond preserving current behavior.

## Technical Notes

* Relevant frontend files: `src/app/useOverlayState.js`, `src/app/useOverlayActions.js`, `src/app/modalDismissal.js`, `src/app/App.jsx`, `src/app/AppOverlays.jsx`, `src/app/socketHandlers.js`, `src/app/useGameSocketConnection.js`.
* Relevant backend files: `server/roomBroadcasts.js`, `server/roomQueries.js`, `server/roomMembershipIndex.js`, `server/userAssets.js`, `server/mailbox.js`, `server/recruitment.js`.
* Relevant docs: `docs/system-design.md`, `docs/system-design/02-frontend-architecture.md`, `docs/system-design/03-backend-realtime-api.md`, `docs/system-design/04-data-model-and-domain.md`, `docs/system-design/07-performance-tech-debt.md`.
* Relevant specs: `.trellis/spec/frontend/state-management.md`, `.trellis/spec/frontend/quality-guidelines.md`, `.trellis/spec/backend/database-guidelines.md`, `.trellis/spec/guides/cross-layer-thinking-guide.md`, `.trellis/spec/guides/code-reuse-thinking-guide.md`.
