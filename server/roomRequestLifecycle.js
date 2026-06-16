import { GAME_PHASES } from "../src/shared/game.js";
import {
  applyCountingRequest,
  applyCountingResponse,
  applyDrawRequest,
  applyDrawResponse,
  applyScoringAction
} from "./roomScoringFlow.js";

export function createRoomRequestLifecycle({
  rooms,
  validateRoomCode,
  validateActionPoint,
  appendSystem,
  appendNotices,
  broadcastToast,
  scheduleCountingTimeout,
  scheduleDrawTimeout,
  scheduleResultReviewTimeout,
  scheduleRoomClose
}) {
  function requestCounting(roomCode, userId, io) {
    const context = roomActionContext(roomCode, userId, "观战者不能申请数子");
    if (!context.ok) return context;
    const { room, player } = context;
    if (room.game.phase !== GAME_PHASES.playing) return { ok: false, error: "当前不能申请数子" };
    if (room.game.extraTurn) return { ok: false, error: "连下状态中不能申请数子" };
    return applyCountingRequest({
      room,
      player,
      userId,
      appendSystem,
      scheduleCountingTimeout,
      io
    });
  }

  function respondCounting(roomCode, userId, accepted) {
    const context = roomActionContext(roomCode, userId, "观战者不能确认数子");
    if (!context.ok) return context;
    const { room, player } = context;
    if (room.game.phase !== GAME_PHASES.countingRequested) return { ok: false, error: "当前没有数子申请" };
    return applyCountingResponse({ room, player, userId, accepted, appendSystem });
  }

  function requestDraw(roomCode, userId, io) {
    const context = roomActionContext(roomCode, userId, "观战者不能申请和棋");
    if (!context.ok) return context;
    const { room, player } = context;
    if (room.game.phase !== GAME_PHASES.playing) return { ok: false, error: "当前不能申请和棋" };
    if (room.game.extraTurn) return { ok: false, error: "连下状态中不能申请和棋" };
    return applyDrawRequest({
      room,
      player,
      userId,
      appendSystem,
      scheduleDrawTimeout,
      io
    });
  }

  function respondDraw(roomCode, userId, accepted, io) {
    const context = roomActionContext(roomCode, userId, "观战者不能确认和棋");
    if (!context.ok) return context;
    const { room, player } = context;
    if (room.game.phase !== GAME_PHASES.drawRequested) return { ok: false, error: "当前没有和棋申请" };
    return applyDrawResponse({
      room,
      player,
      userId,
      accepted,
      appendSystem,
      broadcastToast,
      scheduleRoomClose,
      io
    });
  }

  function handleScoringAction(roomCode, userId, action, io) {
    const roomContext = roomContextForCode(roomCode);
    if (!roomContext.ok) return roomContext;
    const room = roomContext.room;
    const validationError = validateActionPoint(action, room.game.size);
    if (validationError) return { ok: false, error: validationError };
    const player = playerForUser(room, userId);
    if (!player) return { ok: false, error: "观战者不能确认数子" };

    if (["mark-dead", "mark-neutral", "reset-dead", "confirm-dead"].includes(action.type)) {
      if (room.game.phase !== GAME_PHASES.markingDead) return { ok: false, error: "当前不在死子确认阶段" };
    }
    if (["accept-result", "reject-result"].includes(action.type)) {
      if (room.game.phase !== GAME_PHASES.resultReview) return { ok: false, error: "当前不在结果确认阶段" };
    }

    return applyScoringAction({
      room,
      player,
      userId,
      action,
      appendSystem,
      appendNotices,
      broadcastToast,
      scheduleResultReviewTimeout,
      scheduleRoomClose,
      io
    });
  }

  function roomActionContext(roomCode, userId, spectatorError) {
    const roomContext = roomContextForCode(roomCode);
    if (!roomContext.ok) return roomContext;
    const player = playerForUser(roomContext.room, userId);
    if (!player) return { ok: false, error: spectatorError };
    return { ok: true, room: roomContext.room, player };
  }

  function roomContextForCode(roomCode) {
    const validatedRoomCode = validateRoomCode(roomCode);
    if (!validatedRoomCode.ok) return { ok: false, error: validatedRoomCode.error };
    const room = rooms.get(validatedRoomCode.value);
    if (!room) return { ok: false, error: "房间不存在" };
    return { ok: true, room };
  }

  function playerForUser(room, userId) {
    return room.players.find((player) => player.user.id === userId) ?? null;
  }

  return {
    requestCounting,
    respondCounting,
    requestDraw,
    respondDraw,
    handleScoringAction
  };
}
