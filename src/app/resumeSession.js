export const LAST_ROOM_CODE_KEY = "sigrika-last-room-code";

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
  handlers.closeAllOverlays();
  handlers.setMatchStart(null);
  handlers.setMatchSuccess(null);
  handlers.setReplayStep(null);
  handlers.setPendingSkill(false);
  handlers.setDismissedResultRoom("");
  handlers.setRoom(payload.room);
  handlers.setView(payload.type === "room" ? "room" : "home");
  return true;
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
