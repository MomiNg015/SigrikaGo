export function createOnlineSessionManager({
  io,
  sessions,
  signLoginResponse,
  isUserInActiveRoom,
  onSocketDisconnected = () => {},
  clearTimer = clearTimeout
}) {
  const onlineSockets = new Map();
  const onlineSocketDetails = new Map();
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
    onlineSocketDetails.set(socket.id, {
      socketId: socket.id,
      userId: socket.user.id,
      username: socket.user.username,
      role: socket.user.role,
      status: socket.user.status,
      connectedAt: new Date(),
      lastActiveAt: new Date()
    });
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
    onlineSocketDetails.delete(socket.id);
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

  function listOnlineUsers() {
    return [...onlineSockets.entries()].map(([userId, socketIds]) => {
      const socketId = socketIds.values().next().value;
      const socket = socketId ? io.sockets.sockets.get(socketId) : null;
      const detail = socketId ? onlineSocketDetails.get(socketId) : null;
      return {
        userId,
        username: socket?.user?.username ?? detail?.username ?? "",
        role: socket?.user?.role ?? detail?.role ?? "player",
        status: statusForUser(userId),
        socketCount: socketIds.size,
        connectedAt: detail?.connectedAt ?? null,
        lastActiveAt: detail?.lastActiveAt ?? null
      };
    });
  }

  return {
    createLoginResponse,
    forceLogoutUser,
    registerOnlineSocket,
    unregisterOnlineSocket,
    statusForUser,
    firstOnlineSocket,
    listOnlineUsers,
    hasOnlineUser: (userId) => onlineSockets.has(userId),
    onlineCount: () => onlineSockets.size
  };
}
