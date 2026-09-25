const SOCKET_AUTH_EXPIRED_MESSAGE = "\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55";

import { createCharacterSelectionData } from "./playerRoutes.js";
import { resolveTeamLineup } from "./teamMatch.js";

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
  runtimeServiceState = null,
  metrics = null,
  now = Date.now,
  isUserInActiveRoom = () => false,
  characterSelectionData = createCharacterSelectionData({ prisma })
}) {
  let matchAttempt = 0;
  socket.on("match:join", async ({ mode: modeInput, lineup } = {}, ack = () => {}) => {
    const attempt = ++matchAttempt;
    if (typeof ack !== "function") ack = () => {};
    try {
      const admission = runtimeServiceState?.admission?.("match") ?? { ok: true };
      if (!admission.ok) {
        metrics?.increment?.("admissionRejectedMatches");
        socket.emit("error:toast", admission.error);
        ack({ ok: false, error: admission.error });
        return;
      }
      const mode = normalizeGameModeId(modeInput);
      await refreshSocketUser(socket);
      let teamLineup;
      if (mode === "team") {
        if (socket.user.sigrikaCandyArc?.corrupted || isUserInActiveRoom(socket.user.id)) {
          ack({ ok: false, error: "当前无法参加队际赛，请先完成正在进行的对局或剧情" });
          return;
        }
        const result = resolveTeamLineup(socket.user, lineup, await characterSelectionData());
        if (!result.ok) {
          ack(result);
          return;
        }
        teamLineup = result.lineup;
      }
      const blockedCandidateIds = new Set();
      for (const candidate of listWaitingPlayers()) {
        if (mode === "team" && candidate.mode === "team") {
          const waitingSocket = io.sockets?.sockets?.get(candidate.socketId);
          if (!waitingSocket) {
            leaveMatchmaking(candidate.user.id);
            continue;
          }
          if (waitingSocket) {
            try {
              await refreshSocketUser(waitingSocket);
              const result = resolveTeamLineup(waitingSocket.user, candidate.teamLineup.map((entry) => entry.characterId), await characterSelectionData());
              if (!result.ok || waitingSocket.user.sigrikaCandyArc?.corrupted || isUserInActiveRoom(waitingSocket.user.id)) {
                leaveMatchmaking(candidate.user.id);
                waitingSocket.emit("match:left");
                waitingSocket.emit("error:toast", result.error || "阵容已不可用，请重新选择");
                continue;
              }
              candidate.user = waitingSocket.user;
              candidate.teamLineup = result.lineup;
            } catch {
              leaveMatchmaking(candidate.user.id);
              waitingSocket.emit("match:left");
              waitingSocket.emit("error:toast", SOCKET_AUTH_EXPIRED_MESSAGE);
              continue;
            }
          }
        }
        if (await hasBlacklistBetween({
          prisma,
          firstUserId: socket.user.id,
          secondUserId: candidate.user.id
        })) {
          blockedCandidateIds.add(candidate.user.id);
        }
      }
      if (attempt !== matchAttempt || socket.connected === false) {
        ack({ ok: true, cancelled: true });
        return;
      }
      const room = joinMatchmaking(
        { user: socket.user, socketId: socket.id, mode, ...(teamLineup ? { teamLineup } : {}) },
        io,
        { canPair: (candidate) => !blockedCandidateIds.has(candidate.user.id) }
      );
      if (!room) socket.emit("match:waiting", { startedAt: now(), mode });
      broadcastLobbyStats();
      ack({ ok: true });
    } catch (error) {
      socket.emit("error:toast", SOCKET_AUTH_EXPIRED_MESSAGE);
      ack({ ok: false, error: SOCKET_AUTH_EXPIRED_MESSAGE });
    }
  });

  socket.on("match:leave", () => {
    matchAttempt += 1;
    leaveMatchmaking(socket.user.id);
    socket.emit("match:left");
    broadcastLobbyStats();
  });
}
