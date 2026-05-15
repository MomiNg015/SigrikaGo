import { describe, expect, it } from "vitest";
import { validateCharacterInput } from "./characters.js";

const validInput = {
  slug: "star-rune",
  name: "星辰符文师",
  palette: "#ff9b4d",
  portraitUrl: "/assets/sigrika_centered.png",
  effectType: "erase-point",
  skillName: "星辰符文",
  skillDescription: "抹除一个空交叉点。",
  uses: 1,
  freeTurn: true,
  targetRule: "empty-point",
  paramsJson: "{}"
};

describe("character admin helpers", () => {
  it("accepts a valid erase-point skill targeting an empty point", () => {
    const result = validateCharacterInput(validInput);

    expect(result.ok).toBe(true);
    expect(result.value.skill.effectType).toBe("erase-point");
    expect(result.value.skill.targetRule).toBe("empty-point");
  });

  it("rejects erase-point skills targeting a stone", () => {
    const result = validateCharacterInput({
      ...validInput,
      targetRule: "stone"
    });

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("目标规则");
  });
});
