import { describe, expect, it } from "vitest";
import { DEFAULT_SKILL_SYSTEM_MESSAGE } from "../src/shared/skillMessages.js";
import { safeUploadFilename } from "./adminRoutes.js";
import { listPublicCharacterResponse, seedCharacters, toCharacterPayload, validateCharacterInput } from "./characters.js";

const validInput = {
  slug: "star-rune",
  name: "星辰符文师",
  description: "A precise rune caster.",
  palette: "#ff9b4d",
  portraitUrl: "/assets/sigrika_centered.webp",
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
      description: "A moonlit tactician.",
      cvName: "Voice Actor",
      cvUrl: "https://example.com/cv",
      portraitUrl: "/uploads/characters/danea.png",
      portraitSource: "upload",
      acquisitionMethod: "商城购买",
      palette: "#6ab7ff",
      enabled: true,
      skill: null
    });

    expect(payload.portraitSource).toBe("upload");
    expect(payload.description).toBe("A moonlit tactician.");
    expect(payload.cvName).toBe("Voice Actor");
    expect(payload.cvUrl).toBe("https://example.com/cv");
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

  it("returns sort order in public character payloads", () => {
    const payload = toCharacterPayload({
      id: "character-db-1",
      slug: "sigrika",
      name: "Sigrika",
      description: "",
      portraitUrl: "/assets/sigrika.png",
      portraitSource: "url",
      palette: "#ff9b4d",
      enabled: true,
      sortOrder: 42,
      skill: null
    });

    expect(payload.sortOrder).toBe(42);
  });

  it("accepts a valid erase-point skill targeting an empty point", () => {
    const result = validateCharacterInput(validInput);

    expect(result.ok).toBe(true);
    expect(result.value.description).toBe("A precise rune caster.");
    expect(result.value.cvName).toBe("");
    expect(result.value.cvUrl).toBe("");
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

  it("accepts Lynae spray skills targeting stones", () => {
    const result = validateCharacterInput({
      ...validInput,
      slug: "lynae",
      name: "琳奈",
      portraitUrl: "/assets/characters/lynae_centered.webp",
      skill: {
        effectType: "spray-stone",
        name: "流光溢彩",
        description: "Transform the selected stone and one random eligible stone into spray stones.",
        uses: 1,
        freeTurn: false,
        targetRule: "stone",
        paramsJson: "{}",
        costType: "numeric",
        costValue: "4"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.value.skill.effectType).toBe("spray-stone");
    expect(result.value.skill.targetRule).toBe("stone");
    expect(result.value.skill.costValue).toBe("4");
  });

  it("accepts Mornye protocol takeover skills targeting empty points", () => {
    const result = validateCharacterInput({
      ...validInput,
      slug: "mornye",
      name: "莫宁",
      portraitUrl: "/assets/characters/mornye.png",
      acquisitionMethod: "招募获得",
      skill: {
        effectType: "protocol-takeover",
        name: "协议接管",
        description: "指定棋盘一处空置交叉点，将其变为对方的禁入点。",
        uses: 1,
        freeTurn: true,
        targetRule: "empty-point",
        paramsJson: "{}",
        costType: "numeric",
        costValue: "2"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.value.skill.effectType).toBe("protocol-takeover");
    expect(result.value.skill.targetRule).toBe("empty-point");
    expect(result.value.skill.costValue).toBe("2");
  });

  it("accepts ChangLi double-move skills with no target", () => {
    const result = validateCharacterInput({
      ...validInput,
      slug: "changli",
      name: "长离",
      portraitUrl: "/assets/characters/changli.png",
      acquisitionMethod: "招募获得",
      skill: {
        effectType: "double-move",
        name: "谋定后动",
        description: "本回合可以连下2手。",
        uses: 1,
        freeTurn: true,
        targetRule: "none",
        paramsJson: "{\"moves\":2}",
        costType: "numeric",
        costValue: "3"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.value.skill.effectType).toBe("double-move");
    expect(result.value.skill.targetRule).toBe("none");
    expect(result.value.skill.costValue).toBe("3");
    expect(result.value.skill.freeTurn).toBe(true);
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

  it("accepts optional character CV metadata with safe links", () => {
    const result = validateCharacterInput({
      ...validInput,
      cvName: "配音者",
      cvUrl: "/credits/voice"
    });

    expect(result.ok).toBe(true);
    expect(result.value.cvName).toBe("配音者");
    expect(result.value.cvUrl).toBe("/credits/voice");
  });

  it("rejects unsafe or nameless character CV links", () => {
    const unsafe = validateCharacterInput({
      ...validInput,
      cvName: "配音者",
      cvUrl: "javascript:alert(1)"
    });
    const nameless = validateCharacterInput({
      ...validInput,
      cvName: "",
      cvUrl: "https://example.com/cv"
    });

    expect(unsafe.ok).toBe(false);
    expect(unsafe.error).toContain("cvUrl");
    expect(nameless.ok).toBe(false);
    expect(nameless.error).toContain("cvName");
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
              slug: "denia",
              name: "Denia",
              portraitUrl: "/assets/denia.png",
              portraitSource: "url",
              palette: "#6ab7ff",
              enabled: true,
              sortOrder: 7,
              cvName: "Denia CV",
              cvUrl: "https://example.com/denia",
              skill: null
            }];
          }
          return [
            { slug: "sigrika", enabled: false },
            { slug: "denia", enabled: true }
          ];
        }
      }
    });

    expect(response.characters.map((character) => character.id)).toEqual(["denia"]);
    expect(response.characters[0].sortOrder).toBe(7);
    expect(response.characters[0].cvName).toBe("Denia CV");
    expect(response.characters[0].cvUrl).toBe("https://example.com/denia");
    expect(response.disabledSlugs).toEqual(["sigrika"]);
  });

  it("does not overwrite admin-managed builtin sort orders during seed", async () => {
    const updates = [];
    const existing = {
      id: "character-db-1",
      slug: "sigrika",
      sortOrder: 99,
      skill: null
    };
    const prisma = {
      character: {
        findUnique: async ({ where }) => where.slug === "sigrika" ? existing : null,
        update: async (query) => updates.push(query),
        create: async () => ({})
      }
    };

    await seedCharacters(prisma);

    expect(updates).toEqual([]);
  });

  it("syncs builtin static portrait asset paths during seed", async () => {
    const updates = [];
    const existing = {
      id: "character-db-nabomo",
      slug: "nabomo",
      portraitUrl: "/assets/nabomo.png",
      portraitSource: "url",
      source: "default",
      skill: null
    };
    const prisma = {
      character: {
        findUnique: async ({ where }) => where.slug === "nabomo" ? existing : null,
        update: async (query) => updates.push(query),
        create: async () => ({})
      }
    };

    await seedCharacters(prisma);

    expect(updates).toContainEqual({
      where: { id: "character-db-nabomo" },
      data: {
        portraitUrl: "/assets/nabomo.webp",
        portraitSource: "url"
      }
    });
  });

  it("backfills missing code-defined derived skills without overwriting existing content", async () => {
    const skillUpdates = [];
    const existing = {
      id: "character-db-aemeath",
      slug: "aemeath",
      portraitUrl: "/assets/Aemeath_centered.webp",
      portraitSource: "url",
      source: "default",
      skill: {
        id: "skill-aemeath",
        effectType: "hidden-hand",
        paramsJson: JSON.stringify({ other: true })
      }
    };
    const prisma = {
      character: {
        findUnique: async ({ where }) => where.slug === "aemeath" ? existing : null,
        update: async () => ({}),
        create: async () => ({})
      },
      characterSkill: {
        update: async (query) => skillUpdates.push(query)
      }
    };

    await seedCharacters(prisma);

    expect(skillUpdates).toHaveLength(1);
    expect(JSON.parse(skillUpdates[0].data.paramsJson)).toMatchObject({
      other: true,
      derivedSkills: [expect.objectContaining({ effectType: "voyage-star", name: "远航星" })]
    });
  });

  it("omits legacy Denia rows from the public character response", async () => {
    const response = await listPublicCharacterResponse({
      character: {
        findMany: async (query) => {
          if (query.where?.enabled === true) {
            return [
              {
                id: "legacy-danea",
                slug: "danea",
                name: "旧达妮娅",
                portraitUrl: "/assets/Danea_centered.webp",
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
                portraitUrl: "/assets/Danea_centered.webp",
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
