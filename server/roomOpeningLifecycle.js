import { GAME_PHASES } from "../src/shared/game.js";

export function createRoomOpeningLifecycle({
  appendSystem,
  broadcastRoom,
  scheduleInitialPassiveSkill,
  maybeStartPassiveSkill,
  now = () => Date.now()
}) {
  function completeRoomOpening(room, io) {
    if (room.game.phase !== GAME_PHASES.opening) return false;

    room.game.phase = GAME_PHASES.playing;
    room.lastTick = now();
    appendSystem(room, "\u5bf9\u5c40\u5f00\u59cb\u3002", { kind: "game-start" });
    broadcastRoom(io, room);
    scheduleInitialPassiveSkill(room, io);
    return true;
  }

  function startInitialPassiveSkillNow(room, io) {
    return maybeStartPassiveSkill(room, io);
  }

  return {
    completeRoomOpening,
    startInitialPassiveSkillNow
  };
}
