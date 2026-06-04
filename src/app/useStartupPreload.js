import { useEffect } from "react";
import { api } from "../api/client.js";
import { loginPreloadAssets, preloadLoginAssets } from "../shared/preloadAssets.js";
import { loadPublicCharacterCatalog } from "./characterCatalog.js";
import { shouldFinishPreloadAsHome } from "./sessionState.js";

export function useStartupPreload({
  fallbackCharacters,
  matchSuccessRef,
  refreshSiteSettings,
  roomRef,
  setAssetProgress,
  setCharacters,
  setLobbyStats,
  setMatchStart,
  setMatchSuccess,
  setRoom,
  setShowHouse,
  setShowLeaderboard,
  setShowShop,
  setShowWarehouse,
  setShowWatch,
  setToken,
  setUser,
  setView,
  socket,
  token,
  viewRef
}) {
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api("/api/me", { token })
      .then(async (data) => {
        if (cancelled) return;
        setUser(data.user);
        setView("preloading");
        setAssetProgress(0);
        const nextCharacters = await loadPublicCharacterCatalog({ token });
        if (cancelled) return;
        setCharacters(nextCharacters);
        const startedAt = Date.now();
        await preloadLoginAssets(loginPreloadAssets({
          characters: nextCharacters,
          ownedCharacters: data.user.ownedCharacters,
          itemEffects: data.user.itemEffects,
          musicSelections: data.user.musicSelections
        }), {
          onProgress: (progress) => {
            if (!cancelled) setAssetProgress(progress);
          }
        });
        const elapsed = Date.now() - startedAt;
        await refreshSiteSettings();
        if (elapsed < 900) await new Promise((resolve) => setTimeout(resolve, 900 - elapsed));
        if (!cancelled && shouldFinishPreloadAsHome({
          view: viewRef.current,
          room: roomRef.current,
          matchSuccess: matchSuccessRef.current
        })) {
          setView("home");
        }
      })
      .catch(() => {
        if (cancelled) return;
        socket?.close();
        setToken("");
        setUser(null);
        setRoom(null);
        setMatchStart(null);
        setMatchSuccess(null);
        setShowShop(false);
        setShowHouse(false);
        setShowWarehouse(false);
        setShowLeaderboard(false);
        setShowWatch(false);
        setLobbyStats({ onlineCount: 0, matchmakingCount: 0 });
        setView("login");
        setCharacters(fallbackCharacters);
      });
    return () => {
      cancelled = true;
    };
  }, [
    fallbackCharacters,
    matchSuccessRef,
    refreshSiteSettings,
    roomRef,
    setAssetProgress,
    setCharacters,
    setLobbyStats,
    setMatchStart,
    setMatchSuccess,
    setRoom,
    setShowHouse,
    setShowLeaderboard,
    setShowShop,
    setShowWarehouse,
    setShowWatch,
    setToken,
    setUser,
    setView,
    socket,
    token,
    viewRef
  ]);
}
