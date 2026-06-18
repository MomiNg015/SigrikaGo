import { useEffect } from "react";
import { playDoorbellSound } from "../audio/playback.jsx";
import { applyRoomClock } from "./roomClock.js";
import { connectGameSocket } from "./gameSocket.js";
import { syncPendingMatchRoom } from "./matchTransition.js";
import { mergeCurrentUserFromRoom } from "./roomUserSync.js";
import {
  buildRoomResumeRequest,
  clearLastRoomCode,
  handleMissingRoomResumePayload,
  handleRoomResumePayload
} from "./resumeSession.js";
import { createSocketHandlers } from "./socketHandlers.js";

export function useGameSocketConnection({
  audioSettingsRef,
  closeAllOverlays,
  matchSuccessRef,
  onSocketReconnect = () => {},
  roomRef,
  setDismissedResultRoom,
  setIncomingDuel,
  setLobbyStats,
  setMatchStart,
  setMatchSuccess,
  setPendingSkill,
  setReplayStep,
  setRoom,
  setSocket,
  setToken,
  setUser,
  setView,
  showToast,
  socketBase,
  token,
  updateUser,
  userId
}) {
  useEffect(() => {
    if (!token || !userId) return;
    const nextSocket = connectGameSocket({
      socketBase,
      token,
      handlers: createSocketHandlers({
        matchSuccessRef,
        roomRef,
        audioSettingsRef,
        closeAllOverlays,
        updateUser,
        setMatchStart,
        setMatchSuccess,
        setReplayStep,
        setRoom,
        setView,
        setPendingSkill,
        setDismissedResultRoom,
        setIncomingDuel,
        setToken,
        setUser,
        setLobbyStats,
        showToast,
        clearLastRoomCode,
        handleMissingRoomResumePayload,
        handleRoomResumePayload,
        mergeCurrentUserFromRoom,
        syncPendingMatchRoom,
        applyRoomClock,
        playDoorbellSound
      }),
      buildRoomResumeRequest,
      onSocketReconnect
    });
    setSocket(nextSocket);
    return () => nextSocket.close();
  }, [
    audioSettingsRef,
    closeAllOverlays,
    matchSuccessRef,
    onSocketReconnect,
    roomRef,
    setDismissedResultRoom,
    setIncomingDuel,
    setLobbyStats,
    setMatchStart,
    setMatchSuccess,
    setPendingSkill,
    setReplayStep,
    setRoom,
    setSocket,
    setToken,
    setUser,
    setView,
    showToast,
    socketBase,
    token,
    updateUser,
    userId
  ]);
}
