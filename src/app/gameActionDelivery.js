import { roomActionsReady, trackPendingRoomAction } from "./roomActionConnection.js";

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
  if (!roomActionsReady(socket, roomCode) || !action) return null;

  const payload = { roomCode, action, actionId };
  let attempts = 0;
  let timerId = null;
  let settled = false;
  const connectionId = socket.id;
  let untrack = () => {};

  function cancel() {
    settled = true;
    clearTimer();
    untrack();
    socket.off?.("disconnect", cancel);
  }
  untrack = trackPendingRoomAction(socket, roomCode, cancel);
  socket.on?.("disconnect", cancel);

  function clearTimer() {
    if (timerId === null) return;
    clearTimeoutFn(timerId);
    timerId = null;
  }

  function acknowledge(response = {}) {
    if (settled || response?.actionId !== actionId) return;
    cancel();
    onAcknowledged(response);
  }

  function send() {
    if (settled) return;
    if (!roomActionsReady(socket, roomCode) || socket.id !== connectionId) {
      cancel();
      return;
    }
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
      cancel();
      onUnconfirmed({ actionId, attempts, payload });
    }, ackTimeoutMs);
  }

  send();
  return {
    actionId,
    cancel
  };
}
