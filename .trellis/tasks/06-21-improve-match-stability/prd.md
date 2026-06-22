# Improve match stability

## Goal

Improve live match stability before doing larger realtime protocol work. The first pass should reduce avoidable room-state churn, make reconnect/recovery safer under weak networks, and lower backend pressure from room lookups, snapshots, and persistence without changing game rules or visible product behavior.

## What I already know

* The user wants to prioritize match stability after a static technical-debt audit.
* Existing realtime optimizations already include lightweight `room:clock`, `room:patch` for chat and presence, client-side patch revision recovery through `room:resume`, room snapshot structural sharing, and memoized board point rendering.
* Full `room:update` is still used for moves, skills, phase transitions, scoring, timeouts, match found, join/resume, and patch-gap recovery.
* Server runtime still keeps active rooms in a process-local `rooms = new Map()` and uses per-room timers plus throttled SQLite room snapshots.
* Current static audit suggests the best first stability batch is instrumentation and low-risk pressure reduction, not a full protocol rewrite.

## Assumptions

* Preserve current gameplay semantics, room payload shapes, and replay behavior unless a change is strictly internal.
* Avoid changing visible UI except for clearer recovery/status behavior if needed.
* Keep the first implementation small enough to verify with focused unit tests and the existing `npm run check` path.

## Requirements

* Add or improve guardrails for reconnect/resume so duplicate reconnects, stale room close payloads, and missing-room recovery do not cause unnecessary room state resets.
* Reduce backend room lookup pressure by avoiding repeated full scans of active rooms where a direct index can be maintained safely.
* Reduce persistence pressure by avoiding forced room persistence for changes that do not need an immediate durable snapshot, while preserving crash/restart recovery for gameplay-critical state.
* Add focused tests around the chosen stability paths.
* Update system design documentation if runtime behavior, persistence, recovery, or realtime API behavior changes.

## Acceptance Criteria

* [ ] Match/duel/join room flows still create rooms and deliver authoritative snapshots.
* [ ] Reconnect `room:resume` remains authoritative and does not reopen dismissed finished results.
* [ ] Stale or unrelated room events are ignored without clearing the active room.
* [ ] Active-room membership lookups no longer require scanning every room in the common path.
* [ ] Non-critical patch persistence is throttled or deduplicated without losing active-room recovery guarantees.
* [ ] Unit tests cover the new indexing/recovery/persistence behavior.
* [ ] `npm test` or a narrower justified test set passes.
* [ ] `docs/system-design.md` or the relevant `docs/system-design/` chapter is updated if behavior changes, followed by `npm run docs:system-design`.

## Definition of Done

* Tests added or updated for every changed realtime/runtime behavior.
* No gameplay rule changes.
* No unrelated CSS, asset, or UI redesign work.
* Existing dirty `output/` and `prototypes/` paths are not touched.

## Out of Scope

* Full move/skill/scoring domain-patch protocol.
* Multi-process room runtime, Redis, external queues, or database migration away from SQLite.
* Pixi/animation performance work.
* Large app-shell React refactor.
* Product-facing redesign of room UI.

## Technical Approach

Recommended MVP:

1. Add a backend active-room membership index around the current room runtime.
2. Make room query helpers use the index for `isUserInActiveRoom()` and `findRoomForUser()` where possible.
3. Review room close/resume socket handlers for stale-event handling and add tests for weak-network orderings.
4. Tune persistence boundaries only where the current code forces snapshots for non-critical patch updates.
5. Document any changed realtime/runtime behavior.

## Decision (ADR-lite)

**Context**: The current code already has clock/patch/snapshot-sharing optimizations. The largest stability risk remaining is not one obvious bug, but pressure and edge-case ordering around room recovery, lookup scans, forced persistence, and full snapshots.

**Decision**: Start with low-risk runtime pressure reduction and recovery hardening instead of introducing a broader move/skill patch protocol in this task.

**Consequences**: This should improve stability with a smaller regression surface. Full action patching remains a later project once recovery and metrics are tighter.

## Open Questions

* None. User confirmed on 2026-06-21 to implement the low-risk MVP first and leave the larger move/skill patch protocol out of this round.

## Technical Notes

* Relevant docs: `docs/system-design/03-backend-realtime-api.md`, `docs/system-design/07-performance-tech-debt.md`.
* Relevant frontend files: `src/app/socketHandlers.js`, `src/app/roomSnapshot.js`, `src/app/roomPatch.js`, `src/app/roomClock.js`, `src/app/useGameSocketConnection.js`.
* Relevant backend files: `server/rooms.js`, `server/roomBroadcasts.js`, `server/roomQueries.js`, `server/roomStatePersistence.js`, `server/roomConnectionLifecycle.js`, `server/roomClockLifecycle.js`.
