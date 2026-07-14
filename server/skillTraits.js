import { randomUUID } from "node:crypto";
import {
  DEFAULT_SKILL_TRAITS,
  extractSkillTraitReferences
} from "../src/shared/skillTraits.js";
import { writeAudit } from "./adminAudit.js";
import { routeError } from "./adminRouteErrors.js";

const BASE_DESCRIPTION_MIGRATIONS = Object.freeze({
  "erase-point": {
    slugs: ["sigrika"],
    traits: ["疾走"],
    replacements: ["（使用该技能不消耗本次落子）"],
    overclockValues: ["3"]
  },
  "flip-stone": { slugs: ["denia"], overclockValues: ["4"] },
  "hidden-hand": { slugs: ["aemeath"], overclockValues: ["0"] },
  "spray-stone": { slugs: ["lynae"], overclockValues: ["2", "4"] },
  "random-blast": {
    slugs: ["baconbits"],
    traits: ["疾走"],
    replacements: ["（使用该技能不消耗本次落子）"],
    exactTraitDescriptions: ["随机移除棋盘上3*3区域的棋子。"],
    overclockValues: ["0"]
  },
  "protocol-takeover": {
    slugs: ["mornye"],
    traits: ["疾走"],
    replacements: [
      "（使用该技能不消耗本次落子）",
      "发动技能不会消耗本回合。"
    ],
    overclockValues: ["2"]
  },
  "double-move": {
    slugs: ["changli"],
    traits: ["禁先", "疾走"],
    replacements: [
      "【仅限对手发动过主动技能后才可以发动】",
      "该技能只有在对手成功发动过主动技能后才能发动。",
      "（使用该技能不消耗本次落子）",
      "发动技能不会消耗本回合。"
    ],
    overclockValues: ["3"]
  },
  "color-illusion-passive": {
    slugs: ["nabomo"],
    traits: ["被动"],
    replacements: ["被动技。"],
    overclockValues: ["0"]
  }
});

const DERIVED_DESCRIPTION_MIGRATIONS = Object.freeze({
  "voyage-star": {
    characterSlugs: ["aemeath"],
    traits: ["派生", "疾走"],
    replacements: [
      "派生技，",
      "派生技。",
      "（该技能不消耗落子回合）",
      "不消耗落子次数，"
    ],
    overclockValues: ["5"]
  }
});

export async function ensureSkillTraitSchema(client) {
  if (!client?.$executeRawUnsafe) return;
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SkillTrait" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "definition" TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "SkillTrait_name_key" ON "SkillTrait"("name")`
  );
}

export async function seedDefaultSkillTraits(prisma, traits = DEFAULT_SKILL_TRAITS) {
  if (!prisma?.skillTrait?.findUnique || !prisma?.skillTrait?.create) return;
  for (const trait of traits) {
    const existing = await prisma.skillTrait.findUnique({ where: { id: trait.id } });
    if (existing) continue;
    await prisma.skillTrait.create({ data: { ...trait } });
  }
}

export async function listPublicSkillTraits(prisma) {
  if (!prisma?.skillTrait?.findMany) return [];
  return prisma.skillTrait.findMany({
    select: { id: true, name: true, definition: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
}

export async function listAdminSkillTraits(prisma) {
  const [traits, characters] = await Promise.all([
    listPublicSkillTraits(prisma),
    listCharactersWithSkills(prisma)
  ]);
  return traits.map((trait) => ({
    ...trait,
    references: collectTraitReferences(characters, trait.name)
  }));
}

export async function createSkillTrait({ prisma, adminUser, input }) {
  const value = validateSkillTraitInput(input);
  return prisma.$transaction(async (tx) => {
    await assertUniqueSkillTraitName(tx, value.name);
    const trait = await tx.skillTrait.create({
      data: {
        id: value.id || `skill-trait-${randomUUID()}`,
        name: value.name,
        definition: value.definition,
        sortOrder: value.sortOrder
      }
    });
    await writeAudit(tx, adminUser, "skill-trait.create", trait.id, null, trait, "skill-trait");
    return trait;
  });
}

export async function updateSkillTrait({ prisma, adminUser, traitId, input }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.skillTrait.findUnique({ where: { id: traitId } });
    if (!before) throw routeError(404, "特性词不存在");
    const value = validateSkillTraitInput({ ...before, ...input });
    await assertUniqueSkillTraitName(tx, value.name, before.id);

    if (value.name !== before.name) {
      await renameSkillTraitReferences(tx, before.name, value.name);
    }
    const after = await tx.skillTrait.update({
      where: { id: before.id },
      data: {
        name: value.name,
        definition: value.definition,
        sortOrder: value.sortOrder
      }
    });
    await writeAudit(tx, adminUser, "skill-trait.update", after.id, before, after, "skill-trait");
    return after;
  });
}

export async function deleteSkillTrait({ prisma, adminUser, traitId }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.skillTrait.findUnique({ where: { id: traitId } });
    if (!before) throw routeError(404, "特性词不存在");
    const references = collectTraitReferences(await listCharactersWithSkills(tx), before.name);
    if (references.length) {
      throw routeError(409, "该特性词仍被技能描述引用，无法删除", { references });
    }
    await tx.skillTrait.delete({ where: { id: before.id } });
    await writeAudit(tx, adminUser, "skill-trait.delete", before.id, before, null, "skill-trait");
    return before;
  });
}

export async function assertSkillTraitReferences(prisma, skill = {}) {
  if (!prisma?.skillTrait?.findMany) return;
  const traits = await prisma.skillTrait.findMany({ select: { name: true } });
  const knownNames = new Set(traits.map((trait) => trait.name));
  assertDescriptionTraitReferences(skill.description, knownNames, skill.name || "基础技能");

  const params = parseParamsJson(skill.paramsJson);
  const definitions = Array.isArray(params.derivedSkills) ? params.derivedSkills : [];
  for (const definition of definitions) {
    assertDescriptionTraitReferences(
      definition?.description,
      knownNames,
      definition?.name || definition?.effectType || "派生技能"
    );
  }
}

export async function migrateBuiltinSkillDescriptions(prisma) {
  if (!prisma?.character?.findMany || !prisma?.characterSkill?.update) return;
  const characters = await listCharactersWithSkills(prisma);
  for (const character of characters) {
    const skill = character.skill;
    if (!skill) continue;
    const candidateMigration = BASE_DESCRIPTION_MIGRATIONS[skill.effectType];
    const migration = candidateMigration?.slugs?.includes(character.slug)
      ? candidateMigration
      : null;
    const nextDescription = migration
      ? migrateDescription(skill.description, migration)
      : String(skill.description ?? "");
    const params = parseParamsJson(skill.paramsJson);
    const definitions = Array.isArray(params.derivedSkills) ? params.derivedSkills : [];
    let derivedChanged = false;
    const derivedSkills = definitions.map((definition) => {
      const derivedMigration = DERIVED_DESCRIPTION_MIGRATIONS[definition?.effectType ?? definition?.id];
      if (!derivedMigration?.characterSlugs?.includes(character.slug)) return definition;
      const description = migrateDescription(definition.description, derivedMigration);
      if (description === String(definition.description ?? "")) return definition;
      derivedChanged = true;
      return { ...definition, description };
    });
    if (nextDescription === skill.description && !derivedChanged) continue;
    await prisma.characterSkill.update({
      where: { id: skill.id },
      data: {
        description: nextDescription,
        paramsJson: derivedChanged
          ? JSON.stringify({ ...params, derivedSkills })
          : skill.paramsJson
      }
    });
  }
}

export function validateSkillTraitInput(input = {}) {
  const name = String(input.name ?? "").trim();
  const definition = String(input.definition ?? "").trim();
  const sortOrder = Number(input.sortOrder ?? 0);
  if (!name) throw routeError(400, "特性词名称不能为空");
  if ([...name].length > 8) throw routeError(400, "特性词名称最多 8 个字符");
  if (/[【】]/.test(name)) throw routeError(400, "特性词名称不能包含【或】");
  if (!definition) throw routeError(400, "特性词释义不能为空");
  if (!Number.isInteger(sortOrder)) throw routeError(400, "特性词排序必须是整数");
  return { id: String(input.id ?? ""), name, definition, sortOrder };
}

export function collectTraitReferences(characters = [], traitName) {
  const references = [];
  for (const character of characters) {
    const skill = character.skill;
    if (!skill) continue;
    if (extractSkillTraitReferences(skill.description).includes(traitName)) {
      references.push(referencePayload(character, skill, "base"));
    }
    const params = parseParamsJson(skill.paramsJson);
    const definitions = Array.isArray(params.derivedSkills) ? params.derivedSkills : [];
    for (const definition of definitions) {
      if (!extractSkillTraitReferences(definition?.description).includes(traitName)) continue;
      references.push(referencePayload(character, definition, "derived"));
    }
  }
  return references;
}

async function listCharactersWithSkills(prisma) {
  if (!prisma?.character?.findMany) return [];
  return prisma.character.findMany({
    include: { skill: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
}

function referencePayload(character, skill, skillType) {
  return {
    characterId: character.id,
    characterSlug: character.slug,
    characterName: character.name,
    skillType,
    skillId: skill.effectType ?? skill.id ?? "",
    skillName: skill.name ?? skill.effectType ?? skill.id ?? ""
  };
}

async function assertUniqueSkillTraitName(prisma, name, currentId = "") {
  const existing = await prisma.skillTrait.findUnique({ where: { name } });
  if (existing && existing.id !== currentId) throw routeError(409, "特性词名称已存在");
}

function assertDescriptionTraitReferences(description, knownNames, label) {
  const references = extractSkillTraitReferences(description);
  const seen = new Set();
  for (const name of references) {
    if (!knownNames.has(name)) throw routeError(400, `${label}引用了未知特性词【${name}】`);
    if (seen.has(name)) throw routeError(400, `${label}重复引用了特性词【${name}】`);
    seen.add(name);
  }
}

async function renameSkillTraitReferences(prisma, oldName, newName) {
  const characters = await listCharactersWithSkills(prisma);
  const oldToken = `【${oldName}】`;
  const newToken = `【${newName}】`;
  for (const character of characters) {
    const skill = character.skill;
    if (!skill) continue;
    const description = replaceAllExact(skill.description, oldToken, newToken);
    const params = parseParamsJson(skill.paramsJson);
    const definitions = Array.isArray(params.derivedSkills) ? params.derivedSkills : [];
    let derivedChanged = false;
    const derivedSkills = definitions.map((definition) => {
      const nextDescription = replaceAllExact(definition?.description, oldToken, newToken);
      if (nextDescription === String(definition?.description ?? "")) return definition;
      derivedChanged = true;
      return { ...definition, description: nextDescription };
    });
    if (description === String(skill.description ?? "") && !derivedChanged) continue;
    await prisma.characterSkill.update({
      where: { id: skill.id },
      data: {
        description,
        paramsJson: derivedChanged
          ? JSON.stringify({ ...params, derivedSkills })
          : skill.paramsJson
      }
    });
  }
}

function migrateDescription(description, migration) {
  const original = String(description ?? "");
  let next = original;
  let traitSourceMatched = migration.exactTraitDescriptions?.includes(original) ?? false;
  for (const fragment of migration.replacements ?? []) {
    if (!next.includes(fragment)) continue;
    next = replaceAllExact(next, fragment, "");
    traitSourceMatched = true;
  }
  for (const fragment of fixedOverclockFragments(migration.overclockValues ?? [])) {
    next = removeExactFixedOverclockFragment(next, fragment);
  }
  next = next.trim();
  if (traitSourceMatched && migration.traits?.length) {
    const prefix = migration.traits.map((name) => `【${name}】`).join("");
    for (const name of migration.traits) {
      next = replaceAllExact(next, `【${name}】`, "");
    }
    next = `${prefix}${next.trimStart()}`;
  }
  return next;
}

function fixedOverclockFragments(values) {
  return values.flatMap((value) => [
    `\n超频：${value}。`,
    `\n超频：${value}`,
    `超频：${value}。`,
    `超频：${value}`,
    `超频 ${value}，`,
    `超频${value}，`,
    `超频 ${value}。`,
    `超频${value}。`,
    `超频 ${value}`,
    `超频${value}`
  ]);
}

function removeExactFixedOverclockFragment(value, fragment) {
  const text = String(value ?? "");
  if (/\d$/.test(fragment)) {
    return text.endsWith(fragment) ? text.slice(0, -fragment.length) : text;
  }
  return replaceAllExact(text, fragment, "");
}

function replaceAllExact(value, search, replacement) {
  return String(value ?? "").split(search).join(replacement);
}

function parseParamsJson(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value || "{}") : value;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
