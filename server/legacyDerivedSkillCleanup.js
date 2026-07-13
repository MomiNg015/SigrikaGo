import { DEFAULT_VOYAGE_STAR_DERIVED_SKILL } from "../src/shared/derivedSkills.js";

export const DERIVED_SKILL_LEAK_CLEANUP_MARKER = "migration.cleanup-derived-skill-leak-v1";

export async function cleanupLegacyDerivedSkillLeak(prisma) {
  if (!prisma?.character?.findMany || !prisma?.characterSkill?.update) return;
  const marker = await prisma.siteSetting?.findUnique?.({
    where: { key: DERIVED_SKILL_LEAK_CLEANUP_MARKER }
  });
  if (marker?.value === "complete") return;

  const characters = await prisma.character.findMany({
    where: { slug: { not: "aemeath" } },
    include: { skill: true }
  });
  for (const character of characters) {
    const params = parseParams(character.skill?.paramsJson);
    if (!params || !Array.isArray(params.derivedSkills)) continue;
    const derivedSkills = params.derivedSkills.filter((definition) => !isLegacyVoyageStarLeak(definition));
    if (derivedSkills.length === params.derivedSkills.length) continue;
    const nextParams = { ...params };
    if (derivedSkills.length) nextParams.derivedSkills = derivedSkills;
    else delete nextParams.derivedSkills;
    await prisma.characterSkill.update({
      where: { id: character.skill.id },
      data: { paramsJson: JSON.stringify(nextParams) }
    });
  }

  await prisma.siteSetting?.upsert?.({
    where: { key: DERIVED_SKILL_LEAK_CLEANUP_MARKER },
    create: { key: DERIVED_SKILL_LEAK_CLEANUP_MARKER, value: "complete" },
    update: { value: "complete" }
  });
}

export function isLegacyVoyageStarLeak(definition) {
  if (!definition || typeof definition !== "object") return false;
  return (definition.effectType ?? definition.id) === DEFAULT_VOYAGE_STAR_DERIVED_SKILL.effectType
    && String(definition.name ?? "") === DEFAULT_VOYAGE_STAR_DERIVED_SKILL.name
    && String(definition.description ?? "") === DEFAULT_VOYAGE_STAR_DERIVED_SKILL.description
    && String(definition.costValue ?? definition.cost ?? "") === String(DEFAULT_VOYAGE_STAR_DERIVED_SKILL.costValue)
    && String(definition.musicTrackId ?? "") === DEFAULT_VOYAGE_STAR_DERIVED_SKILL.musicTrackId;
}

function parseParams(paramsJson) {
  try {
    const parsed = JSON.parse(paramsJson ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
