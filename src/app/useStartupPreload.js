import { useEffect } from "react";
import { MUSIC_TRACKS } from "../shared/musicLibrary.js";
import { api } from "../api/client.js";
import { loginPreloadAssets, preloadLoginAssets } from "../shared/preloadAssets.js";
import { preloadHomeReady, preloadPlayerWindows } from "./homeReadyPreload.js";
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
    let accountLoaded = false;
    let cancelHold = () => {};
    api("/api/me", { token })
      .then(async (data) => {
        if (cancelled) return;
        setStartupError(null);
        setUser(data.user);
        accountLoaded = true;
        if (shouldShowStartupPreload({
          room: roomRef.current,
          matchSuccess: matchSuccessRef.current
        })) {
          setView("preloading");
        }
        setAssetProgress(0);
        const [nextCharacters, nextMusicTracks] = await Promise.all([
          loadPublicCharacterCatalog({ token }),
          loadMusicTrackCatalog({ token }).catch((error) => {
            if (error.status === 401 || error.status === 403) throw error;
            return MUSIC_TRACKS;
          })
        ]);
        if (cancelled) return;
        setCharacters(nextCharacters);
        setMusicTracks(nextMusicTracks);
        await Promise.all([preloadHomeReady(), preloadLoginAssets(loginPreloadAssets({
          priority: "home",
          characters: nextCharacters,
          user: data.user,
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
          void preloadPlayerWindows();
          void warmCatalogImages(token, () => cancelled).catch(() => {});
        }
      })
      .catch((error) => {
        if (cancelled) return;
        if (error.status !== 401 && error.status !== 403) {
          // A recovered match owns its own asset barrier and connection feedback.
          if (shouldShowStartupPreload({ room: roomRef.current, matchSuccess: matchSuccessRef.current })) {
            setStartupError({ source: "preload", message: accountLoaded
              ? "资源尚未加载完成，请检查网络后重试"
              : "暂时无法加载账号，请检查网络后重试" });
            setView("preloading");
          }
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

async function warmCatalogImages(token, isCancelled) {
  const catalogs = await Promise.all(["/api/shop", "/api/items/inventory", "/api/recruitment"]
    .map((path) => api(path, { token }).catch(() => ({ items: [] }))));
  if (isCancelled()) return;
  await preloadLoginAssets({ images: catalogs.flatMap((catalog) => (catalog.items ?? []).map((item) => item.imageUrl)) }, {
    concurrency: 2, taskTimeoutMs: 8000
  });
}
