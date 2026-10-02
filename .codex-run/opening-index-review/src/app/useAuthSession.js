import { useCallback, useEffect, useRef } from "react";
import { api, configureAuthRefresh } from "../api/client.js";

export function useAuthSession({
  fallbackCharacters,
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
          setToken(data.token);
          updateUser(data.user);
          return data;
        })
        .catch((error) => {
          if (!silent) showToast(error.message);
          resetToLogin();
          return null;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }
    return refreshPromiseRef.current;
  }, [resetToLogin, setToken, showToast, updateUser]);

  useEffect(() => {
    let cancelled = false;
    refreshAuthSession({ silent: true })
      .catch(() => {
        if (!cancelled) setView("login");
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
