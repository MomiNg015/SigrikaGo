import { useAccountActions } from "./useAccountActions.js";
import { useMatchActions } from "./useMatchActions.js";
import { useOverlayActions } from "./useOverlayActions.js";
import { useReplayActions } from "./useReplayActions.js";

export function useAppActions({
  matchSuccess,
  matchSuccessRef,
  overlaySetters,
  room,
  socket,
  showToast,
  token,
  updateUser,
  view,
  setAssetProgress,
  setCharacters,
  setDismissedResultRoom,
  setLobbyStats,
  setMatchStart,
  setMatchSuccess,
  setPendingSkill,
  setReplayStep,
  setRoom,
  setToken,
  setUser,
  setView
}) {
  const overlayActions = useOverlayActions({
    overlaySetters,
    room,
    view,
    setDismissedResultRoom,
    setRoom
  });

  const accountActions = useAccountActions({
    socket,
    showToast,
    token,
    updateUser,
    setAssetProgress,
    setCharacters,
    setLobbyStats,
    setMatchSuccess,
    setRoom,
    setToken,
    setUser,
    setView
  });

  const matchActions = useMatchActions({
    matchSuccess,
    matchSuccessRef,
    room,
    socket,
    showToast,
    setMatchStart,
    setMatchSuccess,
    setRoom,
    setView
  });

  const replayActions = useReplayActions({
    closeAllOverlays: overlayActions.closeAllOverlays,
    token,
    setCharacters,
    setPendingSkill,
    setReplayStep,
    setRoom,
    setView
  });

  return {
    ...accountActions,
    ...matchActions,
    ...overlayActions,
    ...replayActions
  };
}
