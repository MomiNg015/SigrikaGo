import { useCallback } from "react";
import { clearLastRoomCode } from "./resumeSession.js";

export function useOverlayActions({
  room,
  view,
  setDismissedResultRoom,
  setRoom,
  setShowFriends,
  setShowGacha,
  setShowHouse,
  setShowLeaderboard,
  setShowMessageBoard,
  setShowResume,
  setShowSettings,
  setShowShop,
  setShowWarehouse,
  setShowWatch
}) {
  const closeAllOverlays = useCallback(() => {
    setShowShop(false);
    setShowHouse(false);
    setShowResume(false);
    setShowWarehouse(false);
    setShowLeaderboard(false);
    setShowWatch(false);
    setShowFriends(false);
    setShowGacha(false);
    setShowSettings(false);
    setShowMessageBoard(false);
  }, [
    setShowFriends,
    setShowGacha,
    setShowHouse,
    setShowLeaderboard,
    setShowMessageBoard,
    setShowResume,
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
