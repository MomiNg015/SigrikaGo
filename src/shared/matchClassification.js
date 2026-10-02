import { rankToStep } from "./rankProgression.js";
import { SIGRIKA_CANDY_DUEL } from "./sigrikaCandyArc.js";

export const MATCH_EXPANSION_DELAY_MS = 15000;
export const RATED_RANK_DISTANCE = 2;

export function rankDistance(first, second) {
  // There is no zero rank: 1 kyu and 1 dan are adjacent.
  const ordinal = (rank) => {
    const step = rankToStep(rank);
    return step > 0 ? step - 1 : step;
  };
  return Math.abs(ordinal(first) - ordinal(second));
}

export function roomMatchClassification(room) {
  if (room.mode === "team" || room.team || room.practice || room.sigrikaCandyDuel
    || ["practice", SIGRIKA_CANDY_DUEL.matchSource].includes(room.matchSource)) return null;
  return room.rated === false
    ? { id: "friendly", label: "友谊对局" }
    : { id: "rated", label: "升降级对局" };
}
