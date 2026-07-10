const SOCKET_RATE_LIMIT_WINDOW_MS = 10000;
const SOCKET_RATE_LIMIT_MAX_PACKETS = 120;
const SOCKET_RECOVERY_RATE_LIMIT_MAX_PACKETS = 300;
const SOCKET_RATE_LIMIT_MESSAGE = "\u64cd\u4f5c\u8fc7\u4e8e\u9891\u7e41\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5";
const SOCKET_DRAINING_MESSAGE = "服务器正在维护，暂时不能提交新操作";
const RECOVERY_SOCKET_EVENTS = new Set(["room:resume", "room:preload-ready"]);
const MUTATING_SOCKET_EVENTS = new Set([
  "match:join",
  "duel:request",
  "duel:respond",
  "game:action",
  "counting:request",
  "counting:respond",
  "draw:request",
  "draw:respond",
  "scoring:action",
  "chat:send"
]);

export function installSocketRateGuard(socket, {
  now = Date.now,
  isDraining = () => false,
  metrics = null
} = {}) {
  const startedAt = now();
  socket.data.rateGuard = {
    action: { startedAt, count: 0, notified: false },
    recovery: { startedAt, count: 0, notified: false }
  };
  socket.use((packet, next) => {
    const eventName = packetEventName(packet);
    if (isDraining() && MUTATING_SOCKET_EVENTS.has(eventName)) {
      acknowledgeDraining(packet, eventName);
      if (eventName === "game:action") metrics?.increment?.("gameActionDrainRejections");
      if (!socket.data.drainNotified) {
        socket.data.drainNotified = true;
        socket.emit("error:toast", SOCKET_DRAINING_MESSAGE);
      }
      return;
    }
    const isRecoveryEvent = RECOVERY_SOCKET_EVENTS.has(eventName);
    const guard = isRecoveryEvent ? socket.data.rateGuard.recovery : socket.data.rateGuard.action;
    const maxPackets = isRecoveryEvent
      ? SOCKET_RECOVERY_RATE_LIMIT_MAX_PACKETS
      : SOCKET_RATE_LIMIT_MAX_PACKETS;
    const currentTime = now();
    if (currentTime - guard.startedAt > SOCKET_RATE_LIMIT_WINDOW_MS) {
      guard.startedAt = currentTime;
      guard.count = 0;
      guard.notified = false;
    }
    guard.count += 1;
    if (guard.count > maxPackets) {
      if (isRecoveryEvent) {
        acknowledgeRecoveryRateLimit(packet);
        return;
      }
      if (!guard.notified) {
        guard.notified = true;
        socket.emit("error:toast", SOCKET_RATE_LIMIT_MESSAGE);
      }
      return;
    }
    next();
  });
}

function acknowledgeDraining(packet, eventName) {
  const maybeAck = Array.isArray(packet) ? packet.at(-1) : null;
  if (typeof maybeAck !== "function") return;
  const payload = packet?.[1] ?? {};
  maybeAck({
    ok: false,
    code: "server_draining",
    error: SOCKET_DRAINING_MESSAGE,
    ...(eventName === "game:action"
      ? { actionId: String(payload.actionId ?? ""), roomCode: String(payload.roomCode ?? "") }
      : {})
  });
}

function packetEventName(packet) {
  return Array.isArray(packet) ? String(packet[0] ?? "") : "";
}

function acknowledgeRecoveryRateLimit(packet) {
  const maybeAck = Array.isArray(packet) ? packet.at(-1) : null;
  if (typeof maybeAck === "function") {
    maybeAck({ ok: false, error: "too_many_recovery_requests" });
  }
}
