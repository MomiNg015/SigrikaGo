import { useEffect, useRef } from "react";
import { api } from "../api/client.js";

export function shouldRefreshHomeUser({ token, user, view }) {
  return view === "home" && Boolean(token && user?.id);
}

export function useHomeUserRefresh({ token, updateUser, user, view }) {
  const refreshSequenceRef = useRef(0);

  useEffect(() => {
    if (!shouldRefreshHomeUser({ token, user, view })) return;
    let cancelled = false;
    const sequence = ++refreshSequenceRef.current;

    api("/api/me", { token })
      .then((data) => {
        if (cancelled || sequence !== refreshSequenceRef.current) return;
        updateUser(data.user);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token, updateUser, user?.id, view]);
}
