import { CHARACTERS } from "../src/shared/characters.js";
import { DEFAULT_SKILL_SYSTEM_MESSAGE } from "../src/shared/skillMessages.js";

const EFFECT_TARGET_RULES = {
  "erase-point": "empty-point",
  "flip-stone": "stone",
  "hidden-hand": "empty-point",
  "random-blast": "any-point"
};
const COST_TYPES = new Set(["numeric", "special"]);

export function validateCharacterInput(input = {}) {
  if (!isPlainObject(input)) {
    return { ok: false, error: "payload must be an object" };
  }

  const errors = [];
  const skillInput = isPlainObject(input.skill) ? input.skill : {};
  if (!isPlainObject(input.skill)) errors.push("skill must be an object");

  const slug = String(input.slug ?? "").trim();
  const name = String(input.name ?? "").trim();
  const portraitUrl = String(input.portraitUrl ?? input.portrait ?? "").trim();
  const portraitSource = String(input.portraitSource ?? "url").trim();
  const acquisitionMethod = String(input.acquisitionMethod ?? "").trim();
  const palette = String(input.palette ?? "#5d7fe8").trim();
  const effectType = String(skillInput.effectType ?? "").trim();
  const skillName = String(skillInput.name ?? "").trim();
  const description = String(skillInput.description ?? "").trim();
  const targetRule = String(skillInput.targetRule ?? "").trim();
  const uses = skillInput.uses ?? input.uses;
  const enabled = input.enabled ?? true;
  const sortOrder = input.sortOrder ?? 0;
  const freeTurn = skillInput.freeTurn ?? input.freeTurn ?? false;
  const paramsJson = skillInput.paramsJson ?? input.paramsJson ?? "{}";
  const costType = String(skillInput.costType ?? input.costType ?? "numeric").trim();
  const fallbackCostValue = skillInput.cost ?? input.cost ?? 0;
  const costValue = String(skillInput.costValue ?? input.costValue ?? fallbackCostValue).trim();
  const systemMessage = String(skillInput.systemMessage ?? input.systemMessage ?? DEFAULT_SKILL_SYSTEM_MESSAGE).trim();
  let params = {};

  if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
    errors.push("slug must contain lowercase letters, numbers, or hyphens and be 2-40 characters");
  }
  if (!name) errors.push("name is required");
  if (!skillName) errors.push("skill.name is required");
  if (!description) errors.push("skill.description is required");
  if (!portraitUrl) errors.push("portraitUrl is required");
  if (!["url", "upload"].includes(portraitSource)) {
    errors.push("portraitSource must be url or upload");
  }
  if (!Object.hasOwn(EFFECT_TARGET_RULES, effectType)) {
    errors.push("effectType must be erase-point, flip-stone, hidden-hand, or random-blast");
  }
  if (EFFECT_TARGET_RULES[effectType] && targetRule !== EFFECT_TARGET_RULES[effectType]) {
    errors.push("目标规则与技能类型不匹配");
  }
  if (!Number.isInteger(uses) || uses < 0 || uses > 9) {
    errors.push("uses must be an integer from 0 to 9");
  }
  if (typeof enabled !== "boolean") errors.push("enabled must be a boolean");
  if (!Number.isInteger(sortOrder)) errors.push("sortOrder must be an integer");
  if (typeof freeTurn !== "boolean") errors.push("freeTurn must be a boolean");
  if (typeof paramsJson !== "string") errors.push("paramsJson must be a string");
  if (!COST_TYPES.has(costType)) errors.push("costType must be numeric or special");
  if (costType === "numeric" && !/^-?\d+(\.\d+)?$/.test(costValue)) {
    errors.push("costValue must be numeric when costType is numeric");
  }
  if (costType === "special" && !costValue) {
    errors.push("costValue is required when costType is special");
  }
  if (!systemMessage) errors.push("systemMessage is required");

  try {
    params = JSON.parse(typeof paramsJson === "string" ? paramsJson : "{}");
  } catch {
    errors.push("paramsJson must be valid JSON");
  }

  if (errors.length) return { ok: false, error: errors.join("\n") };

  return {
    ok: true,
    value: {
      slug,
      name,
      portraitUrl,
      portraitSource,
      acquisitionMethod,
      palette,
      enabled,
      sortOrder,
      skill: {
        effectType,
        name: skillName,
        description,
        uses,
        freeTurn,
        targetRule,
        params,
        paramsJson: JSON.stringify(params),
        costType,
        costValue,
        systemMessage
      }
    }
  };
}

export function toCharacterPayload(record) {
  const skill = record.skill && record.skill.enabled !== false
    ? {
        id: record.skill.id,
        effectType: record.skill.effectType,
        name: record.skill.name,
        uses: record.skill.uses,
        description: record.skill.description,
        freeTurn: record.skill.freeTurn,
        targetRule: record.skill.targetRule,
        params: parseParams(record.skill.paramsJson),
        costType: record.skill.costType ?? "numeric",
        costValue: record.skill.costValue ?? String(record.skill.cost ?? 0),
        cost: numericCost(record.skill),
        systemMessage: record.skill.systemMessage ?? DEFAULT_SKILL_SYSTEM_MESSAGE
      }
    : null;

  return {
    id: record.slug,
    dbId: record.id,
    name: record.name,
    palette: record.palette,
    portrait: record.portraitUrl,
    portraitSource: record.portraitSource,
    acquisitionMethod: record.acquisitionMethod ?? "",
    enabled: record.enabled,
    skill
  };
}

export async function seedCharacters(prisma) {
  const entries = Object.values(CHARACTERS);
  for (const [sortOrder, character] of entries.entries()) {
    const existing = await prisma.character.findUnique({ where: { slug: character.id }, include: { skill: true } });
    if (existing) {
      await syncBuiltinCharacterFields(prisma, existing, character, sortOrder);
      await syncBuiltinSkillCost(prisma, existing, character);
      continue;
    }

    await prisma.character.create({
      data: {
        slug: character.id,
        name: character.name,
        portraitUrl: character.portrait,
        acquisitionMethod: character.acquisitionMethod ?? "",
        palette: character.palette,
        enabled: true,
        sortOrder,
        skill: {
          create: {
            effectType: character.skill.id,
            name: character.skill.name,
            description: character.skill.description,
            uses: character.skill.uses ?? 1,
            freeTurn: Boolean(character.skill.freeTurn),
            targetRule: targetRuleForEffect(character.skill.id),
            paramsJson: JSON.stringify(character.skill.params ?? {}),
            costType: character.skill.costType ?? "numeric",
            costValue: String(character.skill.costValue ?? character.skill.cost ?? 0),
            systemMessage: character.skill.systemMessage ?? DEFAULT_SKILL_SYSTEM_MESSAGE,
            enabled: true
          }
        }
      }
    });
  }
}

async function syncBuiltinCharacterFields(prisma, existing, character, sortOrder) {
  const data = {};
  if (existing.sortOrder !== sortOrder) data.sortOrder = sortOrder;
  if (Object.keys(data).length) {
    await prisma.character.update({ where: { id: existing.id }, data });
  }
}

async function syncBuiltinSkillCost(prisma, existing, character) {
  const fallbackCost = String(character.skill.costValue ?? character.skill.cost ?? 0);
  if (!existing.skill || fallbackCost === "0") return;
  const looksLikeOriginalSkill = existing.skill.name === character.skill.name
    && existing.skill.description === character.skill.description
    && existing.skill.effectType === character.skill.id;
  if (!looksLikeOriginalSkill) return;
  if (existing.skill.costType === "numeric" && existing.skill.costValue === fallbackCost) return;
  await prisma.characterSkill.update({
    where: { id: existing.skill.id },
    data: {
      costType: character.skill.costType ?? "numeric",
      costValue: fallbackCost
    }
  });
}

export async function listPublicCharacters(prisma) {
  return (await listPublicCharacterResponse(prisma)).characters;
}

export async function listPublicCharacterResponse(prisma) {
  const characters = await prisma.character.findMany({
    where: { enabled: true },
    include: { skill: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
  const records = await prisma.character.findMany({
    select: { slug: true, enabled: true }
  });
  return {
    characters: characters.map(toCharacterPayload),
    disabledSlugs: records.filter((record) => !record.enabled).map((record) => record.slug)
  };
}

function targetRuleForEffect(effectType) {
  return EFFECT_TARGET_RULES[effectType] ?? "stone";
}

function numericCost(skill) {
  if ((skill.costType ?? "numeric") !== "numeric") return 0;
  const value = Number(skill.costValue ?? skill.cost ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function parseParams(paramsJson) {
  try {
    return JSON.parse(paramsJson ?? "{}");
  } catch {
    return {};
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
