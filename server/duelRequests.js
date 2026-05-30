export function createDuelRequestManager({
  io,
  isUserInActiveRoom,
  firstOnlineSocket,
  statusForUser,
  toSocialUser,
  createDirectRoom,
  refreshSocketUser,
  isDuelBlocked = async () => false,
  randomId = () => crypto.randomUUID(),
  now = () => Date.now(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  expiresMs = 20000,
  blockedRejectDelayMs = 3000
}) {
  const pending = new Map();

  async function handleRequest(socket, targetUserId) {
    if (!targetUserId || targetUserId === socket.user.id) {
      socket.emit("error:toast", "不能向自己申请对局");
      return;
    }
    if (isUserInActiveRoom(socket.user.id)) {
      socket.emit("error:toast", "你正在对局中，无法申请对局。");
      return;
    }
    if (isUserInActiveRoom(targetUserId)) {
      socket.emit("duel:unavailable", { targetUserId, reason: "playing" });
      socket.emit("error:toast", "对方正在对局中。");
      return;
    }
    const targetSocket = firstOnlineSocket(targetUserId);
    if (!targetSocket) {
      socket.emit("duel:unavailable", { targetUserId, reason: "offline" });
      socket.emit("error:toast", "对方不在线。");
      return;
    }
    const requestId = randomId();
    if (await isDuelBlocked(socket.user.id, targetUserId)) {
      setTimer(() => {
        socket.emit("duel:rejected", { requestId, username: targetSocket.user.username });
      }, blockedRejectDelayMs);
      return;
    }
    const expiresAt = now() + expiresMs;
    const request = {
      id: requestId,
      fromSocketId: socket.id,
      targetSocketId: targetSocket.id,
      fromUser: socket.user,
      targetUser: targetSocket.user,
      timerId: setTimer(() => expireRequest(requestId), expiresMs)
    };
    pending.set(requestId, request);
    targetSocket.emit("duel:incoming", {
      requestId,
      expiresAt,
      from: toSocialUser(socket.user, statusForUser(socket.user.id))
    });
    socket.emit("duel:sent", {
      requestId,
      target: toSocialUser(targetSocket.user, statusForUser(targetSocket.user.id)),
      expiresAt
    });
  }

  async function handleResponse(socket, requestId, accepted) {
    const request = pending.get(requestId);
    if (!request || request.targetSocketId !== socket.id) return;
    pending.delete(requestId);
    clearTimer(request.timerId);
    const fromSocket = io.sockets?.sockets?.get(request.fromSocketId);
    if (!fromSocket) return;
    if (!accepted) {
      fromSocket.emit("duel:rejected", { requestId, username: socket.user.username });
      socket.emit("duel:closed", { requestId });
      return;
    }
    if (isUserInActiveRoom(fromSocket.user.id) || isUserInActiveRoom(socket.user.id)) {
      fromSocket.emit("duel:rejected", { requestId, username: socket.user.username, reason: "playing" });
      socket.emit("duel:closed", { requestId });
      return;
    }
    await refreshSocketUser(fromSocket);
    await refreshSocketUser(socket);
    createDirectRoom(
      { user: fromSocket.user, socketId: fromSocket.id },
      { user: socket.user, socketId: socket.id },
      io
    );
    socket.emit("duel:closed", { requestId });
  }

  function expireRequest(requestId) {
    const request = pending.get(requestId);
    if (!request) return;
    pending.delete(requestId);
    clearTimer(request.timerId);
    io.to(request.fromSocketId).emit("duel:rejected", {
      requestId,
      username: request.targetUser.username,
      reason: "timeout"
    });
    io.to(request.targetSocketId).emit("duel:closed", { requestId });
  }

  function expireSocketRequests(socketId) {
    for (const [requestId, request] of pending) {
      if (request.fromSocketId === socketId || request.targetSocketId === socketId) {
        expireRequest(requestId);
      }
    }
  }

  return {
    handleRequest,
    handleResponse,
    expireRequest,
    expireSocketRequests,
    pendingCount: () => pending.size
  };
}
