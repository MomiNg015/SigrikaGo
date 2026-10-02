# Improve Production Battle Stability

## Goal

Improve deployed battle-room stability for players by tightening shutdown persistence, making runtime recovery issues observable, and extending production-like stability verification around restart/recovery paths.

## What I Already Know

* The project already persists active and finished rooms through `PersistedRoom` and restores them on startup.
* `room:resume`, `room:preload-ready`, lightweight `room:clock`, `room:patch`, patch-gap recovery, and production-like Playwright stability checks already exist.
* Deployment is intentionally single Node.js process because room state, matchmaking queue, and Socket.IO online state are still process-local.
* Existing admin analytics expose service-health slots for reconnects, preload timeouts, and API errors, but these are currently marked as not connected.
* Shutdown currently closes the HTTP server and disconnects Prisma, but does not explicitly wait for pending room snapshot writes.

## Assumptions

* This task should keep the current single-instance architecture.
* This task should avoid a full maintenance/drain UI unless a smaller server-side shutdown hardening path can deliver value first.
* Runtime stability metrics can be lightweight process-local counters for this MVP; durable analytics can come later.

## Requirements

* Flush pending room persistence before Prisma disconnects during graceful shutdown.
* Track lightweight runtime stability counters for room persistence errors, room restore errors, result-save errors, preload timeouts, room resume attempts, successful room resumes, missing-room resumes, patch-gap resume requests, and socket reconnect-triggered resume requests where existing boundaries expose them.
* Surface those counters in admin overview service health instead of leaving key stability fields as `null` where data is available.
* Extend stability verification with a production-like server restart/recovery case or the closest practical local equivalent.
* Update `docs/system-design.md` or the relevant `docs/system-design/` section, then regenerate `docs/system-design.html`.

## Acceptance Criteria

* [ ] Graceful shutdown waits for queued room persistence writes before disconnecting Prisma.
* [ ] Runtime stability counters are incremented from the relevant room/socket lifecycle paths.
* [ ] Admin overview service health reports reconnect/resume/preload/error counters from the runtime source.
* [ ] A focused unit or stability test covers the new shutdown/counter behavior.
* [ ] `npm run docs:system-design` updates generated docs.
* [ ] Targeted tests pass.

## Definition of Done

* Tests added or updated for the changed runtime behavior.
* Docs updated for architecture/runtime behavior changes.
* Existing user changes in the dirty worktree are preserved.
* Implementation remains compatible with the current single-process deployment model.

## Out of Scope

* Multi-instance Socket.IO/Redis adapter support.
* Persistent analytics event tables.
* Operator-facing maintenance/drain UI.
* Replacing SQLite or changing the deployment topology.

## Technical Approach

Add a small server-side runtime stability metrics module, inject it into existing room and socket boundaries, include a pending room persistence flush dependency in server shutdown, and expose the counters through admin analytics. Prefer lightweight counters and focused tests over larger infrastructure changes.

## Decision (ADR-lite)

**Context**: Existing battle recovery behavior is already strong, but production incidents still need clean shutdown persistence and operator visibility.

**Decision**: Implement process-local runtime stability counters and shutdown persistence flush first.

**Consequences**: This improves single-instance deployment safety and observability without introducing distributed-state complexity. Counters reset on restart and are not historical analytics.

## Technical Notes

* Likely files: `server/serverLifecycle.js`, `server/index.js`, `server/rooms.js`, `server/roomRuntime.js`, `server/roomCloseLifecycle.js`, `server/roomPreparationLifecycle.js`, `server/socketHandlers.js` or socket event registration boundaries, `server/adminAnalytics.js`, `tests/stability/*`, `server/*.test.js`, `docs/system-design/03-backend-realtime-api.md`, `docs/system-design/07-performance-tech-debt.md`.
* Existing verification entry: `npm run verify:stability`.
* Existing aggregate check: `npm run check`.
