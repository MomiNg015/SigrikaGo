export function createOnlineSessionManager({
  io,
  sessions,
  signLoginResponse,
  isUserInActiveRoom,
  onSocketDisconnected = () => {},
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  pendingLoginMs = 2 * 60 * 1000,
  disconnectedSessionGraceMs = 30 * 60 * 1000
}) {
  const onlineSockets = new Map();
  const pendingLoginSessionTimers = new Map();
  const disconnectedSessionTimers = new Map();

  function clearPendingLogin(userId) {
    if (!pendingLoginSessionTimers.has(userId)) return;
    clearTimer(pendingLoginSessionTimers.get(userId));
    pendingLoginSessionTimers.delete(userId);
  }

  function clearDisconnectedSessionTimer(userId) {
    if (!disconnectedSessionTimers.has(userId)) return;
    clearTimer(disconnectedSessionTimers.get(userId));
    disconnectedSessionTimers.delete(userId);
  }

  function createLoginResponse(user) {
    const sessionId = sessions.replace(user.id);
    clearPendingLogin(user.id);
    clearDisconnectedSessionTimer(user.id);
    pendingLoginSessionTimers.set(user.id, setTimer(() => {
      pendingLoginSessionTimers.delete(user.id);
      if (!onlineSockets.has(user.id)) sessions.clear(user.id, sessionId);
    }, pendingLoginMs));
    return signLoginResponse(user, sessionId);
  }

  function forceLogoutUser(userId) {
    const socketIds = [...(onlineSockets.get(userId) ?? [])];
    sessions.clearUser(userId);
    clearPendingLogin(userId);
    clearDisconnectedSessionTimer(userId);
    for (const socketId of socketIds) {
      const socket = io.sockets.sockets.get(socketId);
      if (!socket) continue;
      socket.emit("account:logged-out", { message: "账号已在其他地方登录" });
      socket.disconnect(true);
    }
  }

  function registerOnlineSocket(socket) {
    clearDisconnectedSessionTimer(socket.user.id);
    const sockets = onlineSockets.get(socket.user.id) ?? new Set();
    sockets.add(socket.id);
    onlineSockets.set(socket.user.id, sockets);
    clearPendingLogin(socket.user.id);
  }

  function unregisterOnlineSocket(socket) {
    const sockets = onlineSockets.get(socket.user.id);
    if (!sockets) return;
    sockets.delete(socket.id);
    if (sockets.size === 0) {
      onlineSockets.delete(socket.user.id);
      const sessionId = socket.data.sessionId;
      clearDisconnectedSessionTimer(socket.user.id);
      disconnectedSessionTimers.set(socket.user.id, setTimer(() => {
        disconnectedSessionTimers.delete(socket.user.id);
        if (!onlineSockets.has(socket.user.id)) sessions.clear(socket.user.id, sessionId);
      }, disconnectedSessionGraceMs));
    }
    onSocketDisconnected(socket);
  }

  function statusForUser(userId) {
    if (isUserInActiveRoom(userId)) return "playing";
    return onlineSockets.has(userId) ? "online" : "offline";
  }

  function firstOnlineSocket(userId) {
    const socketId = onlineSockets.get(userId)?.values().next().value;
    return socketId ? io.sockets.sockets.get(socketId) : null;
  }

  return {
    createLoginResponse,
    forceLogoutUser,
    registerOnlineSocket,
    unregisterOnlineSocket,
    statusForUser,
    firstOnlineSocket,
    hasOnlineUser: (userId) => onlineSockets.has(userId),
    onlineCount: () => onlineSockets.size
  };
}
