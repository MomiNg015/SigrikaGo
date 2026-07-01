import { useCallback } from "react";
import { GAME_PHASES } from "../shared/game.js";
import { completePendingMatchRoom } from "./matchTransition.js";
import { preloadPlayableReady as defaultPreloadPlayableReady } from "./playableReadyPreload.js";

export function useMatchActions({
  matchSuccess,
  matchSuccessRef,
  room,
  socket,
  setMatchStart,
  setMatchSuccess,
  setRoom,
  setView
}) {
  const startMatch = useCallback((mode = "spark") => {
    startMatchTransition({
      mode,
      preloadPlayableReady: defaultPreloadPlayableReady,
      setMatchStart,
      setMatchSuccess,
      socket
    });
  }, [setMatchStart, setMatchSuccess, socket]);

  const cancelMatch = useCallback(() => {
    socket?.emit("match:leave");
    setMatchStart(null);
  }, [setMatchStart, socket]);

  const completeMatchSuccess = useCallback(() => {
    if (!matchSuccess) return;
    const nextTransition = matchSuccessCountdownCompletedTransition(matchSuccess, matchSuccessRef.current);
    if (nextTransition.room?.game?.phase === GAME_PHASES.preloading) {
      matchSuccessRef.current = nextTransition;
      setMatchSuccess((current) => current ? { ...current, ...nextTransition } : current);
      setView("match-preloading");
      return;
    }
    setRoom((current) => completePendingMatchRoom(matchSuccessRef, matchSuccess.room, current));
    matchSuccessRef.current = null;
    setMatchSuccess(null);
    setView("room");
  }, [matchSuccess, matchSuccessRef, setMatchSuccess, setRoom, setView]);

  const joinWatchRoom = useCallback((roomCode) => {
    if (!roomCode) return;
    socket?.emit("room:join", { roomCode });
  }, [socket]);

  const emitGame = useCallback((action) => {
    if (!room) return;
    socket?.emit("game:action", { roomCode: room.code, action });
  }, [room, socket]);

  const emitScoring = useCallback((action) => {
    if (!room) return;
    socket?.emit("scoring:action", { roomCode: room.code, action });
  }, [room, socket]);

  const requestDraw = useCallback(() => {
    if (!room) return;
    socket?.emit("draw:request", { roomCode: room.code });
  }, [room, socket]);

  const respondDraw = useCallback((accepted) => {
    if (!room) return;
    socket?.emit("draw:respond", { roomCode: room.code, accepted });
  }, [room, socket]);

  return {
    cancelMatch,
    completeMatchSuccess,
    emitGame,
    emitScoring,
    joinWatchRoom,
    requestDraw,
    respondDraw,
    startMatch
  };
}

export function startMatchTransition({
  mode = "spark",
  now = Date.now,
  preloadPlayableReady = defaultPreloadPlayableReady,
  setMatchStart,
  setMatchSuccess,
  socket
}) {
  try {
    void preloadPlayableReady({ includePixi: true, mode, reason: "match-start" });
  } catch {
    // Prewarm is opportunistic; matchmaking must continue even if it fails.
  }
  setMatchSuccess(null);
  setMatchStart({ startedAt: now(), mode });
  socket?.emit("match:join", { mode });
}

export function matchSuccessCountdownCompletedTransition(matchSuccess, latestTransition = matchSuccess) {
  const transition = latestTransition ?? matchSuccess;
  const room = latestTransition?.room ?? matchSuccess?.room;
  return {
    ...transition,
    room,
    countdownComplete: true
  };
}
