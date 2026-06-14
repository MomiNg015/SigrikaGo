const SOCKET_AUTH_EXPIRED_MESSAGE = "鐧诲綍鐘舵€佸凡澶辨晥锛岃閲嶆柊鐧诲綍";

export function registerDuelSocketEvents(socket, {
  refreshSocketUser,
  duelRequests,
  normalizeGameModeId,
  broadcastLobbyStats
}) {
  socket.on("duel:request", async ({ targetUserId, mode: modeInput } = {}) => {
    try {
      await refreshSocketUser(socket);
      await duelRequests.handleRequest(socket, String(targetUserId ?? ""), normalizeGameModeId(modeInput));
    } catch (error) {
      socket.emit("error:toast", SOCKET_AUTH_EXPIRED_MESSAGE);
    }
  });

  socket.on("duel:respond", async ({ requestId, accepted } = {}) => {
    try {
      await refreshSocketUser(socket);
      await duelRequests.handleResponse(socket, String(requestId ?? ""), Boolean(accepted));
      broadcastLobbyStats();
    } catch (error) {
      socket.emit("error:toast", SOCKET_AUTH_EXPIRED_MESSAGE);
    }
  });
}
