import { CHARACTERS } from "./characters.js";

export const BOARD_SIZE = 13;
export const KOMI_STONES = 2.75;
export const COLORS = {
  black: "black",
  white: "white"
};
export const HIDDEN_HAND_NOTICE = "发现隐藏手了！";

export function opponent(color) {
  return color === COLORS.black ? COLORS.white : COLORS.black;
}

export function createGameState(players = []) {
  return {
    size: BOARD_SIZE,
    points: createPoints(),
    turn: COLORS.black,
    moveNumber: 0,
    passes: 0,
    captures: { black: 0, white: 0 },
    ko: null,
    history: [],
    players,
    skillUses: Object.fromEntries(players.map((p) => [p.color, configuredSkillUses(p)])),
    skillCosts: { black: 0, white: 0 },
    skillCostNotes: [],
    phase: "playing",
    scoring: null,
    suspendedHiddenHands: [],
    winner: null
  };
}

export function createPoints(size = BOARD_SIZE) {
  const points = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      points.push({
        id: pointId(x, y),
        x,
        y,
        valid: true,
        stone: null,
        mark: null,
        neighbors: baseNeighbors(x, y, size)
      });
    }
  }
  return points;
}

export function pointId(x, y) {
  return `${x},${y}`;
}

export function parsePointId(id) {
  const [x, y] = id.split(",").map(Number);
  return { x, y };
}

function baseNeighbors(x, y, size) {
  return [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1]
  ]
    .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < size && ny < size)
    .map(([nx, ny]) => pointId(nx, ny));
}

export function getPoint(state, id) {
  return state.points.find((p) => p.id === id);
}

export function activeNeighbors(state, point) {
  return point.neighbors
    .map((id) => getPoint(state, id))
    .filter((neighbor) => neighbor?.valid);
}

export function cloneState(state) {
  return structuredClone(state);
}

export function playMove(state, color, id) {
  return placeStone(state, color, id, { hidden: false });
}

function placeStone(state, color, id, { hidden }) {
  if (state.phase !== "playing") return fail("对局当前不能落子");
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

  point.stone = color;
  if (hidden) {
    point.hiddenHand = {
      owner: color,
      exposed: false,
      effect: "hidden-hand"
    };
  }

  const removed = [];
  for (const neighbor of activeNeighbors(next, point)) {
    if (neighbor.stone === opponent(color)) {
      const group = collectGroup(next, neighbor.id);
      if (group.liberties.size === 0) removed.push(...group.stones);
    }
  }

  for (const stone of removed) clearStone(next, stone);

  const ownGroup = collectGroup(next, id);
  if (ownGroup.liberties.size === 0) return fail("禁自杀");
  const notices = revealCapturingHiddenHands(next, ownGroup, removed, color);

  next.captures[color] += removed.length;
  next.ko = removed.length === 1 && ownGroup.stones.length === 1 && ownGroup.liberties.size === 1
    ? removed[0]
    : null;
  next.turn = opponent(color);
  next.passes = 0;
  next.moveNumber += 1;
  next.history.push(hidden
    ? { type: "skill", skill: "小爱出击", color, id, captures: removed, moveNumber: next.moveNumber }
    : { type: "move", color, id, captures: removed, moveNumber: next.moveNumber });
  if (hidden) {
    next.skillUses[color] -= 1;
    applySkillCost(next, color, "aemeath");
  }
  return ok(next, { notices });
}

export function passMove(state, color) {
  if (state.phase !== "playing") return fail("对局当前不能弃一手");
  if (state.turn !== color) return fail("还没有轮到你");
  const next = cloneState(state);
  next.turn = opponent(color);
  next.ko = null;
  next.passes += 1;
  next.moveNumber += 1;
  next.history.push({ type: "pass", color, moveNumber: next.moveNumber });
  if (next.passes >= 2) {
    next.phase = "counting-requested";
    suspendUnexposedHiddenHands(next);
    next.scoring = prepareScoringState(next);
  }
  return ok(next);
}

export function resignGame(state, color) {
  const next = cloneState(state);
  next.phase = "finished";
  next.winner = createResignResult(color);
  return ok(next);
}

export function createResignResult(resigningColor) {
  const winnerColor = opponent(resigningColor);
  return {
    winnerColor,
    reason: "resign",
    text: `${colorName(winnerColor)}\u4e2d\u76d8\u80dc`
  };
}

export function createTimeoutResult(timeoutColor) {
  const winnerColor = opponent(timeoutColor);
  return {
    winnerColor,
    reason: "timeout",
    text: `${colorName(winnerColor)}\u8d85\u65f6\u80dc`
  };
}

export function createDrawResult(reason = "agreement") {
  return {
    winnerColor: null,
    reason,
    text: "\u548c\u68cb"
  };
}

export function useSkill(state, color, skillOrCharacterId, targetId) {
  if (state.phase !== "playing") return fail("对局当前不能使用技能");
  if (state.turn !== color) return fail("还没有轮到你");
  if ((state.skillUses[color] ?? 0) <= 0) return fail("技能次数已经用完");
  const skill = normalizeSkillConfig(skillOrCharacterId);
  if (skill?.effectType === "erase-point") {
    return erasePoint(state, color, targetId, {
      skillName: skill.name,
      consumesTurn: !skill.freeTurn
    });
  }
  if (skill?.effectType === "flip-stone") {
    return flipStone(state, color, targetId, {
      skillName: skill.name,
      consumesTurn: !skill.freeTurn
    });
  }
  if (skill?.effectType === "hidden-hand") {
    return playHiddenHand(state, color, targetId, {
      skillName: skill.name,
      characterId: skill.characterId ?? "aemeath"
    });
  }
  return fail("未知角色技能");
}

function configuredSkillUses(player) {
  const skill = normalizeSkillConfig(player?.character?.skill ?? player?.skill ?? player?.characterId);
  return Number.isInteger(skill?.uses) ? skill.uses : 1;
}

export function normalizeSkillConfig(skillOrCharacterId) {
  if (skillOrCharacterId?.effectType) return skillOrCharacterId;
  const fallback = CHARACTERS[skillOrCharacterId];
  if (fallback?.skill?.id === "erase-point") {
    return {
      characterId: fallback.id,
      effectType: "erase-point",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 1,
      freeTurn: Boolean(fallback.skill.freeTurn),
      targetRule: "empty-point",
      params: {}
    };
  }
  if (fallback?.skill?.id === "flip-stone") {
    return {
      characterId: fallback.id,
      effectType: "flip-stone",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 1,
      freeTurn: Boolean(fallback.skill.freeTurn),
      targetRule: "stone",
      params: {}
    };
  }
  if (fallback?.skill?.id === "hidden-hand") {
    return {
      characterId: fallback.id,
      effectType: "hidden-hand",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 1,
      freeTurn: false,
      targetRule: "empty-point",
      params: {}
    };
  }
  return null;
}

export function playHiddenHand(state, color, id, options = {}) {
  const result = placeStone(state, color, id, { hidden: true });
  if (result.ok && options.skillName) {
    result.state.history[result.state.history.length - 1].skill = options.skillName;
  }
  return result;
}

export function erasePoint(state, color, id, options = {}) {
  const next = cloneState(state);
  const point = getPoint(next, id);
  if (!point?.valid) return fail("该交叉点已不可用");
  if (point.stone) return fail("只能抹除空交叉点");
  point.valid = false;
  point.mark = null;
  point.skillEffect = "erased-point";
  point.neighbors = [];
  for (const other of next.points) {
    other.neighbors = other.neighbors.filter((neighborId) => neighborId !== id);
  }
  next.skillUses[color] -= 1;
  applySkillCost(next, color, "sigrika");
  next.ko = null;
  next.history.push({ type: "skill", skill: "星辰符文", color, id, moveNumber: next.moveNumber });
  if (options.skillName) next.history[next.history.length - 1].skill = options.skillName;
  return ok(resolveCapturesAfterMutation(next, color, options.consumesTurn ?? false));
}

export function flipStone(state, color, id, options = {}) {
  const next = cloneState(state);
  const point = getPoint(next, id);
  if (!point?.valid || !point.stone) return fail("必须指定棋盘上的棋子");
  point.stone = opponent(point.stone);
  point.skillEffect = "flipped-stone";
  next.skillUses[color] -= 1;
  applySkillCost(next, color, "danea");
  next.ko = null;
  next.history.push({ type: "skill", skill: "染秽", color, id, moveNumber: next.moveNumber });
  if (options.skillName) next.history[next.history.length - 1].skill = options.skillName;
  return ok(resolveCapturesAfterMutation(next, color, options.consumesTurn ?? true));
}

function resolveCapturesAfterMutation(state, actorColor, consumesTurn = true) {
  let changed = true;
  while (changed) {
    changed = false;
    const visited = new Set();
    for (const point of state.points) {
      if (!point.valid || !point.stone || visited.has(point.id)) continue;
      const group = collectGroup(state, point.id);
      group.stones.forEach((stone) => visited.add(stone));
      if (group.liberties.size === 0) {
        for (const stone of group.stones) clearStone(state, stone);
        state.captures[opponent(point.stone)] += group.stones.length;
        changed = true;
      }
    }
  }
  if (consumesTurn) {
    state.turn = opponent(actorColor);
    state.moveNumber += 1;
  }
  return state;
}

export function collectGroup(state, startId) {
  const start = getPoint(state, startId);
  if (!start?.valid || !start.stone) return { color: null, stones: [], liberties: new Set() };
  const stones = [];
  const liberties = new Set();
  const seen = new Set([startId]);
  const queue = [start];

  while (queue.length) {
    const point = queue.shift();
    stones.push(point.id);
    for (const neighbor of activeNeighbors(state, point)) {
      if (!neighbor.stone) {
        liberties.add(neighbor.id);
      } else if (neighbor.stone === start.stone && !seen.has(neighbor.id)) {
        seen.add(neighbor.id);
        queue.push(neighbor);
      }
    }
  }

  return { color: start.stone, stones, liberties };
}

export function createScoringState() {
  return {
    requestedBy: null,
    acceptedBy: null,
    deadStones: [],
    deadStoneOwners: {},
    neutralPoints: [],
    territory: { black: [], white: [] },
    confirmedBy: [],
    resultAcceptedBy: [],
    resultDeadline: null,
    result: null
  };
}

export function prepareScoringState(state, scoring = null) {
  const nextScoring = {
    ...createScoringState(),
    ...(scoring ?? state.scoring ?? {})
  };
  nextScoring.deadStones = nextScoring.deadStones ?? [];
  nextScoring.deadStoneOwners = nextScoring.deadStoneOwners ?? {};
  nextScoring.neutralPoints = nextScoring.neutralPoints ?? [];
  nextScoring.confirmedBy = nextScoring.confirmedBy ?? [];
  nextScoring.resultAcceptedBy = nextScoring.resultAcceptedBy ?? [];
  nextScoring.territory = computeTerritoryMarks(state, new Set(nextScoring.neutralPoints));
  return nextScoring;
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

export function exposeHiddenHands(state) {
  restoreSuspendedHiddenHands(state);
  let revealed = false;
  for (const point of state.points) {
    if (point.hiddenHand && revealHiddenHand(point)) revealed = true;
  }
  return revealed ? [HIDDEN_HAND_NOTICE] : [];
}

export function markDeadGroup(state, id, markerColor = null) {
  const next = cloneState(state);
  if (!next.scoring) next.scoring = prepareScoringState(next);
  const group = collectGroup(next, id);
  if (!group.stones.length) return fail("请选择棋子");
  if (markerColor && group.color !== markerColor) return fail("只能标记自己颜色的死子");

  const dead = new Set(next.scoring.deadStones ?? []);
  const owners = { ...(next.scoring.deadStoneOwners ?? {}) };
  const clickedGroupAlreadyMarked = group.stones.every((stone) => dead.has(stone));
  const owner = opponent(group.color);
  const stonesToUpdate = clickedGroupAlreadyMarked
    ? group.stones
    : collectPotentialDeadStones(next, group, owner);

  for (const stone of stonesToUpdate) {
    if (clickedGroupAlreadyMarked) {
      dead.delete(stone);
      delete owners[stone];
    } else {
      dead.add(stone);
      owners[stone] = owner;
    }
  }

  next.scoring.deadStones = [...dead];
  next.scoring.deadStoneOwners = owners;
  next.scoring.territory = computeScoringTerritory(next);
  clearScoringConfirmations(next.scoring);
  return ok(next);
}

export function toggleNeutralPoint(state, id) {
  const next = cloneState(state);
  if (!next.scoring) next.scoring = prepareScoringState(next);
  const point = getPoint(next, id);
  if (!point?.valid || point.stone) return fail("只能标记空交叉点");
  const neutral = new Set(next.scoring.neutralPoints ?? []);
  if (neutral.has(id)) neutral.delete(id);
  else neutral.add(id);
  next.scoring.neutralPoints = [...neutral];
  next.scoring.territory = computeScoringTerritory(next);
  clearScoringConfirmations(next.scoring);
  return ok(next);
}

export function resetDeadMarks(state) {
  const next = cloneState(state);
  if (!next.scoring) next.scoring = prepareScoringState(next);
  next.scoring.deadStones = [];
  next.scoring.deadStoneOwners = {};
  next.scoring.territory = computeScoringTerritory(next);
  clearScoringConfirmations(next.scoring);
  return ok(next);
}

function clearScoringConfirmations(scoring) {
  scoring.confirmedBy = [];
  scoring.resultAcceptedBy = [];
  scoring.result = null;
  scoring.resultDeadline = null;
}

export function scoreGame(state) {
  const dead = new Set(state.scoring?.deadStones ?? []);
  const neutral = new Set(state.scoring?.neutralPoints ?? []);
  const board = cloneState(state);
  for (const id of dead) {
    const point = getPoint(board, id);
    if (point) point.stone = null;
  }

  let blackStones = 0;
  let whiteStones = 0;
  for (const point of board.points) {
    if (!point.valid) continue;
    if (point.stone === COLORS.black) blackStones += 1;
    if (point.stone === COLORS.white) whiteStones += 1;
  }

  const territory = computeTerritoryMarks(board, neutral);
  const blackTerritory = territory.black.length;
  const whiteTerritory = territory.white.length;
  const blackSkillCost = numericSkillCost(state, COLORS.black);
  const whiteSkillCost = numericSkillCost(state, COLORS.white);
  const black = blackStones + blackTerritory - blackSkillCost;
  const white = whiteStones + whiteTerritory - whiteSkillCost;
  const blackAfterKomi = black - KOMI_STONES;
  const whiteAfterKomi = white;
  const margin = Math.abs(blackAfterKomi - whiteAfterKomi);
  const winnerColor = blackAfterKomi > whiteAfterKomi ? COLORS.black : COLORS.white;

  return {
    black,
    white,
    blackStones,
    whiteStones,
    blackTerritory,
    whiteTerritory,
    blackSkillCost,
    whiteSkillCost,
    blackAfterKomi,
    whiteAfterKomi,
    winnerColor,
    margin,
    text: `${winnerColor === COLORS.black ? "黑" : "白"}胜${formatStones(margin)}子`
  };
}

function computeTerritoryMarks(state, neutral) {
  const territory = { black: [], white: [] };
  const visited = new Set();
  for (const point of state.points) {
    if (!point.valid || point.stone || visited.has(point.id) || neutral.has(point.id)) continue;
    const area = collectTerritory(state, point.id, neutral);
    area.points.forEach((areaId) => visited.add(areaId));
    if (area.borderColors.size === 1) {
      const [owner] = area.borderColors;
      territory[owner].push(...area.points);
    }
  }
  return territory;
}

function computeScoringTerritory(state) {
  const board = cloneState(state);
  for (const id of state.scoring?.deadStones ?? []) {
    const point = getPoint(board, id);
    if (point) point.stone = null;
  }
  return computeTerritoryMarks(board, new Set(state.scoring?.neutralPoints ?? []));
}

function collectPotentialDeadStones(state, group, owner) {
  const deadColor = group.color;
  const neutral = new Set(state.scoring?.neutralPoints ?? []);
  const stones = new Set(group.stones);
  const seen = new Set(group.stones);
  const queue = [...group.stones];

  while (queue.length) {
    const current = getPoint(state, queue.shift());
    if (!current) continue;
    for (const neighbor of activeNeighbors(state, current)) {
      if (seen.has(neighbor.id)) continue;
      if (neighbor.stone === owner) continue;
      if (neighbor.stone && neighbor.stone !== deadColor) continue;

      if (neighbor.stone === deadColor) {
        const connected = collectGroup(state, neighbor.id);
        for (const stone of connected.stones) {
          stones.add(stone);
          if (!seen.has(stone)) {
            seen.add(stone);
            queue.push(stone);
          }
        }
        continue;
      }

      const area = collectTerritoryIgnoringColor(state, neighbor.id, neutral, deadColor);
      if (area.owner !== owner) continue;
      for (const areaId of area.points) {
        if (!seen.has(areaId)) {
          seen.add(areaId);
          queue.push(areaId);
        }
      }
    }
  }

  return [...stones];
}

function collectTerritory(state, startId, neutral) {
  return collectTerritoryIgnoringColor(state, startId, neutral, null);
}

function collectTerritoryIgnoringColor(state, startId, neutral, ignoredColor) {
  const points = [];
  const borderColors = new Set();
  const seen = new Set([startId]);
  const queue = [getPoint(state, startId)];
  while (queue.length) {
    const point = queue.shift();
    if (!point?.valid || point.stone || neutral.has(point.id)) continue;
    points.push(point.id);
    for (const neighbor of activeNeighbors(state, point)) {
      if (neighbor.stone) {
        if (neighbor.stone !== ignoredColor) borderColors.add(neighbor.stone);
      } else if (!seen.has(neighbor.id) && !neutral.has(neighbor.id)) {
        seen.add(neighbor.id);
        queue.push(neighbor);
      }
    }
  }
  const [owner] = borderColors;
  return {
    points,
    borderColors,
    owner: borderColors.size === 1 ? owner : null
  };
}

function isUnexposedOpponentHiddenHand(point, color) {
  return point.hiddenHand && !point.hiddenHand.exposed && point.hiddenHand.owner !== color;
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

function clearStone(state, id) {
  const point = getPoint(state, id);
  if (!point) return;
  point.stone = null;
  point.hiddenHand = null;
}

export function formatStones(value) {
  return Number.isInteger(value) ? `${value}` : `${Math.round(value * 100) / 100}`;
}

function colorName(color) {
  return color === COLORS.black ? "\u9ed1" : "\u767d";
}

function applySkillCost(state, color, characterId) {
  const cost = CHARACTERS[characterId]?.skill?.cost ?? 0;
  if (typeof cost === "number") {
    state.skillCosts = state.skillCosts ?? { black: 0, white: 0 };
    state.skillCosts[color] = (state.skillCosts[color] ?? 0) + cost;
    return;
  }
  state.skillCostNotes = state.skillCostNotes ?? [];
  state.skillCostNotes.push({ color, characterId, cost });
}

function numericSkillCost(state, color) {
  return state.skillCosts?.[color] ?? 0;
}

function ok(state, extra = {}) {
  return { ok: true, state, ...extra };
}

function fail(error) {
  return { ok: false, error };
}
