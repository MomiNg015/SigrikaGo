import { CHARACTERS } from "./characters.js";
import { captureCreditOwner, opponent } from "./gameConstants.js";
import { getPoint } from "./gameBoard.js";
import { collectGroup } from "./gameGroups.js";

export function cloneState(state) {
  return structuredClone(state);
}

export function clearStone(state, id) {
  const point = getPoint(state, id);
  if (!point) return;
  point.stone = null;
  point.hiddenHand = null;
  point.colorIllusion = null;
}

export function clearOwnedBoardMarkers(state, ownerColor) {
  for (const point of state.points) {
    if (point.skillEffect !== "blast-marker") continue;
    if (point.skillEffectOwner !== ownerColor) continue;
    point.skillEffect = null;
    point.skillEffectOwner = null;
  }
  state.rowEffects = (state.rowEffects ?? []).filter((effect) => effect.owner !== ownerColor);
}

export function clearExpiredLibertyPurgeMarks(state) {
  state.libertyPurgeMarks = (state.libertyPurgeMarks ?? []).filter((mark) => mark.owner !== state.turn);
}

export function applySkillCost(state, color, skillOrCharacterId) {
  const skill = typeof skillOrCharacterId === "string"
    ? CHARACTERS[skillOrCharacterId]?.skill
    : skillOrCharacterId;
  const costType = skill?.costType ?? "numeric";
  const costValue = String(skill?.costValue ?? skill?.cost ?? 0);
  if (costType === "numeric") {
    const cost = Number(costValue);
    state.skillCosts = state.skillCosts ?? { black: 0, white: 0 };
    if (Number.isFinite(cost)) {
      state.skillCosts[color] = (state.skillCosts[color] ?? 0) + cost;
    }
  }
  state.skillCostNotes = state.skillCostNotes ?? [];
  state.skillCostNotes.push({
    color,
    characterId: typeof skillOrCharacterId === "string" ? skillOrCharacterId : skill?.characterId ?? null,
    costType,
    costValue
  });
}

export function applyExtraSkillCost(state, color, cost, { characterId = null, reason = "" } = {}) {
  if (!Number.isFinite(cost) || cost <= 0) return;
  state.skillCosts = state.skillCosts ?? { black: 0, white: 0 };
  state.skillCosts[color] = (state.skillCosts[color] ?? 0) + cost;
  state.skillCostNotes = state.skillCostNotes ?? [];
  state.skillCostNotes.push({
    color,
    characterId,
    costType: "numeric",
    costValue: String(cost),
    reason
  });
}

export function resolveCapturesAfterMutation(state, actorColor, consumesTurn = true, counter = "captures", cleanupSink = null) {
  let changed = true;
  while (changed) {
    changed = false;
    const visited = new Set();
    for (const point of state.points) {
      if (!point.valid || !point.stone || visited.has(point.id)) continue;
      const group = collectGroup(state, point.id);
      group.stones.forEach((stone) => visited.add(stone));
      if (group.liberties.size === 0) {
        const removalOwner = captureCreditOwner(group.color);
        for (const stone of group.stones) clearStone(state, stone);
        cleanupSink?.push?.({ color: group.color, stones: [...group.stones], owner: removalOwner });
        if (counter === "skillRemovals") {
          state.skillRemovals ??= { black: 0, white: 0 };
          if (removalOwner) {
            state.skillRemovals[removalOwner] = (state.skillRemovals[removalOwner] ?? 0) + group.stones.length;
          }
        } else if (removalOwner) {
          state.captures[removalOwner] += group.stones.length;
        }
        changed = true;
      }
    }
  }
  if (consumesTurn) {
    state.turn = opponent(actorColor);
    state.moveNumber += 1;
    clearExpiredLibertyPurgeMarks(state);
  }
  return state;
}
