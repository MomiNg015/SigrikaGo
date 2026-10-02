# Stability Extensibility Tech Debt

## Goal

Improve future feature extensibility and match stability by addressing the highest-risk architecture and runtime debts found in the read-only audit: realtime state boundaries, room resume observability, account asset source-of-truth drift, skill effect extensibility, app orchestration, startup schema drift, and room query scaling.

## What I already know

* The user wants to handle audit items 1 through 7 in one push if feasible.
* Production is intentionally guarded as single Node process because room state, matchmaking queue, and Socket.IO online state are process-local.
* Room resume metrics exist, but `initial-connect` resume requests are not separately classified.
* Account assets still bridge legacy string fields and structured relation tables; at least `server/items.js` reads legacy ownership strings directly.
* Skill rule execution is registry-based, while board skill effect rendering is concentrated in a large registry file.
* `src/app/App.jsx` still owns multiple domain states and is a continuing orchestration root.
* Startup mixes schema compatibility guards, seeding, cleanup, and runtime boot.
* Hot room membership lookup is indexed, while active/watch room lists still scan the room map.

## Assumptions

* This task should prioritize stability-preserving incremental work over a high-risk rewrite.
* Full multi-instance production support is out of scope for a single pass; the MVP should prepare boundaries and document the remaining deployment constraint.
* Behavior-changing updates must update `docs/system-design.md` or the relevant `docs/system-design/` pages and regenerate `docs/system-design.html`.

## Requirements

* Add or improve runtime observability for all room resume reasons, including initial connect.
* Reduce asset source-of-truth drift by moving remaining direct business reads toward the structured asset projection boundary.
* Start decomposing the board skill effect rendering registry without changing skill behavior.
* Continue extracting app orchestration state from `App.jsx` into focused hooks where the boundary is clear.
* Make startup schema/seed guard expectations more testable or easier to audit.
* Improve room query/read-model scalability where it can be done incrementally without changing deployment topology.
* Preserve the current single-process production guard unless explicit distributed state infrastructure is introduced.

## Decision (ADR-lite)

**Context**: Full multi-instance realtime support requires shared room state, shared matchmaking, cross-process Socket.IO broadcast, and deployment changes. Doing that together with the other stability debts would create a high-risk migration.

**Decision**: Keep the current single-process production guard in this task. Implement items 2-7 as incremental, testable stability and extensibility hardening. For item 1, document the process-local boundaries and avoid deepening the single-process coupling.

**Consequences**: This task should improve stability observability and code extensibility without changing deployment topology. True multi-instance support remains a later architecture project.

## Acceptance Criteria

* [x] Existing battle/runtime stability tests still pass.
* [x] New or updated tests cover room resume reason classification.
* [x] Asset ownership checks avoid direct legacy string parsing outside the compatibility boundary where touched.
* [x] Skill effect extraction keeps current rendered effect contract and diagnostics intact.
* [x] App orchestration extraction does not change startup, auth, lobby, or room behavior.
* [x] Schema/startup guard behavior is covered by targeted tests or documented testable invariants.
* [x] Room query changes preserve active/watch/admin behavior and have focused tests.
* [x] System design docs and generated HTML are updated if implementation changes architecture/runtime behavior.

## Definition of Done

* Tests added or updated for changed behavior.
* `npm test` or targeted equivalent passes for impacted modules.
* `npm run build` passes if frontend or shared runtime code changes.
* `npm run docs:system-design` runs after system design docs are edited.
* The remaining out-of-scope work is documented clearly.

## Out of Scope

* Full multi-instance deployment support with Redis, external Socket.IO adapter, or shared matchmaking in this single task.
* Replacing SQLite or rewriting persistence wholesale.
* Visual redesign work unrelated to stability/extensibility.

## Technical Notes

* Production single-instance guard: `server/security.js`.
* Room resume client paths: `src/app/gameSocket.js`, `src/app/socketHandlers.js`.
* Room resume service metrics: `server/socketRoomEvents.js`, `server/runtimeStabilityMetrics.js`, `server/adminAnalytics.js`.
* Account asset compatibility boundary: `server/userAssets.js`, `server/items.js`, `prisma/schema.prisma`.
* Skill logic and presentation: `src/shared/gameSkillHandlers.js`, `src/shared/skillPresentation.js`, `src/room/boardSkillEffectRegistry.js`, `src/room/BoardSkillEffects.jsx`.
* App orchestration root: `src/app/App.jsx`.
* Startup schema guards: `server/serverStartup.js`, `server/db.js`.
* Room queries and indexes: `server/roomQueries.js`, `server/roomMembershipIndex.js`.

## Completion Notes

* Implemented incremental hardening while keeping the production runtime single-process.
* Added `initial-connect` room-resume metrics through runtime stability/admin analytics.
* Moved character-target item ownership checks to `publicUserAssets()` with structured `userCharacters` loaded.
* Split board skill image URL constants into `src/room/boardSkillEffectAssets.js`.
* Moved direct-duel incoming request state behind `src/app/useIncomingDuelState.js`.
* Exported `SERVER_STARTUP_TASK_ORDER` and made startup sequencing data-driven/tested.
* Added optional `roomReadModel` delegation for active/watch room lists.
* Updated system design docs, generated `docs/system-design.html`, and updated the frontend state Trellis spec.
* Verification: `npm run check` passed on 2026-06-27.
