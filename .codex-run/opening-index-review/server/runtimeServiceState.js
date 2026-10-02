import { monitorEventLoopDelay, performance } from "node:perf_hooks";

export const DEFAULT_MAX_ONLINE_USERS = 500;
export const DEFAULT_MAX_ACTIVE_ROOMS = 100;
export const DEFAULT_MAX_SPECTATORS_PER_ROOM = 20;

export function runtimeCapacityLimits(env = process.env) {
  return {
    maxOnlineUsers: positiveInteger(env.MAX_ONLINE_USERS, DEFAULT_MAX_ONLINE_USERS),
    maxActiveRooms: positiveInteger(env.MAX_ACTIVE_ROOMS, DEFAULT_MAX_ACTIVE_ROOMS),
    maxSpectatorsPerRoom: positiveInteger(
      env.MAX_SPECTATORS_PER_ROOM,
      DEFAULT_MAX_SPECTATORS_PER_ROOM
    )
  };
}

export function createRuntimeServiceState({
  env = process.env,
  now = Date.now,
  onlineCount = () => 0,
  activeRoomCount = () => 0,
  spectatorCount = () => 0,
  matchmakingCount = () => 0,
  persistenceStats = () => ({ pendingRooms: 0 }),
  performanceMetrics = createRuntimePerformanceMetrics()
} = {}) {
  const limits = runtimeCapacityLimits(env);
  let draining = false;
  let drainReason = "";
  let drainStartedAt = null;

  function beginDrain(reason = "server-shutdown") {
    if (draining) return false;
    draining = true;
    drainReason = String(reason || "server-shutdown");
    drainStartedAt = new Date(now()).toISOString();
    return true;
  }

  function admission(kind = "match", context = {}) {
    if (draining) {
      return rejection("server_draining", "服务器正在维护，暂时不能开始新的操作");
    }
    if (kind === "spectator") {
      const roomAdmission = roomSpectatorAdmission(context.room, context.userId, limits);
      if (!roomAdmission.ok) return roomAdmission;
      if (roomAdmission.existing) return { ok: true };
    }
    const currentOnline = safeCount(onlineCount);
    const currentRooms = safeCount(activeRoomCount);
    if (currentRooms >= limits.maxActiveRooms) {
      return rejection("active_room_capacity", kind === "spectator"
        ? "当前观战席繁忙，请稍后再试"
        : "当前对局人数较多，请稍后再匹配");
    }
    if (currentOnline >= limits.maxOnlineUsers) {
      return rejection("online_capacity", kind === "spectator"
        ? "当前观战席繁忙，请稍后再试"
        : "当前在线人数较多，请稍后再匹配");
    }
    return { ok: true };
  }

  function snapshot() {
    return {
      draining,
      drainReason: draining ? drainReason : null,
      drainStartedAt,
      limits,
      current: {
        onlineUsers: safeCount(onlineCount),
        activeRooms: safeCount(activeRoomCount),
        spectators: safeCount(spectatorCount),
        matchmakingUsers: safeCount(matchmakingCount),
        ...safePersistenceStats(persistenceStats)
      },
      process: performanceMetrics.snapshot()
    };
  }

  return {
    admission,
    beginDrain,
    close: () => performanceMetrics.close?.(),
    isDraining: () => draining,
    readiness: () => ({
      ok: !draining,
      status: draining ? "draining" : "ready",
      ...(draining ? { reason: drainReason, startedAt: drainStartedAt } : {})
    }),
    snapshot
  };
}

export function roomSpectatorAdmission(room, userId, {
  maxSpectatorsPerRoom = DEFAULT_MAX_SPECTATORS_PER_ROOM
} = {}) {
  if (!room) return { ok: true };
  const spectators = Array.isArray(room.spectators) ? room.spectators : [];
  if (spectators.some((spectator) => spectator?.user?.id === userId)) {
    return { ok: true, existing: true };
  }
  if (spectators.length >= maxSpectatorsPerRoom) {
    return rejection("room_spectator_capacity", "当前房间观战席已满，请稍后再试");
  }
  return { ok: true };
}

export function createRuntimePerformanceMetrics({
  processLike = process,
  performanceLike = performance,
  histogram = monitorEventLoopDelay({ resolution: 20 })
} = {}) {
  histogram.enable?.();
  let previousUtilization = performanceLike.eventLoopUtilization?.();
  let previousCpuUsage = processLike.cpuUsage?.();
  let previousCpuMeasuredAt = performanceLike.now?.() ?? 0;

  function snapshot() {
    const memory = processLike.memoryUsage?.() ?? {};
    const utilization = performanceLike.eventLoopUtilization?.(previousUtilization) ?? null;
    const measuredAt = performanceLike.now?.() ?? previousCpuMeasuredAt;
    const cpuDelta = previousCpuUsage ? processLike.cpuUsage?.(previousCpuUsage) : null;
    const elapsedMs = Math.max(0, measuredAt - previousCpuMeasuredAt);
    if (utilization) previousUtilization = performanceLike.eventLoopUtilization?.();
    if (processLike.cpuUsage) previousCpuUsage = processLike.cpuUsage();
    previousCpuMeasuredAt = measuredAt;
    return {
      uptimeSeconds: Number(processLike.uptime?.() ?? 0),
      rssBytes: Number(memory.rss ?? 0),
      heapUsedBytes: Number(memory.heapUsed ?? 0),
      heapTotalBytes: Number(memory.heapTotal ?? 0),
      externalBytes: Number(memory.external ?? 0),
      cpuPercent: cpuDelta && elapsedMs > 0
        ? ((Number(cpuDelta.user ?? 0) + Number(cpuDelta.system ?? 0)) / 1000 / elapsedMs) * 100
        : null,
      eventLoopDelayP95Ms: nanosecondsToMs(histogram.percentile?.(95) ?? 0),
      eventLoopDelayMaxMs: nanosecondsToMs(histogram.max ?? 0),
      eventLoopUtilization: utilization ? Number(utilization.utilization ?? 0) : null
    };
  }

  return {
    close: () => histogram.disable?.(),
    snapshot
  };
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function safeCount(getValue) {
  try {
    const value = Number(getValue?.() ?? 0);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

function safePersistenceStats(getStats) {
  try {
    const stats = getStats?.() ?? {};
    return { pendingPersistenceRooms: safeNonNegative(stats.pendingRooms) };
  } catch {
    return { pendingPersistenceRooms: 0 };
  }
}

function safeNonNegative(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function rejection(code, error) {
  return { ok: false, code, error };
}

function nanosecondsToMs(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number / 1_000_000 : 0;
}
