import { CHARACTERS } from "../src/shared/characters.js";

const EFFECT_TARGET_RULES = {
  "erase-point": "empty-point",
  "flip-stone": "stone"
};

export function validateCharacterInput(input = {}) {
  if (!isPlainObject(input)) {
    return { ok: false, error: "payload must be an object" };
  }

  const errors = [];
  const skillInput = input.skill ?? input;
  if (!isPlainObject(skillInput)) errors.push("skill must be an object");

  const slug = String(input.slug ?? "").trim();
  const name = String(input.name ?? "").trim();
  const portraitUrl = String(input.portraitUrl ?? input.portrait ?? "").trim();
  const portraitSource = String(input.portraitSource ?? "url").trim();
  const palette = String(input.palette ?? "#5d7fe8").trim();
  const effectType = String(skillInput.effectType ?? "").trim();
  const skillName = String(skillInput.name ?? input.skillName ?? "").trim();
  const description = String(skillInput.description ?? input.skillDescription ?? "").trim();
  const targetRule = String(skillInput.targetRule ?? "").trim();
  const uses = skillInput.uses ?? input.uses;
  const enabled = input.enabled ?? true;
  const sortOrder = input.sortOrder ?? 0;
  const freeTurn = skillInput.freeTurn ?? input.freeTurn ?? false;
  const paramsJson = skillInput.paramsJson ?? input.paramsJson ?? "{}";
  let params = {};

  if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
    errors.push("slug must contain lowercase letters, numbers, or hyphens and be 2-40 characters");
  }
  if (!name) errors.push("name is required");
  if (!portraitUrl) errors.push("portraitUrl is required");
  if (!["url", "upload"].includes(portraitSource)) {
    errors.push("portraitSource must be url or upload");
  }
  if (!Object.hasOwn(EFFECT_TARGET_RULES, effectType)) {
    errors.push("effectType must be erase-point or flip-stone");
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
        paramsJson: JSON.stringify(params)
      }
    }
  };
}

export function toCharacterPayload(record) {
  const skill = record.skill
    ? {
        id: record.skill.id,
        effectType: record.skill.effectType,
        name: record.skill.name,
        uses: record.skill.uses,
        description: record.skill.description,
        freeTurn: record.skill.freeTurn,
        targetRule: record.skill.targetRule,
        params: parseParams(record.skill.paramsJson)
      }
    : null;

  return {
    id: record.slug,
    dbId: record.id,
    name: record.name,
    palette: record.palette,
    portrait: record.portraitUrl,
    enabled: record.enabled,
    skill
  };
}

export async function seedCharacters(prisma) {
  const entries = Object.values(CHARACTERS);
  for (const [sortOrder, character] of entries.entries()) {
    const existing = await prisma.character.findUnique({ where: { slug: character.id } });
    if (existing) continue;

    await prisma.character.create({
      data: {
        slug: character.id,
        name: character.name,
        portraitUrl: character.portrait,
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
            paramsJson: "{}",
            enabled: true
          }
        }
      }
    });
  }
}

export async function listPublicCharacters(prisma) {
  const characters = await prisma.character.findMany({
    where: { enabled: true },
    include: { skill: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
  return characters.map(toCharacterPayload);
}

function targetRuleForEffect(effectType) {
  return EFFECT_TARGET_RULES[effectType] ?? "stone";
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
