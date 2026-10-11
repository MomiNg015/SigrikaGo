import { useCallback } from "react";
import { closeOverlaySetters } from "./overlayRegistry.js";
import { clearLastRoomCode, rememberDismissedResultRoom } from "./resumeSession.js";
import { planRoomBackNavigation } from "./roomNavigation.js";

export function useOverlayActions({
  overlaySetters,
  room,
  view,
  setDismissedResultRoom,
  setRoom,
  socket,
  setPendingSkill,
  setReplayStep,
  setView
}) {
  const closeAllOverlays = useCallback(() => {
    closeOverlaySetters(overlaySetters);
  }, [overlaySetters]);

  const closeResultModal = useCallback(() => {
    if (!room) return;
    clearLastRoomCode();
    rememberDismissedResultRoom(room.code);
    setDismissedResultRoom(room.code);
    if (view !== "room") setRoom(null);
  }, [room, setDismissedResultRoom, setRoom, view]);

  const leaveResultRoom = useCallback(() => {
    if (!room || room.game?.phase !== "finished" || room.sigrikaCandyDuel) return;
    const plan = planRoomBackNavigation({ room, replayStep: null });
    if (plan.leaveRoomCode) socket?.emit("room:leave", { roomCode: plan.leaveRoomCode });
    closeResultModal();
    setPendingSkill(null);
    setReplayStep(plan.nextReplayStep);
    setRoom(null);
    setView(plan.nextView);
  }, [room, socket, closeResultModal, setPendingSkill, setReplayStep, setRoom, setView]);

  return { closeAllOverlays, closeResultModal, leaveResultRoom };
}
