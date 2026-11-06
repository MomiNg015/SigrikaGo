const connections = new WeakMap();
const listeners = new WeakMap();
const pendingActions = new WeakMap();
export const ROOM_ACTION_UNAVAILABLE = "连接尚未就绪，正在同步对局，请稍后操作";

export function roomActionsReady(socket, roomCode) {
  if (!socket?.emit || socket.connected === false || !roomCode) return false;
  const state = connections.get(socket);
  return !state || state.roomCode === roomCode;
}
export function markRoomActionsSyncing(socket) {
  connections.set(socket, { roomCode: null });
  cancelPendingRoomActions(socket);
  for (const listener of listeners.get(socket) ?? []) listener();
}
export function markRoomActionsReady(socket, roomCode) {
  if (connections.get(socket)?.roomCode !== roomCode) cancelPendingRoomActions(socket);
  connections.set(socket, { roomCode: roomCode || "" });
  for (const listener of listeners.get(socket) ?? []) listener();
}
export function roomActionsSyncing(socket) {
  return Boolean(socket?.connected && connections.get(socket)?.roomCode === null);
}
export function subscribeRoomActions(socket, listener) {
  if (!socket) return () => {};
  const callbacks = listeners.get(socket) ?? new Set();
  listeners.set(socket, callbacks);
  callbacks.add(listener);
  return () => callbacks.delete(listener);
}
export function trackPendingRoomAction(socket, roomCode, cancel) {
  const actions = pendingActions.get(socket) ?? new Set();
  pendingActions.set(socket, actions);
  const action = { roomCode, cancel };
  actions.add(action);
  return () => actions.delete(action);
}
export function cancelPendingRoomActions(socket, roomCode) {
  for (const action of pendingActions.get(socket) ?? []) {
    if (!roomCode || action.roomCode === roomCode) action.cancel();
  }
}
export function emitRoomMutation(socket, event, payload, onUnavailable = () => {}) {
  if (!roomActionsReady(socket, payload?.roomCode)) {
    onUnavailable(ROOM_ACTION_UNAVAILABLE, "warning");
    return false;
  }
  socket.emit(event, payload);
  return true;
}
