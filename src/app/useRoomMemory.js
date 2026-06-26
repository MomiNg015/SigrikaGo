import { useEffect } from "react";
import { rememberPlayerRoom } from "./resumeSession.js";

export function useRoomMemory(room, pendingMatchRoom = null) {
  const roomToRemember = roomToRememberForResume(room, pendingMatchRoom);
  useEffect(() => {
    rememberPlayerRoom(roomToRemember);
  }, [roomToRemember?.code, roomToRemember?.role]);
}

export function roomToRememberForResume(room, pendingMatchRoom = null) {
  if (room?.code && room.role === "player") return room;
  if (pendingMatchRoom?.code && pendingMatchRoom.role === "player") return pendingMatchRoom;
  return null;
}
