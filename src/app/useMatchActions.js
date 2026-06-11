import { useCallback } from "react";
import { completePendingMatchRoom } from "./matchTransition.js";

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
    setMatchSuccess(null);
    setMatchStart({ startedAt: Date.now(), mode });
    socket?.emit("match:join", { mode });
  }, [setMatchStart, setMatchSuccess, socket]);

  const cancelMatch = useCallback(() => {
    socket?.emit("match:leave");
    setMatchStart(null);
  }, [setMatchStart, socket]);

  const completeMatchSuccess = useCallback(() => {
    if (!matchSuccess) return;
    setRoom(completePendingMatchRoom(matchSuccessRef, matchSuccess.room));
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
