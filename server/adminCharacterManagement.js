import { DEFAULT_SKILL_SYSTEM_MESSAGE } from "../src/shared/skillMessages.js";
import { routeError } from "./adminRouteErrors.js";
import { writeAudit } from "./adminAudit.js";
import { toCharacterPayload, validateCharacterInput } from "./characters.js";

export async function createCharacter({ prisma, adminUser, input }) {
  return prisma.$transaction(async (tx) => {
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
        params: {},
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
    skill: {
      ...current.skill,
      ...incomingSkill
    }
  };
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
