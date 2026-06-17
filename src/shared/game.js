import { CHARACTERS } from "./characters.js";
import {
  COLORS,
  NEUTRAL_STONES,
  canSprayTransformStone,
  captureCreditOwner,
  isPlayerColor,
  opponent
} from "./gameConstants.js";
import {
  BOARD_SIZE,
  activeNeighbors,
  createPoints,
  getPoint,
  isStarPoint,
  parsePointId,
  pointId
} from "./gameBoard.js";
import { gameModeById, gameModeFamily, gameModeSkillEnabled } from "./gameModes.js";
import { GAME_PHASES } from "./gamePhases.js";
import {
  normalizeSkillConfig,
  skillRequiresExistingStone,
  skillUsesBoardConfirmation,
  skillUsesBoardSurfaceConfirmation
} from "./gameSkills.js";
import { executeActiveSkillHandler } from "./gameSkillHandlers.js";
import {
  doubleMove,
  erasePoint,
  flipStone,
  libertyPurge,
  protocolTakeover,
  randomBlast,
  rowSlash,
  sprayStone
} from "./gameSkillActions.js";
import { clearExpiredLibertyPurgeMarks, cloneState } from "./gameSkillState.js";
import {
  HIDDEN_HAND_NOTICE,
  exposeHiddenHands,
  playHiddenHand,
  playMove,
  restoreSuspendedHiddenHands,
  suspendUnexposedHiddenHands
} from "./gameStoneActions.js";
import { collectGroup } from "./gameGroups.js";
import { fail, ok } from "./gameActionResult.js";
import {
  INVALID_EARLY_RESIGN_NOTICE,
  MAX_INVALID_GAME_END_MOVE_NUMBER,
  MIN_VALID_RESIGN_MOVE_NUMBER,
  createDrawResult,
  createResignResult,
  createTimeoutResult,
  isInvalidGameEnd,
  resultWithInvalidFlagForGame
} from "./gameResults.js";

export { collectGroup } from "./gameGroups.js";
export {
  KOMI_STONES,
  createScoringState,
  markDeadGroup,
  prepareScoringState,
  resetDeadMarks,
  scoreGame,
  toggleNeutralPoint
} from "./gameScoring.js";
export {
  COLORS,
  NEUTRAL_STONES,
  canSprayTransformStone,
  captureCreditOwner,
  isPlayerColor,
  opponent
} from "./gameConstants.js";
export {
  BOARD_SIZE,
  activeNeighbors,
  createPoints,
  getPoint,
  isStarPoint,
  parsePointId,
  pointId
} from "./gameBoard.js";
export { GAME_PHASES } from "./gamePhases.js";
export {
  normalizeSkillConfig,
  skillRequiresExistingStone,
  skillUsesBoardConfirmation,
  skillUsesBoardSurfaceConfirmation
} from "./gameSkills.js";
export {
  doubleMove,
  erasePoint,
  flipStone,
  libertyPurge,
  protocolTakeover,
  randomBlast,
  rowSlash,
  sprayStone
} from "./gameSkillActions.js";
export { cloneState } from "./gameSkillState.js";
export {
  HIDDEN_HAND_NOTICE,
  exposeHiddenHands,
  playHiddenHand,
  playMove,
  restoreSuspendedHiddenHands,
  suspendUnexposedHiddenHands
} from "./gameStoneActions.js";
export {
  INVALID_EARLY_RESIGN_NOTICE,
  MAX_INVALID_GAME_END_MOVE_NUMBER,
  MIN_VALID_RESIGN_MOVE_NUMBER,
  createDrawResult,
  createResignResult,
  createTimeoutResult,
  isInvalidGameEnd,
  resultWithInvalidFlagForGame
} from "./gameResults.js";
export { formatStones } from "./stoneFormatting.js";

export function createGameState(players = [], options = {}) {
  const mode = gameModeById(options.mode);
  return {
    mode: mode.id,
    skillEnabled: mode.skillEnabled,
    size: mode.boardSize,
    points: createPoints(mode.boardSize),
    turn: COLORS.black,
    moveNumber: 0,
    passes: 0,
    captures: { black: 0, white: 0 },
    skillRemovals: { black: 0, white: 0 },
    ko: null,
    history: [],
    players,
    skillUses: Object.fromEntries(players.map((p) => [p.color, configuredSkillUses(p, mode)])),
    skillCosts: { black: 0, white: 0 },
    skillCostNotes: [],
    passives: createPassiveState(players, mode),
    phase: GAME_PHASES.playing,
    scoring: null,
    suspendedHiddenHands: [],
    rowEffects: [],
    extraTurn: null,
    winner: null
  };
}

export function activatePassiveSkill(state, color, skillOrCharacterId) {
  if (!gameModeSkillEnabled(state.mode)) return fail("标准对弈不能发动技能");
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
  const showColorIllusions = [
    GAME_PHASES.playing,
    GAME_PHASES.skillPreview,
    GAME_PHASES.drawRequested,
    GAME_PHASES.countingRequested
  ].includes(view.phase);
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

export function passMove(state, color) {
  if (gameModeFamily(state.mode) === "gomoku") return fail("五子棋不能弃手");
  if (state.phase !== GAME_PHASES.playing) return fail("对局当前不能弃一手");
  if (state.turn !== color) return fail("还没有轮到你");
  const next = cloneState(state);
  next.turn = opponent(color);
  if (next.extraTurn?.effectType === "double-move" && next.extraTurn.owner === color) {
    next.extraTurn = null;
  }
  next.ko = null;
  next.passes += 1;
  next.moveNumber += 1;
  clearExpiredLibertyPurgeMarks(next);
  next.history.push({ type: "pass", color, moveNumber: next.moveNumber });
  return ok(next);
}

export function resignGame(state, color) {
  const next = cloneState(state);
  next.phase = GAME_PHASES.finished;
  const invalid = isInvalidGameEnd(next);
  next.winner = createResignResult(color, { invalid });
  return ok(next, invalid ? { notices: [INVALID_EARLY_RESIGN_NOTICE] } : {});
}

export function useSkill(state, color, skillOrCharacterId, targetId) {
  if (!gameModeSkillEnabled(state.mode)) return fail("标准对弈不能使用技能");
  if (state.phase !== GAME_PHASES.playing) return fail("对局当前不能使用技能");
  if (state.turn !== color) return fail("还没有轮到你");
  if (state.extraTurn) return fail("连下状态中不能使用技能");
  if ((state.skillUses[color] ?? 0) <= 0) return fail("技能次数已经用完");
  const skill = normalizeSkillConfig(skillOrCharacterId);
  if (isProtocolBannedEmptySkillTarget(state, color, targetId)) return fail("该交叉点为禁入点");
  if (!canStartSkill(state, skill)) return fail("场上没有可作用的棋子");
  return executeActiveSkillHandler({
    state,
    color,
    targetId,
    skill
  }) ?? fail("未知角色技能");
}

export function canStartSkill(state, skillOrCharacterId) {
  if (!gameModeSkillEnabled(state.mode)) return false;
  if (state.extraTurn) return false;
  const skill = normalizeSkillConfig(skillOrCharacterId);
  if (skill?.effectType === "double-move") {
    return opponentResolvedActiveSkill(state, state.turn);
  }
  if (skill?.effectType === "spray-stone") {
    return state.points.some((point) => canSprayTransformStone(point));
  }
  if (!skillRequiresExistingStone(skill)) return true;
  return state.points.some((point) => point.valid && point.stone);
}

function opponentResolvedActiveSkill(state, color) {
  const rival = opponent(color);
  return (state.history ?? []).some((entry) => (
    entry?.type === "skill"
    && entry.color === rival
    && entry.effectType
    && entry.effectType !== "color-illusion-passive"
  ));
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
  state.rowEffects = [];
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

function configuredSkillUses(player, mode = gameModeById()) {
  if (!mode.skillEnabled) return 0;
  const skill = normalizeSkillConfig(player?.character?.skill ?? player?.skill ?? player?.characterId);
  return Number.isInteger(skill?.uses) ? skill.uses : 1;
}

function createPassiveState(players = [], mode = gameModeById()) {
  if (!mode.skillEnabled) return {};
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

function isProtocolBannedEmptySkillTarget(state, color, targetId) {
  if (!targetId) return false;
  const point = getPoint(state, targetId);
  return Boolean(point?.valid && !point.stone && point.protocolBan?.bannedColor === color);
}

function passiveProbability(skill) {
  const value = Number(skill?.params?.probability ?? 0.8);
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.8;
}
