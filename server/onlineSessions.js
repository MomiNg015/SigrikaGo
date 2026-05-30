export function createOnlineSessionManager({
  io,
  sessions,
  signLoginResponse,
  isUserInActiveRoom,
  onSocketDisconnected = () => {},
  clearTimer = clearTimeout
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

  async function createLoginResponse(user) {
    const session = await sessions.replace(user.id);
    clearPendingLogin(user.id);
    clearDisconnectedSessionTimer(user.id);
    return {
      ...signLoginResponse(user, session),
      refreshToken: session.refreshToken,
      refreshExpiresAt: session.expiresAt
    };
  }

  async function forceLogoutUser(userId) {
    const socketIds = [...(onlineSockets.get(userId) ?? [])];
    await sessions.clearUser(userId);
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
      clearDisconnectedSessionTimer(socket.user.id);
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
