import { describe, expect, it } from "vitest";
import { DEFAULT_SKILL_SYSTEM_MESSAGE } from "../src/shared/skillMessages.js";
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
      acquisitionMethod: "商城购买",
      palette: "#6ab7ff",
      enabled: true,
      skill: null
    });

    expect(payload.portraitSource).toBe("upload");
    expect(payload.acquisitionMethod).toBe("商城购买");
  });

  it("omits disabled skills from public character payloads", () => {
    const payload = toCharacterPayload({
      id: "character-db-1",
      slug: "danea",
      name: "Danea",
      portraitUrl: "/uploads/characters/danea.png",
      portraitSource: "upload",
      palette: "#6ab7ff",
      enabled: true,
      skill: {
        id: "skill-1",
        effectType: "flip-stone",
        name: "Moon Flip",
        uses: 1,
        description: "Flip one stone.",
        freeTurn: false,
        targetRule: "stone",
        paramsJson: "{}",
        costType: "numeric",
        costValue: "1",
        enabled: false
      }
    });

    expect(payload.skill).toBeNull();
  });

  it("accepts a valid erase-point skill targeting an empty point", () => {
    const result = validateCharacterInput(validInput);

    expect(result.ok).toBe(true);
    expect(result.value.skill.effectType).toBe("erase-point");
    expect(result.value.skill.targetRule).toBe("empty-point");
    expect(result.value.skill.costType).toBe("numeric");
    expect(result.value.skill.costValue).toBe("0");
    expect(result.value.skill.systemMessage).toContain("{player}");
  });

  it("accepts random blast skills with no target", () => {
    const result = validateCharacterInput({
      ...validInput,
      acquisitionMethod: "商城购买",
      skill: {
        effectType: "random-blast",
        name: "猪小仙爆炸",
        description: "随机移除棋盘上3*3区域的棋子。",
        uses: 1,
        freeTurn: true,
        targetRule: "none",
        paramsJson: "{\"size\":3}",
        costType: "numeric",
        costValue: "0"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.value.acquisitionMethod).toBe("商城购买");
    expect(result.value.skill.effectType).toBe("random-blast");
    expect(result.value.skill.targetRule).toBe("none");
  });

  it("uses the shared default system message when no custom message is provided", () => {
    const result = validateCharacterInput(validInput);

    expect(result.ok).toBe(true);
    expect(result.value.skill.systemMessage).toBe(DEFAULT_SKILL_SYSTEM_MESSAGE);

    const payload = toCharacterPayload({
      id: "character-db-1",
      slug: "sigrika",
      name: "Sigrika",
      portraitUrl: "/assets/sigrika.png",
      portraitSource: "url",
      palette: "#ff9b4d",
      enabled: true,
      skill: {
        id: "skill-1",
        effectType: "erase-point",
        name: "Star Rune",
        uses: 1,
        description: "Erase one point.",
        freeTurn: true,
        targetRule: "empty-point",
        paramsJson: "{}",
        costType: "numeric",
        costValue: "3",
        systemMessage: null
      }
    });

    expect(payload.skill.systemMessage).toBe(DEFAULT_SKILL_SYSTEM_MESSAGE);
  });

  it("preserves disabled skill state from admin character input", () => {
    const result = validateCharacterInput({
      ...validInput,
      skill: {
        ...validInput.skill,
        enabled: false
      }
    });

    expect(result.ok).toBe(true);
    expect(result.value.skill.enabled).toBe(false);
  });

  it("accepts numeric skill costs and preserves them in payloads", () => {
    const result = validateCharacterInput({
      ...validInput,
      skill: {
        ...validInput.skill,
        costType: "numeric",
        costValue: "3",
        systemMessage: "{player} uses {skill}"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.value.skill.costType).toBe("numeric");
    expect(result.value.skill.costValue).toBe("3");
    expect(result.value.skill.systemMessage).toBe("{player} uses {skill}");

    const payload = toCharacterPayload({
      id: "character-db-1",
      slug: "sigrika",
      name: "Sigrika",
      portraitUrl: "/assets/sigrika.png",
      portraitSource: "url",
      palette: "#ff9b4d",
      enabled: true,
      skill: {
        id: "skill-1",
        effectType: "erase-point",
        name: "Star Rune",
        uses: 1,
        description: "Erase one point.",
        freeTurn: true,
        targetRule: "empty-point",
        paramsJson: "{}",
        costType: "numeric",
        costValue: "3",
        systemMessage: "{player} uses {skill}"
      }
    });

    expect(payload.skill.costType).toBe("numeric");
    expect(payload.skill.costValue).toBe("3");
    expect(payload.skill.cost).toBe(3);
    expect(payload.skill.systemMessage).toBe("{player} uses {skill}");
  });

  it("rejects non-numeric cost values for numeric costs", () => {
    const result = validateCharacterInput({
      ...validInput,
      skill: {
        ...validInput.skill,
        costType: "numeric",
        costValue: "三子"
      }
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("costValue");
  });

  it("accepts special skill costs as display-only text", () => {
    const result = validateCharacterInput({
      ...validInput,
      skill: {
        ...validInput.skill,
        costType: "special",
        costValue: "下次读秒缩短"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.value.skill.costType).toBe("special");
    expect(result.value.skill.costValue).toBe("下次读秒缩短");
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

    expect(response.characters.map((character) => character.id)).toEqual(["denia"]);
    expect(response.disabledSlugs).toEqual(["sigrika"]);
  });

  it("deduplicates legacy character aliases in the public character response", async () => {
    const response = await listPublicCharacterResponse({
      character: {
        findMany: async (query) => {
          if (query.where?.enabled === true) {
            return [
              {
                id: "legacy-danea",
                slug: "danea",
                name: "旧达妮娅",
                portraitUrl: "/assets/Danea_centered.png",
                portraitSource: "url",
                palette: "#f2a4d8",
                acquisitionMethod: "",
                enabled: true,
                skill: null
              },
              {
                id: "canonical-denia",
                slug: "denia",
                name: "达妮娅",
                portraitUrl: "/assets/Danea_centered.png",
                portraitSource: "url",
                palette: "#f2a4d8",
                acquisitionMethod: "",
                enabled: true,
                skill: null
              }
            ];
          }
          return [
            { slug: "danea", enabled: true },
            { slug: "denia", enabled: true }
          ];
        }
      }
    });

    expect(response.characters.map((character) => character.id)).toEqual(["denia"]);
    expect(response.characters[0].name).toBe("达妮娅");
  });
});
