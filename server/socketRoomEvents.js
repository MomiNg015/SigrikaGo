const ROOM_NOT_AVAILABLE_MESSAGE = "\u623f\u95f4\u4e0d\u5b58\u5728\u6216\u5df2\u7ecf\u5173\u95ed";

export function registerRoomSocketEvents(socket, {
  io,
  prisma,
  validateRoomCode,
  validateOptionalRoomCode,
  attachSocketToRoom,
  leaveRoom,
  findRoomForUser,
  resumePayloadForUser,
  roomView,
  broadcastRoom,
  broadcastRoomPresencePatch = broadcastRoom,
  markRoomPreloadReady = () => null,
  metrics = null
}) {
  socket.on("room:join", ({ roomCode } = {}) => {
    const validatedRoomCode = validateRoomCode(roomCode);
    if (!validatedRoomCode.ok) {
      socket.emit("error:toast", validatedRoomCode.error);
      return;
    }
    const room = attachSocketToRoom(validatedRoomCode.value, socket, socket.user);
    if (!room) {
      socket.emit("error:toast", ROOM_NOT_AVAILABLE_MESSAGE);
      return;
    }
    socket.emit("room:update", roomView(room, socket.user.id));
    broadcastRoomPresencePatch(io, room);
  });

  socket.on("room:leave", ({ roomCode } = {}) => {
    const room = leaveRoom(roomCode, socket.user.id, socket.id);
    if (!room) return;
    socket.leave(room.code);
    socket.emit("room:left", { roomCode: room.code });
    broadcastRoomPresencePatch(io, room);
  });

  socket.on("room:resume", async ({ roomCode, resumeReason } = {}) => {
    metrics?.increment?.("roomResumeAttempts");
    if (resumeReason === "patch-gap") metrics?.increment?.("roomResumePatchGapRequests");
    if (resumeReason === "socket-connect") metrics?.increment?.("roomResumeSocketConnectRequests");
    if (resumeReason === "initial-connect") metrics?.increment?.("roomResumeInitialConnectRequests");
    const payload = await resumePayloadForUser({
      prisma,
      userId: socket.user.id,
      roomCode: validateOptionalRoomCode(roomCode),
      findRoomForUser,
      roomView
    });
    if (payload.type === "room") {
      const room = attachSocketToRoom(payload.room.code, socket, socket.user);
      if (room) {
        metrics?.increment?.("roomResumeSuccesses");
        socket.emit("room:update", roomView(room, socket.user.id));
        broadcastRoomPresencePatch(io, room);
        return;
      }
    }
    metrics?.increment?.("roomResumeMisses");
    socket.emit("room:resume", payload);
  });

  socket.on("room:preload-ready", ({ roomCode } = {}, ack) => {
    const validatedRoomCode = validateRoomCode(roomCode);
    if (!validatedRoomCode.ok) {
      socket.emit("error:toast", validatedRoomCode.error);
      acknowledgePreloadReady(ack, { ok: false, error: validatedRoomCode.error });
      return;
    }
    const room = markRoomPreloadReady(validatedRoomCode.value, socket.user.id, io)
      ?? findRoomForUser?.(socket.user.id, validatedRoomCode.value)
      ?? null;
    if (!room) {
      acknowledgePreloadReady(ack, {
        ok: false,
        error: ROOM_NOT_AVAILABLE_MESSAGE,
        roomCode: validatedRoomCode.value
      });
      return;
    }
    acknowledgePreloadReady(ack, {
      ok: true,
      roomCode: validatedRoomCode.value,
      phase: room.game?.phase ?? null,
      readyCount: Number(room.preload?.readyCount ?? 0),
      requiredCount: Number(room.preload?.requiredCount ?? room.players?.length ?? 0)
    });
  });
}

function acknowledgePreloadReady(ack, payload) {
  if (typeof ack === "function") ack(payload);
}
