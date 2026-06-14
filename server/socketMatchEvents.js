const SOCKET_AUTH_EXPIRED_MESSAGE = "鐧诲綍鐘舵€佸凡澶辨晥锛岃閲嶆柊鐧诲綍";

export function registerMatchSocketEvents(socket, {
  io,
  prisma,
  refreshSocketUser,
  listWaitingPlayers,
  hasBlacklistBetween,
  joinMatchmaking,
  leaveMatchmaking,
  broadcastLobbyStats,
  normalizeGameModeId,
  now = Date.now
}) {
  socket.on("match:join", async ({ mode: modeInput } = {}) => {
    try {
      const mode = normalizeGameModeId(modeInput);
      await refreshSocketUser(socket);
      const blockedCandidateIds = new Set();
      for (const candidate of listWaitingPlayers()) {
        if (await hasBlacklistBetween({
          prisma,
          firstUserId: socket.user.id,
          secondUserId: candidate.user.id
        })) {
          blockedCandidateIds.add(candidate.user.id);
        }
      }
      const room = joinMatchmaking(
        { user: socket.user, socketId: socket.id, mode },
        io,
        { canPair: (candidate) => !blockedCandidateIds.has(candidate.user.id) }
      );
      if (!room) socket.emit("match:waiting", { startedAt: now(), mode });
      broadcastLobbyStats();
    } catch (error) {
      socket.emit("error:toast", SOCKET_AUTH_EXPIRED_MESSAGE);
    }
  });

  socket.on("match:leave", () => {
    leaveMatchmaking(socket.user.id);
    socket.emit("match:left");
    broadcastLobbyStats();
  });
}
