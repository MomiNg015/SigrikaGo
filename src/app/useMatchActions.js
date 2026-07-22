import { useCallback } from "react";
import { GAME_PHASES } from "../shared/game.js";
import { emitGameActionWithAck } from "./gameActionDelivery.js";
import { completePendingMatchRoom } from "./matchTransition.js";
import { preloadPlayableReady as defaultPreloadPlayableReady } from "./playableReadyPreload.js";

export function useMatchActions({
  matchSuccess,
  matchSuccessRef,
  room,
  socket,
  showToast = () => {},
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

  const startPractice = useCallback((options) => {
    startPracticeTransition({
      options,
      preloadPlayableReady: defaultPreloadPlayableReady,
      setMatchStart,
      setMatchSuccess,
      showToast,
      socket
    });
  }, [setMatchStart, setMatchSuccess, showToast, socket]);

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
    emitGameActionWithAck(socket, { roomCode: room.code, action }, {
      onUnconfirmed: () => {
        showToast("操作确认超时，正在同步对局状态", "warning");
        socket?.emit("room:resume", { roomCode: room.code, resumeReason: "action-ack-timeout" });
      }
    });
  }, [room, showToast, socket]);

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
    startMatch,
    startPractice
  };
}

export function startPracticeTransition({
  options,
  now = Date.now,
  preloadPlayableReady = defaultPreloadPlayableReady,
  setMatchStart,
  setMatchSuccess,
  showToast = () => {},
  socket
}) {
  try {
    void preloadPlayableReady({ includePixi: true, mode: "spark", reason: "practice-start" });
  } catch {
    // Prewarm is opportunistic; room creation remains authoritative on the server.
  }
  setMatchSuccess(null);
  setMatchStart({ startedAt: now(), mode: "spark", practice: true });
  socket?.emit("practice:start", options, (ack = {}) => {
    if (ack.ok) return;
    setMatchStart(null);
    showToast(ack.error || "暂时无法开始人机练习", "error");
  });
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
