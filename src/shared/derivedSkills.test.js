import { describe, expect, it } from "vitest";
import {
  DEFAULT_VOYAGE_STAR_DERIVED_SKILL,
  derivedSkillDefinitionsFromSkill,
  normalizeDerivedSkillDefinition
} from "./derivedSkills.js";

describe("derived skill definitions", () => {
  it("does not inject a character-specific derived skill into empty configs", () => {
    expect(derivedSkillDefinitionsFromSkill({ effectType: "liberty-purge", params: {} })).toEqual([]);
    expect(derivedSkillDefinitionsFromSkill({ effectType: "hidden-hand", params: {} })).toEqual([]);
  });

  it("normalizes future derived skills with neutral defaults", () => {
    expect(normalizeDerivedSkillDefinition({
      id: "future-slash",
      effectType: "row-slash",
      name: "Future Slash"
    })).toEqual(expect.objectContaining({
      id: "future-slash",
      effectType: "row-slash",
      name: "Future Slash",
      description: "",
      uses: 1,
      freeTurn: false,
      targetRule: "any-point",
      costType: "numeric",
      costValue: "0",
      musicTrackId: null
    }));
  });

  it("keeps Voyage Star defaults only when explicitly present in the base skill", () => {
    expect(derivedSkillDefinitionsFromSkill({
      effectType: "hidden-hand",
      params: { derivedSkills: [{ ...DEFAULT_VOYAGE_STAR_DERIVED_SKILL }] }
    })).toEqual([{ ...DEFAULT_VOYAGE_STAR_DERIVED_SKILL }]);
  });
});
