import { useCallback } from "react";
import { GAME_PHASES } from "../shared/game.js";
import { CAPTURE_CHALLENGE_MODE } from "../shared/captureChallenge.js";
import { PRACTICE_BOT_PORTRAIT_URL } from "../shared/practiceMode.js";
import { SIGRIKA_CANDY_DUEL_AVAILABILITY } from "../shared/sigrikaCandyArc.js";
import { emitGameActionWithAck } from "./gameActionDelivery.js";
import { completePendingMatchRoom } from "./matchTransition.js";
import { preloadPlayableReady as defaultPreloadPlayableReady } from "./playableReadyPreload.js";
import { practiceEngineClient } from "../practice/practiceEngineClient.js";
import { LOCAL_PRACTICE_VERSION } from "../shared/localPractice.js";

const pendingPracticeStarts = new WeakMap();
export function cancelPracticeStart(socket) {
  if (socket) pendingPracticeStarts.delete(socket);
}

export function useMatchActions({
  matchSuccess,
  matchSuccessRef,
  room,
  socket,
  showToast = () => {},
  updateUser = () => {},
  setMatchStart,
  setMatchSuccess,
  setRoom,
  setView
}) {
  const startMatch = useCallback((mode = "spark", lineup) => {
    startMatchTransition({
      mode,
      lineup,
      showToast,
      preloadPlayableReady: defaultPreloadPlayableReady,
      setMatchStart,
      setMatchSuccess,
      socket
    });
  }, [setMatchStart, setMatchSuccess, socket, showToast]);

  const startPractice = useCallback((options) => {
    startPracticeTransition({
      options,
      preloadPlayableReady: defaultPreloadPlayableReady,
      setMatchStart,
      setMatchSuccess,
      showToast,
      socket,
      updateUser
    });
  }, [setMatchStart, setMatchSuccess, showToast, socket, updateUser]);

  const startSigrikaDuel = useCallback((options = {}) => {
    startSigrikaDuelTransition({
      ...options,
      preloadPlayableReady: defaultPreloadPlayableReady,
      setMatchStart,
      setMatchSuccess,
      showToast,
      socket
    });
  }, [setMatchStart, setMatchSuccess, showToast, socket]);

  const cancelMatch = useCallback(() => {
    cancelPracticeStart(socket);
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
    startPractice,
    startSigrikaDuel
  };
}

export function startSigrikaDuelTransition({
  now = Date.now,
  preloadPlayableReady = defaultPreloadPlayableReady,
  setMatchStart,
  setMatchSuccess,
  showToast = () => {},
  onStatusChange = () => {},
  socket,
  updateUser = () => {}
}) {
  try {
    void preloadPlayableReady({ includePixi: true, mode: "spark", reason: "sigrika-candy-duel-start" });
  } catch {
    // Prewarm is opportunistic; the special room remains authoritative on the server.
  }
  setMatchSuccess(null);
  setMatchStart({ startedAt: now(), mode: "spark", specialDuel: true });
  socket?.emit("sigrika-candy:duel-start", {}, (ack = {}) => {
    if (ack.ok) return;
    if (ack.status) {
      onStatusChange(ack.status);
    } else if (ack.code === "special_room_reset") {
      onStatusChange(SIGRIKA_CANDY_DUEL_AVAILABILITY.available);
    }
    if (ack.sigrikaCandyArc) {
      updateUser((current) => current ? { ...current, sigrikaCandyArc: ack.sigrikaCandyArc } : current);
    }
    setMatchStart(null);
    showToast(ack.error || "暂时无法进入特殊对局", "error");
  });
}

export async function startPracticeTransition({
  options,
  now = Date.now,
  preloadPlayableReady = defaultPreloadPlayableReady,
  prepareEngine = (difficulty) => practiceEngineClient.ensureReady(difficulty),
  setMatchStart,
  setMatchSuccess,
  showToast = () => {},
  socket
}) {
  if (!socket || socket.connected === false) {
    showToast("连接尚未就绪，请稍后重试", "warning");
    return;
  }
  const attempt = {};
  const connectionId = socket.id;
  pendingPracticeStarts.set(socket, attempt);
  if (options?.challenge === CAPTURE_CHALLENGE_MODE && typeof Image !== "undefined") {
    const portrait = new Image();
    portrait.src = PRACTICE_BOT_PORTRAIT_URL;
  }
  try {
    void preloadPlayableReady({ includePixi: true, mode: "spark", reason: "practice-start" });
  } catch {
    // Prewarm is opportunistic; room creation remains authoritative on the server.
  }
  setMatchSuccess(null);
  setMatchStart({ startedAt: now(), mode: "spark", practice: true });
  try {
    await prepareEngine(options.difficulty);
  } catch {
    if (pendingPracticeStarts.get(socket) !== attempt) return;
    pendingPracticeStarts.delete(socket);
    setMatchStart(null);
    showToast("本机陪练引擎加载失败，请检查网络后重试，或使用新版浏览器。", "error");
    return;
  }
  if (pendingPracticeStarts.get(socket) !== attempt) return;
  pendingPracticeStarts.delete(socket);
  if (socket.connected === false || socket.id !== connectionId) {
    setMatchStart(null);
    showToast("连接已变化，请重新开始陪练", "warning");
    return;
  }
  socket.emit("practice:start", { ...options, engineVersion: LOCAL_PRACTICE_VERSION }, (ack = {}) => {
    if (ack.ok) return;
    setMatchStart(null);
    showToast(ack.error || "暂时无法开始人机练习", "error");
  });
}

export function startMatchTransition({
  mode = "spark",
  lineup,
  showToast = () => {},
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
  if (mode === "team") {
    socket?.emit("match:join", { mode, lineup }, (ack = {}) => {
      if (ack.ok) return;
      setMatchStart(null);
      showToast(ack.error || "暂时无法开始队际赛", "error");
    });
  } else socket?.emit("match:join", { mode });
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
