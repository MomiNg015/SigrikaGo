import {
  findRoomActionReceipt,
  normalizeActionId,
  storeRoomActionReceipt
} from "./roomActionReceipts.js";

function emitResultError(socket, result) {
  if (!result.ok) socket.emit("error:toast", result.error);
}

function broadcastOkRoom(io, result, broadcastRoom) {
  if (result.ok) broadcastRoom(io, result.room);
}

export function registerGameSocketEvents(socket, {
  io,
  handleGameAction,
  requestCounting,
  respondCounting,
  requestDraw,
  respondDraw,
  handleScoringAction,
  broadcastRoom,
  getRoom = () => null,
  metrics = null,
  now = Date.now
}) {
  socket.on("game:action", (payload = {}, acknowledge) => {
    const startedAt = now();
    metrics?.increment?.("gameActionAttempts");
    const actionId = normalizeActionId(payload.actionId);
    if (actionId === null) {
      const response = actionAcknowledgement({
        ok: false,
        actionId: "",
        roomCode: payload.roomCode,
        error: "对局操作标识无效",
        code: "invalid_action_id"
      });
      socket.emit("error:toast", response.error);
      acknowledge?.(response);
      metrics?.increment?.("gameActionAckFailures");
      metrics?.observe?.("gameActionAckLatencyMs", now() - startedAt);
      return;
    }

    const currentRoom = getRoom(payload.roomCode);
    const existingReceipt = actionId
      ? findRoomActionReceipt(currentRoom, socket.user.id, actionId)
      : null;
    if (existingReceipt) {
      metrics?.increment?.("gameActionDuplicateAcks");
      acknowledge?.(existingReceipt);
      metrics?.observe?.("gameActionAckLatencyMs", now() - startedAt);
      return;
    }

    const result = handleGameAction(payload.roomCode, socket.user.id, payload.action, io);
    emitResultError(socket, result);
    const receiptRoom = result.room ?? currentRoom;
    const response = actionAcknowledgement({
      ok: result.ok,
      actionId,
      roomCode: payload.roomCode,
      revision: receiptRoom?.revision,
      error: result.error
    });
    if (actionId && receiptRoom) {
      storeRoomActionReceipt(receiptRoom, socket.user.id, response);
    }
    broadcastOkRoom(io, result, broadcastRoom);
    acknowledge?.(response);
    metrics?.increment?.(result.ok ? "gameActionAckSuccesses" : "gameActionAckFailures");
    metrics?.observe?.("gameActionAckLatencyMs", now() - startedAt);
  });

  socket.on("counting:request", ({ roomCode } = {}) => {
    const result = requestCounting(roomCode, socket.user.id, io);
    emitResultError(socket, result);
    broadcastOkRoom(io, result, broadcastRoom);
  });

  socket.on("counting:respond", ({ roomCode, accepted } = {}) => {
    const result = respondCounting(roomCode, socket.user.id, accepted);
    emitResultError(socket, result);
    broadcastOkRoom(io, result, broadcastRoom);
  });

  socket.on("draw:request", ({ roomCode } = {}) => {
    const result = requestDraw(roomCode, socket.user.id, io);
    emitResultError(socket, result);
    broadcastOkRoom(io, result, broadcastRoom);
  });

  socket.on("draw:respond", ({ roomCode, accepted } = {}) => {
    const result = respondDraw(roomCode, socket.user.id, accepted, io);
    emitResultError(socket, result);
    broadcastOkRoom(io, result, broadcastRoom);
  });

  socket.on("scoring:action", (payload = {}) => {
    const result = handleScoringAction(payload.roomCode, socket.user.id, payload.action, io);
    emitResultError(socket, result);
    broadcastOkRoom(io, result, broadcastRoom);
  });
}

function actionAcknowledgement({ ok, actionId = "", roomCode = "", revision = 0, error = "", code = "" }) {
  return {
    ok: ok === true,
    actionId: String(actionId ?? ""),
    roomCode: String(roomCode ?? ""),
    revision: Number(revision ?? 0),
    ...(error ? { error: String(error) } : {}),
    ...(code ? { code: String(code) } : {})
  };
}
