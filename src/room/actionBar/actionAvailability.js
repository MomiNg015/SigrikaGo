import { GAME_PHASES } from "../../shared/game.js";

export function canRequestOpponentDecision({ phase, skillLocked = false, hasAnyStones = true, opponentConnected = true } = {}) {
  return phase === GAME_PHASES.playing && !skillLocked && hasAnyStones && opponentConnected !== false;
}
