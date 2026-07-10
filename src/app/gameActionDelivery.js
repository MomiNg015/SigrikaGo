export const GAME_ACTION_ACK_TIMEOUT_MS = 4000;
export const GAME_ACTION_RETRY_LIMIT = 2;

let fallbackActionCounter = 0;

export function createGameActionId({
  cryptoLike = globalThis.crypto,
  now = Date.now
} = {}) {
  if (typeof cryptoLike?.randomUUID === "function") return cryptoLike.randomUUID();
  fallbackActionCounter = (fallbackActionCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `action:${Number(now()).toString(36)}:${fallbackActionCounter.toString(36)}`;
}

export function emitGameActionWithAck(socket, {
  roomCode,
  action
} = {}, {
  actionId = createGameActionId(),
  ackTimeoutMs = GAME_ACTION_ACK_TIMEOUT_MS,
  retryLimit = GAME_ACTION_RETRY_LIMIT,
  setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn = globalThis.clearTimeout,
  onAcknowledged = () => {},
  onUnconfirmed = () => {}
} = {}) {
  if (!socket?.emit || !roomCode || !action) return null;

  const payload = { roomCode, action, actionId };
  let attempts = 0;
  let timerId = null;
  let settled = false;

  function clearTimer() {
    if (timerId === null) return;
    clearTimeoutFn(timerId);
    timerId = null;
  }

  function acknowledge(response = {}) {
    if (settled || response?.actionId !== actionId) return;
    settled = true;
    clearTimer();
    onAcknowledged(response);
  }

  function send() {
    if (settled) return;
    attempts += 1;
    socket.emit("game:action", payload, acknowledge);
    if (settled) return;
    clearTimer();
    timerId = setTimeoutFn(() => {
      timerId = null;
      if (settled) return;
      if (attempts <= retryLimit) {
        send();
        return;
      }
      settled = true;
      onUnconfirmed({ actionId, attempts, payload });
    }, ackTimeoutMs);
  }

  send();
  return {
    actionId,
    cancel: () => {
      settled = true;
      clearTimer();
    }
  };
}
