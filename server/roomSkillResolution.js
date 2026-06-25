export {
  SKILL_BANNER_DURATION_MS,
  SKILL_BOARD_EFFECT_DURATION_MS,
  SKILL_PREVIEW_DELAY_MS,
  skillPreviewResolutionDelay
} from "../src/shared/skillPresentation.js";

import {
  GAME_PHASES,
  activatePassiveSkill,
  canStartSkill,
  skillUsesBoardConfirmation,
  useSkill
} from "../src/shared/game.js";
import { effectiveSkillConfigForColor } from "../src/shared/derivedSkills.js";
import { normalizeSkillConfig } from "../src/shared/gameSkills.js";
import { CHARACTERS } from "../src/shared/characters.js";
import {
  SKILL_BANNER_DURATION_MS,
  skillBoardEffectDurationMs,
  skillPreviewResolutionDelay
} from "../src/shared/skillPresentation.js";
import { gameModeFamily } from "../src/shared/gameModes.js";
import { getCachedPublicSiteSettings } from "./siteSettings.js";
import { describeSkillUse } from "./roomSkillMessages.js";

export function createPendingSkillResolution({
  pendingSkillId,
  game,
  notices = [],
  playerColor,
  effectType = "",
  effectsEnabled = true,
  now = Date.now
}) {
  const skillAction = latestSkillAction(game);
  const removalMarkIds = Array.isArray(skillAction?.removalMarkIds) ? skillAction.removalMarkIds : [];
  return {
    pendingSkillId,
    resolvesAt: now() + skillPreviewResolutionDelay({ effectType, effectsEnabled, removalMarkIds }),
    game,
    notices,
    playerColor,
    effectsEnabled
  };
}

export function canSchedulePendingSkillResolution(resolution) {
  return Boolean(resolution?.pendingSkillId && resolution.game);
}

export function pendingSkillResolutionDelay(resolution, { now = Date.now } = {}) {
  return Math.max(0, (resolution?.resolvesAt ?? now()) - now());
}

export function createRoomSkillLifecycle({
  rooms,
  scheduleRoomTimeout,
  appendSystem,
  appendNotices,
  resetByoYomi,
  scheduleRoomClose,
  broadcastRoom,
  randomId = () => crypto.randomUUID()
}) {
  function beginPendingSkillPreview({
    room,
    player,
    character,
    skill,
    skillTargetId,
    result,
    io
  }) {
    const pendingSkillId = randomId();
    const effectType = resolvedSkillEffectType(result.state, skill);
    room.pendingSkillResolution = createPendingSkillResolution({
      pendingSkillId,
      game: result.state,
      notices: result.notices ?? [],
      playerColor: player.color,
      effectType,
      effectsEnabled: skillEffectsEnabled()
    });
    const pendingSkill = buildPendingSkillPreview({
      pendingSkillId,
      player,
      character,
      skill,
      requestedTargetId: skillTargetId,
      resolvedGame: result.state,
      effectType,
      resolvesAt: room.pendingSkillResolution.resolvesAt,
      effectsEnabled: room.pendingSkillResolution.effectsEnabled
    });
    room.game = {
      ...room.game,
      phase: GAME_PHASES.skillPreview,
      pendingSkill
    };
    appendSystem(room, describeSkillUse(room, player, skillTargetId, skill), { kind: "skill" });
    schedulePendingSkillResolution(room, io);
    return { ok: true, room };
  }

  function startActiveSkill({ room, player, action, io }) {
    const baseSkillConfig = normalizeSkillConfig(player.character?.skill ?? player.characterId);
    const skillConfig = effectiveSkillConfigForColor(room.game, player.color, baseSkillConfig);
    if (gameModeFamily(room.game?.mode) === "gomoku") return { ok: false, error: "五子棋不能使用技能" };
    if (!canStartSkill(room.game, skillConfig)) return { ok: false, error: "场上没有可作用的棋子" };
    const skillTargetId = skillUsesBoardConfirmation(skillConfig) ? null : action.pointId;
    const result = useSkill(room.game, player.color, skillConfig, skillTargetId);
    if (!result.ok) return result;
    if (result.revealedOnly) {
      room.game = result.state;
      appendNotices(room, result.notices ?? []);
      broadcastRoom(io, room);
      return { ok: true, room };
    }

    const character = player.character ?? CHARACTERS[player.characterId] ?? CHARACTERS.sigrika;
    return beginPendingSkillPreview({
      room,
      player,
      character,
      skill: skillConfig,
      skillTargetId,
      result,
      io
    });
  }

  function maybeStartPassiveSkill(room, io) {
    if (room.game.phase !== GAME_PHASES.playing || room.game.pendingSkill) return false;
    const player = room.players.find((candidate) => candidate.color === room.game.turn);
    const skill = player?.character?.skill ?? CHARACTERS[player?.characterId]?.skill;
    const effectType = skill?.effectType ?? skill?.id;
    if (effectType !== "color-illusion-passive") return false;
    if (room.game.passives?.[player.color]?.colorIllusion?.triggered) return false;
    const character = player.character ?? CHARACTERS[player.characterId] ?? CHARACTERS.nabomo;
    const result = activatePassiveSkill(room.game, player.color, skill);
    if (!result.ok) return false;
    beginPendingSkillPreview({
      room,
      player,
      character,
      skill,
      skillTargetId: null,
      result,
      io
    });
    return true;
  }

  function schedulePendingSkillResolution(room, io) {
    const resolution = room.pendingSkillResolution;
    if (!canSchedulePendingSkillResolution(resolution)) return false;
    const delay = pendingSkillResolutionDelay(resolution);
    scheduleRoomTimeout(room, () => {
      completePendingSkillResolution(room.code, resolution.pendingSkillId, io);
    }, delay);
    return true;
  }

  function completePendingSkillResolution(roomCode, pendingSkillId, io) {
    const latest = rooms.get(roomCode);
    if (!latest || latest.game.pendingSkill?.id !== pendingSkillId) return false;
    const resolution = latest.pendingSkillResolution;
    if (!resolution?.game) return false;
    const resolvedGame = structuredClone(resolution.game);
    resolvedGame.pendingSkill = null;
    latest.pendingSkillResolution = null;
    latest.game = resolvedGame;
    const player = latest.players.find((candidate) => candidate.color === resolution.playerColor);
    if (player) resetByoYomi(player);
    appendNotices(latest, resolution.notices ?? []);
    if (latest.game.phase === GAME_PHASES.finished) scheduleRoomClose(roomCode, io);
    else if (!latest.game.extraTurn) maybeStartPassiveSkill(latest, io);
    broadcastRoom(io, latest);
    return true;
  }

  return {
    startActiveSkill,
    maybeStartPassiveSkill,
    schedulePendingSkillResolution,
    completePendingSkillResolution
  };
}

export function buildPendingSkillPreview({
  pendingSkillId,
  player,
  character,
  skill,
  requestedTargetId,
  resolvedGame,
  effectType: providedEffectType = "",
  resolvesAt,
  effectsEnabled = true
}) {
  const skillAction = [...(resolvedGame.history ?? [])].reverse().find((entry) => entry.type === "skill");
  const effectType = providedEffectType || resolvedSkillEffectType(resolvedGame, skill);
  const targetId = skillAction?.id ?? requestedTargetId ?? null;
  const markedPointIds = Array.isArray(skillAction?.marked) ? skillAction.marked : [];
  const removalMarkIds = Array.isArray(skillAction?.removalMarkIds) ? skillAction.removalMarkIds : [];
  const removedStones = Array.isArray(skillAction?.directRemovals)
    ? skillAction.directRemovals
        .map((entry) => ({ id: entry?.id, from: entry?.from }))
        .filter((entry) => entry.id && entry.from)
    : [];
  const affectedPointIds = affectedPointIdsForSkillAction({
    effectType,
    targetId,
    markedPointIds,
    removalMarkIds,
    affectedPointIds: skillAction?.affectedPointIds,
    erasedPointIds: skillAction?.erasedPointIds,
    secondaryRemovalIds: skillAction?.secondaryRemovalIds,
    transformed: skillAction?.transformed,
    boardSize: resolvedGame?.size
  });

  return {
    id: pendingSkillId,
    color: player.color,
    username: player.user.username,
    characterId: character.id ?? player.characterId,
    character: player.character ?? null,
    characterName: character.name,
    itemEffects: player.user.itemEffects ?? {},
    skillName: skill.name,
    musicTrackId: skillAction?.musicTrackId ?? skill.musicTrackId ?? null,
    effectType,
    targetId,
    affectedPointIds,
    erasedPointIds: Array.isArray(skillAction?.erasedPointIds) ? skillAction.erasedPointIds : [],
    secondaryRemovalIds: Array.isArray(skillAction?.secondaryRemovalIds) ? skillAction.secondaryRemovalIds : [],
    markedPointIds,
    removalMarkIds,
    row: Number.isInteger(skillAction?.row) ? skillAction.row : null,
    removed: skillAction?.removed ?? 0,
    removedByColor: skillAction?.removedByColor ?? null,
    removedStones,
    resolvesAt,
    effectsEnabled,
    bannerDurationMs: SKILL_BANNER_DURATION_MS,
    boardEffectDurationMs: effectsEnabled === false
      ? 0
      : skillBoardEffectDurationMs({ effectType, removalMarkIds })
  };
}

function latestSkillAction(game) {
  return [...(game?.history ?? [])].reverse().find((entry) => entry.type === "skill");
}

function resolvedSkillEffectType(resolvedGame, skill) {
  const skillAction = latestSkillAction(resolvedGame);
  return skillAction?.effectType ?? skill?.effectType ?? skill?.id ?? "";
}

function skillEffectsEnabled() {
  return getCachedPublicSiteSettings().skillEffectsEnabled !== false;
}

export function affectedPointIdsForSkillAction({ effectType, targetId, markedPointIds, removalMarkIds = [], affectedPointIds = [], erasedPointIds = [], secondaryRemovalIds = [], transformed = [], boardSize = 13 }) {
  if (Array.isArray(affectedPointIds) && affectedPointIds.length) return [...new Set(affectedPointIds)];
  if (effectType === "voyage-star") {
    return [...new Set([
      ...(targetId ? [targetId] : []),
      ...(Array.isArray(erasedPointIds) ? erasedPointIds : []),
      ...(Array.isArray(secondaryRemovalIds) ? secondaryRemovalIds : [])
    ])];
  }
  if (effectType === "random-blast") return markedPointIds;
  if (effectType === "spray-stone") {
    const transformedIds = Array.isArray(transformed)
      ? transformed.map((entry) => entry?.id).filter(Boolean)
      : [];
    return [...new Set([...(targetId ? [targetId] : []), ...transformedIds])];
  }
  if (effectType === "liberty-purge") {
    return [...new Set([...(targetId ? [targetId] : []), ...removalMarkIds])];
  }
  if (effectType === "row-slash" && targetId) {
    const [, rawY] = String(targetId).split(",").map(Number);
    if (!Number.isInteger(rawY)) return [];
    const size = Math.max(1, Number(boardSize) || 13);
    return Array.from({ length: size }, (_, x) => `${x},${rawY}`);
  }
  return targetId ? [targetId] : [];
}
