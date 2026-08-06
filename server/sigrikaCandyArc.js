import {
  SIGRIKA_CANDY_MAX_USE_COUNT,
  SIGRIKA_CANDY_OUTCOMES,
  SIGRIKA_CANDY_PHASES,
  normalizeSigrikaCandyArc
} from "../src/shared/sigrikaCandyArc.js";
import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import { CHARACTERS } from "../src/shared/characters.js";
import { publicUser, USER_ASSET_RELATION_INCLUDE } from "./db.js";
import { parseItemEffects, RAINBOW_BEAN_CANDY_ID, serializeItemEffects } from "./itemEffects.js";
import { canUseDebugTestActions } from "./security.js";
import { getPublishedStoryScriptForTrigger, STORY_TRIGGER_TYPES } from "./storyScripts.js";
import { syncStructuredUserAssets } from "./userAssets.js";

const CANDY_EFFECT_KEYS = Object.freeze({
  sigrika: "sigrikaCandyDisabled",
  denia: "deniaRainbowGlow",
  aemeath: "aemeathRainbowMove",
  lynae: "lynaeContraryVoice"
});

const USER_COLUMNS = Object.freeze([
  ["sigrikaCandyUseCount", 'ALTER TABLE "User" ADD COLUMN "sigrikaCandyUseCount" INTEGER NOT NULL DEFAULT 0'],
  ["sigrikaCandyPhase", 'ALTER TABLE "User" ADD COLUMN "sigrikaCandyPhase" TEXT NOT NULL DEFAULT \'normal\''],
  ["sigrikaCandyOutcome", 'ALTER TABLE "User" ADD COLUMN "sigrikaCandyOutcome" TEXT NOT NULL DEFAULT \'\''],
  ["sigrikaCandyRoomCode", 'ALTER TABLE "User" ADD COLUMN "sigrikaCandyRoomCode" TEXT NOT NULL DEFAULT \'\'']
]);

export async function ensureSigrikaCandyArcSchema(client) {
  if (!client?.$executeRawUnsafe) return;
  const columns = client.$queryRawUnsafe
    ? await client.$queryRawUnsafe('PRAGMA table_info("User")')
    : [];
  const existing = new Set(columns.map((column) => column.name));
  for (const [name, sql] of USER_COLUMNS) {
    if (existing.has(name)) continue;
    await client.$executeRawUnsafe(sql);
  }
}

export function sigrikaCandyUseProgressData(user = {}) {
  const arc = normalizeSigrikaCandyArc(user);
  if (arc.phase !== SIGRIKA_CANDY_PHASES.normal || arc.useCount >= SIGRIKA_CANDY_MAX_USE_COUNT) {
    throw routeError(409, "西格莉卡的异常剧情尚未结束");
  }
  const useCount = arc.useCount + 1;
  return {
    sigrikaCandyUseCount: useCount,
    sigrikaCandyPhase: useCount === SIGRIKA_CANDY_MAX_USE_COUNT
      ? SIGRIKA_CANDY_PHASES.corruptionStory
      : SIGRIKA_CANDY_PHASES.normal,
    sigrikaCandyOutcome: "",
    sigrikaCandyRoomCode: ""
  };
}

export function sigrikaCandyClimaxData(user = {}) {
  const arc = normalizeSigrikaCandyArc(user);
  if (arc.phase === SIGRIKA_CANDY_PHASES.awaitingDuel) return {};
  if (arc.phase !== SIGRIKA_CANDY_PHASES.corruptionStory || arc.useCount !== SIGRIKA_CANDY_MAX_USE_COUNT) {
    throw routeError(409, "当前不能触发界面异常");
  }
  return { sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.awaitingDuel };
}

export function sigrikaCandyDebugJumpData(user = {}) {
  const arc = normalizeSigrikaCandyArc(user);
  if (arc.phase === SIGRIKA_CANDY_PHASES.corruptionStory && arc.useCount === SIGRIKA_CANDY_MAX_USE_COUNT) {
    return {};
  }
  if (arc.phase !== SIGRIKA_CANDY_PHASES.normal || arc.useCount < 1 || arc.useCount >= SIGRIKA_CANDY_MAX_USE_COUNT) {
    throw routeError(409, "请先进入西格莉卡的普通糖果剧情");
  }
  return {
    sigrikaCandyUseCount: SIGRIKA_CANDY_MAX_USE_COUNT,
    sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.corruptionStory,
    sigrikaCandyOutcome: "",
    sigrikaCandyRoomCode: ""
  };
}

export function sigrikaCandyDuelStartedData(roomCode) {
  return {
    sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.duelActive,
    sigrikaCandyRoomCode: String(roomCode ?? "").trim(),
    sigrikaCandyOutcome: ""
  };
}

export function sigrikaCandyResultData(outcome) {
  if (!Object.values(SIGRIKA_CANDY_OUTCOMES).includes(outcome)) {
    throw routeError(400, "特殊对局结果无效");
  }
  return {
    sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.resultPending,
    sigrikaCandyOutcome: outcome
  };
}

export function sigrikaCandyRecoveryStartedData(user = {}) {
  const arc = normalizeSigrikaCandyArc(user);
  if (arc.phase === SIGRIKA_CANDY_PHASES.recoveryStory) return {};
  if (arc.phase !== SIGRIKA_CANDY_PHASES.resultPending || !arc.outcome) {
    throw routeError(409, "当前没有待播放的恢复剧情");
  }
  return { sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.recoveryStory };
}

export function sigrikaCandyRecoveryCompletedData(user = {}) {
  const arc = normalizeSigrikaCandyArc(user);
  if (arc.phase === SIGRIKA_CANDY_PHASES.normal && arc.useCount === 0) return {};
  if (arc.phase !== SIGRIKA_CANDY_PHASES.recoveryStory) {
    throw routeError(409, "当前不能结束恢复剧情");
  }
  const itemEffects = parseItemEffects(user.itemEffects);
  delete itemEffects.sigrikaCandyDisabled;
  return {
    itemEffects: serializeItemEffects(itemEffects),
    sigrikaCandyUseCount: 0,
    sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.normal,
    sigrikaCandyOutcome: "",
    sigrikaCandyRoomCode: ""
  };
}

export async function getSigrikaCandyArcStory({ prisma, userId }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw routeError(404, "用户不存在");
  const arc = normalizeSigrikaCandyArc(user);
  const startNodeId = arc.phase === SIGRIKA_CANDY_PHASES.corruptionStory
    ? "corruption-start"
    : arc.phase === SIGRIKA_CANDY_PHASES.resultPending || arc.phase === SIGRIKA_CANDY_PHASES.recoveryStory
      ? arc.outcome === SIGRIKA_CANDY_OUTCOMES.win ? "recovery-win-start" : "recovery-loss-start"
      : "";
  if (!startNodeId) return { user: publicUser(user), storyScript: null };
  const storyScript = await getPublishedStoryScriptForTrigger({
    prisma,
    triggerType: STORY_TRIGGER_TYPES.itemCharacterUse,
    triggerParams: { itemId: RAINBOW_BEAN_CANDY_ID, characterId: "sigrika" },
    variables: {
      username: user.username,
      characterName: CHARACTERS.sigrika?.name ?? "西格莉卡",
      itemName: "彩虹豆豆跳跳糖"
    }
  });
  return {
    user: publicUser(user),
    storyScript: storyScript && storyScript.nodes?.some((node) => node.id === startNodeId)
      ? { ...storyScript, startNodeId }
      : storyScript
  };
}

export async function markSigrikaCandyClimax({ prisma, userId }) {
  return updateArcUser(prisma, userId, sigrikaCandyClimaxData);
}

export async function debugJumpSigrikaCandyToUseEight({ prisma, userId, nodeEnv = process.env.NODE_ENV }) {
  if (!canUseDebugTestActions({ NODE_ENV: nodeEnv })) throw routeError(404, "接口不存在");
  return updateArcUser(prisma, userId, sigrikaCandyDebugJumpData, { includeAssets: true });
}

export async function markSigrikaCandyDuelStarted({ prisma, userId, roomCode }) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: sigrikaCandyDuelStartedData(roomCode)
  });
  return publicUser(updated);
}

export async function startSigrikaCandyRecovery({ prisma, userId }) {
  const user = await updateArcUser(prisma, userId, sigrikaCandyRecoveryStartedData);
  const story = await getSigrikaCandyArcStory({ prisma, userId });
  return { ...story, user };
}

export async function completeSigrikaCandyRecovery({ prisma, userId }) {
  const user = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({ where: { id: userId } });
    if (!current) throw routeError(404, "用户不存在");
    const data = sigrikaCandyRecoveryCompletedData(current);
    if (!Object.keys(data).length) return current;
    const updated = await tx.user.update({ where: { id: userId }, data });
    await syncStructuredUserAssets(tx, updated);
    return updated;
  });
  return publicUser(user);
}

export async function cancelRainbowBeanCandyEffect({ prisma, userId, characterId, nodeEnv = process.env.NODE_ENV }) {
  if (!canUseDebugTestActions({ NODE_ENV: nodeEnv })) throw routeError(404, "接口不存在");
  const canonicalId = canonicalCharacterId(characterId);
  const effectKey = CANDY_EFFECT_KEYS[canonicalId];
  if (!effectKey) throw routeError(400, "这个角色没有可取消的糖果效果");
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: USER_ASSET_RELATION_INCLUDE
    });
    if (!user) throw routeError(404, "用户不存在");
    const arc = normalizeSigrikaCandyArc(user);
    if (canonicalId === "sigrika" && arc.phase !== SIGRIKA_CANDY_PHASES.normal) {
      throw routeError(409, "异常剧情期间不能取消西格莉卡的糖果效果");
    }
    const itemEffects = parseItemEffects(user.itemEffects);
    if (!itemEffects[effectKey]) return user;
    delete itemEffects[effectKey];
    const nextUser = await tx.user.update({
      where: { id: userId },
      data: { itemEffects: serializeItemEffects(itemEffects) }
    });
    await syncStructuredUserAssets(tx, nextUser);
    return tx.user.findUnique({
      where: { id: userId },
      include: USER_ASSET_RELATION_INCLUDE
    });
  });
  if (!updated) throw routeError(404, "用户不存在");
  return { user: publicUser(updated) };
}

async function updateArcUser(prisma, userId, transition, { includeAssets = false } = {}) {
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      ...(includeAssets ? { include: USER_ASSET_RELATION_INCLUDE } : {})
    });
    if (!user) throw routeError(404, "用户不存在");
    const data = transition(user);
    if (!Object.keys(data).length) return user;
    await tx.user.update({ where: { id: userId }, data });
    return includeAssets
      ? tx.user.findUnique({ where: { id: userId }, include: USER_ASSET_RELATION_INCLUDE })
      : { ...user, ...data };
  });
  if (!updated) throw routeError(404, "用户不存在");
  return publicUser(updated);
}

function routeError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
