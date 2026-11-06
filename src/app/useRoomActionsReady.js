import { useCallback, useSyncExternalStore } from "react";
import { roomActionsReady, roomActionsSyncing, subscribeRoomActions } from "./roomActionConnection.js";

export function useRoomActionsReady(socket, roomCode) {
  const subscribe = useCallback((callback) => subscribeRoomActions(socket, callback), [socket]);
  const snapshot = useCallback(() => socket === undefined || roomActionsReady(socket, roomCode), [socket, roomCode]);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function useRoomActionsSyncing(socket) {
  const subscribe = useCallback((callback) => subscribeRoomActions(socket, callback), [socket]);
  const snapshot = useCallback(() => roomActionsSyncing(socket), [socket]);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
