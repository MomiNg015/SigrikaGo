const SOCKET_AUTH_EXPIRED_MESSAGE = "\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55";

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
