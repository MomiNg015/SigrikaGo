import { describe, expect, it, vi } from "vitest";
import { DEFAULT_VOYAGE_STAR_DERIVED_SKILL } from "../src/shared/derivedSkills.js";
import {
  cleanupLegacyDerivedSkillLeak,
  DERIVED_SKILL_LEAK_CLEANUP_MARKER,
  isLegacyVoyageStarLeak
} from "./legacyDerivedSkillCleanup.js";

describe("legacy derived skill leak cleanup", () => {
  it("recognizes only the old injected Voyage Star signature", () => {
    expect(isLegacyVoyageStarLeak({ ...DEFAULT_VOYAGE_STAR_DERIVED_SKILL })).toBe(true);
    expect(isLegacyVoyageStarLeak({
      ...DEFAULT_VOYAGE_STAR_DERIVED_SKILL,
      name: "Another character's explicit skill"
    })).toBe(false);
  });

  it("removes leaked defaults once while preserving explicit derived skills", async () => {
    const updates = [];
    const siteSetting = {
      findUnique: vi.fn(async () => null),
      upsert: vi.fn(async () => null)
    };
    const prisma = {
      siteSetting,
      character: {
        findMany: vi.fn(async () => [{
          slug: "chisa",
          skill: {
            id: "skill-chisa",
            paramsJson: JSON.stringify({
              radius: 1,
              derivedSkills: [
                { ...DEFAULT_VOYAGE_STAR_DERIVED_SKILL },
                { id: "custom", effectType: "row-slash", name: "Custom", description: "Keep", costValue: "2" }
              ]
            })
          }
        }])
      },
      characterSkill: {
        update: vi.fn(async (query) => updates.push(query))
      }
    };

    await cleanupLegacyDerivedSkillLeak(prisma);

    expect(prisma.character.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { slug: { not: "aemeath" } }
    }));
    expect(updates).toHaveLength(1);
    expect(JSON.parse(updates[0].data.paramsJson)).toEqual({
      radius: 1,
      derivedSkills: [{ id: "custom", effectType: "row-slash", name: "Custom", description: "Keep", costValue: "2" }]
    });
    expect(siteSetting.upsert).toHaveBeenCalledWith({
      where: { key: DERIVED_SKILL_LEAK_CLEANUP_MARKER },
      create: { key: DERIVED_SKILL_LEAK_CLEANUP_MARKER, value: "complete" },
      update: { value: "complete" }
    });
  });

  it("skips cleanup after the migration marker is complete", async () => {
    const prisma = {
      siteSetting: { findUnique: vi.fn(async () => ({ value: "complete" })) },
      character: { findMany: vi.fn(async () => []) },
      characterSkill: { update: vi.fn() }
    };

    await cleanupLegacyDerivedSkillLeak(prisma);

    expect(prisma.character.findMany).not.toHaveBeenCalled();
  });
});
