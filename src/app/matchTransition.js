import { applyRoomSnapshot } from "./roomSnapshot.js";

export function syncPendingMatchRoom(matchSuccessRef, setMatchSuccess, roomView) {
  if (!matchSuccessRef.current) return false;
  const currentTransition = matchSuccessRef.current;
  const nextRoom = applyRoomSnapshot(currentTransition.room, roomView);
  if (nextRoom === currentTransition.room) return true;
  matchSuccessRef.current = {
    ...currentTransition,
    room: nextRoom
  };
  setMatchSuccess((current) => {
    if (!current) return current;
    const currentNextRoom = applyRoomSnapshot(current.room, roomView);
    return currentNextRoom === current.room ? current : { ...current, room: currentNextRoom };
  });
  return true;
}

export function completePendingMatchRoom(matchSuccessRef, fallbackRoom, currentRoom = null) {
  return applyRoomSnapshot(currentRoom, matchSuccessRef.current?.room ?? fallbackRoom);
}
