import { GAME_PHASES } from "../src/shared/game.js";

export function createRoomRestoreLifecycle({
  closeRoom,
  scheduleRoomClose,
  startGameClock,
  completeRoomOpening,
  scheduleGameStart,
  schedulePendingSkillResolution,
  schedulePendingRoomDeadlines,
  scheduleEmptyActiveRoomClose,
  now = Date.now
}) {
  function resumeRoomTimers(room, io) {
    if (room.game.phase === GAME_PHASES.finished) {
      return resumeFinishedRoom(room, io);
    }
    if (room.game.phase === GAME_PHASES.opening) {
      return resumeOpeningRoom(room, io);
    }
    return resumeActiveRoom(room, io);
  }

  function resumeFinishedRoom(room, io) {
    if (room.closesAt && room.closesAt <= now()) {
      closeRoom(room.code, io, { reason: "finished-room-close" });
      return false;
    }
    scheduleRoomClose(room.code, io);
    return true;
  }

  function resumeOpeningRoom(room, io) {
    startGameClock(room, io);
    if (room.openingEndsAt <= now()) completeRoomOpening(room, io);
    else scheduleGameStart(room, io);
    return true;
  }

  function resumeActiveRoom(room, io) {
    if (room.game.phase === GAME_PHASES.skillPreview) {
      if (!schedulePendingSkillResolution(room, io)) {
        room.game.phase = GAME_PHASES.playing;
        room.game.pendingSkill = null;
      }
    }
    startGameClock(room, io);
    schedulePendingRoomDeadlines(room, io);
    scheduleEmptyActiveRoomClose(room, io);
    return true;
  }

  return {
    resumeRoomTimers
  };
}
