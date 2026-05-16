import { describe, expect, it } from "vitest";
import { safeUploadFilename } from "./adminRoutes.js";
import { listPublicCharacterResponse, toCharacterPayload, validateCharacterInput } from "./characters.js";

const validInput = {
  slug: "star-rune",
  name: "星辰符文师",
  palette: "#ff9b4d",
  portraitUrl: "/assets/sigrika_centered.png",
  skill: {
    effectType: "erase-point",
    name: "Star Rune",
    description: "Erase one empty intersection.",
    uses: 1,
    freeTurn: true,
    targetRule: "empty-point",
    paramsJson: "{}"
  },
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

  it("returns null for unsupported upload mime types", () => {
    expect(safeUploadFilename("danea.png", "image/svg+xml")).toBeNull();
  });

  it("sanitizes upload filenames with paths and spoofed extensions", () => {
    const name = safeUploadFilename("..\\Danea Pretty.php.PNG", "image/webp");

    expect(name).toMatch(/^character-[a-f0-9-]+-danea-pretty-php\.webp$/);
    expect(name).not.toContain("\\");
    expect(name).not.toContain("..");
  });

  it("returns portraitSource in character payloads", () => {
    const payload = toCharacterPayload({
      id: "character-db-1",
      slug: "danea",
      name: "Danea",
      portraitUrl: "/uploads/characters/danea.png",
      portraitSource: "upload",
      palette: "#6ab7ff",
      enabled: true,
      skill: null
    });

    expect(payload.portraitSource).toBe("upload");
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
      skill: {
        ...validInput.skill,
        targetRule: "stone"
      }
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

  it("rejects blank skill name and description", () => {
    const result = validateCharacterInput({
      ...validInput,
      skill: {
        ...validInput.skill,
        name: " ",
        description: ""
      }
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("skill.name");
    expect(result.error).toContain("skill.description");
  });

  it("requires skill name and description from the nested skill object", () => {
    const result = validateCharacterInput({
      ...validInput,
      skill: undefined,
      skillName: validInput.skill.name,
      skillDescription: validInput.skill.description
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("skill must be an object");
  });

  it("returns enabled public characters plus disabled slugs", async () => {
    const response = await listPublicCharacterResponse({
      character: {
        findMany: async (query) => {
          if (query.where?.enabled === true) {
            return [{
              id: "character-db-1",
              slug: "danea",
              name: "Danea",
              portraitUrl: "/assets/danea.png",
              portraitSource: "url",
              palette: "#6ab7ff",
              enabled: true,
              skill: null
            }];
          }
          return [
            { slug: "sigrika", enabled: false },
            { slug: "danea", enabled: true }
          ];
        }
      }
    });

    expect(response.characters.map((character) => character.id)).toEqual(["danea"]);
    expect(response.disabledSlugs).toEqual(["sigrika"]);
  });
});
