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
  broadcastRoom
}) {
  socket.on("game:action", (payload = {}) => {
    const result = handleGameAction(payload.roomCode, socket.user.id, payload.action, io);
    emitResultError(socket, result);
    broadcastOkRoom(io, result, broadcastRoom);
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
