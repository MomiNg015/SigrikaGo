import { GAME_PHASES } from "../src/shared/game.js";
import {
  SIGRIKA_CANDY_DUEL_AVAILABILITY,
  SIGRIKA_CANDY_PHASES,
  isSigrikaCandyCorruptedPhase
} from "../src/shared/sigrikaCandyArc.js";
import {
  markSigrikaCandyDuelStarted,
  recoverMissingSigrikaCandyDuel
} from "./sigrikaCandyArc.js";

export function registerSigrikaCandySocketEvents(socket, {
  io,
  prisma,
  refreshSocketUser,
  createSigrikaCandyDuelRoom,
  findActiveSigrikaCandyDuel = () => null,
  findRoomForUser,
  attachSocketToRoom,
  roomView,
  broadcastRoomPresencePatch = () => {},
  leaveMatchmaking,
  broadcastLobbyStats = () => {},
  runtimeServiceState = null,
  metrics = null
}) {
  socket.on("sigrika-candy:duel-status", async (_payload = {}, acknowledge) => {
    try {
      await refreshSocketUser(socket);
      if (!canAccessSigrikaCandyDuel(socket.user)) {
        acknowledge?.({ ok: false, error: "当前不能查看这场对局", code: "invalid_special_phase" });
        return;
      }
      acknowledge?.({
        ok: true,
        status: activeDuelAvailability(findActiveSigrikaCandyDuel(), socket.user.id)
      });
    } catch {
      acknowledge?.({ ok: false, error: "登录状态已失效，请重新登录", code: "auth_expired" });
    }
  });

  socket.on("sigrika-candy:duel-watch", async (_payload = {}, acknowledge) => {
    try {
      await refreshSocketUser(socket);
      if (!canAccessSigrikaCandyDuel(socket.user)) {
        acknowledge?.({ ok: false, error: "当前不能查看这场对局", code: "invalid_special_phase" });
        return;
      }
      const room = findActiveSigrikaCandyDuel();
      if (!room) {
        acknowledge?.({
          ok: false,
          error: "这盘决战已经结束了。",
          code: "special_watch_ended",
          status: SIGRIKA_CANDY_DUEL_AVAILABILITY.available
        });
        return;
      }
      if (room.sigrikaCandyDuel?.ownerUserId === socket.user.id) {
        acknowledge?.({
          ok: false,
          error: "这是你正在进行的决战，请继续对局",
          code: "special_duel_owned",
          status: SIGRIKA_CANDY_DUEL_AVAILABILITY.owned
        });
        return;
      }
      const admission = runtimeServiceState?.admission?.("spectator", {
        room,
        userId: socket.user.id
      }) ?? { ok: true };
      if (!admission.ok) {
        metrics?.increment?.("admissionRejectedSpectators");
        acknowledge?.({ ok: false, error: admission.error, code: admission.code });
        return;
      }
      const attachedRoom = attachSocketToRoom(room.code, socket, socket.user, {
        allowSigrikaCandySpectator: true
      });
      if (!attachedRoom) {
        acknowledge?.({ ok: false, error: "当前房间观战席已满，请稍后再试", code: "room_spectator_capacity" });
        return;
      }
      socket.emit("room:update", roomView(attachedRoom, socket.user.id));
      broadcastRoomPresencePatch(io, attachedRoom);
      acknowledge?.({ ok: true, roomCode: attachedRoom.code });
    } catch {
      acknowledge?.({ ok: false, error: "登录状态已失效，请重新登录", code: "auth_expired" });
    }
  });

  socket.on("sigrika-candy:duel-start", async (_payload = {}, acknowledge) => {
    try {
      await refreshSocketUser(socket);
      const phase = socket.user.sigrikaCandyArc?.phase;
      if (phase === SIGRIKA_CANDY_PHASES.duelActive) {
        const existing = findRoomForUser(socket.user.id, socket.user.sigrikaCandyArc?.roomCode);
        if (!existing?.sigrikaCandyDuel || existing.game?.phase === GAME_PHASES.finished) {
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
      const activeDuel = findActiveSigrikaCandyDuel();
      if (activeDuel) {
        if (activeDuel.sigrikaCandyDuel?.ownerUserId === socket.user.id) {
          attachSocketToRoom(activeDuel.code, socket, socket.user);
          io.to(socket.id).emit("match:found", roomView(activeDuel, socket.user.id));
          acknowledge?.({ ok: true, roomCode: activeDuel.code, resumed: true });
          return;
        }
        acknowledge?.({
          ok: false,
          error: "西格莉卡？已经开始和别人对局了。",
          code: "special_duel_occupied",
          status: SIGRIKA_CANDY_DUEL_AVAILABILITY.occupied
        });
        return;
      }
      const admission = runtimeServiceState?.admission?.("match") ?? { ok: true };
      if (!admission.ok) {
        metrics?.increment?.("admissionRejectedMatches");
        acknowledge?.({ ok: false, error: admission.error, code: "capacity_reached" });
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

function canAccessSigrikaCandyDuel(user) {
  return isSigrikaCandyCorruptedPhase(user?.sigrikaCandyArc?.phase);
}

function activeDuelAvailability(room, userId) {
  if (!room) return SIGRIKA_CANDY_DUEL_AVAILABILITY.available;
  return room.sigrikaCandyDuel?.ownerUserId === userId
    ? SIGRIKA_CANDY_DUEL_AVAILABILITY.owned
    : SIGRIKA_CANDY_DUEL_AVAILABILITY.occupied;
}
