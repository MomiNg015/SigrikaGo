# Realtime reliability and SQLite deployment research

## Scope

This note records the external constraints that affect SigrikaGo's 2-core/2GB single-instance deployment. It intentionally focuses on behavior that changes the implementation plan: delivery guarantees, shutdown semantics, reconnection recovery, multi-node prerequisites, and SQLite journal safety.

## Primary references

* Socket.IO delivery guarantees: https://socket.io/docs/v4/delivery-guarantees/
* Socket.IO connection state recovery: https://socket.io/docs/v4/connection-state-recovery/
* Socket.IO Server API (`server.close`): https://socket.io/docs/v4/server-api/
* Socket.IO multiple-node deployment: https://socket.io/docs/v4/using-multiple-nodes/
* Socket.IO Redis Streams adapter: https://socket.io/docs/v4/redis-streams-adapter/
* SQLite WAL documentation: https://www.sqlite.org/wal.html
* Node.js HTTP server shutdown semantics: https://nodejs.org/api/http.html

## Findings

### Delivery and recovery

* Socket.IO preserves message ordering when messages arrive, but default arrival is at-most-once. An event interrupted by a broken connection may be lost and is not automatically retried after reconnection.
* Client retries require acknowledgements. Retrying a mutable game command is safe only after the application adds an idempotency key and server-side deduplication.
* Socket.IO connection state recovery can replay packets after brief disconnections, but recovery is not guaranteed and authoritative resynchronization is still required.
* SigrikaGo already has room revisions, patch-gap detection, persisted room snapshots, and `room:resume`. Those remain the authoritative recovery mechanism; built-in connection state recovery is optional optimization rather than a replacement.

### Shutdown

* Socket.IO documents that closing only the underlying HTTP server is insufficient because upgraded WebSocket clients are not immediately disconnected. `io.close()` disconnects Socket.IO clients and closes the underlying server.
* Node.js also documents that generic HTTP connection-close helpers do not destroy protocol-upgraded sockets.
* SigrikaGo currently calls HTTP `server.close()` before `flushRoomPersistence()` and never enters a drain state. Existing WebSocket commands can therefore race with the final persistence boundary unless commands are explicitly stopped or Socket.IO is closed in a controlled order.
* A safe application sequence is: set draining/readiness false; reject new matches and new authoritative mutations; notify clients; flush snapshots; close Socket.IO clients; close remaining HTTP resources; disconnect Prisma; enforce a hard timeout.

### Reconnect storms

* The current client reconnect range is 500–3000ms with infinite attempts. Socket.IO includes jitter, but a full server restart can still produce a concentrated authentication/resume burst.
* SigrikaGo broadcasts lobby stats to every online socket on every connect/disconnect. Coalescing this broadcast is a higher-value first step than aggressively lengthening normal reconnect delay.
* Recommended behavior is bounded exponential backoff with jitter, separate recovery rate limits, idempotent resume, and a debounced global lobby-stats publisher.

### Multi-node boundary

* Multiple Socket.IO nodes require both load-balancing/session-affinity behavior and an adapter that forwards messages between nodes.
* A Socket.IO adapter alone does not share SigrikaGo's application-owned `rooms`, matchmaking queue, online-session map, timers, or room ownership.
* The classic Redis Pub/Sub adapter does not support Socket.IO connection state recovery. The Redis Streams adapter does support it and survives temporary Redis disconnections, but sticky sessions are still required while HTTP long-polling remains enabled.
* Multi-instance deployment must therefore be a separate architecture task covering shared room state/ownership, matching, presence, database topology, draining, and routing—not a PM2 configuration change.

### SQLite journal mode

* SQLite WAL generally improves reader/writer concurrency and reduces fsync frequency, but still permits only one writer at a time and requires checkpoint management.
* SQLite's official WAL page currently documents a rare WAL-reset corruption bug affecting versions through 3.51.2, with fixes in 3.51.3 and selected backports including 3.50.7 and 3.44.6.
* The current Prisma runtime reports SQLite 3.46.0 locally. Do not enable WAL as an incidental deployment tweak until the bundled SQLite version is upgraded/verified and WAL behavior is exercised under concurrent room persistence plus result transactions.
* For the current MVP, local SSD storage, explicit latency/error metrics, bounded snapshot frequency, tested backups, and a clean shutdown are safer first steps. PostgreSQL becomes the durable direction when multi-instance or sustained write concurrency is required, but the repository's SQLite-specific schema guards make that a separate migration project.

## Repo mapping

* Shutdown: `server/serverLifecycle.js`, `server/index.js`
* Socket command boundary: `server/socketGameEvents.js`, `server/socketEvents.js`, `server/socketGuards.js`
* Client reconnect/handlers: `src/app/gameSocket.js`, `src/app/socketHandlers.js`
* Persistence: `server/roomStatePersistence.js`, `server/roomPersistence.js`, `server/roomResultPersistence.js`
* Broadcast cost: `server/roomBroadcasts.js`, `server/roomView.js`
* Metrics: `server/runtimeStabilityMetrics.js`, `server/adminAnalytics.js`
* Deployment: `docs/deployment.md`

## Recommended staged approach

1. Establish drain + idempotent ack + real restart verification.
2. Add operational metrics and overload admission control.
3. Remove spectator payload duplication, cap spectators, and coalesce global broadcasts.
4. Add repeatable target-host capacity tests and deployment templates.
5. Treat WAL, PostgreSQL, Redis Streams, and multi-instance room ownership as explicit follow-up architecture decisions.
## Phase 2 measured payload change

- A fresh 13x13 spectator snapshot serialized from the real `createGameState()` shape fell from 54,136 bytes under the legacy `{ game, gameViews: { black, white } }` shape to 36,356 bytes with `{ game: black, gameViews: { white } }`.
- This fixture shows a 32.8% reduction while preserving both spectator perspectives. Larger move/chat histories remain shared by the same contract and should be remeasured on the target 2-core/2GB server during Phase 3 capacity verification.
