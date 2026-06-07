import { useCallback } from "react";
import { clearLastRoomCode } from "./resumeSession.js";

export function useOverlayActions({
  room,
  view,
  setDismissedResultRoom,
  setRoom,
  setShowFriends,
  setShowHouse,
  setShowLeaderboard,
  setShowMessageBoard,
  setShowSettings,
  setShowShop,
  setShowWarehouse,
  setShowWatch
}) {
  const closeAllOverlays = useCallback(() => {
    setShowShop(false);
    setShowHouse(false);
    setShowWarehouse(false);
    setShowLeaderboard(false);
    setShowWatch(false);
    setShowFriends(false);
    setShowSettings(false);
    setShowMessageBoard(false);
  }, [
    setShowFriends,
    setShowHouse,
    setShowLeaderboard,
    setShowMessageBoard,
    setShowSettings,
    setShowShop,
    setShowWarehouse,
    setShowWatch
  ]);

  const closeResultModal = useCallback(() => {
    if (!room) return;
    clearLastRoomCode();
    setDismissedResultRoom(room.code);
    if (view !== "room") setRoom(null);
  }, [room, setDismissedResultRoom, setRoom, view]);

  return { closeAllOverlays, closeResultModal };
}
