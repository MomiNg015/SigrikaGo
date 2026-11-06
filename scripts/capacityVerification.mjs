import { io } from "socket.io-client";
import { playMove } from "../src/shared/gameStoneActions.js";
import { applyRoomPatch } from "../src/app/roomPatch.js";

const PROFILES = Object.freeze({
  smoke: Object.freeze({
    sockets: 20,
    rooms: 5,
    spectatorsPerRoom: 1,
    durationMs: 12_000,
    actionIntervalMs: 3_000,
    reconnectRatio: 0.2
  }),
  target: Object.freeze({
    sockets: 500,
    rooms: 100,
    spectatorsPerRoom: 2,
    durationMs: 120_000,
    actionIntervalMs: 7_500,
    reconnectRatio: 0.2
  })
});

export function capacityProfile(name = "smoke", overrides = {}) {
  const profileName = Object.hasOwn(PROFILES, name) ? name : "smoke";
  const base = PROFILES[profileName];
  const profile = {
    name: profileName,
    actionMode: "layout",
    registrationConcurrency: 8,
    staggerActions: false,
    recycleAfterMoves: 0,
    httpReadsPerCycle: 0,
    ...base,
    ...Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== undefined))
  };
  profile.sockets = positiveInteger(profile.sockets, base.sockets);
  profile.registrationConcurrency = positiveInteger(profile.registrationConcurrency, 8);
  profile.recycleAfterMoves = nonNegativeInteger(profile.recycleAfterMoves, 0);
  profile.httpReadsPerCycle = nonNegativeInteger(profile.httpReadsPerCycle, 0);
  if (profile.recycleAfterMoves && (profile.actionMode !== "move" || profile.recycleAfterMoves < 20)) {
    throw new Error("Capacity lifecycle needs move mode and at least 20 moves per game");
  }
  profile.rooms = nonNegativeInteger(profile.rooms, base.rooms);
  if (!["layout", "move"].includes(profile.actionMode)) throw new Error("Unknown capacity action mode");
  profile.spectatorsPerRoom = nonNegativeInteger(profile.spectatorsPerRoom, base.spectatorsPerRoom);
  profile.durationMs = positiveInteger(profile.durationMs, base.durationMs);
  profile.actionIntervalMs = positiveInteger(profile.actionIntervalMs, base.actionIntervalMs);
  profile.reconnectRatio = ratio(profile.reconnectRatio, base.reconnectRatio);
  if (profile.rooms * 2 > profile.sockets) {
    throw new Error(`Capacity profile needs at least ${profile.rooms * 2} sockets for ${profile.rooms} rooms`);
  }
  return profile;
}

export async function runCapacityVerification({
  baseUrl,
  profile = capacityProfile(),
  restartServer = null,
  restartAfterSetup = null,
  verifySettlement = null,
  runId = Date.now().toString(36).slice(-5),
  password = "pwpass12",
  onProgress = () => {}
} = {}) {
  const target = String(baseUrl ?? "").replace(/\/+$/, "");
  if (!target) throw new Error("Capacity verification requires baseUrl");
  if (profile.recycleAfterMoves && !verifySettlement) throw new Error("Lifecycle verification requires the isolated local database auditor");
  const records = [];
  const rooms = [];
  const ackLatencies = [];
  const reconnectLatencies = [];
  const restartResumeLatencies = [];
  const serverSamples = [];
  const errors = [];
  const httpLatencies = [];
  let completedGames = 0;
  const startedAt = new Date();

  try {
    onProgress(`cold-static ${target}`);
    const coldStatic = await measureColdStatic(target);

    onProgress(`register ${profile.sockets} users`);
    const authRecords = await registerCapacityUsers({
      baseUrl: target,
      count: profile.sockets,
      password,
      runId,
      concurrency: profile.registrationConcurrency
    });
    if (restartAfterSetup) {
      onProgress("restart after account setup to separate registration cost from online load");
      await restartAfterSetup();
    }

    onProgress(`connect ${profile.sockets} sockets`);
    await mapWithConcurrency(authRecords, 25, async (auth, index) => {
      const onUnexpectedDisconnect = (reason) => errors.push(`unexpected disconnect ${index}: ${reason}`);
      records[index] = { auth, socket: await connectSocket(target, auth.token, onUnexpectedDisconnect),
        role: "idle", roomCode: "", onUnexpectedDisconnect };
    });

    onProgress(`create ${profile.rooms} active rooms`);
    const roomPairs = Array.from({ length: profile.rooms }, (_, index) => [index * 2, index * 2 + 1]);
    const preparedRooms = [];
    for (const [firstIndex, secondIndex] of roomPairs) {
      const prepared = await createPreparedRoom(records[firstIndex].socket, records[secondIndex].socket);
      records[firstIndex].role = "player";
      records[firstIndex].roomCode = prepared.roomCode;
      records[secondIndex].role = "player";
      records[secondIndex].roomCode = prepared.roomCode;
      preparedRooms.push({ roomCode: prepared.roomCode, actorIndex: firstIndex, secondIndex, round: 0 });
    }
    await mapWithConcurrency(preparedRooms, 12, (room) => waitForRoomPhase(
      records[room.actorIndex].socket,
      room.roomCode,
      "playing"
    ));
    rooms.push(...preparedRooms);

    const spectatorCapacity = Math.min(
      profile.sockets - profile.rooms * 2,
      profile.rooms * profile.spectatorsPerRoom
    );
    onProgress(`join ${spectatorCapacity} spectators`);
    await mapWithConcurrency(Array.from({ length: spectatorCapacity }, (_, index) => index), 25, async (offset) => {
      const recordIndex = profile.rooms * 2 + offset;
      const roomCode = rooms[offset % rooms.length]?.roomCode;
      if (!roomCode) return;
      await joinRoom(records[recordIndex].socket, roomCode);
      records[recordIndex].role = "spectator";
      records[recordIndex].roomCode = roomCode;
    });

    const adminToken = records[0]?.auth?.token;
    await promoteCapacityFixtureAdmin(target, adminToken);
    const serverStart = await fetchServerSnapshot(target, adminToken);
    serverSamples.push(serverStart);
    const reconnectAt = Date.now() + Math.floor(profile.durationMs / 3);
    const restartAt = Date.now() + Math.floor(profile.durationMs * 2 / 3);
    const deadline = Date.now() + profile.durationMs;
    let reconnectDone = false;
    let restartDone = false;
    let actionSequence = 0;

    while (Date.now() < deadline) {
      const cycleStarted = Date.now();
      onProgress(`action cycle ${actionSequence + 1}`);
      await Promise.all(rooms.map(async (room, roomIndex) => {
        if (profile.staggerActions) await delay(Math.floor(roomIndex * profile.actionIntervalMs / rooms.length));
        let actor = records[room.actorIndex];
        let action = { type: "test-random-layout" };
        if (profile.actionMode === "move") {
          const view = actor.socket.capacityRoom;
          const player = view?.players.find((entry) => entry.color === view.game.turn);
          actor = [records[room.actorIndex], records[room.secondIndex]].find((entry) => entry.auth.user.id === player?.user.id);
          action = nextCapacityMove(view?.game);
          if (!actor || !action) { errors.push(`action ${room.roomCode}: no playable turn`); return; }
        }
        const started = performance.now();
        try {
          const response = await emitWithAck(actor.socket, "game:action", {
            roomCode: room.roomCode,
            actionId: `capacity:${runId}:${actionSequence}:${room.roomCode}`,
            action
          });
          ackLatencies.push(performance.now() - started);
          if (!response.ok) errors.push(`action ${room.roomCode}: ${response.error ?? "rejected"}`);
        } catch (error) {
          ackLatencies.push(performance.now() - started);
          errors.push(`action ${room.roomCode}: ${error.message}`);
        }
      }));
      actionSequence += 1;
      if (profile.httpReadsPerCycle) {
        await mapWithConcurrency(Array.from({ length: profile.httpReadsPerCycle }, (_, index) => index), 4, async (index) => {
          const record = records[(actionSequence * profile.httpReadsPerCycle + index) % records.length];
          const started = performance.now();
          try {
            const response = await fetch(`${target}/api/me`, { headers: { Authorization: `Bearer ${record.auth.token}` } });
            await response.arrayBuffer();
            httpLatencies.push(performance.now() - started);
            if (!response.ok) errors.push(`http me: ${response.status}`);
          } catch (error) { errors.push(`http me: ${error.message}`); }
        });
      }
      if (profile.recycleAfterMoves && actionSequence % profile.recycleAfterMoves === 0) {
        onProgress(`settle and verify ${rooms.length} games, then rematch`);
        await mapWithConcurrency(rooms, 4, async (room) => {
          const loser = records[room.round % 2 ? room.secondIndex : room.actorIndex];
          const result = await emitWithAck(loser.socket, "game:action", {
            roomCode: room.roomCode, actionId: `capacity:${runId}:finish:${room.roomCode}`, action: { type: "resign" }
          });
          if (!result.ok) throw new Error(`Settlement action rejected: ${result.error}`);
          await verifySettlement({ roomCode: room.roomCode, loserId: loser.auth.user.id,
            playerIds: [records[room.actorIndex].auth.user.id, records[room.secondIndex].auth.user.id], minMoves: profile.recycleAfterMoves });
          completedGames += 1;
          const participants = records.filter(record => record.roomCode === room.roomCode);
          room.spectatorIndexes = participants.filter(record => record.role === "spectator").map(record => records.indexOf(record));
          await Promise.all(participants.map(async (record) => {
            const left = waitForEvent(record.socket, "room:left", payload => payload.roomCode === room.roomCode);
            record.socket.emit("room:leave", { roomCode: room.roomCode });
            await left;
          }));
        });
        // Match pairs sequentially: parallel queue joins could pair different rooms' players.
        for (const room of rooms) {
          const prepared = await createPreparedRoom(records[room.actorIndex].socket, records[room.secondIndex].socket);
          room.roomCode = prepared.roomCode;
          room.round += 1;
          for (const index of [room.actorIndex, room.secondIndex]) records[index].roomCode = room.roomCode;
        }
        await mapWithConcurrency(rooms, 12, room => waitForRoomPhase(records[room.actorIndex].socket, room.roomCode, "playing"));
        await mapWithConcurrency(rooms, 4, async room => {
          for (const index of room.spectatorIndexes) {
            await joinRoom(records[index].socket, room.roomCode);
            records[index].roomCode = room.roomCode;
          }
        });
      }
      serverSamples.push(await fetchServerSnapshot(target, adminToken));

      if (!reconnectDone && profile.reconnectRatio > 0 && Date.now() >= reconnectAt) {
        reconnectDone = true;
        const reconnectCount = Math.max(1, Math.floor(records.length * profile.reconnectRatio));
        onProgress(`reconnect ${reconnectCount} sockets`);
        const indexes = evenlySpacedIndexes(records.length, reconnectCount);
        await mapWithConcurrency(indexes, 25, async (index) => {
          const started = performance.now();
          try {
            await reconnectRecord(records[index], target);
            reconnectLatencies.push(performance.now() - started);
          } catch (error) {
            errors.push(`reconnect ${index}: ${error.message}`);
          }
        });
      }

      if (!restartDone && restartServer && Date.now() >= restartAt) {
        restartDone = true;
        onProgress("restart server and recover all sockets");
        records.forEach((record) => record.socket?.disconnect());
        await restartServer();
        await mapWithConcurrency(records.map((_, index) => index), 25, async (index) => {
          const started = performance.now();
          try {
            await reconnectRecord(records[index], target);
            restartResumeLatencies.push(performance.now() - started);
          } catch (error) {
            errors.push(`restart-resume ${index}: ${error.message}`);
          }
        });
      }

      await delay(Math.min(Math.max(0, profile.actionIntervalMs - (Date.now() - cycleStarted)), Math.max(0, deadline - Date.now())));
    }

    const serverEnd = await fetchServerSnapshot(target, adminToken);
    const disconnectedSockets = records.filter((record) => !record.socket.connected).length;
    if (disconnectedSockets) errors.push(`disconnected sockets at end: ${disconnectedSockets}`);
    serverSamples.push(serverEnd);
    const serverPeak = peakProcessMetrics(serverSamples);
    const completedAt = new Date();
    return {
      profile,
      restartedAfterAccountSetup: Boolean(restartAfterSetup),
      target,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      elapsedMs: completedAt.getTime() - startedAt.getTime(),
      topology: {
        sockets: records.length,
        rooms: rooms.length,
        players: records.filter((record) => record.role === "player").length,
        spectators: records.filter((record) => record.role === "spectator").length,
        idleSockets: records.filter((record) => record.role === "idle").length
      },
      coldStatic,
      client: {
        completedGames,
        httpReads: summarizeLatency(httpLatencies),
        coldLogins: summarizeLatency(authRecords.map((auth) => auth.loginLatencyMs)),
        actions: summarizeLatency(ackLatencies),
        reconnects: summarizeLatency(reconnectLatencies),
        restartResumes: summarizeLatency(restartResumeLatencies),
        errorCount: errors.length,
        errors: errors.slice(0, 50)
      },
      server: {
        start: serverStart,
        end: serverEnd,
        peak: serverPeak,
        sampleCount: serverSamples.filter(Boolean).length,
        samples: serverSamples.filter(Boolean),
        delta: serverMetricDelta(serverStart, serverEnd)
      },
      thresholds: evaluateThresholds({
        profile,
        ackLatencies,
        restartResumeLatencies,
        errors,
        completedGames,
        serverEnd,
        serverPeak,
        serverSamples
      })
    };
  } finally {
    records.forEach((record) => record?.socket?.disconnect());
  }
}

export function nextCapacityMove(game) {
  if (game?.phase !== "playing") return null;
  const empty = game.points.filter((point) => point.valid && !point.stone);
  // Rotate candidates to spread stones across the board; validate with the real rules.
  const offset = Number(game.moveNumber ?? 0) * 37;
  for (let index = 0; index < empty.length; index += 1) {
    const point = empty[(offset + index) % empty.length];
    if (playMove(game, game.turn, point.id).ok) return { type: "move", pointId: point.id };
  }
  return null;
}

export function percentile(values, requestedPercentile) {
  const sorted = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(requestedPercentile * sorted.length) - 1));
  return sorted[index];
}

export function summarizeLatency(values) {
  const finite = values.map(Number).filter(Number.isFinite);
  return {
    count: finite.length,
    minMs: finite.length ? Math.min(...finite) : null,
    averageMs: finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : null,
    p95Ms: percentile(finite, 0.95),
    p99Ms: percentile(finite, 0.99),
    maxMs: finite.length ? Math.max(...finite) : null
  };
}

async function measureColdStatic(baseUrl) {
  const started = performance.now();
  const indexResponse = await fetch(`${baseUrl}/`, { cache: "no-store" });
  const html = await indexResponse.text();
  if (!indexResponse.ok) throw new Error(`Cold index failed (${indexResponse.status})`);
  const indexMs = performance.now() - started;
  const assetPath = html.match(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/)?.[1] ?? null;
  if (!assetPath) return { indexMs, indexBytes: Buffer.byteLength(html), assetPath: null };
  const assetStarted = performance.now();
  const assetResponse = await fetch(`${baseUrl}${assetPath}`, { cache: "no-store" });
  const assetBytes = (await assetResponse.arrayBuffer()).byteLength;
  if (!assetResponse.ok) throw new Error(`Cold asset failed (${assetResponse.status})`);
  return {
    indexMs,
    indexBytes: Buffer.byteLength(html),
    assetPath,
    assetMs: performance.now() - assetStarted,
    assetBytes,
    assetCacheControl: assetResponse.headers.get("cache-control") ?? ""
  };
}

async function registerCapacityUsers({ baseUrl, count, password, runId, concurrency }) {
  const users = Array.from({ length: count }, (_, index) => ({
    username: index === 0 ? "capadmin" : `c${runId}${index.toString(36)}`,
    password
  }));
  return mapWithConcurrency(users, concurrency, async (credentials, index) => {
    const started = performance.now();
    let response = await requestJson(`${baseUrl}/api/auth/register`, {
      method: "POST",
      body: credentials
    }, { allowConflict: index === 0 });
    if (response.conflict) {
      response = await requestJson(`${baseUrl}/api/auth/login`, {
        method: "POST",
        body: { ...credentials, forceLogin: true }
      });
    }
    return { ...response, username: credentials.username, loginLatencyMs: performance.now() - started };
  });
}

async function createPreparedRoom(firstSocket, secondSocket) {
  const firstFound = waitForEvent(firstSocket, "match:found");
  const firstWaiting = waitForEvent(firstSocket, "match:waiting");
  firstSocket.emit("match:join", { mode: "standard" });
  await firstWaiting;
  const secondFound = waitForEvent(secondSocket, "match:found");
  secondSocket.emit("match:join", { mode: "standard" });
  const [firstRoom] = await Promise.all([firstFound, secondFound]);
  const roomCode = firstRoom.code;
  await Promise.all([
    emitWithAck(firstSocket, "room:preload-ready", { roomCode }),
    emitWithAck(secondSocket, "room:preload-ready", { roomCode })
  ]);
  return { roomCode };
}

async function waitForRoomPhase(socket, roomCode, phase) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const room = await requestRoomSnapshot(socket, roomCode);
    if (room?.game?.phase === phase) return room;
    await delay(200);
  }
  throw new Error(`Room ${roomCode} did not reach ${phase}`);
}

async function reconnectRecord(record, baseUrl) {
  record.socket?.disconnect();
  record.socket = await connectSocket(baseUrl, record.auth.token, record.onUnexpectedDisconnect);
  if (record.role === "player") {
    await requestRoomSnapshot(record.socket, record.roomCode);
  } else if (record.role === "spectator") {
    await joinRoom(record.socket, record.roomCode);
  }
}

function connectSocket(baseUrl, token, onUnexpectedDisconnect = () => {}) {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      auth: { token },
      reconnection: false,
      timeout: 8_000,
      transports: ["websocket"]
    });
    socket.on("room:update", (room) => { socket.capacityRoom = room; });
    socket.on("room:patch", (patch) => { socket.capacityRoom = applyRoomPatch(socket.capacityRoom, patch); });
    socket.on("disconnect", (reason) => {
      if (reason !== "io client disconnect") onUnexpectedDisconnect(reason);
    });
    const timeoutId = setTimeout(() => {
      socket.disconnect();
      reject(new Error("socket connect timed out"));
    }, 10_000);
    socket.once("connect", () => {
      clearTimeout(timeoutId);
      resolve(socket);
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timeoutId);
      socket.disconnect();
      reject(error);
    });
  });
}

function joinRoom(socket, roomCode) {
  const update = waitForEvent(socket, "room:update", (room) => room?.code === roomCode);
  socket.emit("room:join", { roomCode });
  return update;
}

function requestRoomSnapshot(socket, roomCode) {
  const update = waitForEvent(socket, "room:update", (room) => room?.code === roomCode);
  socket.emit("room:resume", { roomCode, resumeReason: "capacity-verification" });
  return update;
}

function emitWithAck(socket, eventName, payload) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`${eventName} acknowledgement timed out`)), 8_000);
    socket.emit(eventName, payload, (response = {}) => {
      clearTimeout(timeoutId);
      resolve(response);
    });
  });
}

function waitForEvent(socket, eventName, predicate = () => true, timeoutMs = 12_000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`${eventName} timed out`));
    }, timeoutMs);
    const handler = (payload) => {
      if (!predicate(payload)) return;
      cleanup();
      resolve(payload);
    };
    const cleanup = () => {
      clearTimeout(timeoutId);
      socket.off(eventName, handler);
    };
    socket.on(eventName, handler);
  });
}

async function fetchServerSnapshot(baseUrl, token) {
  if (!token) return null;
  const response = await fetch(`${baseUrl}/api/admin/runtime-capacity`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return { error: `admin overview ${response.status}` };
  const body = await response.json();
  return body ?? null;
}

async function promoteCapacityFixtureAdmin(baseUrl, token) {
  if (!token) throw new Error("Capacity admin fixture requires an authenticated user");
  const response = await fetch(`${baseUrl}/api/test-fixtures/me/admin`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: "{}"
  });
  if (!response.ok) throw new Error(`Capacity admin fixture failed (${response.status})`);
}

function peakProcessMetrics(samples) {
  const processSnapshots = samples
    .map((sample) => sample?.capacity?.process)
    .filter(Boolean);
  if (!processSnapshots.length) return null;
  const keys = [
    "rssBytes",
    "heapUsedBytes",
    "heapTotalBytes",
    "externalBytes",
    "cpuPercent",
    "eventLoopDelayP95Ms",
    "eventLoopDelayMaxMs",
    "eventLoopUtilization"
  ];
  return Object.fromEntries(keys.map((key) => [key, Math.max(
    ...processSnapshots.map((snapshot) => Number(snapshot[key] ?? 0)).filter(Number.isFinite)
  )]));
}

function serverMetricDelta(start, end) {
  const before = start?.runtimeStability ?? {};
  const after = end?.runtimeStability ?? {};
  const keys = [
    "roomPersistenceErrors",
    "roomRestoreErrors",
    "roomResultSaveErrors",
    "roomResumeAttempts",
    "roomResumeSuccesses",
    "roomResumeMisses",
    "gameActionAttempts",
    "gameActionAckSuccesses",
    "gameActionAckFailures"
  ];
  const counterResetDetected = Boolean(
    before.startedAt
    && after.startedAt
    && before.startedAt !== after.startedAt
  );
  return {
    counterResetDetected,
    ...Object.fromEntries(keys.map((key) => [key, counterResetDetected
      ? Number(after[key] ?? 0)
      : Number(after[key] ?? 0) - Number(before[key] ?? 0)]))
  };
}

export function evaluateThresholds({
  profile,
  ackLatencies,
  restartResumeLatencies,
  errors,
  completedGames = 0,
  serverEnd,
  serverPeak,
  serverSamples
}) {
  const eventLoopDelayLimitMs = profile?.name === "target" ? 50 : 150;
  const ackP95 = percentile(ackLatencies, 0.95);
  const ackP99 = percentile(ackLatencies, 0.99);
  const processMetrics = serverPeak ?? serverEnd?.capacity?.process ?? {};
  const restartSuccessRatio = restartResumeLatencies.length > 0
    ? restartResumeLatencies.length / (restartResumeLatencies.length + errors.filter((error) => error.startsWith("restart-resume")).length)
    : null;
  const checks = {
    serverMetricsAvailable: serverSamples.length > 0 && serverSamples.every((sample) => (
      sample?.capacity?.process && sample?.runtimeStability
    )),
    noClientErrors: errors.length === 0,
    requestedLifecycleCompleted: !profile?.recycleAfterMoves || (profile.rooms > 0 && completedGames >= profile.rooms),
    expectedOnlineUsers: profile?.sockets === undefined || serverEnd?.capacity?.current?.onlineUsers === profile.sockets,
    expectedActiveRooms: profile?.rooms === undefined || serverEnd?.capacity?.current?.activeRooms === profile.rooms,
    ackP95Under200Ms: profile?.rooms === 0 || (ackP95 !== null && ackP95 < 200),
    ackP99Under500Ms: profile?.rooms === 0 || (ackP99 !== null && ackP99 < 500),
    eventLoopP95WithinProfileLimit: Number(processMetrics.eventLoopDelayP95Ms ?? Infinity) < eventLoopDelayLimitMs,
    rssUnder1_2GiB: Number(processMetrics.rssBytes ?? Infinity) < 1.2 * 1024 * 1024 * 1024,
    restartRecoveryAbove99Percent: restartSuccessRatio === null || restartSuccessRatio > 0.99,
    noPersistenceOrResultErrors: serverSamples.every((sample) => [
      sample?.runtimeStability?.roomPersistenceErrors,
      sample?.runtimeStability?.roomRestoreErrors,
      sample?.runtimeStability?.roomResultSaveErrors
    ].every((value) => Number(value ?? 0) === 0))
  };
  return {
    checks,
    limits: { eventLoopDelayP95Ms: eventLoopDelayLimitMs },
    passed: Object.values(checks).every(Boolean),
    note: profile?.name === "target"
      ? "These are candidate 2-core/2-GB release thresholds; approve production limits only from the target host report."
      : "Smoke thresholds validate the verification pipeline; production capacity approval still requires the target profile on the target host."
  };
}

async function requestJson(url, { method, body }, { allowConflict = false } = {}) {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (allowConflict && response.status === 409) return { conflict: true };
  if (!response.ok) throw new Error(`${method} ${url} failed (${response.status}): ${JSON.stringify(payload)}`);
  return payload;
}

async function mapWithConcurrency(values, concurrency, task) {
  const results = new Array(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(values[index], index);
    }
  }
  const settled = await Promise.allSettled(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  const failure = settled.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
  return results;
}

function evenlySpacedIndexes(total, count) {
  if (!total || !count) return [];
  return Array.from({ length: Math.min(total, count) }, (_, index) => Math.min(
    total - 1,
    Math.floor(index * total / Math.min(total, count))
  ));
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function nonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function ratio(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1 ? number : fallback;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
