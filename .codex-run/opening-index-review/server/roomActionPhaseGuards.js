import { GAME_PHASES } from "../src/shared/game.js";

export const ROOM_ACTION_PHASES = Object.freeze({
  move: Object.freeze([GAME_PHASES.playing]),
  pass: Object.freeze([GAME_PHASES.playing]),
  skill: Object.freeze([GAME_PHASES.playing]),
  resign: Object.freeze([
    GAME_PHASES.playing,
    GAME_PHASES.countingRequested,
    GAME_PHASES.drawRequested
  ])
});

export function validateRoomActionPhase(action, phase) {
  const allowedPhases = ROOM_ACTION_PHASES[action?.type];
  if (!allowedPhases || allowedPhases.includes(phase)) return null;
  return "\u5f53\u524d\u9636\u6bb5\u4e0d\u80fd\u6267\u884c\u8be5\u64cd\u4f5c";
}
