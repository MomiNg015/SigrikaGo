import { CHARACTERS } from "./characters.js";

export const BOARD_SIZE = 13;
export const KOMI_STONES = 2.75;
export const COLORS = {
  black: "black",
  white: "white"
};
export const GAME_PHASES = {
  opening: "opening",
  playing: "playing",
  countingRequested: "counting-requested",
  markingDead: "marking-dead",
  resultReview: "result-review",
  drawRequested: "draw-requested",
  skillPreview: "skill-preview",
  finished: "finished"
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
    passives: createPassiveState(players),
    phase: GAME_PHASES.playing,
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

export function playMove(state, color, id, options = {}) {
  return placeStone(state, color, id, { hidden: false, colorIllusion: options.colorIllusion });
}

export function activatePassiveSkill(state, color, skillOrCharacterId) {
  if (![GAME_PHASES.playing, GAME_PHASES.skillPreview].includes(state.phase)) return fail("当前不能发动被动技能");
  const skill = normalizeSkillConfig(skillOrCharacterId);
  if (skill?.effectType !== "color-illusion-passive") return fail("不是可发动的被动技能");
  const next = cloneState(state);
  next.passives = next.passives ?? {};
  const passive = next.passives[color]?.colorIllusion ?? {
    active: false,
    triggered: false,
    probability: passiveProbability(skill)
  };
  if (passive.triggered) return fail("被动技能已经发动");
  next.passives[color] = {
    ...(next.passives[color] ?? {}),
    colorIllusion: {
      ...passive,
      active: true,
      triggered: true,
      probability: passiveProbability(skill)
    }
  };
  next.phase = GAME_PHASES.playing;
  next.pendingSkill = null;
  next.history.push({
    type: "skill",
    effectType: "color-illusion-passive",
    skill: skill.name,
    color,
    moveNumber: next.moveNumber
  });
  return ok(next);
}

export function gameViewForColor(game, viewerColor) {
  const view = cloneState(game);
  const showColorIllusions = [GAME_PHASES.playing, GAME_PHASES.skillPreview, GAME_PHASES.drawRequested].includes(view.phase);
  view.points = view.points.map((point) => {
    let nextPoint = point;
    if (nextPoint.hiddenHand && !nextPoint.hiddenHand.exposed && nextPoint.hiddenHand.owner !== viewerColor) {
      nextPoint = {
        ...nextPoint,
        stone: null,
        hiddenHand: null
      };
    }
    if (showColorIllusions && nextPoint.colorIllusion && nextPoint.colorIllusion.owner !== viewerColor && nextPoint.stone) {
      nextPoint = {
        ...nextPoint,
        stone: nextPoint.colorIllusion.visibleAs
      };
    }
    return nextPoint;
  });
  return view;
}

export function randomLayout(state, counts = { black: 50, white: 50 }) {
  if (state.phase !== GAME_PHASES.playing) return fail("对局当前不能随机布局");
  const validPoints = state.points.filter((point) => point.valid);
  const blackCount = Math.max(0, Math.floor(Number(counts.black ?? 50)));
  const whiteCount = Math.max(0, Math.floor(Number(counts.white ?? 50)));
  if (blackCount + whiteCount > validPoints.length) return fail("棋盘空间不足");

  for (let attempt = 0; attempt < 3000; attempt += 1) {
    const next = cloneState(state);
    clearBoardStones(next);
    const colors = shuffle([
      ...Array.from({ length: blackCount }, () => COLORS.black),
      ...Array.from({ length: whiteCount }, () => COLORS.white)
    ]);
    const points = shuffle(next.points.filter((point) => point.valid));
    for (const [index, color] of colors.entries()) {
      points[index].stone = color;
    }
    if (allStoneGroupsHaveLiberties(next)) {
      next.ko = null;
      next.passes = 0;
      next.captures = { black: 0, white: 0 };
      next.scoring = null;
      next.suspendedHiddenHands = [];
      next.winner = null;
      next.history.push({
        type: "test-random-layout",
        black: blackCount,
        white: whiteCount,
        moveNumber: next.moveNumber
      });
      return ok(next);
    }
  }

  return fail("随机布局生成失败，请重试");
}

export function restoreSkillUse(state, color) {
  if (state.phase !== GAME_PHASES.playing) return fail("对局当前不能恢复技能");
  const next = cloneState(state);
  const player = next.players.find((candidate) => candidate.color === color);
  next.skillUses[color] = configuredSkillUses(player);
  next.history.push({
    type: "test-restore-skill",
    color,
    moveNumber: next.moveNumber
  });
  return ok(next);
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

  point.stone = color;
  if (hidden) {
    point.hiddenHand = {
      owner: color,
      exposed: false,
      effect: "hidden-hand"
    };
  }
  applyColorIllusion(next, color, point, colorIllusion);

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
  clearBlastMarkers(next, color);
  next.turn = opponent(color);
  next.passes = 0;
  next.moveNumber += 1;
  next.history.push(hidden
    ? { type: "skill", skill: "小爱出击", color, id, captures: removed, moveNumber: next.moveNumber }
    : { type: "move", color, id, captures: removed, colorIllusion: point.colorIllusion ?? null, moveNumber: next.moveNumber });
  if (hidden) {
    next.skillUses[color] -= 1;
    applySkillCost(next, color, skill ?? "aemeath");
  }
  return ok(next, { notices });
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

export function passMove(state, color) {
  if (state.phase !== GAME_PHASES.playing) return fail("对局当前不能弃一手");
  if (state.turn !== color) return fail("还没有轮到你");
  const next = cloneState(state);
  next.turn = opponent(color);
  next.ko = null;
  next.passes += 1;
  next.moveNumber += 1;
  next.history.push({ type: "pass", color, moveNumber: next.moveNumber });
  if (next.passes >= 2) {
    next.phase = GAME_PHASES.countingRequested;
    suspendUnexposedHiddenHands(next);
    next.scoring = prepareScoringState(next);
  }
  return ok(next);
}

export function resignGame(state, color) {
  const next = cloneState(state);
  next.phase = GAME_PHASES.finished;
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
  if (state.phase !== GAME_PHASES.playing) return fail("对局当前不能使用技能");
  if (state.turn !== color) return fail("还没有轮到你");
  if ((state.skillUses[color] ?? 0) <= 0) return fail("技能次数已经用完");
  const skill = normalizeSkillConfig(skillOrCharacterId);
  if (skill?.effectType === "erase-point") {
    return erasePoint(state, color, targetId, {
      skillName: skill.name,
      consumesTurn: !skill.freeTurn,
      skill
    });
  }
  if (skill?.effectType === "flip-stone") {
    return flipStone(state, color, targetId, {
      skillName: skill.name,
      consumesTurn: !skill.freeTurn,
      skill
    });
  }
  if (skill?.effectType === "hidden-hand") {
    return playHiddenHand(state, color, targetId, {
      skillName: skill.name,
      characterId: skill.characterId ?? "aemeath",
      skill
    });
  }
  if (skill?.effectType === "random-blast") {
    return randomBlast(state, color, {
      skillName: skill.name,
      consumesTurn: !skill.freeTurn,
      skill
    });
  }
  return fail("未知角色技能");
}

function clearBoardStones(state) {
  for (const point of state.points) {
    point.stone = null;
    point.hiddenHand = null;
    point.colorIllusion = null;
    if (point.skillEffect !== "erased-point") {
      point.skillEffect = null;
      point.skillEffectOwner = null;
    }
    point.mark = null;
  }
}

function allStoneGroupsHaveLiberties(state) {
  const visited = new Set();
  for (const point of state.points) {
    if (!point.valid || !point.stone || visited.has(point.id)) continue;
    const group = collectGroup(state, point.id);
    group.stones.forEach((stone) => visited.add(stone));
    if (group.liberties.size === 0) return false;
  }
  return true;
}

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function configuredSkillUses(player) {
  const skill = normalizeSkillConfig(player?.character?.skill ?? player?.skill ?? player?.characterId);
  return Number.isInteger(skill?.uses) ? skill.uses : 1;
}

function createPassiveState(players = []) {
  return Object.fromEntries(players
    .map((player) => {
      const skill = normalizeSkillConfig(player?.character?.skill ?? player?.skill ?? player?.characterId);
      if (skill?.effectType !== "color-illusion-passive") return null;
      return [player.color, {
        colorIllusion: {
          active: false,
          triggered: false,
          probability: passiveProbability(skill)
        }
      }];
    })
    .filter(Boolean));
}

function passiveProbability(skill) {
  const value = Number(skill?.params?.probability ?? 0.8);
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.8;
}

function targetRuleForEffect(effectType) {
  if (effectType === "flip-stone") return "stone";
  if (effectType === "random-blast") return "any-point";
  if (effectType === "color-illusion-passive") return "none";
  return "empty-point";
}

export function normalizeSkillConfig(skillOrCharacterId) {
  if (skillOrCharacterId?.effectType) return skillOrCharacterId;
  if (skillOrCharacterId?.id) {
    const effectType = skillOrCharacterId.id;
    return {
      characterId: skillOrCharacterId.characterId ?? null,
      effectType,
      name: skillOrCharacterId.name,
      uses: skillOrCharacterId.uses ?? (effectType === "color-illusion-passive" ? 0 : 1),
      freeTurn: Boolean(skillOrCharacterId.freeTurn),
      costType: skillOrCharacterId.costType ?? "numeric",
      costValue: String(skillOrCharacterId.costValue ?? skillOrCharacterId.cost ?? 0),
      systemMessage: skillOrCharacterId.systemMessage,
      targetRule: targetRuleForEffect(effectType),
      params: skillOrCharacterId.params ?? {}
    };
  }
  const fallback = CHARACTERS[skillOrCharacterId];
  if (fallback?.skill?.id === "erase-point") {
    return {
      characterId: fallback.id,
      effectType: "erase-point",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 1,
      freeTurn: Boolean(fallback.skill.freeTurn),
      costType: fallback.skill.costType ?? "numeric",
      costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
      systemMessage: fallback.skill.systemMessage,
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
      costType: fallback.skill.costType ?? "numeric",
      costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
      systemMessage: fallback.skill.systemMessage,
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
      costType: fallback.skill.costType ?? "numeric",
      costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
      systemMessage: fallback.skill.systemMessage,
      targetRule: "empty-point",
      params: {}
    };
  }
  if (fallback?.skill?.id === "random-blast") {
    return {
      characterId: fallback.id,
      effectType: "random-blast",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 1,
      freeTurn: Boolean(fallback.skill.freeTurn),
      costType: fallback.skill.costType ?? "numeric",
      costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
      systemMessage: fallback.skill.systemMessage,
      targetRule: "any-point",
      params: fallback.skill.params ?? { size: 3 }
    };
  }
  if (fallback?.skill?.id === "color-illusion-passive") {
    return {
      characterId: fallback.id,
      effectType: "color-illusion-passive",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 0,
      freeTurn: true,
      costType: fallback.skill.costType ?? "numeric",
      costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
      systemMessage: fallback.skill.systemMessage,
      targetRule: "none",
      params: fallback.skill.params ?? { probability: 0.8 }
    };
  }
  return null;
}

export function playHiddenHand(state, color, id, options = {}) {
  const result = placeStone(state, color, id, { hidden: true, skill: options.skill ?? options.characterId ?? "aemeath" });
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
  applySkillCost(next, color, options.skill ?? "sigrika");
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
  point.colorIllusion = null;
  point.skillEffect = "flipped-stone";
  next.skillUses[color] -= 1;
  applySkillCost(next, color, options.skill ?? "danea");
  next.ko = null;
  next.history.push({ type: "skill", skill: "染秽", effectType: "flip-stone", color, id, moveNumber: next.moveNumber });
  if (options.skillName) next.history[next.history.length - 1].skill = options.skillName;
  return ok(resolveCapturesAfterMutation(next, color, options.consumesTurn ?? true));
}

export function randomBlast(state, color, options = {}) {
  const next = cloneState(state);
  const size = Math.max(1, Number(options.skill?.params?.size ?? 3) || 3);
  const radius = Math.floor(size / 2);
  const center = options.centerId ? parsePointId(options.centerId) : null;
  const centerX = center ? clampBlastCenter(center.x, next.size, radius) : randomBlastCenter(next.size, radius);
  const centerY = center ? clampBlastCenter(center.y, next.size, radius) : randomBlastCenter(next.size, radius);
  let removed = 0;
  const marked = [];

  for (let y = centerY - radius; y <= centerY + radius; y += 1) {
    for (let x = centerX - radius; x <= centerX + radius; x += 1) {
      if (x < 0 || y < 0 || x >= next.size || y >= next.size) continue;
      const point = getPoint(next, pointId(x, y));
      if (!point?.valid) continue;
      if (point.stone) {
        clearStone(next, point.id);
        removed += 1;
      }
      point.skillEffect = "blast-marker";
      point.skillEffectOwner = color;
      marked.push(point.id);
    }
  }

  next.skillUses[color] -= 1;
  applySkillCost(next, color, options.skill ?? "baconbits");
  next.ko = null;
  next.history.push({
    type: "skill",
    effectType: "random-blast",
    skill: options.skillName ?? "猪小仙爆炸",
    color,
    id: pointId(centerX, centerY),
    removed,
    marked,
    moveNumber: next.moveNumber
  });
  return ok(resolveCapturesAfterMutation(next, color, options.consumesTurn ?? false));
}

function randomBlastCenter(boardSize, radius) {
  const min = radius;
  const max = boardSize - radius - 1;
  if (min > max) return Math.floor(boardSize / 2);
  return min + Math.floor(Math.random() * (max - min + 1));
}

function clampBlastCenter(value, boardSize, radius) {
  const min = radius;
  const max = boardSize - radius - 1;
  if (min > max) return Math.floor(boardSize / 2);
  return Math.min(max, Math.max(min, value));
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
  const blackRaw = blackStones + blackTerritory;
  const whiteRaw = whiteStones + whiteTerritory;
  const black = blackRaw - KOMI_STONES - blackSkillCost + whiteSkillCost;
  const white = whiteRaw + KOMI_STONES - whiteSkillCost + blackSkillCost;
  const blackAfterKomi = black;
  const whiteAfterKomi = white;
  const marginValue = black - white;
  const margin = Math.abs(marginValue);
  const winnerColor = marginValue > 0 ? COLORS.black : COLORS.white;
  const winnerName = winnerColor === COLORS.black ? "黑" : "白";

  return {
    black,
    white,
    blackRaw,
    whiteRaw,
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
    marginValue,
    formula: {
      black: {
        stones: blackStones,
        territory: blackTerritory,
        komi: -KOMI_STONES,
        ownSkillCost: -blackSkillCost,
        opponentSkillCost: whiteSkillCost,
        total: black
      },
      white: {
        stones: whiteStones,
        territory: whiteTerritory,
        komi: KOMI_STONES,
        ownSkillCost: -whiteSkillCost,
        opponentSkillCost: blackSkillCost,
        total: white
      },
      margin: marginValue
    },
    text: `${winnerName}胜${formatStones(margin)}子`
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
  point.colorIllusion = null;
}

function clearBlastMarkers(state, ownerColor) {
  for (const point of state.points) {
    if (point.skillEffect !== "blast-marker") continue;
    if (point.skillEffectOwner !== ownerColor) continue;
    point.skillEffect = null;
    point.skillEffectOwner = null;
  }
}

export function formatStones(value) {
  if (!Number.isFinite(value)) return "0";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const denominator = 100;
  const numerator = Math.round(abs * denominator);
  const whole = Math.floor(numerator / denominator);
  const remainder = numerator % denominator;
  if (remainder === 0) return `${sign}${whole}`;
  const divisor = gcd(remainder, denominator);
  const fraction = `${remainder / divisor}/${denominator / divisor}`;
  return whole > 0 ? `${sign}${whole}又${fraction}` : `${sign}${fraction}`;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function colorName(color) {
  return color === COLORS.black ? "\u9ed1" : "\u767d";
}

function applySkillCost(state, color, skillOrCharacterId) {
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

function numericSkillCost(state, color) {
  return state.skillCosts?.[color] ?? 0;
}

function ok(state, extra = {}) {
  return { ok: true, state, ...extra };
}

function fail(error) {
  return { ok: false, error };
}
