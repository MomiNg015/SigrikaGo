import { COLORS, captureCreditOwner, isPlayerColor } from "./gameConstants.js";
import { activeNeighbors, getPoint } from "./gameBoard.js";
import { collectGroup } from "./gameGroups.js";
import { formatStones } from "./stoneFormatting.js";
import { gameModeById, gameModeSkillEnabled } from "./gameModes.js";

export const KOMI_STONES = 2.75;

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

export function markDeadGroup(state, id, markerColor = null) {
  const next = structuredClone(state);
  if (!next.scoring) next.scoring = prepareScoringState(next);
  const group = collectGroup(next, id);
  if (markerColor && !isPlayerColor(group.color)) markerColor = null;
  if (!group.stones.length) return fail("请选择棋子");
  if (markerColor && group.color !== markerColor) return fail("只能标记自己颜色的死子");

  const dead = new Set(next.scoring.deadStones ?? []);
  const owners = { ...(next.scoring.deadStoneOwners ?? {}) };
  const clickedGroupAlreadyMarked = group.stones.every((stone) => dead.has(stone));
  const owner = captureCreditOwner(group.color);
  const stonesToUpdate = clickedGroupAlreadyMarked
    ? group.stones
    : owner ? collectPotentialDeadStones(next, group, owner) : group.stones;

  for (const stone of stonesToUpdate) {
    if (clickedGroupAlreadyMarked) {
      dead.delete(stone);
      delete owners[stone];
    } else {
      dead.add(stone);
      if (owner) owners[stone] = owner;
    }
  }

  next.scoring.deadStones = [...dead];
  next.scoring.deadStoneOwners = owners;
  next.scoring.territory = computeScoringTerritory(next);
  clearScoringConfirmations(next.scoring);
  return ok(next);
}

export function toggleNeutralPoint(state, id) {
  const next = structuredClone(state);
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
  const next = structuredClone(state);
  if (!next.scoring) next.scoring = prepareScoringState(next);
  next.scoring.deadStones = [];
  next.scoring.deadStoneOwners = {};
  next.scoring.territory = computeScoringTerritory(next);
  clearScoringConfirmations(next.scoring);
  return ok(next);
}

export function scoreGame(state) {
  const mode = gameModeById(state.mode);
  const dead = new Set(state.scoring?.deadStones ?? []);
  const neutral = new Set(state.scoring?.neutralPoints ?? []);
  const board = structuredClone(state);
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
  const blackSkillRemovals = numericSkillRemovals(state, COLORS.black);
  const whiteSkillRemovals = numericSkillRemovals(state, COLORS.white);
  const blackRaw = blackStones + blackTerritory;
  const whiteRaw = whiteStones + whiteTerritory;
  const komi = mode.komi ?? KOMI_STONES;
  const black = blackRaw + blackSkillRemovals - komi - blackSkillCost + whiteSkillCost;
  const white = whiteRaw + whiteSkillRemovals + komi - whiteSkillCost + blackSkillCost;
  const marginValue = black - white;
  const margin = Math.abs(marginValue) / 2;
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
    blackSkillRemovals,
    whiteSkillRemovals,
    blackAfterKomi: black,
    whiteAfterKomi: white,
    winnerColor,
    margin,
    marginValue,
    formula: {
      skillEnabled: gameModeSkillEnabled(state.mode),
      black: {
        stones: blackStones,
        territory: blackTerritory,
        skillRemovals: blackSkillRemovals,
        komi: -komi,
        ownSkillCost: blackSkillCost ? -blackSkillCost : 0,
        opponentSkillCost: whiteSkillCost,
        total: black
      },
      white: {
        stones: whiteStones,
        territory: whiteTerritory,
        skillRemovals: whiteSkillRemovals,
        komi,
        ownSkillCost: whiteSkillCost ? -whiteSkillCost : 0,
        opponentSkillCost: blackSkillCost,
        total: white
      },
      margin: marginValue
    },
    text: `${winnerName}胜${formatStones(margin)}子`
  };
}

function clearScoringConfirmations(scoring) {
  scoring.confirmedBy = [];
  scoring.resultAcceptedBy = [];
  scoring.result = null;
  scoring.resultDeadline = null;
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
      if (isPlayerColor(owner)) {
        territory[owner].push(...area.points.filter((areaId) => !isProtocolBannedForOwner(getPoint(state, areaId), owner)));
      }
    }
  }
  return territory;
}

function isProtocolBannedForOwner(point, owner) {
  return Boolean(point?.protocolBan?.bannedColor === owner);
}

function computeScoringTerritory(state) {
  const board = structuredClone(state);
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

  for (let index = 0; index < queue.length; index += 1) {
    const current = getPoint(state, queue[index]);
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
  for (let index = 0; index < queue.length; index += 1) {
    const point = queue[index];
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

function numericSkillCost(state, color) {
  if (!gameModeSkillEnabled(state.mode)) return 0;
  return state.skillCosts?.[color] ?? 0;
}

function numericSkillRemovals(state, color) {
  if (!gameModeSkillEnabled(state.mode)) return 0;
  const value = Number(state.skillRemovals?.[color] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function ok(state, extra = {}) {
  return { ok: true, state, ...extra };
}

function fail(error) {
  return { ok: false, error };
}
