const SOCKET_AUTH_EXPIRED_MESSAGE = "\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55";

export function registerDuelSocketEvents(socket, {
  refreshSocketUser,
  duelRequests,
  normalizeGameModeId,
  broadcastLobbyStats,
  runtimeServiceState = null,
  metrics = null
}) {
  socket.on("duel:request", async ({ targetUserId, mode: modeInput } = {}) => {
    try {
      if (!admitDuel(socket, runtimeServiceState, metrics)) return;
      await refreshSocketUser(socket);
      await duelRequests.handleRequest(socket, String(targetUserId ?? ""), normalizeGameModeId(modeInput));
    } catch (error) {
      socket.emit("error:toast", SOCKET_AUTH_EXPIRED_MESSAGE);
    }
  });

  socket.on("duel:respond", async ({ requestId, accepted } = {}) => {
    try {
      if (accepted && !admitDuel(socket, runtimeServiceState, metrics)) return;
      await refreshSocketUser(socket);
      await duelRequests.handleResponse(socket, String(requestId ?? ""), Boolean(accepted));
      broadcastLobbyStats();
    } catch (error) {
      socket.emit("error:toast", SOCKET_AUTH_EXPIRED_MESSAGE);
    }
  });
}

function admitDuel(socket, runtimeServiceState, metrics) {
  const admission = runtimeServiceState?.admission?.("match") ?? { ok: true };
  if (admission.ok) return true;
  metrics?.increment?.("admissionRejectedMatches");
  socket.emit("error:toast", admission.error);
  return false;
}
