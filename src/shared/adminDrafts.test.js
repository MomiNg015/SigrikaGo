import { describe, expect, it } from "vitest";
import { DEFAULT_SKILL_SYSTEM_MESSAGE } from "./skillMessages.js";
import {
  buildCharacterDraft,
  buildDecorationDraft,
  buildShopItemDraft,
  characterDraftToBody,
  decorationDraftToBody,
  emptyCharacterDraft,
  parseAdminInteger,
  shopCategoryLabel,
  targetRuleForEffect,
  validateShopItemDraft
} from "./adminDrafts.js";

describe("admin draft helpers", () => {
  it("builds character drafts with safe skill defaults", () => {
    expect(emptyCharacterDraft().skill.systemMessage).toBe(DEFAULT_SKILL_SYSTEM_MESSAGE);
    expect(targetRuleForEffect("flip-stone")).toBe("stone");
    expect(targetRuleForEffect("erase-point")).toBe("empty-point");

    const draft = buildCharacterDraft({
      id: "danea",
      dbId: "character-1",
      name: "Danea",
      portrait: "/assets/danea.png",
      acquisitionMethod: "商城购买",
      skill: { effectType: "flip-stone", params: { radius: 1 } }
    });

    expect(draft.slug).toBe("danea");
    expect(draft.acquisitionMethod).toBe("商城购买");
    expect(draft.skill.targetRule).toBe("stone");
    expect(draft.skill.paramsJson).toBe("{\"radius\":1}");
    expect(targetRuleForEffect("random-blast")).toBe("none");
  });

  it("serializes valid character drafts and rejects invalid numeric fields", () => {
    const draft = {
      ...emptyCharacterDraft(),
      slug: "new-character",
      name: "New Character",
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
    expect(characterDraftToBody(draft).acquisitionMethod).toBe("商城购买");
    expect(characterDraftToBody({ ...draft, skill: { ...draft.skill, uses: "10" } })).toBeNull();
    expect(characterDraftToBody({ ...draft, skill: { ...draft.skill, costValue: "three" } })).toBeNull();
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

  it("validates shop and decoration drafts", () => {
    const shop = buildShopItemDraft({
      name: "Danea",
      targetId: "danea",
      priceCoins: "100",
      discountPercent: "20",
      sortOrder: "1"
    });
    const validated = validateShopItemDraft(shop);

    expect(validated.ok).toBe(true);
    expect(validated.value.priceCoins).toBe(100);
    expect(validated.value.discountPercent).toBe(20);
    expect(shopCategoryLabel("decoration")).toBe("装饰");
    expect(shopCategoryLabel("item")).toBe("道具");
    expect(validateShopItemDraft({ ...shop, discountPercent: "101" }).ok).toBe(false);

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
});
