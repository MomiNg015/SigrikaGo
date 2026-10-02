import { GAME_PHASES, restoreSuspendedHiddenHands } from "../src/shared/game.js";

export const INITIAL_PASSIVE_SKILL_DELAY_MS = 3000;

export function createRoomDeadlineScheduler({
  rooms,
  scheduleRoomTimeout,
  appendSystem,
  broadcastRoom,
  completeRoomOpening,
  startInitialPassiveSkillNow,
  now = () => Date.now()
}) {
  function scheduleGameStart(room, io) {
    const delay = Math.max(0, room.openingEndsAt - now());
    scheduleRoomTimeout(room, () => {
      const latest = rooms.get(room.code);
      if (!latest) return;
      completeRoomOpening(latest, io);
    }, delay);
  }

  function scheduleInitialPassiveSkill(room, io) {
    scheduleRoomTimeout(room, () => {
      const latest = rooms.get(room.code);
      if (!latest || latest.game.phase !== GAME_PHASES.playing) return;
      if (startInitialPassiveSkillNow(latest, io)) broadcastRoom(io, latest);
    }, INITIAL_PASSIVE_SKILL_DELAY_MS);
  }

  function scheduleCountingTimeout(room, io) {
    const delay = Math.max(0, (room.countingDeadline ?? now()) - now());
    scheduleRoomTimeout(room, () => {
      const latest = rooms.get(room.code);
      if (latest?.game.phase === GAME_PHASES.countingRequested && latest.countingDeadline && now() >= latest.countingDeadline) {
        restoreSuspendedHiddenHands(latest.game);
        latest.game.phase = GAME_PHASES.playing;
        latest.game.scoring = null;
        latest.countingDeadline = null;
        appendSystem(latest, "数子申请超时，视为不同意数子。");
        broadcastRoom(io, latest);
      }
    }, delay);
  }

  function scheduleDrawTimeout(room, io) {
    const delay = Math.max(0, (room.drawDeadline ?? now()) - now());
    scheduleRoomTimeout(room, () => {
      const latest = rooms.get(room.code);
      if (latest?.game.phase === GAME_PHASES.drawRequested && latest.drawDeadline && now() >= latest.drawDeadline) {
        latest.game.phase = GAME_PHASES.playing;
        latest.game.drawRequest = null;
        latest.drawDeadline = null;
        appendSystem(latest, "和棋申请超时，对局继续。");
        broadcastRoom(io, latest);
      }
    }, delay);
  }

  function scheduleResultReviewTimeout(roomOrCode, io) {
    const room = typeof roomOrCode === "string" ? rooms.get(roomOrCode) : roomOrCode;
    if (!room) return;
    const delay = Math.max(0, (room.game.scoring?.resultDeadline ?? now()) - now());
    scheduleRoomTimeout(room, () => {
      const latest = rooms.get(room.code);
      const deadline = latest?.game.scoring?.resultDeadline;
      if (latest?.game.phase === GAME_PHASES.resultReview && deadline && now() >= deadline) {
        latest.game.phase = GAME_PHASES.playing;
        latest.game.scoring = null;
        appendSystem(latest, "数子结果确认超时，对局继续。");
        broadcastRoom(io, latest);
      }
    }, delay);
  }

  function schedulePendingRoomDeadlines(room, io) {
    if (room.game.phase === GAME_PHASES.countingRequested && room.countingDeadline) {
      scheduleCountingTimeout(room, io);
    }
    if (room.game.phase === GAME_PHASES.drawRequested && room.drawDeadline) {
      scheduleDrawTimeout(room, io);
    }
    if (room.game.phase === GAME_PHASES.resultReview && room.game.scoring?.resultDeadline) {
      scheduleResultReviewTimeout(room.code, io);
    }
  }

  return {
    scheduleGameStart,
    scheduleInitialPassiveSkill,
    scheduleCountingTimeout,
    scheduleDrawTimeout,
    scheduleResultReviewTimeout,
    schedulePendingRoomDeadlines
  };
}
