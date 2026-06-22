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
  markRoomPreloadReady = () => null
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

  socket.on("room:resume", async ({ roomCode } = {}) => {
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
        socket.emit("room:update", roomView(room, socket.user.id));
        broadcastRoomPresencePatch(io, room);
        return;
      }
    }
    socket.emit("room:resume", payload);
  });

  socket.on("room:preload-ready", ({ roomCode } = {}) => {
    const validatedRoomCode = validateRoomCode(roomCode);
    if (!validatedRoomCode.ok) {
      socket.emit("error:toast", validatedRoomCode.error);
      return;
    }
    markRoomPreloadReady(validatedRoomCode.value, socket.user.id, io);
  });
}
