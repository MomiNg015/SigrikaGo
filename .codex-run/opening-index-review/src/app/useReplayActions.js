import { useCallback } from "react";
import { adminApi, api } from "../api/client.js";
import { loadPublicCharacterCatalog } from "./characterCatalog.js";
import { replayOpeningState } from "./replayOpening.js";

export function useReplayActions({
  closeAllOverlays,
  token,
  setCharacters,
  setPendingSkill,
  setReplayStep,
  setRoom,
  setView
}) {
  const refreshPublicCharacters = useCallback(async () => {
    setCharacters(await loadPublicCharacterCatalog({ token }));
  }, [setCharacters, token]);

  const openReplay = useCallback(async (recordId) => {
    const data = await api(`/api/replays/${recordId}`, { token });
    const replayState = replayOpeningState(data);
    closeAllOverlays();
    setRoom(replayState.room);
    setReplayStep(replayState.replayStep);
    setPendingSkill(replayState.pendingSkill);
    setView(replayState.view);
  }, [closeAllOverlays, setPendingSkill, setReplayStep, setRoom, setView, token]);

  const openAdminReplay = useCallback(async (recordId) => {
    const data = await adminApi(`/replays/${recordId}`, token);
    const replayState = replayOpeningState(data);
    setRoom(replayState.room);
    setReplayStep(replayState.replayStep);
    setPendingSkill(replayState.pendingSkill);
    setView(replayState.view);
  }, [setPendingSkill, setReplayStep, setRoom, setView, token]);

  return { openAdminReplay, openReplay, refreshPublicCharacters };
}
