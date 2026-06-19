export const LAST_ROOM_CODE_KEY = "sigrika-last-room-code";
export const GOMOKU_RESULT_REVEAL_DELAY_MS = 2000;

export function rememberPlayerRoom(room, storage = localStorage) {
  if (!room?.code || room.role !== "player") return false;
  storage.setItem(LAST_ROOM_CODE_KEY, room.code);
  return true;
}

export function clearLastRoomCode(storage = localStorage) {
  storage.removeItem(LAST_ROOM_CODE_KEY);
}

export function buildRoomResumeRequest(storage = localStorage) {
  return {
    roomCode: storage.getItem(LAST_ROOM_CODE_KEY) ?? ""
  };
}

export function handleRoomResumePayload(payload, handlers) {
  if (!["result", "room"].includes(payload?.type) || !payload.room) return false;
  const room = payload.type === "room"
    ? { ...payload.room, __audioResumeBaseline: true }
    : payload.room;
  handlers.closeAllOverlays();
  handlers.setMatchStart(null);
  handlers.setMatchSuccess(null);
  handlers.setReplayStep(null);
  handlers.setPendingSkill(false);
  handlers.setDismissedResultRoom((current) => dismissedResultRoomAfterResume(payload, current));
  handlers.setRoom(room);
  handlers.setView(payload.type === "room" ? "room" : "home");
  return true;
}

export function dismissedResultRoomAfterResume(payload, currentDismissedResultRoom = "") {
  const roomCode = payload?.room?.code ?? "";
  if (payload?.type === "result" && roomCode && currentDismissedResultRoom === roomCode) {
    return currentDismissedResultRoom;
  }
  return "";
}

export function handleMissingRoomResumePayload(payload, currentRoom, handlers) {
  if (payload?.type !== "none" || !currentRoom?.code || currentRoom.role !== "player") return false;
  handlers.clearLastRoomCode();
  handlers.setMatchStart(null);
  handlers.setMatchSuccess(null);
  handlers.setReplayStep(null);
  handlers.setPendingSkill(false);
  handlers.setRoom(null);
  handlers.setView("home");
  handlers.showToast("房间已不存在，可能是服务器重启或房间已关闭", "danger");
  return true;
}

export function shouldShowResultModal(room, dismissedResultRoom, replayStep = null, { resultRevealReady = true } = {}) {
  if (replayStep !== null) return false;
  if (!room || room.game?.phase !== "finished") return false;
  if (room.game?.winner?.invalid) return false;
  if (isDelayedGomokuFiveResult(room, replayStep) && !resultRevealReady) return false;
  return dismissedResultRoom !== room.code;
}

export function shouldClearRoomOnReplayExit(replayStep) {
  return replayStep !== null;
}

export function isDelayedGomokuFiveResult(room, replayStep = null) {
  return replayStep === null
    && room?.game?.mode === "gomoku"
    && room?.game?.phase === "finished"
    && room?.game?.winner?.reason === "gomoku-five"
    && Array.isArray(room.game.winner.winningLine)
    && room.game.winner.winningLine.length >= 5
    && !room.game.winner.invalid;
}

export function gomokuResultRevealKey(room, replayStep = null) {
  if (!isDelayedGomokuFiveResult(room, replayStep)) return "";
  return [
    room.code ?? "",
    room.game.moveNumber ?? room.game.history?.length ?? 0,
    room.game.winner?.winnerColor ?? "",
    room.game.winner?.winningLine?.join("|") ?? ""
  ].join(":");
}
