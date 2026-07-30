import { DEFAULT_SKILL_SYSTEM_MESSAGE } from "../src/shared/skillMessages.js";
import { isDeepStrictEqual } from "node:util";
import { routeError } from "./adminRouteErrors.js";
import { writeAudit } from "./adminAudit.js";
import { toCharacterPayload, validateCharacterInput } from "./characters.js";
import { assertSkillTraitReferences } from "./skillTraits.js";

export async function createCharacter({ prisma, adminUser, input }) {
  return prisma.$transaction(async (tx) => {
    await assertSkillTraitReferences(tx, input.skill);
    const character = await tx.character.create({
      data: characterCreateData(input),
      include: { skill: true }
    });
    await writeAudit(tx, adminUser, "character.create", character.slug, null, toCharacterPayload(character), "character");
    return character;
  });
}

export async function updateCharacter({ prisma, adminUser, characterId, body }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.character.findFirst({
      where: { OR: [{ id: characterId }, { slug: characterId }] },
      include: { skill: true }
    });
    if (!before) throw routeError(404, "Character not found");

    const validated = validateCharacterInput(mergeCharacterInput(before, body));
    if (!validated.ok) throw routeError(400, validated.error);
    await assertSkillTraitReferences(tx, validated.value.skill);

    const after = await tx.character.update({
      where: { id: before.id },
      data: characterUpdateData(validated.value),
      include: { skill: true }
    });
    await writeAudit(
      tx,
      adminUser,
      "character.update",
      after.slug,
      toCharacterPayload(before),
      toCharacterPayload(after),
      "character"
    );
    return after;
  });
}

export async function disableCharacter({ prisma, adminUser, characterId }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.character.findFirst({
      where: { OR: [{ id: characterId }, { slug: characterId }] },
      include: { skill: true }
    });
    if (!before) throw routeError(404, "Character not found");
    const after = await tx.character.update({
      where: { id: before.id },
      data: { enabled: false },
      include: { skill: true }
    });
    await writeAudit(
      tx,
      adminUser,
      "character.disable",
      after.slug,
      toCharacterPayload(before),
      toCharacterPayload(after),
      "character"
    );
    return after;
  });
}

function characterCreateData(input) {
  return {
    slug: input.slug,
    name: input.name,
    description: input.description,
    portraitUrl: input.portraitUrl,
    portraitSource: input.portraitSource,
    acquisitionMethod: input.acquisitionMethod,
    cvName: input.cvName,
    cvUrl: input.cvUrl,
    illustName: input.illustName,
    illustUrl: input.illustUrl,
    source: input.source,
    palette: input.palette,
    enabled: input.enabled,
    sortOrder: input.sortOrder,
    skill: {
      create: skillData(input.skill)
    }
  };
}

function characterUpdateData(input) {
  return {
    slug: input.slug,
    name: input.name,
    description: input.description,
    portraitUrl: input.portraitUrl,
    portraitSource: input.portraitSource,
    acquisitionMethod: input.acquisitionMethod,
    cvName: input.cvName,
    cvUrl: input.cvUrl,
    illustName: input.illustName,
    illustUrl: input.illustUrl,
    source: input.source,
    palette: input.palette,
    enabled: input.enabled,
    sortOrder: input.sortOrder,
    skill: {
      upsert: {
        create: skillData(input.skill),
        update: skillData(input.skill)
      }
    }
  };
}

function skillData(skill) {
  return {
    effectType: skill.effectType,
    name: skill.name,
    description: skill.description,
    uses: skill.uses,
    freeTurn: skill.freeTurn,
    targetRule: skill.targetRule,
    paramsJson: skill.paramsJson,
    costType: skill.costType,
    costValue: skill.costValue,
    systemMessage: skill.systemMessage,
    enabled: skill.enabled
  };
}

export function toAdminCharacterPayload(record) {
  const payload = toCharacterPayload(record);
  const skill = record.skill
    ? {
        id: record.skill.id,
        effectType: record.skill.effectType,
        name: record.skill.name,
        uses: record.skill.uses,
        description: record.skill.description,
        freeTurn: record.skill.freeTurn,
        targetRule: record.skill.targetRule,
        params: payload.skill?.params ?? {},
        costType: record.skill.costType ?? "numeric",
        costValue: record.skill.costValue ?? String(record.skill.cost ?? 0),
        cost: 0,
        systemMessage: record.skill.systemMessage ?? DEFAULT_SKILL_SYSTEM_MESSAGE,
        enabled: record.skill.enabled ?? true,
        paramsJson: record.skill.paramsJson ?? "{}"
      }
    : null;
  return {
    ...payload,
    sortOrder: record.sortOrder,
    source: record.source ?? "default",
    skill
  };
}

function mergeCharacterInput(record, body = {}) {
  const current = characterRecordToInput(record);
  const incoming = isPlainObject(body) ? body : {};
  const incomingSkill = {
    ...legacySkillInput(incoming),
    ...(isPlainObject(incoming.skill) ? incoming.skill : {})
  };
  return {
    ...current,
    ...incoming,
    skill: mergeEditableSkillContent(current.skill, incomingSkill)
  };
}

const EDITABLE_SKILL_FIELDS = new Set(["name", "description", "costValue"]);
const IMMUTABLE_SKILL_FIELDS = [
  "effectType",
  "uses",
  "freeTurn",
  "targetRule",
  "costType",
  "systemMessage",
  "enabled"
];
const EDITABLE_DERIVED_SKILL_FIELDS = new Set(["name", "description", "costValue"]);

function mergeEditableSkillContent(currentSkill, incomingSkill) {
  for (const field of IMMUTABLE_SKILL_FIELDS) {
    if (Object.hasOwn(incomingSkill, field) && !isDeepStrictEqual(incomingSkill[field], currentSkill[field])) {
      throw routeError(400, `技能逻辑由代码管理，后台不能修改 ${field}`);
    }
  }

  const merged = { ...currentSkill };
  for (const field of EDITABLE_SKILL_FIELDS) {
    if (Object.hasOwn(incomingSkill, field)) merged[field] = incomingSkill[field];
  }
  if (Object.hasOwn(incomingSkill, "paramsJson")) {
    merged.paramsJson = mergeEditableDerivedSkillContent(currentSkill.paramsJson, incomingSkill.paramsJson);
  }
  return merged;
}

function mergeEditableDerivedSkillContent(currentParamsJson, incomingParamsJson) {
  const currentParams = parseParamsObject(currentParamsJson);
  const incomingParams = parseParamsObject(incomingParamsJson);
  const currentDefinitions = Array.isArray(currentParams.derivedSkills) ? currentParams.derivedSkills : [];
  const incomingDefinitions = Array.isArray(incomingParams.derivedSkills) ? incomingParams.derivedSkills : [];
  const currentLogicParams = { ...currentParams };
  const incomingLogicParams = { ...incomingParams };
  delete currentLogicParams.derivedSkills;
  delete incomingLogicParams.derivedSkills;

  if (!isDeepStrictEqual(incomingLogicParams, currentLogicParams)) {
    throw routeError(400, "技能参数由代码管理，后台不能修改");
  }
  if (incomingDefinitions.length !== currentDefinitions.length) {
    throw routeError(400, "技能结构由代码管理，后台不能新增或删除派生技能");
  }

  const derivedSkills = currentDefinitions.map((currentDefinition, index) => {
    const incomingDefinition = incomingDefinitions[index];
    if (!isPlainObject(currentDefinition) || !isPlainObject(incomingDefinition)) {
      throw routeError(400, "派生技能配置无效");
    }
    if (derivedSkillIdentity(currentDefinition) !== derivedSkillIdentity(incomingDefinition)) {
      throw routeError(400, "技能结构由代码管理，后台不能替换或重排派生技能");
    }
    const currentLogic = omitEditableDerivedSkillFields(currentDefinition);
    const incomingLogic = omitEditableDerivedSkillFields(incomingDefinition);
    if (!isDeepStrictEqual(incomingLogic, currentLogic)) {
      throw routeError(400, "派生技能逻辑由代码管理，后台只能修改名称、描述和超频");
    }
    return mergeDerivedSkillEditableFields(currentDefinition, incomingDefinition);
  });

  const mergedParams = { ...currentParams };
  if (derivedSkills.length) mergedParams.derivedSkills = derivedSkills;
  else delete mergedParams.derivedSkills;
  return JSON.stringify(mergedParams);
}

function omitEditableDerivedSkillFields(definition) {
  return Object.fromEntries(
    Object.entries(definition).filter(([field]) => !EDITABLE_DERIVED_SKILL_FIELDS.has(field))
  );
}

function mergeDerivedSkillEditableFields(currentDefinition, incomingDefinition) {
  const merged = { ...currentDefinition };
  if (Object.hasOwn(incomingDefinition, "name")) {
    const name = String(incomingDefinition.name ?? "").trim();
    if (!name) throw routeError(400, "派生技能名称不能为空");
    merged.name = name;
  }
  if (Object.hasOwn(incomingDefinition, "description")) {
    merged.description = String(incomingDefinition.description ?? "").trim();
  }
  if (Object.hasOwn(incomingDefinition, "costValue")) {
    const costValue = String(incomingDefinition.costValue ?? "").trim();
    const costType = currentDefinition.costType === "special" ? "special" : "numeric";
    if (costType === "numeric" && !/^-?\d+(\.\d+)?$/.test(costValue)) {
      throw routeError(400, "派生技能数值超频只能填写数字");
    }
    if (costType === "special" && !costValue) {
      throw routeError(400, "派生技能特殊超频不能为空");
    }
    merged.costValue = costValue;
  }
  return merged;
}

function parseParamsObject(paramsJson) {
  try {
    const parsed = JSON.parse(paramsJson ?? "{}");
    if (isPlainObject(parsed)) return parsed;
  } catch {
    // The public validator will never receive malformed content from this boundary.
  }
  throw routeError(400, "paramsJson must be a valid JSON object");
}

function derivedSkillIdentity(definition) {
  return String(definition?.effectType ?? definition?.id ?? "").trim();
}

function legacySkillInput(input) {
  const skill = {};
  if (Object.hasOwn(input, "effectType")) skill.effectType = input.effectType;
  if (Object.hasOwn(input, "skillName")) skill.name = input.skillName;
  if (Object.hasOwn(input, "skillDescription")) skill.description = input.skillDescription;
  if (Object.hasOwn(input, "uses")) skill.uses = input.uses;
  if (Object.hasOwn(input, "freeTurn")) skill.freeTurn = input.freeTurn;
  if (Object.hasOwn(input, "targetRule")) skill.targetRule = input.targetRule;
  if (Object.hasOwn(input, "paramsJson")) skill.paramsJson = input.paramsJson;
  if (Object.hasOwn(input, "costType")) skill.costType = input.costType;
  if (Object.hasOwn(input, "costValue")) skill.costValue = input.costValue;
  if (Object.hasOwn(input, "systemMessage")) skill.systemMessage = input.systemMessage;
  if (Object.hasOwn(input, "skillEnabled")) skill.enabled = input.skillEnabled;
  return skill;
}

function characterRecordToInput(record) {
  return {
    slug: record.slug,
    name: record.name,
    description: record.description ?? "",
    portraitUrl: record.portraitUrl,
    portraitSource: record.portraitSource,
    acquisitionMethod: record.acquisitionMethod ?? "",
    cvName: record.cvName ?? "",
    cvUrl: record.cvUrl ?? "",
    illustName: record.illustName ?? "",
    illustUrl: record.illustUrl ?? "",
    source: record.source ?? "default",
    palette: record.palette,
    enabled: record.enabled,
    sortOrder: record.sortOrder,
    skill: {
      effectType: record.skill?.effectType ?? "",
      name: record.skill?.name ?? "",
      description: record.skill?.description ?? "",
      uses: record.skill?.uses ?? 0,
      freeTurn: record.skill?.freeTurn ?? false,
      targetRule: record.skill?.targetRule ?? "",
      paramsJson: record.skill?.paramsJson ?? "{}",
      costType: record.skill?.costType ?? "numeric",
      costValue: record.skill?.costValue ?? "0",
      systemMessage: record.skill?.systemMessage ?? DEFAULT_SKILL_SYSTEM_MESSAGE,
      enabled: record.skill?.enabled ?? true
    }
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
