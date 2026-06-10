import { useCallback } from "react";
import { api } from "../api/client.js";
import { CHARACTERS } from "../shared/characters.js";

export function useAccountActions({
  socket,
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
}) {
  const handleAuth = useCallback((nextToken, nextUser) => {
    setView("preloading");
    setAssetProgress(0);
    setToken(nextToken);
    setUser(nextUser);
  }, [setAssetProgress, setToken, setUser, setView]);

  const logout = useCallback(() => {
    api("/api/auth/logout", {
      method: "POST",
      token,
      skipAuthRefresh: true
    }).catch(() => {});
    socket?.close();
    setToken("");
    setUser(null);
    setRoom(null);
    setMatchSuccess(null);
    setLobbyStats({ onlineCount: 0, matchmakingCount: 0 });
    setCharacters(CHARACTERS);
    setView("login");
  }, [
    setCharacters,
    setLobbyStats,
    setMatchSuccess,
    setRoom,
    setToken,
    setUser,
    setView,
    socket,
    token
  ]);

  const selectCharacter = useCallback(async (characterId) => {
    const data = await api("/api/me/character", {
      method: "POST",
      token,
      body: { characterId }
    });
    updateUser(data.user);
  }, [token, updateUser]);

  const applyStoneDecoration = useCallback(async (decorationId) => {
    const data = await api("/api/me/decoration", {
      method: "POST",
      token,
      body: { decorationId }
    });
    updateUser(data.user);
  }, [token, updateUser]);

  const selectCharacterMusic = useCallback(async ({ characterId, trackId }) => {
    const data = await api("/api/me/music-selection", {
      method: "POST",
      token,
      body: { characterId, trackId }
    });
    updateUser(data.user);
  }, [token, updateUser]);

  return { applyStoneDecoration, handleAuth, logout, selectCharacter, selectCharacterMusic };
}
