import { routeError } from "./adminRouteErrors.js";
import { normalizeStoryNodeEffect } from "../src/shared/storyPresentation.js";
import {
  getAdminStoryScript,
  getPublishedStoryScriptForTrigger,
  ONBOARDING_STORY_KEY,
  publishStoryScript,
  STORY_TRIGGER_TYPES,
  toAdminStoryScriptPayload,
  updateStoryScriptDraft,
  validateStoryContent
} from "./storyScripts.js";

export const ONBOARDING_STORY_SCRIPT_ID = "singleton";

const EMPTY_SCRIPT = Object.freeze({
  startNodeId: "",
  nodes: []
});

const ERRORS = Object.freeze({
  invalidAction: "\u64cd\u4f5c\u7c7b\u578b\u65e0\u6548",
  invalidScript: "\u65b0\u624b\u5f15\u5bfc\u811a\u672c\u683c\u5f0f\u65e0\u6548",
  missingNodes: "\u53d1\u5e03\u524d\u81f3\u5c11\u9700\u8981\u4e00\u4e2a\u8282\u70b9",
  missingStart: "\u8d77\u59cb\u8282\u70b9\u4e0d\u5b58\u5728",
  nodeIdRequired: "\u8282\u70b9 ID \u4e0d\u80fd\u4e3a\u7a7a",
  duplicateNodeId: "\u8282\u70b9 ID \u4e0d\u80fd\u91cd\u590d",
  textRequired: "\u6b63\u6587\u4e0d\u80fd\u4e3a\u7a7a",
  targetMissing: "\u8df3\u8f6c\u76ee\u6807\u4e0d\u5b58\u5728",
  optionLabelRequired: "\u9009\u9879\u6587\u6848\u4e0d\u80fd\u4e3a\u7a7a",
  optionTargetRequired: "\u9009\u9879\u76ee\u6807\u4e0d\u80fd\u4e3a\u7a7a",
  invalidNodeEffect: "\u5267\u60c5\u8282\u70b9\u6548\u679c\u65e0\u6548",
  invalidOptionRevealDelay: "\u9009\u9879\u51fa\u73b0\u65f6\u95f4\u5fc5\u987b\u662f\u975e\u8d1f\u6570\u5b57",
  endingRequired: "\u81f3\u5c11\u9700\u8981\u4e00\u4e2a\u7ed3\u675f\u8282\u70b9"
});

export async function ensureOnboardingStorySchema(client) {
  if (!client?.$executeRawUnsafe) return;
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OnboardingStoryScript" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "draftStartNodeId" TEXT NOT NULL DEFAULT '',
      "draftNodesJson" TEXT NOT NULL DEFAULT '[]',
      "isPublished" BOOLEAN NOT NULL DEFAULT false,
      "publishedStartNodeId" TEXT NOT NULL DEFAULT '',
      "publishedNodesJson" TEXT NOT NULL DEFAULT '[]',
      "firstPublishedAt" DATETIME,
      "publishedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await addUserColumnIfMissing(
    client,
    "onboardingRequired",
    'ALTER TABLE "User" ADD COLUMN "onboardingRequired" BOOLEAN NOT NULL DEFAULT false'
  );
  await addUserColumnIfMissing(
    client,
    "onboardingAutoShownAt",
    'ALTER TABLE "User" ADD COLUMN "onboardingAutoShownAt" DATETIME'
  );
  await addUserColumnIfMissing(
    client,
    "onboardingCompletedAt",
    'ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" DATETIME'
  );
}

export function validateOnboardingStoryScript(input = {}, { publishing = false } = {}) {
  return validateStoryContent(input, { publishing });
}

export async function getAdminOnboardingStory({ prisma }) {
  const { script } = await getAdminStoryScript({ prisma, key: ONBOARDING_STORY_KEY });
  return { script: toAdminOnboardingStoryPayload(script) };
}

export async function updateOnboardingStoryDraft({ prisma, adminUser, input }) {
  const response = await updateStoryScriptDraft({
    prisma,
    adminUser,
    input: onboardingInput(input)
  });
  return { script: toAdminOnboardingStoryPayload(response.script) };
}

export async function publishOnboardingStory({ prisma, adminUser, input = null }) {
  let source = input;
  if (!source) {
    const { script } = await getAdminStoryScript({ prisma, key: ONBOARDING_STORY_KEY });
    source = script.draft;
  }
  const response = await publishStoryScript({
    prisma,
    adminUser,
    input: onboardingInput(source)
  });
  return { script: toAdminOnboardingStoryPayload(response.script) };
}

export async function updateAdminOnboardingStory({ prisma, adminUser, input }) {
  const action = normalizeAdminAction(input?.action);
  if (action === "publish") return publishOnboardingStory({ prisma, adminUser, input });
  return updateOnboardingStoryDraft({ prisma, adminUser, input });
}

export async function getPlayerOnboardingStory({ prisma, user }) {
  const script = await getPublishedStoryScriptForTrigger({
    prisma,
    triggerType: STORY_TRIGGER_TYPES.onboarding,
    triggerParams: {},
    variables: { username: user?.username ?? "" }
  });
  if (!script) return { script: null, autoEligible: false };
  return {
    script,
    autoEligible: Boolean(user?.onboardingRequired && !user?.onboardingAutoShownAt)
  };
}

export async function markOnboardingAutoShown({ prisma, user, now = new Date() }) {
  if (user?.id && user.onboardingRequired && !user.onboardingAutoShownAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingRequired: false,
        onboardingAutoShownAt: now
      }
    });
  }
  return { ok: true };
}

export async function markOnboardingCompleted({ prisma, user, now = new Date() }) {
  if (user?.id && !user.onboardingCompletedAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingRequired: false,
        onboardingCompletedAt: now
      }
    });
  }
  return { ok: true };
}

export function toAdminOnboardingStoryPayload(record) {
  if (!record) {
    return {
      id: ONBOARDING_STORY_SCRIPT_ID,
      draft: { ...EMPTY_SCRIPT, nodes: [] },
      published: { ...EMPTY_SCRIPT, nodes: [] },
      isPublished: false,
      firstPublishedAt: null,
      publishedAt: null,
      createdAt: null,
      updatedAt: null
    };
  }
  return {
    id: ONBOARDING_STORY_SCRIPT_ID,
    draft: {
      startNodeId: record.draft?.startNodeId ?? record.draftStartNodeId ?? "",
      nodes: record.draft?.nodes ?? parseNodesJson(record.draftNodesJson)
    },
    published: {
      startNodeId: record.published?.startNodeId ?? record.publishedStartNodeId ?? "",
      nodes: record.published?.nodes ?? parseNodesJson(record.publishedNodesJson)
    },
    isPublished: Boolean(record.isPublished),
    firstPublishedAt: record.firstPublishedAt ?? null,
    publishedAt: record.publishedAt ?? null,
    createdAt: record.createdAt ?? null,
    updatedAt: record.updatedAt ?? null
  };
}

export function toGenericOnboardingStoryPayload(record) {
  return toAdminStoryScriptPayload(record, { key: ONBOARDING_STORY_KEY });
}

async function addUserColumnIfMissing(client, columnName, sql) {
  if (!client.$queryRawUnsafe) {
    await client.$executeRawUnsafe(sql);
    return;
  }
  const columns = await client.$queryRawUnsafe('PRAGMA table_info("User")');
  if (columns.some((column) => column.name === columnName)) return;
  await client.$executeRawUnsafe(sql);
}

function normalizeAdminAction(value) {
  const action = normalizeText(value || "save-draft");
  if (action === "save-draft" || action === "publish") return action;
  throw routeError(400, ERRORS.invalidAction);
}

function onboardingInput(input = {}) {
  return {
    action: input.action,
    key: ONBOARDING_STORY_KEY,
    title: "新手引导",
    triggerType: STORY_TRIGGER_TYPES.onboarding,
    triggerParams: {},
    draft: {
      startNodeId: input.draft?.startNodeId ?? input.startNodeId ?? "",
      nodes: input.draft?.nodes ?? input.nodes ?? []
    }
  };
}

function normalizeNode(node = {}) {
  const options = Array.isArray(node.options) ? node.options.map(normalizeOption) : [];
  const effect = normalizeStoryNodeEffect(node.effect);
  if (effect == null) throw routeError(400, ERRORS.invalidNodeEffect);
  return {
    id: normalizeText(node.id),
    speakerName: normalizeText(node.speakerName),
    characterId: normalizeText(node.characterId),
    effect,
    text: normalizeText(node.text),
    nextNodeId: normalizeText(node.nextNodeId),
    options
  };
}

function normalizeOption(option = {}) {
  return {
    label: normalizeText(option.label),
    nextNodeId: normalizeText(option.nextNodeId),
    revealDelaySeconds: normalizeOptionRevealDelaySeconds(option.revealDelaySeconds)
  };
}

function normalizeOptionRevealDelaySeconds(value) {
  const normalized = typeof value === "string" ? value.trim() : value;
  if (normalized == null || normalized === "") return "";
  const delay = Number(normalized);
  if (!Number.isFinite(delay) || delay < 0) throw routeError(400, ERRORS.invalidOptionRevealDelay);
  return delay;
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
