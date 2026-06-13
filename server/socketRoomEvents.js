const ROOM_NOT_AVAILABLE_MESSAGE = "鎴块棿涓嶅瓨鍦ㄦ垨宸茬粡鍏抽棴";

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
  broadcastRoom
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
    broadcastRoom(io, room);
  });

  socket.on("room:leave", ({ roomCode } = {}) => {
    const room = leaveRoom(roomCode, socket.user.id, socket.id);
    if (!room) return;
    socket.leave(room.code);
    socket.emit("room:left", { roomCode: room.code });
    broadcastRoom(io, room);
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
        broadcastRoom(io, room);
        return;
      }
    }
    socket.emit("room:resume", payload);
  });
}
