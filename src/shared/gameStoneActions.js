import { GAME_PHASES } from "./gamePhases.js";
import { activeNeighbors, getPoint } from "./gameBoard.js";
import { opponent } from "./gameConstants.js";
import { createDerivedSkillState, voyageStarDefinitionFromSkill } from "./derivedSkills.js";
import { collectGroup } from "./gameGroups.js";
import { fail, ok } from "./gameActionResult.js";
import { gameModeFamily } from "./gameModes.js";
import { playGomokuMove } from "./gomokuRules.js";
import {
  applySkillCost,
  clearExpiredLibertyPurgeMarks,
  clearExpiredRowEffects,
  clearOwnedBoardMarkers,
  collectNeighborCaptures,
  clearStone,
  cloneState
} from "./gameSkillState.js";

export const HIDDEN_HAND_NOTICE = "发现隐藏手了！";

export function playMove(state, color, id, options = {}) {
  if (gameModeFamily(state.mode) === "gomoku") return playGomokuMove(state, color, id);
  return placeStone(state, color, id, { hidden: false, colorIllusion: options.colorIllusion });
}

export function playHiddenHand(state, color, id, options = {}) {
  const result = placeStone(state, color, id, { hidden: true, skill: options.skill ?? options.characterId ?? "aemeath" });
  if (result.ok && options.skillName) {
    result.state.history[result.state.history.length - 1].skill = options.skillName;
  }
  return result;
}

function placeStone(state, color, id, { hidden, skill = null, colorIllusion = undefined }) {
  if (state.phase !== GAME_PHASES.playing) return fail("对局当前不能落子");
  if (state.turn !== color) return fail("还没有轮到你");
  const next = cloneState(state);
  const point = getPoint(next, id);
  if (!point?.valid) return fail("该交叉点不可落子");
  if (point.stone) {
    if (!hidden && isUnexposedOpponentHiddenHand(point, color)) {
      revealHiddenHand(point);
      return ok(next, { notices: [HIDDEN_HAND_NOTICE] });
    }
    return fail("该交叉点已有棋子");
  }
  if (next.ko === id) return fail("此处为劫禁着点");

  if (isProtocolBannedEmptyPoint(point, color)) return fail("该交叉点为禁入点");
  const doubleMovePlacement = next.extraTurn?.effectType === "double-move" && next.extraTurn.owner === color;
  point.stone = color;
  if (doubleMovePlacement) {
    point.skillEffect = "double-move-stone";
    point.skillEffectOwner = color;
  }
  if (hidden) {
    point.hiddenHand = {
      owner: color,
      exposed: false,
      effect: "hidden-hand"
    };
  }
  applyColorIllusion(next, color, point, colorIllusion);

  const { removed, creditedCaptures } = collectNeighborCaptures(next, point, color);

  for (const stone of removed) clearStone(next, stone);

  const ownGroup = collectGroup(next, id);
  if (ownGroup.liberties.size === 0) return fail("禁自杀");
  const notices = revealCapturingHiddenHands(next, ownGroup, removed, color);

  next.captures[color] += creditedCaptures;
  next.ko = removed.length === 1 && ownGroup.stones.length === 1 && ownGroup.liberties.size === 1
    ? removed[0]
    : null;
  clearOwnedBoardMarkers(next, color);
  applyExtraTurnAfterNormalAction(next, color);
  clearExpiredRowEffects(next, color);
  clearExpiredLibertyPurgeMarks(next);
  next.passes = 0;
  next.moveNumber += 1;
  const hiddenHandRevealed = notices.includes(HIDDEN_HAND_NOTICE);
  next.history.push(hidden
    ? { type: "skill", skill: "小爱出击", effectType: "hidden-hand", color, id, captures: removed, hiddenHandRevealed, moveNumber: next.moveNumber }
    : { type: "move", color, id, captures: removed, colorIllusion: point.colorIllusion ?? null, hiddenHandRevealed, moveNumber: next.moveNumber });
  if (hidden) {
    next.skillUses[color] -= 1;
    applySkillCost(next, color, skill ?? "aemeath");
    const derivedSkill = createDerivedSkillState(voyageStarDefinitionFromSkill(skill), id);
    if (derivedSkill) {
      next.derivedSkills = {
        ...(next.derivedSkills ?? {}),
        [color]: derivedSkill
      };
    }
  }
  return ok(next, { notices });
}

function applyExtraTurnAfterNormalAction(state, color) {
  const extraTurn = state.extraTurn;
  if (extraTurn?.effectType !== "double-move" || extraTurn.owner !== color) {
    state.turn = opponent(color);
    return;
  }
  const remaining = Math.max(0, Number(extraTurn.remaining ?? 0) - 1);
  const used = Math.max(0, Number(extraTurn.used ?? 0) + 1);
  if (used === 2) {
    state.skillRemovals ??= { black: 0, white: 0 };
    state.skillRemovals[color] = (state.skillRemovals[color] ?? 0) + 1;
  }
  if (remaining > 0) {
    state.extraTurn = { ...extraTurn, remaining, used };
    state.turn = color;
    return;
  }
  state.extraTurn = null;
  state.turn = opponent(color);
}

function applyColorIllusion(state, color, point, override) {
  if (override !== undefined) {
    point.colorIllusion = override ? structuredClone(override) : null;
    return;
  }
  const passive = state.passives?.[color]?.colorIllusion;
  if (!passive?.active || Math.random() >= passive.probability) {
    point.colorIllusion = null;
    return;
  }
  point.colorIllusion = {
    owner: color,
    visibleAs: opponent(color),
    effect: "color-illusion-passive"
  };
}

export function exposeHiddenHands(state) {
  restoreSuspendedHiddenHands(state);
  let revealed = false;
  for (const point of state.points) {
    if (point.hiddenHand && revealHiddenHand(point)) revealed = true;
  }
  return revealed ? [HIDDEN_HAND_NOTICE] : [];
}

export function suspendUnexposedHiddenHands(state) {
  const suspended = state.suspendedHiddenHands ?? [];
  for (const point of state.points) {
    if (!point.stone || !point.hiddenHand || point.hiddenHand.exposed) continue;
    suspended.push({ id: point.id, color: point.stone });
    point.stone = null;
    point.hiddenHand = null;
  }
  state.suspendedHiddenHands = suspended;
  return state;
}

export function restoreSuspendedHiddenHands(state) {
  for (const hidden of state.suspendedHiddenHands ?? []) {
    const point = getPoint(state, hidden.id);
    if (!point?.valid || point.stone) continue;
    point.stone = hidden.color;
    point.hiddenHand = {
      owner: hidden.color,
      exposed: false,
      effect: "hidden-hand"
    };
  }
  state.suspendedHiddenHands = [];
  return state;
}

function isUnexposedOpponentHiddenHand(point, color) {
  return point.hiddenHand && !point.hiddenHand.exposed && point.hiddenHand.owner !== color;
}

function isProtocolBannedEmptyPoint(point, color) {
  return !point.stone && point.protocolBan?.bannedColor === color;
}

function revealHiddenHand(point) {
  if (!point.hiddenHand || point.hiddenHand.exposed) return false;
  point.hiddenHand.exposed = true;
  return true;
}

function revealCapturingHiddenHands(state, ownGroup, removed, color) {
  if (removed.length === 0) return [];
  let revealed = false;
  for (const stone of ownGroup.stones) {
    const point = getPoint(state, stone);
    if (point?.hiddenHand && revealHiddenHand(point)) revealed = true;
  }
  for (const removedId of removed) {
    const removedPoint = getPoint(state, removedId);
    if (!removedPoint) continue;
    for (const neighbor of activeNeighbors(state, removedPoint)) {
      if (neighbor.stone === color && neighbor.hiddenHand && revealHiddenHand(neighbor)) revealed = true;
    }
  }
  return revealed ? [HIDDEN_HAND_NOTICE] : [];
}
