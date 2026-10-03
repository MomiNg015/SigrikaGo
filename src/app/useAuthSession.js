import { useCallback, useEffect, useRef } from "react";
import { api, configureAuthRefresh } from "../api/client.js";

export function useAuthSession({
  fallbackCharacters,
  setStartupError,
  setCharacters,
  setLobbyStats,
  setMatchStart,
  setMatchSuccess,
  setRoom,
  setToken,
  setUser,
  setView,
  showToast,
  updateUser
}) {
  const refreshPromiseRef = useRef(null);

  const resetToLogin = useCallback(() => {
    setToken("");
    setUser(null);
    setRoom(null);
    setMatchStart(null);
    setMatchSuccess(null);
    setLobbyStats({ onlineCount: 0, matchmakingCount: 0 });
    setCharacters(fallbackCharacters);
    setView("login");
  }, [
    fallbackCharacters,
    setCharacters,
    setLobbyStats,
    setMatchStart,
    setMatchSuccess,
    setRoom,
    setToken,
    setUser,
    setView
  ]);

  const refreshAuthSession = useCallback(({ silent = false } = {}) => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = api("/api/auth/refresh", {
        method: "POST",
        skipAuthRefresh: true
      })
        .then((data) => {
          setStartupError?.(null);
          setToken(data.token);
          updateUser(data.user);
          return data;
        })
        .catch((error) => {
          if (!silent) showToast(error.message);
          if (error.status === 401 || error.status === 403) {
            setStartupError?.(null);
            resetToLogin();
            return null;
          }
          setStartupError?.({ source: "auth", message: "暂时无法恢复登录，请检查网络后重试" });
          throw error;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }
    return refreshPromiseRef.current;
  }, [resetToLogin, setToken, showToast, updateUser, setStartupError]);

  useEffect(() => {
    let cancelled = false;
    refreshAuthSession({ silent: true })
      .catch(() => {
        if (!cancelled) setView("preloading");
      });
    return () => {
      cancelled = true;
    };
  }, [refreshAuthSession, setView]);

  useEffect(() => {
    configureAuthRefresh(() => refreshAuthSession({ silent: true }));
    return () => configureAuthRefresh(null);
  }, [refreshAuthSession]);

  return refreshAuthSession;
}
