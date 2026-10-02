import { io } from "socket.io-client";

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
    ...base,
    ...Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== undefined))
  };
  profile.sockets = positiveInteger(profile.sockets, base.sockets);
  profile.rooms = positiveInteger(profile.rooms, base.rooms);
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
  runId = Date.now().toString(36).slice(-5),
  password = "pwpass12",
  onProgress = () => {}
} = {}) {
  const target = String(baseUrl ?? "").replace(/\/+$/, "");
  if (!target) throw new Error("Capacity verification requires baseUrl");
  const records = [];
  const rooms = [];
  const ackLatencies = [];
  const reconnectLatencies = [];
  const restartResumeLatencies = [];
  const serverSamples = [];
  const errors = [];
  const startedAt = new Date();

  try {
    onProgress(`cold-static ${target}`);
    const coldStatic = await measureColdStatic(target);

    onProgress(`register ${profile.sockets} users`);
    const authRecords = await registerCapacityUsers({
      baseUrl: target,
      count: profile.sockets,
      password,
      runId
    });

    onProgress(`connect ${profile.sockets} sockets`);
    const connected = await mapWithConcurrency(authRecords, 25, async (auth) => ({
      auth,
      socket: await connectSocket(target, auth.token),
      role: "idle",
      roomCode: ""
    }));
    records.push(...connected);

    onProgress(`create ${profile.rooms} active rooms`);
    const roomPairs = Array.from({ length: profile.rooms }, (_, index) => [index * 2, index * 2 + 1]);
    const preparedRooms = [];
    for (const [firstIndex, secondIndex] of roomPairs) {
      const prepared = await createPreparedRoom(records[firstIndex].socket, records[secondIndex].socket);
      records[firstIndex].role = "player";
      records[firstIndex].roomCode = prepared.roomCode;
      records[secondIndex].role = "player";
      records[secondIndex].roomCode = prepared.roomCode;
      preparedRooms.push({ roomCode: prepared.roomCode, actorIndex: firstIndex });
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
      onProgress(`action cycle ${actionSequence + 1}`);
      await Promise.all(rooms.map(async (room) => {
        const actor = records[room.actorIndex];
        const started = performance.now();
        try {
          const response = await emitWithAck(actor.socket, "game:action", {
            roomCode: room.roomCode,
            actionId: `capacity:${runId}:${actionSequence}:${room.roomCode}`,
            action: { type: "test-random-layout" }
          });
          ackLatencies.push(performance.now() - started);
          if (!response.ok) errors.push(`action ${room.roomCode}: ${response.error ?? "rejected"}`);
        } catch (error) {
          ackLatencies.push(performance.now() - started);
          errors.push(`action ${room.roomCode}: ${error.message}`);
        }
      }));
      actionSequence += 1;
      serverSamples.push(await fetchServerSnapshot(target, adminToken));

      if (!reconnectDone && Date.now() >= reconnectAt) {
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

      await delay(Math.min(profile.actionIntervalMs, Math.max(0, deadline - Date.now())));
    }

    const serverEnd = await fetchServerSnapshot(target, adminToken);
    serverSamples.push(serverEnd);
    const serverPeak = peakProcessMetrics(serverSamples);
    const completedAt = new Date();
    return {
      profile,
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
        serverEnd,
        serverPeak,
        serverSamples
      })
    };
  } finally {
    records.forEach((record) => record.socket?.disconnect());
  }
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

async function registerCapacityUsers({ baseUrl, count, password, runId }) {
  const users = Array.from({ length: count }, (_, index) => ({
    username: index === 0 ? "capadmin" : `c${runId}${index.toString(36)}`,
    password
  }));
  return mapWithConcurrency(users, 8, async (credentials, index) => {
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
  record.socket = await connectSocket(baseUrl, record.auth.token);
  if (record.role === "player") {
    await requestRoomSnapshot(record.socket, record.roomCode);
  } else if (record.role === "spectator") {
    await joinRoom(record.socket, record.roomCode);
  }
}

function connectSocket(baseUrl, token) {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      auth: { token },
      reconnection: false,
      timeout: 8_000,
      transports: ["websocket"]
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
    ackP95Under200Ms: ackP95 !== null && ackP95 < 200,
    ackP99Under500Ms: ackP99 !== null && ackP99 < 500,
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
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
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
