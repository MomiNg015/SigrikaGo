import { useEffect } from "react";
import { api } from "../api/client.js";
import { loginPreloadAssets, preloadLoginAssets, retrySkippedPreloadAssets } from "../shared/preloadAssets.js";
import { loadPublicCharacterCatalog } from "./characterCatalog.js";
import { loadMusicTrackCatalog } from "./musicTrackCatalog.js";
import { shouldFinishPreloadAsHome, shouldShowStartupPreload } from "./sessionState.js";

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
  setMusicTracks,
  setRoom,
  setShowHouse,
  setShowLeaderboard,
  setShowShop,
  setShowWarehouse,
  setShowWatch,
  setToken,
  setUser,
  setView,
  token,
  viewRef
}) {
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let cancelRetry = () => {};
    api("/api/me", { token })
      .then(async (data) => {
        if (cancelled) return;
        setUser(data.user);
        if (shouldShowStartupPreload({
          room: roomRef.current,
          matchSuccess: matchSuccessRef.current
        })) {
          setView("preloading");
        }
        setAssetProgress(0);
        const [nextCharacters, nextMusicTracks, shopData, inventoryData, recruitmentData] = await Promise.all([
          loadPublicCharacterCatalog({ token }),
          loadMusicTrackCatalog({ token }),
          api("/api/shop", { token, requestTimeoutMs: 8000 }).catch(() => ({ items: [] })),
          api("/api/items/inventory", { token, requestTimeoutMs: 8000 }).catch(() => ({ items: [] })),
          api("/api/recruitment", { token, requestTimeoutMs: 8000 }).catch(() => ({ items: [] }))
        ]);
        if (cancelled) return;
        setCharacters(nextCharacters);
        setMusicTracks(nextMusicTracks);
        const startedAt = Date.now();
        const skippedAssets = [];
        await preloadLoginAssets(loginPreloadAssets({
          characters: nextCharacters,
          user: data.user,
          shopItems: shopData.items ?? [],
          inventoryItems: [
            ...(inventoryData.items ?? []),
            ...(recruitmentData.items ?? [])
          ],
          tracks: nextMusicTracks
        }), {
          concurrency: 6,
          onSkipped: (src) => skippedAssets.push(src),
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
          cancelRetry = retrySkippedPreloadAssets(skippedAssets, { concurrency: 2 });
        }
      })
      .catch(() => {
        if (cancelled) return;
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
      cancelRetry();
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
    setMusicTracks,
    setRoom,
    setShowHouse,
    setShowLeaderboard,
    setShowShop,
    setShowWarehouse,
    setShowWatch,
    setToken,
    setUser,
    setView,
    token,
    viewRef
  ]);
}
