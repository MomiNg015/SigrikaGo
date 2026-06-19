import { applyRoomSnapshot } from "./roomSnapshot.js";

export function syncPendingMatchRoom(matchSuccessRef, setMatchSuccess, roomView) {
  if (!matchSuccessRef.current) return false;
  const nextRoom = applyRoomSnapshot(matchSuccessRef.current.room, roomView);
  matchSuccessRef.current = {
    ...matchSuccessRef.current,
    room: nextRoom
  };
  setMatchSuccess((current) => current ? { ...current, room: applyRoomSnapshot(current.room, roomView) } : current);
  return true;
}

export function completePendingMatchRoom(matchSuccessRef, fallbackRoom, currentRoom = null) {
  return applyRoomSnapshot(currentRoom, matchSuccessRef.current?.room ?? fallbackRoom);
}
