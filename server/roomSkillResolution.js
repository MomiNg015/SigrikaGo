export {
  SKILL_BANNER_DURATION_MS,
  SKILL_BOARD_EFFECT_DURATION_MS,
  SKILL_PREVIEW_DELAY_MS
} from "../src/shared/skillPresentation.js";

import {
  GAME_PHASES,
  activatePassiveSkill,
  canStartSkill,
  skillUsesBoardConfirmation,
  useSkill
} from "../src/shared/game.js";
import { CHARACTERS } from "../src/shared/characters.js";
import { SKILL_PREVIEW_DELAY_MS } from "../src/shared/skillPresentation.js";
import {
  SKILL_BANNER_DURATION_MS,
  SKILL_BOARD_EFFECT_DURATION_MS
} from "../src/shared/skillPresentation.js";
import { describeSkillUse } from "./roomSkillMessages.js";

export function createPendingSkillResolution({
  pendingSkillId,
  game,
  notices = [],
  playerColor,
  now = Date.now
}) {
  return {
    pendingSkillId,
    resolvesAt: now() + SKILL_PREVIEW_DELAY_MS,
    game,
    notices,
    playerColor
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
    room.pendingSkillResolution = createPendingSkillResolution({
      pendingSkillId,
      game: result.state,
      notices: result.notices ?? [],
      playerColor: player.color
    });
    const pendingSkill = buildPendingSkillPreview({
      pendingSkillId,
      player,
      character,
      skill,
      requestedTargetId: skillTargetId,
      resolvedGame: result.state,
      resolvesAt: room.pendingSkillResolution.resolvesAt
    });
    room.game = {
      ...room.game,
      phase: GAME_PHASES.skillPreview,
      pendingSkill
    };
    appendSystem(room, describeSkillUse(room, player, skillTargetId), { kind: "skill" });
    schedulePendingSkillResolution(room, io);
    return { ok: true, room };
  }

  function startActiveSkill({ room, player, action, io }) {
    const skillConfig = player.character?.skill ?? player.characterId;
    if (!canStartSkill(room.game, skillConfig)) return { ok: false, error: "场上没有可作用的棋子" };
    const skillTargetId = skillUsesBoardConfirmation(skillConfig) ? null : action.pointId;
    const result = useSkill(room.game, player.color, skillConfig, skillTargetId);
    if (!result.ok) return result;

    const character = player.character ?? CHARACTERS[player.characterId] ?? CHARACTERS.sigrika;
    const skill = character.skill ?? CHARACTERS[player.characterId]?.skill ?? CHARACTERS.sigrika.skill;
    return beginPendingSkillPreview({
      room,
      player,
      character,
      skill,
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
    else maybeStartPassiveSkill(latest, io);
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
  resolvesAt
}) {
  const skillAction = [...(resolvedGame.history ?? [])].reverse().find((entry) => entry.type === "skill");
  const effectType = skillAction?.effectType ?? skill?.effectType ?? skill?.id ?? "";
  const targetId = skillAction?.id ?? requestedTargetId ?? null;
  const markedPointIds = Array.isArray(skillAction?.marked) ? skillAction.marked : [];
  const affectedPointIds = affectedPointIdsForSkillAction({ effectType, targetId, markedPointIds });

  return {
    id: pendingSkillId,
    color: player.color,
    username: player.user.username,
    characterId: character.id ?? player.characterId,
    character: player.character ?? null,
    characterName: character.name,
    itemEffects: player.user.itemEffects ?? {},
    skillName: skill.name,
    effectType,
    targetId,
    affectedPointIds,
    markedPointIds,
    removed: skillAction?.removed ?? 0,
    removedByColor: skillAction?.removedByColor ?? null,
    resolvesAt,
    bannerDurationMs: SKILL_BANNER_DURATION_MS,
    boardEffectDurationMs: SKILL_BOARD_EFFECT_DURATION_MS
  };
}

export function affectedPointIdsForSkillAction({ effectType, targetId, markedPointIds }) {
  if (effectType === "random-blast") return markedPointIds;
  return targetId ? [targetId] : [];
}
