import { useEffect } from "react";
import { MUSIC_TRACKS } from "../shared/musicLibrary.js";
import { api } from "../api/client.js";
import { loginPreloadAssets, preloadLoginAssets } from "../shared/preloadAssets.js";
import { preloadHomeReady } from "./homeReadyPreload.js";
import { loadPublicCharacterCatalog } from "./characterCatalog.js";
import { loadMusicTrackCatalog } from "./musicTrackCatalog.js";
import { shouldFinishPreloadAsHome, shouldShowStartupPreload } from "./sessionState.js";
import { LOGIN_LOADING_COMPLETE_MS } from "./loginLoadingAssets.js";

export function useStartupPreload({
  fallbackCharacters,
  retryKey = 0,
  setStartupError = () => {},
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
    let cancelHold = () => {};
    api("/api/me", { token })
      .then(async (data) => {
        if (cancelled) return;
        setStartupError(null);
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
          loadMusicTrackCatalog({ token }).catch((error) => {
            if (error.status === 401 || error.status === 403) throw error;
            return MUSIC_TRACKS;
          }),
          api("/api/shop", { token, requestTimeoutMs: 8000 }).catch(() => ({ items: [] })),
          api("/api/items/inventory", { token, requestTimeoutMs: 8000 }).catch(() => ({ items: [] })),
          api("/api/recruitment", { token, requestTimeoutMs: 8000 }).catch(() => ({ items: [] }))
        ]);
        if (cancelled) return;
        setCharacters(nextCharacters);
        setMusicTracks(nextMusicTracks);
        await Promise.all([preloadHomeReady(), preloadLoginAssets(loginPreloadAssets({
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
          taskTimeoutMs: 20000,
          requireComplete: true,
          onProgress: (progress) => {
            if (!cancelled) setAssetProgress(Math.min(progress, 0.99));
          }
        })]);
        await refreshSiteSettings();
        if (cancelled) return;
        setAssetProgress(1);
        if (shouldFinishPreloadAsHome({ view: viewRef.current, room: roomRef.current, matchSuccess: matchSuccessRef.current })) {
          await new Promise((resolve) => {
            const timer = setTimeout(resolve, LOGIN_LOADING_COMPLETE_MS);
            cancelHold = () => { clearTimeout(timer); resolve(); };
          });
        }
        if (!cancelled && shouldFinishPreloadAsHome({
          view: viewRef.current,
          room: roomRef.current,
          matchSuccess: matchSuccessRef.current
        })) {
          setView("home");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        if (error.status !== 401 && error.status !== 403) {
          setStartupError({ source: "preload", message: "资源尚未加载完成，请检查网络后重试" });
          if (shouldShowStartupPreload({ room: roomRef.current, matchSuccess: matchSuccessRef.current })) setView("preloading");
          return;
        }
        setStartupError(null);
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
      cancelHold();
    };
  }, [
    retryKey,
    setStartupError,
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
