import { describe, expect, it } from "vitest";
import { DEFAULT_SKILL_SYSTEM_MESSAGE } from "./skillMessages.js";
import {
  buildCharacterDraft,
  buildDecorationDraft,
  buildGachaPoolDraft,
  buildShopItemDraft,
  characterDraftToBody,
  decorationDraftToBody,
  emptyCharacterDraft,
  emptyGachaPoolDraft,
  emptyShopItemDraft,
  gachaPoolDraftToBody,
  parseAdminInteger,
  shopCategoryLabel,
  targetRuleForEffect,
  validateShopItemDraft
} from "./adminDrafts.js";

describe("admin draft helpers", () => {
  it("builds character drafts with safe skill defaults", () => {
    expect(emptyCharacterDraft().skill.systemMessage).toBe(DEFAULT_SKILL_SYSTEM_MESSAGE);
    expect(emptyCharacterDraft().cvName).toBe("");
    expect(emptyCharacterDraft().cvUrl).toBe("");
    expect(targetRuleForEffect("flip-stone")).toBe("stone");
    expect(targetRuleForEffect("erase-point")).toBe("empty-point");

    const draft = buildCharacterDraft({
      id: "danea",
      dbId: "character-1",
      name: "Danea",
      description: "Moonlit tactician",
      cvName: "Sample CV",
      cvUrl: "https://example.com/cv",
      portrait: "/assets/danea.png",
      acquisitionMethod: "商城购买",
      skill: { effectType: "flip-stone", params: { radius: 1 } }
    });

    expect(draft.slug).toBe("danea");
    expect(draft.description).toBe("Moonlit tactician");
    expect(draft.cvName).toBe("Sample CV");
    expect(draft.cvUrl).toBe("https://example.com/cv");
    expect(draft.acquisitionMethod).toBe("商城购买");
    expect(draft.skill.targetRule).toBe("stone");
    expect(draft.skill.paramsJson).toBe("{\"radius\":1}");
    expect(draft.skill.derivedSkills).toEqual([]);
    expect(targetRuleForEffect("random-blast")).toBe("none");
  });

  it("serializes valid character drafts and rejects invalid numeric fields", () => {
    const draft = {
      ...emptyCharacterDraft(),
      slug: "new-character",
      name: "New Character",
      description: "New character description",
      cvName: "Voice Actor",
      cvUrl: "/voice/actor",
      portraitUrl: "/assets/new.png",
      acquisitionMethod: "商城购买",
      sortOrder: "2",
      skill: {
        ...emptyCharacterDraft().skill,
        name: "Skill",
        description: "Description",
        uses: "1",
        costValue: "3"
      }
    };

    expect(characterDraftToBody(draft).skill.costValue).toBe("3");
    expect(JSON.parse(characterDraftToBody(draft).skill.paramsJson).derivedSkills).toBeUndefined();
    expect(characterDraftToBody(draft).description).toBe("New character description");
    expect(characterDraftToBody(draft).cvName).toBe("Voice Actor");
    expect(characterDraftToBody(draft).cvUrl).toBe("/voice/actor");
    expect(characterDraftToBody(draft).acquisitionMethod).toBe("商城购买");
    expect(characterDraftToBody({ ...draft, skill: { ...draft.skill, uses: "10" } })).toBeNull();
    expect(characterDraftToBody({ ...draft, skill: { ...draft.skill, costValue: "three" } })).toBeNull();
    expect(characterDraftToBody({ ...draft, cvUrl: "javascript:alert(1)" })).toBeNull();
    expect(characterDraftToBody({ ...draft, cvName: "", cvUrl: "https://example.com/cv" })).toBeNull();
  });

  it("preserves the skill enabled flag in character drafts", () => {
    const draft = buildCharacterDraft({
      id: "danea",
      name: "Danea",
      portrait: "/assets/danea.png",
      skill: {
        effectType: "flip-stone",
        name: "Flip",
        description: "Flip a stone.",
        enabled: false
      }
    });

    expect(draft.skill.enabled).toBe(false);

    const body = characterDraftToBody({
      ...draft,
      sortOrder: "1",
      skill: {
        ...draft.skill,
        uses: "1",
        costValue: "0",
        systemMessage: DEFAULT_SKILL_SYSTEM_MESSAGE
      }
    });

    expect(body.skill.enabled).toBe(false);
  });

  it("round-trips Aemeath derived skill text and overclock through skill params", () => {
    const draft = buildCharacterDraft({
      id: "aemeath",
      name: "Aemeath",
      portrait: "/assets/Aemeath_centered.webp",
      skill: {
        effectType: "hidden-hand",
        name: "Little Ai",
        description: "Hidden hand.",
        params: {
          derivedSkills: [{
            effectType: "voyage-star",
            name: "Far Sail",
            description: "Configured derived skill.",
            costValue: "7"
          }]
        }
      }
    });

    expect(draft.skill.derivedSkills[0]).toMatchObject({
      effectType: "voyage-star",
      name: "Far Sail",
      description: "Configured derived skill.",
      costValue: "7"
    });

    const body = characterDraftToBody({
      ...draft,
      slug: "aemeath",
      sortOrder: "1",
      skill: {
        ...draft.skill,
        uses: "1",
        costValue: "0",
        derivedSkills: [{
          ...draft.skill.derivedSkills[0],
          name: "远航星",
          description: "New copy.",
          costValue: "5"
        }]
      }
    });

    expect(JSON.parse(body.skill.paramsJson).derivedSkills[0]).toMatchObject({
      effectType: "voyage-star",
      name: "远航星",
      description: "New copy.",
      costValue: "5"
    });
  });

  it("prefers the admin paramsJson payload when the compatibility params object is empty", () => {
    const draft = buildCharacterDraft({
      id: "aemeath",
      name: "Aemeath",
      portrait: "/assets/Aemeath_centered.webp",
      skill: {
        effectType: "hidden-hand",
        name: "Little Ai",
        description: "Hidden hand.",
        params: {},
        paramsJson: JSON.stringify({
          derivedSkills: [{
            id: "voyage-star",
            effectType: "voyage-star",
            name: "Admin Voyage Star",
            description: "Admin copy.",
            costType: "numeric",
            costValue: "8"
          }]
        })
      }
    });

    expect(draft.skill.derivedSkills[0]).toMatchObject({
      name: "Admin Voyage Star",
      description: "Admin copy.",
      costValue: "8"
    });
  });

  it("round-trips code-defined non-Aemeath derived content without changing its logic", () => {
    const draft = buildCharacterDraft({
      id: "future-character",
      name: "Future Character",
      portrait: "/assets/future.webp",
      skill: {
        effectType: "erase-point",
        name: "Base",
        description: "Base skill.",
        params: {
          derivedSkills: [{
            id: "future-slash",
            effectType: "row-slash",
            name: "Future Slash",
            description: "Old copy.",
            uses: 2,
            freeTurn: false,
            targetRule: "any-point",
            costType: "numeric",
            costValue: "2",
            musicTrackId: "future-track"
          }]
        }
      }
    });
    draft.sortOrder = "1";
    draft.skill.uses = "1";
    draft.skill.costValue = "0";
    draft.skill.derivedSkills[0].name = "Renamed Slash";
    draft.skill.derivedSkills[0].description = "New copy.";
    draft.skill.derivedSkills[0].costValue = "4";

    const body = characterDraftToBody(draft);

    expect(JSON.parse(body.skill.paramsJson).derivedSkills[0]).toEqual({
      id: "future-slash",
      effectType: "row-slash",
      name: "Renamed Slash",
      description: "New copy.",
      uses: 2,
      freeTurn: false,
      targetRule: "any-point",
      costType: "numeric",
      costValue: "4",
      musicTrackId: "future-track"
    });
  });

  it("rejects invalid derived skill overclock when serializing character drafts", () => {
    const draft = {
      ...emptyCharacterDraft(),
      slug: "aemeath",
      name: "Aemeath",
      description: "Aemeath description",
      portraitUrl: "/assets/Aemeath_centered.webp",
      sortOrder: "1",
      skill: {
        ...emptyCharacterDraft().skill,
        effectType: "hidden-hand",
        targetRule: "empty-point",
        name: "Little Ai",
        description: "Hidden hand.",
        uses: "1",
        costValue: "0",
        derivedSkills: [{
          effectType: "voyage-star",
          name: "远航星",
          description: "Derived.",
          costValue: "five"
        }]
      }
    };

    expect(characterDraftToBody(draft)).toBeNull();
  });

  it("validates shop and decoration drafts", () => {
    expect(emptyShopItemDraft().illustName).toBe("");
    expect(emptyShopItemDraft().illustUrl).toBe("");
    const shop = buildShopItemDraft({
      name: "Danea",
      targetId: "danea",
      priceCoins: "100",
      discountPercent: "20",
      sortOrder: "1",
      illustName: "  Artist  ",
      illustUrl: "/credits/artist"
    });
    const validated = validateShopItemDraft(shop);

    expect(validated.ok).toBe(true);
    expect(validated.value.priceCoins).toBe(100);
    expect(validated.value.discountPercent).toBe(20);
    expect(validated.value.illustName).toBe("Artist");
    expect(validated.value.illustUrl).toBe("/credits/artist");
    expect(shopCategoryLabel("decoration")).toBe("装饰");
    expect(shopCategoryLabel("item")).toBe("道具");
    expect(validateShopItemDraft({ ...shop, discountPercent: "101" }).ok).toBe(false);
    expect(validateShopItemDraft({ ...shop, illustUrl: "javascript:alert(1)" }).ok).toBe(false);
    expect(validateShopItemDraft({ ...shop, illustName: "", illustUrl: "https://example.com/artist" }).ok).toBe(false);

    expect(decorationDraftToBody(buildDecorationDraft({
      slug: "moon-frame",
      name: "Moon Frame",
      sortOrder: "1"
    }))).toMatchObject({ slug: "moon-frame", sortOrder: 1 });
  });

  it("parses only safe Prisma integers", () => {
    expect(parseAdminInteger("42")).toBe(42);
    expect(parseAdminInteger("1.5")).toBeNull();
    expect(parseAdminInteger("2147483648")).toBeNull();
  });

  it("allows gacha pool drafts without a featured prize", () => {
    const emptyDraft = emptyGachaPoolDraft();
    expect(emptyDraft.featuredPrizeIndex).toBeNull();
    expect(emptyDraft.featuredPrizeIndexes).toEqual([]);

    const draft = buildGachaPoolDraft({
      ...emptyDraft,
      name: "Prize Board",
      featuredPrizeId: null,
      prizes: [
        { id: "prize-1", type: "coins", targetId: "", quantity: "60", probabilityBasisPoints: "10000", enabled: true, name: "Coins" }
      ]
    });

    const body = gachaPoolDraftToBody(draft);

    expect(draft.featuredPrizeIndex).toBeNull();
    expect(draft.featuredPrizeIndexes).toEqual([]);
    expect(body.featuredPrizeIndex).toBeNull();
    expect(body.featuredPrizeIndexes).toEqual([]);
  });

  it("serializes multiple gacha featured prize indexes", () => {
    const draft = buildGachaPoolDraft({
      name: "Prize Board",
      featuredPrizeIds: ["prize-1", "prize-3"],
      prizes: [
        { id: "prize-1", type: "character", targetId: "denia", quantity: "1", probabilityBasisPoints: "5000", enabled: true, name: "Danea" },
        { id: "prize-2", type: "coins", targetId: "", quantity: "60", probabilityBasisPoints: "3000", enabled: true, name: "Coins" },
        { id: "prize-3", type: "decoration", targetId: "paw-stone", quantity: "1", probabilityBasisPoints: "2000", enabled: true, name: "Paw" }
      ]
    });

    const body = gachaPoolDraftToBody(draft);

    expect(draft.featuredPrizeIndexes).toEqual([0, 2]);
    expect(body.featuredPrizeIndexes).toEqual([0, 2]);
    expect(body.featuredPrizeIndex).toBe(0);
  });
});
