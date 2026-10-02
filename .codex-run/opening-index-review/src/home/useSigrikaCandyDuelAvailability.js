import { useCallback, useEffect, useState } from "react";
import { SIGRIKA_CANDY_DUEL_AVAILABILITY } from "../shared/sigrikaCandyArc.js";

export const SIGRIKA_CANDY_DUEL_STATUS_POLL_MS = 2000;

export function useSigrikaCandyDuelAvailability({
  enabled,
  ownerActive,
  pickerOpen,
  socket,
  onNotice = () => {},
  onPreloadPlayableReady = () => {}
}) {
  const [availability, setAvailability] = useState(
    ownerActive
      ? SIGRIKA_CANDY_DUEL_AVAILABILITY.owned
      : SIGRIKA_CANDY_DUEL_AVAILABILITY.available
  );
  const [watchPending, setWatchPending] = useState(false);

  const refresh = useCallback(() => {
    if (!enabled || typeof socket?.emit !== "function") return;
    socket.emit("sigrika-candy:duel-status", {}, (ack = {}) => {
      if (ack.ok && isAvailability(ack.status)) setAvailability(ack.status);
    });
  }, [enabled, socket]);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    if (!pickerOpen) return undefined;
    const intervalId = window.setInterval(refresh, SIGRIKA_CANDY_DUEL_STATUS_POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [enabled, pickerOpen, refresh]);

  const watch = useCallback(() => {
    if (watchPending || typeof socket?.emit !== "function") return;
    try {
      void onPreloadPlayableReady("spark");
    } catch {
      // Prewarm is opportunistic; the server remains authoritative for admission.
    }
    setWatchPending(true);
    socket.emit("sigrika-candy:duel-watch", {}, (ack = {}) => {
      setWatchPending(false);
      if (ack.ok) return;
      if (isAvailability(ack.status)) setAvailability(ack.status);
      onNotice(ack.error || "暂时无法观战这盘决战", ack.code === "special_watch_ended" ? "warning" : "error");
    });
  }, [onNotice, onPreloadPlayableReady, socket, watchPending]);

  return {
    availability,
    setAvailability,
    watch,
    watchPending
  };
}

function isAvailability(value) {
  return Object.values(SIGRIKA_CANDY_DUEL_AVAILABILITY).includes(value);
}
