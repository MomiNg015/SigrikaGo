export const LOBBY_STATS_BROADCAST_DEBOUNCE_MS = 100;

export function createLobbyStatsBroadcaster({
  io,
  getStats,
  delayMs = LOBBY_STATS_BROADCAST_DEBOUNCE_MS,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  metrics = null
}) {
  let timerId = null;
  let closed = false;
  let lastPayload = null;

  function schedule() {
    if (closed) return false;
    metrics?.increment?.("lobbyStatsBroadcastRequests");
    if (timerId !== null) return false;
    timerId = setTimeoutFn(flush, delayMs);
    return true;
  }

  function flush() {
    if (timerId !== null) {
      clearTimeoutFn(timerId);
      timerId = null;
    }
    if (closed) return false;
    const payload = getStats();
    if (sameLobbyStats(lastPayload, payload)) return false;
    lastPayload = cloneLobbyStats(payload);
    io.emit("lobby:stats", payload);
    metrics?.increment?.("lobbyStatsBroadcastEmissions");
    return true;
  }

  function close() {
    closed = true;
    if (timerId !== null) clearTimeoutFn(timerId);
    timerId = null;
  }

  return { close, flush, schedule };
}

function sameLobbyStats(previous, next) {
  if (!previous || !next) return false;
  if (Number(previous.onlineCount ?? 0) !== Number(next.onlineCount ?? 0)) return false;
  if (Number(previous.matchmakingCount ?? 0) !== Number(next.matchmakingCount ?? 0)) return false;
  const previousModes = previous.matchmakingCounts ?? {};
  const nextModes = next.matchmakingCounts ?? {};
  const keys = new Set([...Object.keys(previousModes), ...Object.keys(nextModes)]);
  return [...keys].every((key) => Number(previousModes[key] ?? 0) === Number(nextModes[key] ?? 0));
}

function cloneLobbyStats(stats = {}) {
  return {
    onlineCount: Number(stats.onlineCount ?? 0),
    matchmakingCount: Number(stats.matchmakingCount ?? 0),
    matchmakingCounts: { ...(stats.matchmakingCounts ?? {}) }
  };
}
