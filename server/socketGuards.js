const SOCKET_RATE_LIMIT_WINDOW_MS = 10000;
const SOCKET_RATE_LIMIT_MAX_PACKETS = 120;
const SOCKET_RATE_LIMIT_MESSAGE = "鎿嶄綔杩囦簬棰戠箒锛岃绋嶅悗鍐嶈瘯";

export function installSocketRateGuard(socket, {
  now = Date.now
} = {}) {
  socket.data.rateGuard = { startedAt: now(), count: 0 };
  socket.use((_packet, next) => {
    const guard = socket.data.rateGuard;
    const currentTime = now();
    if (currentTime - guard.startedAt > SOCKET_RATE_LIMIT_WINDOW_MS) {
      guard.startedAt = currentTime;
      guard.count = 0;
    }
    guard.count += 1;
    if (guard.count > SOCKET_RATE_LIMIT_MAX_PACKETS) {
      socket.emit("error:toast", SOCKET_RATE_LIMIT_MESSAGE);
      return;
    }
    next();
  });
}
