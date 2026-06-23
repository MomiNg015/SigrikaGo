import { useCallback } from "react";
import { closeOverlaySetters } from "./overlayRegistry.js";
import { clearLastRoomCode } from "./resumeSession.js";

export function useOverlayActions({
  overlaySetters,
  room,
  view,
  setDismissedResultRoom,
  setRoom
}) {
  const closeAllOverlays = useCallback(() => {
    closeOverlaySetters(overlaySetters);
  }, [overlaySetters]);

  const closeResultModal = useCallback(() => {
    if (!room) return;
    clearLastRoomCode();
    setDismissedResultRoom(room.code);
    if (view !== "room") setRoom(null);
  }, [room, setDismissedResultRoom, setRoom, view]);

  return { closeAllOverlays, closeResultModal };
}
