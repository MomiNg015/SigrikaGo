import {
  COLORS,
  GAME_PHASES,
  cloneState,
  createGameState,
  getPoint,
  isPlayerColor,
  normalizeSkillConfig,
  playMove,
  resignGame,
  useSkill
} from "../shared/game.js";
import { CHARACTERS } from "../shared/characters.js";
import {
  SKILL_BANNER_DURATION_MS,
  skillBoardEffectDurationMs
} from "../shared/skillPresentation.js";
import { TUTORIAL_NODE_TYPES, nodeTypeRequiresPoint } from "../shared/tutorialNodeTypes.js";

const DEFAULT_TUTORIAL_PLAYERS = Object.freeze([
  { color: COLORS.black, name: "Player", characterId: "sigrika" },
  { color: COLORS.white, name: "NPC", characterId: "denia" }
]);

export function createTutorialGameState({ initialBoard = null, players = DEFAULT_TUTORIAL_PLAYERS } = {}) {
  const game = createGameState(players, { mode: initialBoard?.mode ?? "spark" });
  for (const stone of initialBoard?.stones ?? []) {
    const color = normalizeTutorialColor(stone.color);
    const point = getPoint(game, stone.pointId);
    if (!point?.valid || !color) continue;
    point.stone = color;
  }
  game.tutorialLastMovePointId = initialBoard?.lastMovePointId ?? "";
  return game;
}

export function isAllowedTutorialPoint(node, pointOrId) {
  if (!nodeTypeRequiresPoint(node?.type)) return false;
  const pointId = typeof pointOrId === "string" ? pointOrId : pointOrId?.id;
  return Boolean(node?.pointId && pointId === node.pointId);
}

export function applyTutorialNodeAction(state, node, input = {}) {
  if (!node) return { ok: false, state, message: "Missing tutorial node" };
  if (node.type === TUTORIAL_NODE_TYPES.boardSetup) {
    return applyTutorialBoardSetup(state, node);
  }
  if (node.type === TUTORIAL_NODE_TYPES.playerMove && !input.pointId) {
    return {
      ok: false,
      state,
      message: node.wrongClickMessage || "Missing tutorial point"
    };
  }
  if (input.pointId && node.type === TUTORIAL_NODE_TYPES.playerMove && !isAllowedTutorialPoint(node, input.pointId)) {
    const matchesWrongBranch = Boolean(
      node.wrongMoveNextNodeId
      && (!node.wrongMovePointId || node.wrongMovePointId === input.pointId)
    );
    if (matchesWrongBranch) {
      if (!node.applyWrongMove) {
        return {
          ok: true,
          state,
          wrongMove: true,
          nextNodeId: node.wrongMoveNextNodeId
        };
      }
      const result = playTutorialMove(state, { ...node, pointId: input.pointId });
      return result.ok
        ? { ...result, wrongMove: true, nextNodeId: node.wrongMoveNextNodeId }
        : result;
    }
    return {
      ok: false,
      state,
      message: node.wrongClickMessage || "Wrong tutorial point"
    };
  }

  if (node.type === TUTORIAL_NODE_TYPES.playerMove || node.type === TUTORIAL_NODE_TYPES.npcMove) {
    return playTutorialMove(state, node);
  }

  if (node.type === TUTORIAL_NODE_TYPES.resign) {
    return resignTutorialGame(state, node);
  }

  return { ok: true, state };
}

export function applyTutorialSkillAction(state, node, input = {}) {
  if (![TUTORIAL_NODE_TYPES.playerSkill, TUTORIAL_NODE_TYPES.npcSkill].includes(node?.type)) {
    return { ok: false, state, message: "Not a tutorial skill node" };
  }
  const targetId = input.pointId ?? node.pointId ?? null;
  if (node.type === TUTORIAL_NODE_TYPES.playerSkill && node.pointId && targetId !== node.pointId) {
    return {
      ok: false,
      state,
      message: node.wrongClickMessage || "Wrong tutorial skill target"
    };
  }

  const color = normalizeTutorialColor(node.color) ?? state.turn ?? COLORS.black;
  const skill = tutorialSkillConfig(node);
  if (!skill) return { ok: false, state, message: "Missing tutorial skill" };

  const prepared = cloneState(state);
  prepared.tutorialLastMovePointId = "";
  prepared.turn = color;
  const result = useSkill(prepared, color, skill, targetId);
  if (!result.ok) return { ...result, state };

  const pendingSkill = buildTutorialPendingSkillPreview({
    pendingSkillId: input.pendingSkillId ?? `${node.id || "tutorial-skill"}-${Date.now()}`,
    node,
    color,
    skill,
    requestedTargetId: targetId,
    resolvedGame: result.state,
    resolvesAt: input.resolvesAt ?? null
  });
  const previewState = cloneState(prepared);
  previewState.phase = GAME_PHASES.skillPreview;
  previewState.pendingSkill = pendingSkill;

  return {
    ok: true,
    state: previewState,
    resolvedState: result.state,
    pendingSkill,
    notices: result.notices ?? []
  };
}

function playTutorialMove(state, node) {
  const color = normalizeTutorialColor(node.color) ?? state.turn ?? COLORS.black;
  const prepared = cloneState(state);
  prepared.tutorialLastMovePointId = "";
  prepared.turn = color;
  return playMove(prepared, color, tutorialMovePointId(prepared, node));
}

export function tutorialMovePointId(state, node) {
  const pointId = String(node?.pointId ?? "").trim();
  if (node?.type !== TUTORIAL_NODE_TYPES.npcMove || !getPoint(state, pointId)?.stone) return pointId;
  const [x, y] = pointId.split(",").map(Number);
  const fallbackPointId = Number.isInteger(x) && Number.isInteger(y) ? `${x},${y - 1}` : "";
  return getPoint(state, fallbackPointId)?.valid && !getPoint(state, fallbackPointId)?.stone
    ? fallbackPointId
    : pointId;
}

function applyTutorialBoardSetup(state, node) {
  if (!node.boardSetup || typeof node.boardSetup !== "object") {
    return { ok: false, state, message: "Missing tutorial board setup" };
  }
  return {
    ok: true,
    state: createTutorialGameState({
      initialBoard: node.boardSetup,
      players: state?.players ?? DEFAULT_TUTORIAL_PLAYERS
    })
  };
}

function resignTutorialGame(state, node) {
  const color = normalizeTutorialColor(node.color) ?? state.turn ?? COLORS.black;
  return resignGame(state, color);
}

function normalizeTutorialColor(color) {
  return isPlayerColor(color) ? color : null;
}

function tutorialSkillConfig(node) {
  return normalizeSkillConfig(node.skillId || node.characterId);
}

function buildTutorialPendingSkillPreview({
  pendingSkillId,
  node,
  color,
  skill,
  requestedTargetId,
  resolvedGame,
  resolvesAt
}) {
  const skillAction = latestSkillAction(resolvedGame);
  const effectType = skillAction?.effectType ?? skill.effectType ?? skill.id ?? "";
  const targetId = skillAction?.id ?? requestedTargetId ?? null;
  const removalMarkIds = Array.isArray(skillAction?.removalMarkIds) ? skillAction.removalMarkIds : [];
  const characterId = skill.characterId ?? node.characterId ?? "sigrika";
  const character = CHARACTERS[characterId] ?? CHARACTERS.sigrika;
  return {
    id: pendingSkillId,
    color,
    username: node.speakerName || character.name,
    characterId,
    character,
    characterName: character.name,
    itemEffects: {},
    skillName: skillAction?.skill ?? skill.name ?? character.skill?.name ?? "Skill",
    musicTrackId: skillAction?.musicTrackId ?? skill.musicTrackId ?? null,
    effectType,
    targetId,
    affectedPointIds: affectedPointIdsForTutorialSkillAction({
      effectType,
      targetId,
      skillAction,
      boardSize: resolvedGame?.size
    }),
    erasedPointIds: Array.isArray(skillAction?.erasedPointIds) ? skillAction.erasedPointIds : [],
    secondaryRemovalIds: Array.isArray(skillAction?.secondaryRemovalIds) ? skillAction.secondaryRemovalIds : [],
    markedPointIds: Array.isArray(skillAction?.marked) ? skillAction.marked : [],
    removalMarkIds,
    row: Number.isInteger(skillAction?.row) ? skillAction.row : null,
    removed: skillAction?.removed ?? 0,
    removedByColor: skillAction?.removedByColor ?? null,
    removedStones: Array.isArray(skillAction?.directRemovals)
      ? skillAction.directRemovals.map((entry) => ({ id: entry?.id, from: entry?.from })).filter((entry) => entry.id && entry.from)
      : [],
    resolvesAt,
    effectsEnabled: true,
    bannerDurationMs: SKILL_BANNER_DURATION_MS,
    boardEffectDurationMs: skillBoardEffectDurationMs({ effectType, removalMarkIds })
  };
}

function latestSkillAction(game) {
  return [...(game?.history ?? [])].reverse().find((entry) => entry.type === "skill");
}

function affectedPointIdsForTutorialSkillAction({ effectType, targetId, skillAction, boardSize = 13 }) {
  if (Array.isArray(skillAction?.affectedPointIds) && skillAction.affectedPointIds.length) {
    return [...new Set(skillAction.affectedPointIds)];
  }
  if (effectType === "row-slash" && targetId) {
    const row = Number(String(targetId).split(",")[1]);
    if (!Number.isInteger(row)) return [];
    const size = Math.max(1, Number(boardSize) || 13);
    return Array.from({ length: size }, (_, x) => `${x},${row}`);
  }
  const transformedIds = Array.isArray(skillAction?.transformed)
    ? skillAction.transformed.map((entry) => entry?.id).filter(Boolean)
    : [];
  return [...new Set([
    ...(targetId ? [targetId] : []),
    ...(Array.isArray(skillAction?.marked) ? skillAction.marked : []),
    ...(Array.isArray(skillAction?.removalMarkIds) ? skillAction.removalMarkIds : []),
    ...(Array.isArray(skillAction?.erasedPointIds) ? skillAction.erasedPointIds : []),
    ...(Array.isArray(skillAction?.secondaryRemovalIds) ? skillAction.secondaryRemovalIds : []),
    ...transformedIds
  ])];
}
