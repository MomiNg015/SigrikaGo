import { SIGRIKA_CANDY_PHASES } from "../src/shared/sigrikaCandyArc.js";
import {
  markSigrikaCandyDuelStarted,
  recoverMissingSigrikaCandyDuel
} from "./sigrikaCandyArc.js";

export function registerSigrikaCandySocketEvents(socket, {
  io,
  prisma,
  refreshSocketUser,
  createSigrikaCandyDuelRoom,
  findRoomForUser,
  attachSocketToRoom,
  roomView,
  leaveMatchmaking,
  broadcastLobbyStats = () => {},
  runtimeServiceState = null,
  metrics = null
}) {
  socket.on("sigrika-candy:duel-start", async (_payload = {}, acknowledge) => {
    const admission = runtimeServiceState?.admission?.("match") ?? { ok: true };
    if (!admission.ok) {
      metrics?.increment?.("admissionRejectedMatches");
      acknowledge?.({ ok: false, error: admission.error, code: "capacity_reached" });
      return;
    }
    try {
      await refreshSocketUser(socket);
      const phase = socket.user.sigrikaCandyArc?.phase;
      if (phase === SIGRIKA_CANDY_PHASES.duelActive) {
        const existing = findRoomForUser(socket.user.id, socket.user.sigrikaCandyArc?.roomCode);
        if (!existing?.sigrikaCandyDuel) {
          const updatedUser = await recoverMissingSigrikaCandyDuel({
            prisma,
            userId: socket.user.id,
            roomCode: socket.user.sigrikaCandyArc?.roomCode
          });
          const recoveredArc = updatedUser.sigrikaCandyArc;
          socket.user = { ...socket.user, sigrikaCandyArc: recoveredArc };
          if (recoveredArc?.phase !== SIGRIKA_CANDY_PHASES.awaitingDuel) {
            acknowledge?.({
              ok: false,
              error: "特殊对局状态已更新，请重试",
              code: "special_phase_changed",
              sigrikaCandyArc: recoveredArc
            });
            return;
          }
          acknowledge?.({
            ok: false,
            error: "上次特殊对局已失效，状态已恢复，请再次点击开始决战",
            code: "special_room_reset",
            sigrikaCandyArc: recoveredArc
          });
          return;
        }
        attachSocketToRoom(existing.code, socket, socket.user);
        io.to(socket.id).emit("match:found", roomView(existing, socket.user.id));
        acknowledge?.({ ok: true, roomCode: existing.code, resumed: true });
        return;
      }
      if (phase !== SIGRIKA_CANDY_PHASES.awaitingDuel) {
        acknowledge?.({ ok: false, error: "当前不能开始这场对局", code: "invalid_special_phase" });
        return;
      }
      leaveMatchmaking(socket.user.id);
      const room = createSigrikaCandyDuelRoom({ user: socket.user, socketId: socket.id, mode: "spark" }, io);
      const updatedUser = await markSigrikaCandyDuelStarted({ prisma, userId: socket.user.id, roomCode: room.code });
      socket.user = { ...socket.user, ...updatedUser };
      const human = room.players.find((player) => player.user.id === socket.user.id);
      if (human) human.user = { ...human.user, ...updatedUser, selectedCharacter: null, characterConfig: null };
      acknowledge?.({ ok: true, roomCode: room.code });
      broadcastLobbyStats();
    } catch {
      acknowledge?.({ ok: false, error: "登录状态已失效，请重新登录", code: "auth_expired" });
    }
  });
}
