import { CHARACTERS } from "./characters.js";
import {
  NEUTRAL_STONES,
  canSprayTransformStone,
  captureCreditOwner,
  isPlayerColor,
  opponent
} from "./gameConstants.js";
import { activeNeighbors, getPoint, parsePointId, pointId } from "./gameBoard.js";
import { collectGroup } from "./gameGroups.js";
import { HIDDEN_HAND_NOTICE } from "./gameStoneActions.js";
import { fail, ok } from "./gameActionResult.js";
import {
  applyExtraSkillCost,
  applySkillCost,
  clearOwnedBoardMarkers,
  clearStone,
  cloneState,
  resolveCapturesAfterMutation
} from "./gameSkillState.js";

export function erasePoint(state, color, id, options = {}) {
  const next = cloneState(state);
  const point = getPoint(next, id);
  if (!point?.valid) return fail("该交叉点已不可用");
  if (point.stone) return fail("只能抹除空交叉点");
  delete point.protocolBan;
  point.valid = false;
  point.mark = null;
  point.skillEffect = "erased-point";
  point.neighbors = [];
  for (const other of next.points) {
    other.neighbors = other.neighbors.filter((neighborId) => neighborId !== id);
  }
  next.skillUses[color] -= 1;
  applySkillCost(next, color, options.skill ?? "sigrika");
  next.ko = null;
  next.history.push({ type: "skill", skill: "星辰符文", effectType: "erase-point", color, id, moveNumber: next.moveNumber });
  if (options.skillName) next.history[next.history.length - 1].skill = options.skillName;
  return ok(resolveCapturesAfterMutation(next, color, options.consumesTurn ?? false, "skillRemovals"));
}

export function protocolTakeover(state, color, id, options = {}) {
  const next = cloneState(state);
  const point = getPoint(next, id);
  if (!point?.valid) return fail("必须指定有效交叉点");
  if (point.stone) return fail("只能指定空置交叉点");
  if (point.protocolBan) return fail("该交叉点已有禁入协议");

  point.protocolBan = {
    owner: color,
    bannedColor: opponent(color),
    effect: "protocol-takeover"
  };
  point.skillEffect = "protocol-takeover";
  point.skillEffectOwner = color;
  next.skillUses[color] -= 1;
  applySkillCost(next, color, options.skill ?? "mornye");
  next.ko = null;
  next.history.push({
    type: "skill",
    skill: options.skillName ?? "协议接管",
    effectType: "protocol-takeover",
    color,
    id,
    bannedColor: opponent(color),
    moveNumber: next.moveNumber
  });
  return ok(resolveCapturesAfterMutation(next, color, options.consumesTurn ?? false, "skillRemovals"));
}

export function flipStone(state, color, id, options = {}) {
  const next = cloneState(state);
  const point = getPoint(next, id);
  if (!point?.valid || !point.stone) return fail("必须指定棋盘上的棋子");
  if (!isPlayerColor(point.stone)) return fail("只能反色黑白棋子");
  const originalColor = point.stone;
  const removalOwner = opponent(originalColor);
  point.stone = opponent(point.stone);
  point.colorIllusion = null;
  point.skillEffect = "flipped-stone";
  next.skillRemovals ??= { black: 0, white: 0 };
  next.skillRemovals[removalOwner] = (next.skillRemovals[removalOwner] ?? 0) + 1;
  next.skillUses[color] -= 1;
  applySkillCost(next, color, options.skill ?? "denia");
  next.ko = null;
  next.history.push({ type: "skill", skill: "染移", effectType: "flip-stone", color, id, skillRemovalOwner: removalOwner, moveNumber: next.moveNumber });
  if (options.skillName) next.history[next.history.length - 1].skill = options.skillName;
  return ok(resolveCapturesAfterMutation(next, color, options.consumesTurn ?? true, "skillRemovals"));
}

export function sprayStone(state, color, id, options = {}) {
  const next = cloneState(state);
  const target = getPoint(next, id);
  if (!canSprayTransformStone(target)) return fail("必须指定非喷涂、非隐藏的棋子");

  const candidates = next.points.filter((point) => point.id !== id && canSprayTransformStone(point));
  const replayRandomTarget = Object.hasOwn(options, "randomTargetId") ? getPoint(next, options.randomTargetId) : null;
  const randomTarget = Object.hasOwn(options, "randomTargetId")
    ? (replayRandomTarget?.id !== id && canSprayTransformStone(replayRandomTarget) ? replayRandomTarget : null)
    : candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
  const transformed = [];
  const immediateRemovals = [];
  next.skillRemovals ??= { black: 0, white: 0 };

  for (const point of [target, randomTarget].filter(Boolean)) {
    const from = point.stone;
    const owner = captureCreditOwner(from);
    if (owner) {
      next.skillRemovals[owner] = (next.skillRemovals[owner] ?? 0) + 1;
      immediateRemovals.push({ id: point.id, from, owner });
    }
    point.stone = NEUTRAL_STONES.spray;
    point.colorIllusion = null;
    point.hiddenHand = null;
    point.skillEffect = "spray-stone";
    transformed.push({ id: point.id, from, to: NEUTRAL_STONES.spray });
  }

  next.skillUses[color] -= 1;
  applySkillCost(next, color, options.skill ?? "lynae");
  next.ko = null;
  const cleanupRemovals = [];
  next.history.push({
    type: "skill",
    effectType: "spray-stone",
    skill: options.skillName ?? "流光溢彩",
    color,
    id,
    randomTargetId: randomTarget?.id ?? null,
    transformed,
    immediateRemovals,
    cleanupRemovals,
    moveNumber: next.moveNumber
  });

  return ok(resolveCapturesAfterMutation(
    next,
    color,
    options.consumesTurn ?? true,
    "skillRemovals",
    cleanupRemovals
  ));
}

export function rowSlash(state, color, id, options = {}) {
  const next = cloneState(state);
  const target = getPoint(next, id);
  if (!target?.valid) return fail("必须指定有效交叉点");

  const row = target.y;
  const removedByColor = {};
  const directRemovals = [];
  next.skillRemovals ??= { black: 0, white: 0 };

  for (const point of next.points) {
    if (!point.valid || point.y !== row || !point.stone) continue;
    const from = point.stone;
    removedByColor[from] = (removedByColor[from] ?? 0) + 1;
    const owner = captureCreditOwner(from);
    if (owner) {
      next.skillRemovals[owner] = (next.skillRemovals[owner] ?? 0) + 1;
    }
    directRemovals.push({ id: point.id, from, owner });
    clearStone(next, point.id);
  }

  const directRemoved = directRemovals.length;
  const overclockAdded = directRemoved * 2;
  next.skillUses[color] -= 1;
  applySkillCost(next, color, options.skill ?? "qiuyuan");
  applyExtraSkillCost(next, color, overclockAdded, {
    characterId: options.skill?.characterId ?? "qiuyuan",
    reason: "row-slash-direct-removals"
  });
  next.ko = null;
  next.rowEffects = [
    ...(next.rowEffects ?? []).filter((effect) => effect.owner !== color),
    { effectType: "row-slash", owner: color, clearAfterColor: opponent(color), y: row, id }
  ];
  const cleanupRemovals = [];
  next.history.push({
    type: "skill",
    effectType: "row-slash",
    skill: options.skillName ?? "一斩足矣",
    color,
    id,
    row,
    directRemoved,
    overclockAdded,
    removed: directRemoved,
    removedByColor,
    directRemovals,
    cleanupRemovals,
    moveNumber: next.moveNumber
  });

  const resolved = resolveCapturesAfterMutation(
    next,
    color,
    options.consumesTurn ?? true,
    "skillRemovals",
    cleanupRemovals
  );
  if (options.consumesTurn ?? true) resolved.passes = 0;
  return ok(resolved);
}

export function libertyPurge(state, color, id, options = {}) {
  const next = cloneState(state);
  const point = getPoint(next, id);
  if (!point?.valid) return fail("必须指定有效交叉点");
  if (point?.stone) {
    if (isUnexposedOpponentHiddenHand(point, color)) {
      point.hiddenHand.exposed = true;
      return ok(next, { notices: [HIDDEN_HAND_NOTICE], revealedOnly: true });
    }
    return fail("该交叉点已有棋子");
  }
  if (next.ko === id) return fail("此处为劫禁着点");
  if (point.protocolBan?.bannedColor === color) return fail("该交叉点为禁入点");

  point.stone = color;
  point.hiddenHand = null;
  point.colorIllusion = null;

  const normalCaptures = [];
  let creditedCaptures = 0;
  for (const neighbor of activeNeighbors(next, point)) {
    if (neighbor.stone && neighbor.stone !== color) {
      const group = collectGroup(next, neighbor.id);
      if (group.liberties.size === 0) {
        normalCaptures.push(...group.stones);
        if (captureCreditOwner(group.color) === color) creditedCaptures += group.stones.length;
      }
    }
  }
  for (const stone of normalCaptures) clearStone(next, stone);

  const ownGroup = collectGroup(next, id);
  if (ownGroup.liberties.size === 0) return fail("禁自杀");

  const purgeGroups = oneLibertyGroups(next);
  const directRemovals = [];
  const removedByColor = {};
  let rawOverclockDelta = 0;
  let hiddenHandRemoved = false;
  next.skillRemovals ??= { black: 0, white: 0 };

  for (const group of purgeGroups) {
    const owner = captureCreditOwner(group.color);
    removedByColor[group.color] = (removedByColor[group.color] ?? 0) + group.stones.length;
    rawOverclockDelta += group.color === color ? -group.stones.length : group.stones.length;
    if (owner) {
      next.skillRemovals[owner] = (next.skillRemovals[owner] ?? 0) + group.stones.length;
    }
    for (const stone of group.stones) {
      const removedPoint = getPoint(next, stone);
      if (removedPoint?.hiddenHand && !removedPoint.hiddenHand.exposed) hiddenHandRemoved = true;
      directRemovals.push({ id: stone, from: group.color, owner });
      clearStone(next, stone);
    }
  }

  next.captures[color] += creditedCaptures;
  next.skillUses[color] -= 1;
  applySkillCost(next, color, options.skill ?? "chisa");
  const overclockAdded = Math.max(0, rawOverclockDelta);
  applyExtraSkillCost(next, color, overclockAdded, {
    characterId: options.skill?.characterId ?? "chisa",
    reason: "liberty-purge-snapshot-removals"
  });
  next.ko = null;
  clearOwnedBoardMarkers(next, color);
  const removalMarkIds = directRemovals.map((removal) => removal.id);
  next.libertyPurgeMarks = removalMarkIds.length
    ? [{ effectType: "liberty-purge", owner: color, clearAfterColor: opponent(color), pointIds: removalMarkIds }]
    : [];
  const cleanupRemovals = [];
  next.history.push({
    type: "skill",
    effectType: "liberty-purge",
    skill: options.skillName ?? "虚湮解弦",
    color,
    id,
    placedId: id,
    captures: normalCaptures,
    removed: directRemovals.length,
    removedByColor,
    directRemovals,
    cleanupRemovals,
    rawOverclockDelta,
    overclockAdded,
    removalMarkIds,
    hiddenHandRemoved,
    moveNumber: next.moveNumber
  });

  const resolved = resolveCapturesAfterMutation(
    next,
    color,
    options.consumesTurn ?? true,
    "skillRemovals",
    cleanupRemovals
  );
  if (options.consumesTurn ?? true) resolved.passes = 0;
  resolved.ko = null;
  const notices = hiddenHandRemoved ? [HIDDEN_HAND_NOTICE] : [];
  return ok(resolved, { notices });
}

export function randomBlast(state, color, options = {}) {
  const next = cloneState(state);
  const size = Math.max(1, Number(options.skill?.params?.size ?? 3) || 3);
  const radius = Math.floor(size / 2);
  const center = options.centerId ? parsePointId(options.centerId) : null;
  const randomCenter = center ? null : randomBlastStoneCenter(next, radius);
  if (!center && !randomCenter) return fail("棋盘上没有可作为技能中心的棋子");
  const centerX = center ? clampBlastCenter(center.x, next.size, radius) : randomCenter.x;
  const centerY = center ? clampBlastCenter(center.y, next.size, radius) : randomCenter.y;
  let removed = 0;
  const removedByColor = { black: 0, white: 0 };
  const marked = [];

  for (let y = centerY - radius; y <= centerY + radius; y += 1) {
    for (let x = centerX - radius; x <= centerX + radius; x += 1) {
      if (x < 0 || y < 0 || x >= next.size || y >= next.size) continue;
      const point = getPoint(next, pointId(x, y));
      if (!point?.valid) continue;
      if (point.stone) {
        removedByColor[point.stone] = (removedByColor[point.stone] ?? 0) + 1;
        clearStone(next, point.id);
        removed += 1;
      }
      point.skillEffect = "blast-marker";
      point.skillEffectOwner = color;
      marked.push(point.id);
    }
  }

  next.skillUses[color] -= 1;
  next.skillRemovals ??= { black: 0, white: 0 };
  next.skillRemovals.black = (next.skillRemovals.black ?? 0) + (removedByColor.white ?? 0);
  next.skillRemovals.white = (next.skillRemovals.white ?? 0) + (removedByColor.black ?? 0);
  applySkillCost(next, color, options.skill ?? "baconbits");
  next.ko = null;
  next.history.push({
    type: "skill",
    effectType: "random-blast",
    skill: options.skillName ?? "猪小仙爆炸",
    color,
    id: pointId(centerX, centerY),
    removed,
    removedByColor,
    marked,
    moveNumber: next.moveNumber
  });
  return ok(resolveCapturesAfterMutation(next, color, options.consumesTurn ?? false, "skillRemovals"));
}

export function doubleMove(state, color, options = {}) {
  const next = cloneState(state);
  const moves = Math.max(2, Math.floor(Number(options.skill?.params?.moves ?? 2)) || 2);
  next.extraTurn = {
    effectType: "double-move",
    owner: color,
    remaining: moves,
    used: 0
  };
  next.skillUses[color] -= 1;
  applySkillCost(next, color, options.skill ?? "changli");
  next.ko = null;
  next.history.push({
    type: "skill",
    effectType: "double-move",
    skill: options.skillName ?? "ChangLi double move",
    color,
    moves,
    moveNumber: next.moveNumber
  });
  return ok(next);
}

function oneLibertyGroups(state) {
  const groups = [];
  const visited = new Set();
  for (const point of state.points) {
    if (!point.valid || !point.stone || visited.has(point.id)) continue;
    const group = collectGroup(state, point.id);
    group.stones.forEach((stone) => visited.add(stone));
    if (group.liberties.size === 1) groups.push(group);
  }
  return groups;
}

function isUnexposedOpponentHiddenHand(point, color) {
  return point.hiddenHand && !point.hiddenHand.exposed && point.hiddenHand.owner !== color;
}

function randomBlastStoneCenter(state, radius) {
  const min = radius;
  const max = state.size - radius - 1;
  const candidates = state.points.filter((point) => {
    if (!point.valid || !point.stone) return false;
    const { x, y } = parsePointId(point.id);
    if (x <= 0 || y <= 0 || x >= state.size - 1 || y >= state.size - 1) return false;
    return x >= min && x <= max && y >= min && y <= max;
  });
  if (!candidates.length) return null;
  const point = candidates[Math.floor(Math.random() * candidates.length)];
  return parsePointId(point.id);
}

function clampBlastCenter(value, boardSize, radius) {
  const min = radius;
  const max = boardSize - radius - 1;
  if (min > max) return Math.floor(boardSize / 2);
  return Math.min(max, Math.max(min, value));
}
