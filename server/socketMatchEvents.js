const SOCKET_AUTH_EXPIRED_MESSAGE = "\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55";

import { createCharacterSelectionData } from "./playerRoutes.js";
import { resolveMatchCharacter } from "./matchCharacterSelection.js";
import { resolveTeamLineup } from "./teamMatch.js";
import { MATCH_EXPANSION_DELAY_MS } from "../src/shared/matchClassification.js";

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
  let expansionTimer = null;
  const clearExpansionTimer = () => {
    clearTimeout(expansionTimer);
    expansionTimer = null;
  };
  const isQueued = () => listWaitingPlayers().some((entry) => entry.user.id === socket.user.id && entry.socketId === socket.id);
  async function join({ mode: modeInput, lineup, characterId } = {}, ack = () => {}, retry = false) {
    if (retry && !isQueued()) return;
    clearExpansionTimer();
    const attempt = ++matchAttempt;
    if (typeof ack !== "function") ack = () => {};
    try {
      const admission = runtimeServiceState?.admission?.("match") ?? { ok: true };
      if (!admission.ok) {
        if (retry) {
          leaveMatchmaking(socket.user.id);
          socket.emit("match:left");
          broadcastLobbyStats();
        }
        metrics?.increment?.("admissionRejectedMatches");
        socket.emit("error:toast", admission.error);
        ack({ ok: false, error: admission.error });
        return;
      }
      const mode = normalizeGameModeId(modeInput);
      await refreshSocketUser(socket);
      if (isUserInActiveRoom(socket.user.id)) {
        leaveMatchmaking(socket.user.id);
        socket.emit("match:left");
        ack({ ok: false, error: "你已有进行中的对局", code: "active_room_exists" });
        return;
      }
      let matchUser = socket.user;
      if (mode !== "team" && characterId != null) {
        const result = resolveMatchCharacter(socket.user, characterId, await characterSelectionData());
        if (!result.ok) {
          if (attempt === matchAttempt && isQueued()) {
            leaveMatchmaking(socket.user.id);
            socket.emit("match:left");
            broadcastLobbyStats();
          }
          if (retry && attempt === matchAttempt) socket.emit("error:toast", result.error);
          ack(result);
          return;
        }
        matchUser = result.user;
      }
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
        if (isUserInActiveRoom(candidate.user.id)) {
          leaveMatchmaking(candidate.user.id);
          continue;
        }
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
        if (mode !== "team" && candidate.mode === mode && candidate.characterId != null
          && candidate.user.id !== socket.user.id) {
          const waitingSocket = io.sockets?.sockets?.get(candidate.socketId);
          if (!waitingSocket || waitingSocket.connected === false) {
            leaveMatchmaking(candidate.user.id);
            blockedCandidateIds.add(candidate.user.id);
            broadcastLobbyStats();
            continue;
          }
          try {
            await refreshSocketUser(waitingSocket);
            const selectionData = await characterSelectionData();
            if (attempt !== matchAttempt || socket.connected === false) {
              ack({ ok: true, cancelled: true });
              return;
            }
            if (!listWaitingPlayers().includes(candidate)) continue;
            const result = resolveMatchCharacter(waitingSocket.user, candidate.characterId, selectionData);
            if (!result.ok || waitingSocket.connected === false || isUserInActiveRoom(waitingSocket.user.id)) {
              leaveMatchmaking(candidate.user.id);
              blockedCandidateIds.add(candidate.user.id);
              waitingSocket.emit("match:left");
              waitingSocket.emit("error:toast", result.error || "所选角色不可用，请重新选择");
              broadcastLobbyStats();
              continue;
            }
            candidate.user = result.user;
          } catch {
            if (attempt !== matchAttempt || socket.connected === false) {
              ack({ ok: true, cancelled: true });
              return;
            }
            if (!listWaitingPlayers().includes(candidate)) continue;
            leaveMatchmaking(candidate.user.id);
            blockedCandidateIds.add(candidate.user.id);
            waitingSocket.emit("match:left");
            waitingSocket.emit("error:toast", SOCKET_AUTH_EXPIRED_MESSAGE);
            broadcastLobbyStats();
            continue;
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
      if (attempt !== matchAttempt || socket.connected === false || (retry && !isQueued())) {
        ack({ ok: true, cancelled: true });
        return;
      }
      if (isUserInActiveRoom(socket.user.id)) {
        leaveMatchmaking(socket.user.id);
        socket.emit("match:left");
        ack({ ok: false, error: "你已有进行中的对局", code: "active_room_exists" });
        return;
      }
      const room = joinMatchmaking(
        { user: matchUser, socketId: socket.id, mode, ...(teamLineup ? { teamLineup } : {}),
          ...(mode !== "team" && characterId != null ? { characterId: matchUser.selectedCharacter } : {}) },
        io,
        { canPair: (candidate) => !blockedCandidateIds.has(candidate.user.id) && !isUserInActiveRoom(candidate.user.id) }
      );
      if (!room) {
        const queued = listWaitingPlayers().find((entry) => entry.user.id === socket.user.id);
        const startedAt = queued?.queuedAt ?? now();
        socket.emit("match:waiting", { startedAt, serverNow: now(), mode });
        if (!retry && mode !== "team") {
          expansionTimer = setTimeout(() => { void join({ mode, lineup, characterId }, () => {}, true); }, Math.max(0, MATCH_EXPANSION_DELAY_MS - (now() - startedAt)));
          expansionTimer.unref?.();
        }
      }
      broadcastLobbyStats();
      ack({ ok: true });
    } catch (error) {
      if (retry && attempt === matchAttempt) {
        leaveMatchmaking(socket.user.id);
        socket.emit("match:left");
        broadcastLobbyStats();
      }
      const message = error.code === "active_room_exists" ? error.message : SOCKET_AUTH_EXPIRED_MESSAGE;
      socket.emit("error:toast", message);
      ack({ ok: false, error: message, ...(error.code ? { code: error.code } : {}) });
    }
  }
  socket.on("match:join", (payload, ack) => join(payload, ack));

  socket.on("match:leave", () => {
    matchAttempt += 1;
    clearExpansionTimer();
    leaveMatchmaking(socket.user.id);
    socket.emit("match:left");
    broadcastLobbyStats();
  });
  socket.on("disconnect", () => {
    matchAttempt += 1;
    clearExpansionTimer();
  });
}
