import { GAME_PHASES } from "./gamePhases.js";

// Operates only on the cloned public view, never on the authoritative game.
export function concealHiddenHandLocations(view, viewerColor) {
  if (view.phase === GAME_PHASES.finished) return;
  const hiddenIds = new Set(view.points.filter((point) => point.hiddenHand
    && !point.hiddenHand.exposed && point.hiddenHand.owner !== viewerColor).map((point) => point.id));
  for (const hand of view.suspendedHiddenHands ?? []) {
    if (hand.color !== viewerColor) hiddenIds.add(hand.id);
  }
  view.history = (view.history ?? []).map((entry) => {
    if (entry.effectType !== "hidden-hand" || entry.color === viewerColor || !hiddenIds.has(entry.id)) return entry;
    return { ...entry, id: null, concealed: true };
  });
  view.suspendedHiddenHands = (view.suspendedHiddenHands ?? []).filter((hand) => hand.color === viewerColor);
  const pending = view.pendingSkill;
  if (pending?.effectType === "hidden-hand" && pending.color !== viewerColor) {
    view.pendingSkill = {
      ...pending, targetId: null, affectedPointIds: [], erasedPointIds: [], secondaryRemovalIds: [],
      markedPointIds: [], removalMarkIds: [], removedStones: [], row: null
    };
  }
}
