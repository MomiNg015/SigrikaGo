import { useEffect } from "react";
import { isResumablePlayerRoom, rememberPlayerRoom } from "./resumeSession.js";

export function useRoomMemory(room, pendingMatchRoom = null) {
  const roomToRemember = roomToRememberForResume(room, pendingMatchRoom);
  useEffect(() => {
    if (roomToRemember) rememberPlayerRoom(roomToRemember);
  }, [roomToRemember?.code, roomToRemember?.game?.phase, roomToRemember?.role]);
}

export function roomToRememberForResume(room, pendingMatchRoom = null) {
  if (isResumablePlayerRoom(room)) return room;
  if (isResumablePlayerRoom(pendingMatchRoom)) return pendingMatchRoom;
  return null;
}
