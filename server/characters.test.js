import { describe, expect, it } from "vitest";
import { safeUploadFilename } from "./adminRoutes.js";
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
  it("creates safe upload filenames", () => {
    const name = safeUploadFilename("Danea Pretty.PNG", "image/png");
    expect(name).toMatch(/^character-[a-f0-9-]+-danea-pretty\.png$/);
  });

  it("accepts a valid erase-point skill targeting an empty point", () => {
    const result = validateCharacterInput(validInput);

    expect(result.ok).toBe(true);
    expect(result.value.skill.effectType).toBe("erase-point");
    expect(result.value.skill.targetRule).toBe("empty-point");
  });

  it("preserves upload portrait source metadata", () => {
    const result = validateCharacterInput({
      ...validInput,
      portraitUrl: "/uploads/characters/character-1-danea.png",
      portraitSource: "upload"
    });

    expect(result.ok).toBe(true);
    expect(result.value.portraitSource).toBe("upload");
  });

  it("rejects erase-point skills targeting a stone", () => {
    const result = validateCharacterInput({
      ...validInput,
      targetRule: "stone"
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("目标规则");
  });

  it("rejects null payload without throwing", () => {
    const result = validateCharacterInput(null);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("payload");
  });

  it("rejects invalid top-level runtime types", () => {
    const enabledResult = validateCharacterInput({
      ...validInput,
      enabled: "false"
    });
    const sortOrderResult = validateCharacterInput({
      ...validInput,
      sortOrder: "abc"
    });

    expect(enabledResult.ok).toBe(false);
    expect(enabledResult.error).toContain("enabled");
    expect(sortOrderResult.ok).toBe(false);
    expect(sortOrderResult.error).toContain("sortOrder");
  });

  it("rejects invalid skill boolean runtime types", () => {
    const result = validateCharacterInput({
      ...validInput,
      skill: {
        effectType: "erase-point",
        name: "星辰符文",
        description: "抹除一个空交叉点。",
        uses: 1,
        freeTurn: "false",
        targetRule: "empty-point",
        paramsJson: "{}"
      }
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("freeTurn");
  });
});
