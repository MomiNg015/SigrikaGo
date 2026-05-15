import { CHARACTERS } from "../src/shared/characters.js";

const EFFECT_TARGET_RULES = {
  "erase-point": "empty-point",
  "flip-stone": "stone"
};

export function validateCharacterInput(input = {}) {
  const errors = [];
  const skillInput = input.skill ?? input;
  const slug = String(input.slug ?? "").trim();
  const name = String(input.name ?? "").trim();
  const portraitUrl = String(input.portraitUrl ?? input.portrait ?? "").trim();
  const palette = String(input.palette ?? "#5d7fe8").trim();
  const effectType = String(skillInput.effectType ?? "").trim();
  const skillName = String(skillInput.name ?? input.skillName ?? "").trim();
  const description = String(skillInput.description ?? input.skillDescription ?? "").trim();
  const targetRule = String(skillInput.targetRule ?? "").trim();
  const uses = Number(skillInput.uses ?? input.uses);
  const freeTurn = Boolean(skillInput.freeTurn ?? input.freeTurn);
  const paramsJson = String(skillInput.paramsJson ?? input.paramsJson ?? "{}");
  let params = {};

  if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
    errors.push("slug 只能包含小写字母、数字和短横线，长度 2-40");
  }
  if (!name) errors.push("name 必填");
  if (!portraitUrl) errors.push("portraitUrl 必填");
  if (!Object.hasOwn(EFFECT_TARGET_RULES, effectType)) {
    errors.push("effectType 只支持 erase-point 和 flip-stone");
  }
  if (EFFECT_TARGET_RULES[effectType] && targetRule !== EFFECT_TARGET_RULES[effectType]) {
    errors.push("目标规则与技能类型不匹配");
  }
  if (!Number.isInteger(uses) || uses < 0 || uses > 9) {
    errors.push("uses 必须是 0 到 9 的整数");
  }

  try {
    params = JSON.parse(paramsJson);
  } catch {
    errors.push("paramsJson 必须是有效 JSON");
  }

  if (errors.length) return { ok: false, error: errors.join("\n") };

  return {
    ok: true,
    value: {
      slug,
      name,
      portraitUrl,
      palette,
      enabled: input.enabled ?? true,
      sortOrder: Number(input.sortOrder ?? 0),
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
