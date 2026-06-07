import { useEffect } from "react";
import { rememberPlayerRoom } from "./resumeSession.js";

export function useRoomMemory(room) {
  useEffect(() => {
    rememberPlayerRoom(room);
  }, [room?.code, room?.role]);
}
