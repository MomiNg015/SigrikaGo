const SOCKET_RATE_LIMIT_WINDOW_MS = 10000;
const SOCKET_RATE_LIMIT_MAX_PACKETS = 120;
const SOCKET_RATE_LIMIT_MESSAGE = "\u64cd\u4f5c\u8fc7\u4e8e\u9891\u7e41\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5";

export function installSocketRateGuard(socket, {
  now = Date.now
} = {}) {
  socket.data.rateGuard = { startedAt: now(), count: 0, notified: false };
  socket.use((_packet, next) => {
    const guard = socket.data.rateGuard;
    const currentTime = now();
    if (currentTime - guard.startedAt > SOCKET_RATE_LIMIT_WINDOW_MS) {
      guard.startedAt = currentTime;
      guard.count = 0;
      guard.notified = false;
    }
    guard.count += 1;
    if (guard.count > SOCKET_RATE_LIMIT_MAX_PACKETS) {
      if (!guard.notified) {
        guard.notified = true;
        socket.emit("error:toast", SOCKET_RATE_LIMIT_MESSAGE);
      }
      return;
    }
    next();
  });
}
