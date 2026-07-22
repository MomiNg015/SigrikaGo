import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import { normalizeSkillConfig } from "../src/shared/gameSkills.js";
import { isPlayerColor } from "../src/shared/gameConstants.js";
import { normalizeStoryNodeEffect } from "../src/shared/storyPresentation.js";
import {
  TUTORIAL_NODE_TYPES,
  isStoryNodeType,
  nodeTypeRequiresPoint,
  normalizeTutorialNodeType
} from "../src/shared/tutorialNodeTypes.js";
import { routeError } from "./adminRouteErrors.js";
import { writeAudit } from "./adminAudit.js";
import { RAINBOW_BEAN_CANDY_ID } from "./itemEffects.js";
import { defaultRainbowBeanCandyStoryDraft } from "./rainbowBeanCandyStory.js";

export const STORY_TRIGGER_TYPES = Object.freeze({
  onboarding: "onboarding",
  itemCharacterUse: "item-character-use",
  battleTutorialStart: "battle-tutorial-start"
});

export const ONBOARDING_STORY_KEY = "onboarding.default";

const EMPTY_SCRIPT = Object.freeze({
  startNodeId: "",
  nodes: []
});

const VARIABLE_NAMES = new Set(["username", "characterName", "itemName"]);

const ERRORS = Object.freeze({
  invalidAction: "操作类型无效",
  invalidInput: "剧情脚本格式无效",
  invalidJson: "后台不能直接提交触发器 JSON",
  keyRequired: "脚本 Key 不能为空",
  triggerTypeRequired: "触发器类型无效",
  itemCharacterTriggerRequired: "道具角色触发器需要选择道具和角色",
  onboardingParamsEmpty: "新手引导触发器不需要参数",
  missingNodes: "发布前至少需要一个节点",
  missingStart: "起始节点不存在",
  nodeIdRequired: "节点 ID 不能为空",
  duplicateNodeId: "节点 ID 不能重复",
  textRequired: "正文不能为空",
  targetMissing: "跳转目标不存在",
  optionLabelRequired: "选项文案不能为空",
  optionTargetRequired: "选项目标不能为空",
  invalidNodeEffect: "剧情节点效果无效",
  invalidOptionRevealDelay: "选项出现时间必须是非负数字",
  invalidOptionTransitionDelay: "选项选择后等待必须是非负数字",
  endingRequired: "至少需要一个结束节点",
  triggerConflict: "同一个触发点只能发布一个剧情脚本",
  scriptNotFound: "剧情脚本不存在",
  systemScriptProtected: "系统剧情脚本不能删除",
  publishedScriptDeleteDenied: "已发布剧情脚本请先停用后再删除"
});

const TUTORIAL_ERRORS = Object.freeze({
  invalidNodeType: "剧情节点类型无效",
  pointRequired: "教学节点坐标不能为空",
  boardSetupRequired: "教学局面步骤必须配置棋盘局面",
  colorRequired: "教学节点颜色无效"
});

const TUTORIAL_SKILL_REQUIRED_ERROR = "教学技能 ID 无效";

export async function ensureStoryScriptSchema(client) {
  if (!client?.$executeRawUnsafe) return;
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StoryScript" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "key" TEXT NOT NULL,
      "title" TEXT NOT NULL DEFAULT '',
      "triggerType" TEXT NOT NULL,
      "triggerParamsJson" TEXT NOT NULL DEFAULT '{}',
      "draftStartNodeId" TEXT NOT NULL DEFAULT '',
      "draftInitialBoardJson" TEXT NOT NULL DEFAULT '',
      "draftNodesJson" TEXT NOT NULL DEFAULT '[]',
      "isPublished" BOOLEAN NOT NULL DEFAULT false,
      "publishedStartNodeId" TEXT NOT NULL DEFAULT '',
      "publishedInitialBoardJson" TEXT NOT NULL DEFAULT '',
      "publishedNodesJson" TEXT NOT NULL DEFAULT '[]',
      "firstPublishedAt" DATETIME,
      "publishedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await addColumnIfMissing(client, "StoryScript", "draftInitialBoardJson", 'ALTER TABLE "StoryScript" ADD COLUMN "draftInitialBoardJson" TEXT NOT NULL DEFAULT \'\'');
  await addColumnIfMissing(client, "StoryScript", "publishedInitialBoardJson", 'ALTER TABLE "StoryScript" ADD COLUMN "publishedInitialBoardJson" TEXT NOT NULL DEFAULT \'\'');
  await client.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "StoryScript_key_key" ON "StoryScript"("key")');
  await client.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "StoryScript_triggerType_isPublished_idx" ON "StoryScript"("triggerType", "isPublished")');
}

async function addColumnIfMissing(client, tableName, columnName, sql) {
  if (!client.$queryRawUnsafe) {
    await client.$executeRawUnsafe(sql);
    return;
  }
  const columns = await client.$queryRawUnsafe(`PRAGMA table_info("${tableName}")`);
  if (columns.some((column) => column.name === columnName)) return;
  await client.$executeRawUnsafe(sql);
}

export function validateStoryScriptInput(input = {}, { publishing = false } = {}) {
  if (!input || typeof input !== "object") throw routeError(400, ERRORS.invalidInput);
  if (Object.prototype.hasOwnProperty.call(input, "triggerParamsJson")) throw routeError(400, ERRORS.invalidJson);

  const key = normalizeText(input.key);
  const title = normalizeText(input.title);
  const triggerType = normalizeTriggerType(input.triggerType);
  const triggerParams = normalizeTriggerParams(triggerType, input.triggerParams);
  const draft = validateStoryContent(input.draft ?? input, { publishing });

  if (!key) throw routeError(400, ERRORS.keyRequired);
  if (publishing) validateStoryContent(draft, { publishing: true });

  return {
    key,
    title,
    triggerType,
    triggerParams,
    draft
  };
}

export function validateStoryContent(input = {}, { publishing = false } = {}) {
  if (!input || typeof input !== "object") throw routeError(400, ERRORS.invalidInput);
  const startNodeId = normalizeText(input.startNodeId);
  const initialBoard = normalizeInitialBoard(input.initialBoard);
  const sourceNodes = Array.isArray(input.nodes) ? input.nodes : [];
  const nodes = sourceNodes.map(normalizeNode);

  if (!publishing) return { startNodeId, initialBoard, nodes };
  if (!nodes.length) throw routeError(400, ERRORS.missingNodes);

  const nodeIds = new Set();
  for (const node of nodes) {
    if (!node.id) throw routeError(400, ERRORS.nodeIdRequired);
    if (nodeIds.has(node.id)) throw routeError(400, ERRORS.duplicateNodeId);
    nodeIds.add(node.id);
    if (isStoryNodeType(node.type) && !node.text) throw routeError(400, ERRORS.textRequired);
    if (nodeTypeRequiresPoint(node.type) && !node.pointId) throw routeError(400, TUTORIAL_ERRORS.pointRequired);
    if (node.type === TUTORIAL_NODE_TYPES.boardSetup && !node.boardSetup) throw routeError(400, TUTORIAL_ERRORS.boardSetupRequired);
    if (nodeTypeRequiresSkill(node.type) && !normalizeSkillConfig(node.skillId || node.characterId)) throw routeError(400, TUTORIAL_SKILL_REQUIRED_ERROR);
    if (node.color && !isPlayerColor(node.color)) throw routeError(400, TUTORIAL_ERRORS.colorRequired);
  }

  if (!startNodeId || !nodeIds.has(startNodeId)) throw routeError(400, ERRORS.missingStart);

  let hasEnding = false;
  for (const node of nodes) {
    if (node.wrongMoveNextNodeId && !nodeIds.has(node.wrongMoveNextNodeId)) {
      throw routeError(400, ERRORS.targetMissing);
    }
    if (node.options.length) {
      for (const option of node.options) {
        if (!option.label) throw routeError(400, ERRORS.optionLabelRequired);
        if (!option.nextNodeId) {
          hasEnding = true;
          continue;
        }
        if (!nodeIds.has(option.nextNodeId)) throw routeError(400, ERRORS.targetMissing);
      }
      continue;
    }
    if (node.nextNodeId) {
      if (!nodeIds.has(node.nextNodeId)) throw routeError(400, ERRORS.targetMissing);
      continue;
    }
    hasEnding = true;
  }

  if (!hasEnding) throw routeError(400, ERRORS.endingRequired);
  return { startNodeId, initialBoard, nodes };
}

export async function listAdminStoryScripts({ prisma }) {
  const records = await prisma.storyScript.findMany({
    orderBy: [{ triggerType: "asc" }, { key: "asc" }]
  });
  return { scripts: records.map(toAdminStoryScriptPayload) };
}

export async function getAdminStoryScript({ prisma, key = ONBOARDING_STORY_KEY }) {
  const record = await prisma.storyScript.findUnique({ where: { key } });
  return { script: toAdminStoryScriptPayload(record, { key }) };
}

export async function updateStoryScriptDraft({ prisma, adminUser, input }) {
  const normalized = validateStoryScriptInput(input, { publishing: false });
  const updated = await prisma.$transaction(async (tx) => {
    const before = await tx.storyScript.findUnique({ where: { key: normalized.key } });
    const saved = await tx.storyScript.upsert({
      where: { key: normalized.key },
      create: {
        id: normalized.key,
        key: normalized.key,
        title: normalized.title,
        triggerType: normalized.triggerType,
        triggerParamsJson: JSON.stringify(normalized.triggerParams),
        draftStartNodeId: normalized.draft.startNodeId,
        draftInitialBoardJson: JSON.stringify(normalized.draft.initialBoard ?? null),
        draftNodesJson: JSON.stringify(normalized.draft.nodes)
      },
      update: {
        title: normalized.title,
        triggerType: normalized.triggerType,
        triggerParamsJson: JSON.stringify(normalized.triggerParams),
        draftStartNodeId: normalized.draft.startNodeId,
        draftInitialBoardJson: JSON.stringify(normalized.draft.initialBoard ?? null),
        draftNodesJson: JSON.stringify(normalized.draft.nodes)
      }
    });
    await writeAudit(tx, adminUser, "story-script.update", saved.key, toAdminStoryScriptPayload(before), toAdminStoryScriptPayload(saved), "story-script");
    return saved;
  });
  return { script: toAdminStoryScriptPayload(updated) };
}

export async function publishStoryScript({ prisma, adminUser, input }) {
  const normalized = validateStoryScriptInput(input, { publishing: true });
  return prisma.$transaction(async (tx) => {
    const before = await tx.storyScript.findUnique({ where: { key: normalized.key } });
    await assertNoPublishedTriggerConflict({
      prisma: tx,
      key: normalized.key,
      triggerType: normalized.triggerType,
      triggerParams: normalized.triggerParams
    });
    const now = new Date();
    const saved = await tx.storyScript.upsert({
      where: { key: normalized.key },
      create: {
        id: normalized.key,
        key: normalized.key,
        title: normalized.title,
        triggerType: normalized.triggerType,
        triggerParamsJson: JSON.stringify(normalized.triggerParams),
        draftStartNodeId: normalized.draft.startNodeId,
        draftInitialBoardJson: JSON.stringify(normalized.draft.initialBoard ?? null),
        draftNodesJson: JSON.stringify(normalized.draft.nodes),
        isPublished: true,
        publishedStartNodeId: normalized.draft.startNodeId,
        publishedInitialBoardJson: JSON.stringify(normalized.draft.initialBoard ?? null),
        publishedNodesJson: JSON.stringify(normalized.draft.nodes),
        firstPublishedAt: now,
        publishedAt: now
      },
      update: {
        title: normalized.title,
        triggerType: normalized.triggerType,
        triggerParamsJson: JSON.stringify(normalized.triggerParams),
        draftStartNodeId: normalized.draft.startNodeId,
        draftInitialBoardJson: JSON.stringify(normalized.draft.initialBoard ?? null),
        draftNodesJson: JSON.stringify(normalized.draft.nodes),
        isPublished: true,
        publishedStartNodeId: normalized.draft.startNodeId,
        publishedInitialBoardJson: JSON.stringify(normalized.draft.initialBoard ?? null),
        publishedNodesJson: JSON.stringify(normalized.draft.nodes),
        firstPublishedAt: before?.firstPublishedAt ?? now,
        publishedAt: now
      }
    });
    await writeAudit(tx, adminUser, "story-script.publish", saved.key, toAdminStoryScriptPayload(before), toAdminStoryScriptPayload(saved), "story-script");
    return { script: toAdminStoryScriptPayload(saved) };
  });
}

export async function unpublishStoryScript({ prisma, adminUser, key }) {
  const normalizedKey = normalizeText(key);
  if (!normalizedKey) throw routeError(400, ERRORS.keyRequired);
  const updated = await prisma.$transaction(async (tx) => {
    const before = await tx.storyScript.findUnique({ where: { key: normalizedKey } });
    if (!before) throw routeError(404, ERRORS.scriptNotFound);
    const saved = await tx.storyScript.update({
      where: { key: normalizedKey },
      data: { isPublished: false }
    });
    await writeAudit(tx, adminUser, "story-script.unpublish", saved.key, toAdminStoryScriptPayload(before), toAdminStoryScriptPayload(saved), "story-script");
    return saved;
  });
  return { script: toAdminStoryScriptPayload(updated) };
}

export async function deleteStoryScript({ prisma, adminUser, key }) {
  const normalizedKey = normalizeText(key);
  if (!normalizedKey) throw routeError(400, ERRORS.keyRequired);
  if (normalizedKey === ONBOARDING_STORY_KEY) throw routeError(400, ERRORS.systemScriptProtected);
  const deleted = await prisma.$transaction(async (tx) => {
    const before = await tx.storyScript.findUnique({ where: { key: normalizedKey } });
    if (!before) throw routeError(404, ERRORS.scriptNotFound);
    if (before.isPublished) throw routeError(400, ERRORS.publishedScriptDeleteDenied);
    await tx.storyScript.delete({ where: { key: normalizedKey } });
    await writeAudit(tx, adminUser, "story-script.delete", normalizedKey, toAdminStoryScriptPayload(before), null, "story-script");
    return before;
  });
  return { script: toAdminStoryScriptPayload(deleted), deleted: true };
}

export async function updateAdminStoryScript({ prisma, adminUser, input }) {
  const action = normalizeAdminAction(input?.action);
  if (action === "publish") return publishStoryScript({ prisma, adminUser, input });
  if (action === "unpublish") return unpublishStoryScript({ prisma, adminUser, key: input?.key });
  return updateStoryScriptDraft({ prisma, adminUser, input });
}

export async function getPublishedStoryScriptForTrigger({ prisma, triggerType, triggerParams = {}, variables = {} }) {
  if (!prisma?.storyScript?.findMany) return null;
  const normalizedTriggerType = normalizeTriggerType(triggerType);
  const normalizedTriggerParams = normalizeTriggerParams(normalizedTriggerType, triggerParams);
  const records = await prisma.storyScript.findMany({
    where: {
      triggerType: normalizedTriggerType,
      isPublished: true
    }
  });
  const exactRecord = records.find((candidate) => triggerParamsEqual(parseObjectJson(candidate.triggerParamsJson), normalizedTriggerParams));
  const record = exactRecord ?? await findLegacyItemCharacterTriggerRecord({ prisma, records, normalizedTriggerType, normalizedTriggerParams });
  if (!record) return null;
  const script = toPlayerStoryScriptPayload(record);
  if (!script) return null;
  return interpolateStoryScript(script, variables);
}

export async function seedDefaultStoryScripts(prisma) {
  if (!prisma?.storyScript?.findMany || !prisma?.storyScript?.create) return;
  const seeds = await defaultStoryScriptSeedsWithLegacy(prisma);
  const existing = await prisma.storyScript.findMany({
    where: { key: { in: seeds.map((seed) => seed.key) } }
  });
  const existingKeys = new Set(existing.map((record) => record.key));
  for (const seed of seeds) {
    if (existingKeys.has(seed.key)) continue;
    await prisma.storyScript.create({ data: storyScriptCreateData(seed) });
  }
}

async function defaultStoryScriptSeedsWithLegacy(prisma) {
  const seeds = defaultStoryScriptSeeds();
  const legacy = await legacyOnboardingSeed(prisma);
  if (!legacy) return seeds;
  return seeds.map((seed) => seed.key === ONBOARDING_STORY_KEY ? legacy : seed);
}

export function defaultStoryScriptSeeds() {
  return [
    {
      key: ONBOARDING_STORY_KEY,
      title: "新手引导",
      triggerType: STORY_TRIGGER_TYPES.onboarding,
      triggerParams: {},
      draft: {
        startNodeId: "start",
        nodes: [
          {
            id: "start",
            speakerName: "希格莉卡",
            characterId: "sigrika",
            text: "欢迎来到 SigrikaGo。我会先带你熟悉这里的对局、角色和道具。",
            nextNodeId: ""
          }
        ]
      }
    },
    {
      key: "item.rainbow-bean-candy.sigrika",
      title: "西格莉卡的彩虹豆豆跳跳糖",
      triggerType: STORY_TRIGGER_TYPES.itemCharacterUse,
      triggerParams: { itemId: RAINBOW_BEAN_CANDY_ID, characterId: "sigrika" },
      draft: defaultRainbowBeanCandyStoryDraft("sigrika")
    },
    {
      key: "item.rainbow-bean-candy.denia",
      title: "达妮娅的彩虹豆豆跳跳糖",
      triggerType: STORY_TRIGGER_TYPES.itemCharacterUse,
      triggerParams: { itemId: RAINBOW_BEAN_CANDY_ID, characterId: "denia" },
      draft: defaultRainbowBeanCandyStoryDraft("denia")
    }
  ];
}

export function toAdminStoryScriptPayload(record, fallback = {}) {
  if (!record) {
    return {
      id: fallback.key ?? "",
      key: fallback.key ?? "",
      title: "",
      triggerType: STORY_TRIGGER_TYPES.onboarding,
      triggerParams: {},
      draft: { ...EMPTY_SCRIPT, initialBoard: null, nodes: [] },
      published: { ...EMPTY_SCRIPT, initialBoard: null, nodes: [] },
      isPublished: false,
      firstPublishedAt: null,
      publishedAt: null,
      createdAt: null,
      updatedAt: null
    };
  }
  return {
    id: record.id,
    key: record.key,
    title: record.title ?? "",
    triggerType: record.triggerType,
    triggerParams: parseObjectJson(record.triggerParamsJson),
    draft: {
      startNodeId: record.draftStartNodeId ?? "",
      initialBoard: parseInitialBoardJson(record.draftInitialBoardJson),
      nodes: parseNodesJson(record.draftNodesJson)
    },
    published: {
      startNodeId: record.publishedStartNodeId ?? "",
      initialBoard: parseInitialBoardJson(record.publishedInitialBoardJson),
      nodes: parseNodesJson(record.publishedNodesJson)
    },
    isPublished: Boolean(record.isPublished),
    firstPublishedAt: record.firstPublishedAt ?? null,
    publishedAt: record.publishedAt ?? null,
    createdAt: record.createdAt ?? null,
    updatedAt: record.updatedAt ?? null
  };
}

export function toPlayerStoryScriptPayload(record) {
  if (!record?.isPublished && record?.isPublished !== undefined) return null;
  const script = {
    id: record.id,
    key: record.key,
    title: record.title ?? "",
    triggerType: record.triggerType,
    triggerParams: parseObjectJson(record.triggerParamsJson),
    startNodeId: record.publishedStartNodeId ?? "",
    initialBoard: parseInitialBoardJson(record.publishedInitialBoardJson),
    nodes: parseNodesJson(record.publishedNodesJson),
    publishedAt: record.publishedAt ?? record.firstPublishedAt ?? null
  };
  if (!script.startNodeId || !script.nodes.length) return null;
  return script;
}

export function interpolateStoryScript(script, variables = {}) {
  return {
    ...script,
    nodes: script.nodes.map((node) => ({
      ...node,
      text: interpolateText(node.text, variables),
      speakerName: interpolateText(node.speakerName, variables),
      options: node.options.map((option) => ({
        ...option,
        label: interpolateText(option.label, variables)
      }))
    }))
  };
}

async function assertNoPublishedTriggerConflict({ prisma, key, triggerType, triggerParams }) {
  const records = await prisma.storyScript.findMany({
    where: {
      triggerType,
      isPublished: true
    }
  });
  const conflict = await findTriggerConflictRecord({ prisma, records, key, triggerType, triggerParams });
  if (conflict) throw routeError(400, ERRORS.triggerConflict);
}

function storyScriptCreateData(seed) {
  const normalized = validateStoryScriptInput(seed, { publishing: true });
  const now = new Date();
  const published = seed.legacyPublished ?? normalized.draft;
  const publishedAt = seed.legacyPublishedAt ?? now;
  const firstPublishedAt = seed.legacyFirstPublishedAt ?? publishedAt;
  return {
    id: normalized.key,
    key: normalized.key,
    title: normalized.title,
    triggerType: normalized.triggerType,
    triggerParamsJson: JSON.stringify(normalized.triggerParams),
    draftStartNodeId: normalized.draft.startNodeId,
    draftNodesJson: JSON.stringify(normalized.draft.nodes),
    isPublished: true,
    publishedStartNodeId: published.startNodeId,
    publishedNodesJson: JSON.stringify(published.nodes),
    firstPublishedAt,
    publishedAt
  };
}

async function legacyOnboardingSeed(prisma) {
  if (!prisma?.onboardingStoryScript?.findUnique) return null;
  const legacy = await prisma.onboardingStoryScript.findUnique({ where: { id: "singleton" } });
  if (!legacy?.isPublished) return null;
  try {
    const draft = validateStoryContent({
      startNodeId: legacy.draftStartNodeId,
      nodes: parseNodesJson(legacy.draftNodesJson)
    }, { publishing: false });
    const published = validateStoryContent({
      startNodeId: legacy.publishedStartNodeId,
      nodes: parseNodesJson(legacy.publishedNodesJson)
    }, { publishing: true });
    return {
      key: ONBOARDING_STORY_KEY,
      title: "新手引导",
      triggerType: STORY_TRIGGER_TYPES.onboarding,
      triggerParams: {},
      draft,
      legacyPublished: published,
      legacyFirstPublishedAt: legacy.firstPublishedAt ?? null,
      legacyPublishedAt: legacy.publishedAt ?? null
    };
  } catch {
    return null;
  }
}

function normalizeAdminAction(value) {
  const action = normalizeText(value || "save-draft");
  if (action === "save-draft" || action === "publish" || action === "unpublish") return action;
  throw routeError(400, ERRORS.invalidAction);
}

function normalizeTriggerType(value) {
  const triggerType = normalizeText(value);
  if (Object.values(STORY_TRIGGER_TYPES).includes(triggerType)) return triggerType;
  throw routeError(400, ERRORS.triggerTypeRequired);
}

function normalizeTriggerParams(triggerType, params = {}) {
  if (!params || typeof params !== "object" || Array.isArray(params)) throw routeError(400, ERRORS.invalidInput);
  if (triggerType === STORY_TRIGGER_TYPES.onboarding || triggerType === STORY_TRIGGER_TYPES.battleTutorialStart) {
    if (Object.keys(params).length > 0) throw routeError(400, ERRORS.onboardingParamsEmpty);
    return {};
  }
  if (triggerType === STORY_TRIGGER_TYPES.itemCharacterUse) {
    const itemId = normalizeText(params.itemId);
    const characterId = canonicalCharacterId(params.characterId);
    if (!itemId || !characterId) throw routeError(400, ERRORS.itemCharacterTriggerRequired);
    return { itemId, characterId };
  }
  return {};
}

function triggerParamsEqual(left, right) {
  return JSON.stringify(sortObject(left)) === JSON.stringify(sortObject(right));
}

async function findTriggerConflictRecord({ prisma, records, key, triggerType, triggerParams }) {
  if (triggerType !== STORY_TRIGGER_TYPES.itemCharacterUse) {
    return records.find((record) => record.key !== key && triggerParamsEqual(parseObjectJson(record.triggerParamsJson), triggerParams)) ?? null;
  }
  const itemIds = [triggerParams.itemId];
  for (const record of records) {
    const parsed = parseObjectJson(record.triggerParamsJson);
    if (parsed.itemId) itemIds.push(normalizeText(parsed.itemId));
  }
  const itemTargetIdMap = await itemTriggerTargetIdMap(prisma, itemIds);
  const canonicalTriggerParams = canonicalItemCharacterTriggerParams(triggerParams, itemTargetIdMap);
  return records.find((record) => {
    if (record.key === key) return false;
    const canonicalRecordParams = canonicalItemCharacterTriggerParams(parseObjectJson(record.triggerParamsJson), itemTargetIdMap);
    return canonicalRecordParams && triggerParamsEqual(canonicalRecordParams, canonicalTriggerParams);
  }) ?? null;
}

async function findLegacyItemCharacterTriggerRecord({ prisma, records, normalizedTriggerType, normalizedTriggerParams }) {
  if (normalizedTriggerType !== STORY_TRIGGER_TYPES.itemCharacterUse) return null;
  const itemIds = [normalizedTriggerParams.itemId];
  for (const record of records) {
    const parsed = parseObjectJson(record.triggerParamsJson);
    if (parsed.itemId) itemIds.push(normalizeText(parsed.itemId));
  }
  const itemTargetIdMap = await itemTriggerTargetIdMap(prisma, itemIds);
  const canonicalTriggerParams = canonicalItemCharacterTriggerParams(normalizedTriggerParams, itemTargetIdMap);
  return records.find((record) => {
    const canonicalRecordParams = canonicalItemCharacterTriggerParams(parseObjectJson(record.triggerParamsJson), itemTargetIdMap);
    return canonicalRecordParams && triggerParamsEqual(canonicalRecordParams, canonicalTriggerParams);
  }) ?? null;
}

async function itemTriggerTargetIdMap(prisma, itemIds) {
  const normalizedItemIds = [...new Set(itemIds.map(normalizeText).filter(Boolean))];
  const itemTargetIdMap = new Map(normalizedItemIds.map((itemId) => [itemId, itemId]));
  if (!normalizedItemIds.length || !prisma?.shopItem?.findMany) return itemTargetIdMap;
  const items = await prisma.shopItem.findMany({
    where: {
      category: "item",
      OR: [
        { targetId: { in: normalizedItemIds } },
        { id: { in: normalizedItemIds } }
      ]
    }
  });
  for (const item of items) {
    const targetId = normalizeText(item.targetId);
    if (!targetId) continue;
    if (item.id) itemTargetIdMap.set(normalizeText(item.id), targetId);
    itemTargetIdMap.set(targetId, targetId);
  }
  return itemTargetIdMap;
}

function canonicalItemCharacterTriggerParams(params, itemTargetIdMap) {
  const itemId = normalizeText(params?.itemId);
  const characterId = canonicalCharacterId(params?.characterId);
  if (!itemId || !characterId) return null;
  return {
    itemId: itemTargetIdMap.get(itemId) ?? itemId,
    characterId
  };
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value ?? {}).sort(([left], [right]) => left.localeCompare(right)));
}

function interpolateText(text, variables = {}) {
  return String(text ?? "").replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) => (
    VARIABLE_NAMES.has(name) ? String(variables[name] ?? "") : match
  ));
}

function normalizeNode(node = {}) {
  const options = Array.isArray(node.options) ? node.options.map(normalizeOption) : [];
  const effect = normalizeStoryNodeEffect(node.effect);
  if (effect == null) throw routeError(400, ERRORS.invalidNodeEffect);
  const type = normalizeTutorialNodeType(node.type);
  if (!type) throw routeError(400, TUTORIAL_ERRORS.invalidNodeType);
  return {
    id: normalizeText(node.id),
    name: normalizeText(node.name),
    type,
    speakerName: normalizeText(node.speakerName),
    characterId: normalizeText(node.characterId),
    skillCharacterId: normalizeText(node.skillCharacterId),
    skillId: normalizeText(node.skillId),
    effect,
    text: normalizeText(node.text),
    prompt: normalizeText(node.prompt),
    wrongClickMessage: normalizeText(node.wrongClickMessage),
    pointId: normalizePointId(node.pointId),
    targetHighlightEnabled: normalizeDefaultTrueFlag(node.targetHighlightEnabled),
    wrongMovePointId: normalizePointId(node.wrongMovePointId),
    wrongMoveNextNodeId: normalizeText(node.wrongMoveNextNodeId),
    applyWrongMove: normalizeDefaultFalseFlag(node.applyWrongMove),
    color: normalizeText(node.color),
    playerColor: normalizeText(node.playerColor),
    playerCharacterId: normalizeText(node.playerCharacterId),
    npcCharacterId: normalizeText(node.npcCharacterId),
    npcName: normalizeText(node.npcName),
    entryText: normalizeText(node.entryText),
    actor: normalizeText(node.actor),
    actionStartDelaySeconds: normalizeNonNegativeDelaySeconds(node.actionStartDelaySeconds),
    replyDelaySeconds: normalizeNonNegativeDelaySeconds(node.replyDelaySeconds),
    autoContinueDelaySeconds: normalizeNonNegativeDelaySeconds(node.autoContinueDelaySeconds),
    manualContinueEnabled: normalizeDefaultTrueFlag(node.manualContinueEnabled),
    autoContinueEnabled: normalizeAutoContinueFlag(node.autoContinueEnabled, type),
    boardSetupLoadingEnabled: normalizeDefaultTrueFlag(node.boardSetupLoadingEnabled),
    boardSetup: normalizeInitialBoard(node.boardSetup),
    nextNodeId: normalizeText(node.nextNodeId),
    options
  };
}

function nodeTypeRequiresSkill(type) {
  return type === TUTORIAL_NODE_TYPES.playerSkill || type === TUTORIAL_NODE_TYPES.npcSkill;
}

function normalizeInitialBoard(board = null) {
  if (!board || typeof board !== "object" || Array.isArray(board)) return null;
  const mode = normalizeText(board.mode || "spark") || "spark";
  const stones = Array.isArray(board.stones)
    ? board.stones.map(normalizeBoardStone).filter(Boolean)
    : [];
  const lastMovePointId = normalizePointId(board.lastMovePointId);
  return lastMovePointId ? { mode, stones, lastMovePointId } : { mode, stones };
}

function normalizeBoardStone(stone = {}) {
  const pointIdValue = normalizePointId(stone.pointId ?? stone.id);
  const color = normalizeText(stone.color);
  if (!pointIdValue || !isPlayerColor(color)) return null;
  return { pointId: pointIdValue, color };
}

function normalizePointId(value) {
  const text = normalizeText(value);
  if (!text) return "";
  const [rawX, rawY] = text.split(",");
  const x = Number(rawX);
  const y = Number(rawY);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) return "";
  return `${x},${y}`;
}

function normalizeOption(option = {}) {
  return {
    label: normalizeText(option.label),
    nextNodeId: normalizeText(option.nextNodeId),
    revealDelaySeconds: normalizeOptionRevealDelaySeconds(option.revealDelaySeconds),
    transitionDelaySeconds: normalizeOptionTransitionDelaySeconds(option.transitionDelaySeconds)
  };
}

function normalizeOptionRevealDelaySeconds(value) {
  return normalizeNonNegativeDelaySeconds(value, ERRORS.invalidOptionRevealDelay);
}

function normalizeOptionTransitionDelaySeconds(value) {
  return normalizeNonNegativeDelaySeconds(value, ERRORS.invalidOptionTransitionDelay);
}

function normalizeNonNegativeDelaySeconds(value, error = ERRORS.invalidOptionRevealDelay) {
  const normalized = typeof value === "string" ? value.trim() : value;
  if (normalized == null || normalized === "") return "";
  const delay = Number(normalized);
  if (!Number.isFinite(delay) || delay < 0) throw routeError(400, error);
  return delay;
}

function normalizeDefaultTrueFlag(value) {
  if (value === false || value === "false") return false;
  return true;
}

function normalizeDefaultFalseFlag(value) {
  return value === true || value === "true";
}

function normalizeAutoContinueFlag(value, type) {
  if (value == null || value === "") return type === TUTORIAL_NODE_TYPES.npcDialogue;
  if (value === false || value === "false") return false;
  return true;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function parseNodesJson(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeNode) : [];
  } catch {
    return [];
  }
}

function parseInitialBoardJson(value) {
  try {
    const parsed = JSON.parse(value || "null");
    return normalizeInitialBoard(parsed);
  } catch {
    return null;
  }
}

function parseObjectJson(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
