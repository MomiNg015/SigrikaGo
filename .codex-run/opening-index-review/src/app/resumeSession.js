import { GAME_PHASES } from "../shared/game.js";

export const LAST_ROOM_CODE_KEY = "sigrika-last-room-code";
export const DISMISSED_RESULT_ROOM_KEY = "sigrika-dismissed-result-room-code";

export function rememberPlayerRoom(room, storage = localStorage) {
  if (room?.code && room.role === "player" && room.game?.phase === GAME_PHASES.finished) {
    storage.removeItem(LAST_ROOM_CODE_KEY);
    return false;
  }
  if (!isResumablePlayerRoom(room)) return false;
  storage.setItem(LAST_ROOM_CODE_KEY, room.code);
  storage.removeItem(DISMISSED_RESULT_ROOM_KEY);
  return true;
}

export function isResumablePlayerRoom(room) {
  return Boolean(
    room?.code
      && room.role === "player"
      && room.game?.phase !== GAME_PHASES.finished
  );
}

export function clearLastRoomCode(storage = localStorage) {
  storage.removeItem(LAST_ROOM_CODE_KEY);
}

export function rememberDismissedResultRoom(roomCode, storage = localStorage) {
  if (!roomCode) return false;
  storage.setItem(DISMISSED_RESULT_ROOM_KEY, roomCode);
  storage.removeItem(LAST_ROOM_CODE_KEY);
  return true;
}

export function readDismissedResultRoom(storage = safeLocalStorage()) {
  return storage?.getItem(DISMISSED_RESULT_ROOM_KEY) ?? "";
}

function safeLocalStorage() {
  return typeof localStorage === "undefined" ? null : localStorage;
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

export function shouldShowResultModal(room, dismissedResultRoom, replayStep = null) {
  if (replayStep !== null) return false;
  if (!room || room.game?.phase !== "finished") return false;
  if (room.game?.winner?.invalid) return false;
  return dismissedResultRoom !== room.code;
}

export function shouldClearRoomOnReplayExit(replayStep) {
  return replayStep !== null;
}
