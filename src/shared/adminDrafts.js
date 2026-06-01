import { DEFAULT_SKILL_SYSTEM_MESSAGE } from "./skillMessages.js";

export function emptyCharacterDraft() {
  return {
    dbId: "",
    originalSlug: "",
    slug: "",
    name: "",
    portraitUrl: "",
    portraitSource: "url",
    acquisitionMethod: "",
    palette: "#5d7fe8",
    enabled: true,
    sortOrder: 0,
    skill: {
      effectType: "erase-point",
      name: "",
      description: "",
      uses: 1,
      freeTurn: false,
      targetRule: "empty-point",
      paramsJson: "{}",
      costType: "numeric",
      costValue: "0",
      systemMessage: DEFAULT_SKILL_SYSTEM_MESSAGE,
      enabled: true
    }
  };
}

export function buildCharacterDraft(character) {
  const skill = character.skill ?? {};
  return {
    dbId: character.dbId ?? "",
    originalSlug: character.id ?? "",
    slug: character.id ?? "",
    name: character.name ?? "",
    portraitUrl: character.portrait ?? "",
    portraitSource: character.portraitSource ?? "url",
    acquisitionMethod: character.acquisitionMethod ?? "",
    palette: character.palette ?? "#5d7fe8",
    enabled: character.enabled ?? true,
    sortOrder: character.sortOrder ?? 0,
    skill: {
      effectType: skill.effectType ?? "erase-point",
      name: skill.name ?? "",
      description: skill.description ?? "",
      uses: skill.uses ?? 1,
      freeTurn: skill.freeTurn ?? false,
      targetRule: skill.targetRule ?? targetRuleForEffect(skill.effectType ?? "erase-point"),
      paramsJson: skill.paramsJson ?? JSON.stringify(skill.params ?? {}),
      costType: skill.costType ?? "numeric",
      costValue: String(skill.costValue ?? skill.cost ?? 0),
      systemMessage: skill.systemMessage ?? DEFAULT_SKILL_SYSTEM_MESSAGE,
      enabled: skill.enabled ?? true
    }
  };
}

export function characterDraftToBody(draft) {
  const sortOrder = parseAdminInteger(draft.sortOrder);
  const uses = parseAdminInteger(draft.skill.uses);
  if (sortOrder == null || uses == null || uses < 0 || uses > 9) return null;
  const costType = draft.skill.costType === "special" ? "special" : "numeric";
  const costValue = String(draft.skill.costValue ?? "").trim();
  if (costType === "numeric" && !/^-?\d+(\.\d+)?$/.test(costValue)) return null;
  if (costType === "special" && !costValue) return null;
  return {
    slug: draft.slug.trim(),
    name: draft.name.trim(),
    portraitUrl: draft.portraitUrl.trim(),
    portraitSource: draft.portraitSource,
    acquisitionMethod: String(draft.acquisitionMethod ?? "").trim(),
    palette: draft.palette,
    enabled: Boolean(draft.enabled),
    sortOrder,
    skill: {
      effectType: draft.skill.effectType,
      name: draft.skill.name.trim(),
      description: draft.skill.description.trim(),
      uses,
      freeTurn: Boolean(draft.skill.freeTurn),
      targetRule: draft.skill.targetRule,
      paramsJson: draft.skill.paramsJson,
      costType,
      costValue,
      systemMessage: draft.skill.systemMessage.trim(),
      enabled: Boolean(draft.skill.enabled)
    }
  };
}

export function emptyShopItemDraft() {
  return {
    id: "",
    name: "",
    category: "character",
    targetId: "",
    itemTargetType: "self",
    stockQuantity: -1,
    priceCoins: 100,
    discountPercent: 0,
    purchasable: true,
    enabled: true,
    sortOrder: 0,
    description: "",
    imageUrl: ""
  };
}

export function buildShopItemDraft(item) {
  return { ...emptyShopItemDraft(), ...item };
}

export function validateShopItemDraft(draft) {
  const priceCoins = parseAdminInteger(draft.priceCoins);
  const discountPercent = parseAdminInteger(draft.discountPercent);
  const sortOrder = parseAdminInteger(draft.sortOrder);
  const stockQuantity = parseAdminInteger(draft.stockQuantity);
  const errors = [];
  if (!draft.name.trim()) errors.push("商品名");
  if (!draft.targetId.trim()) errors.push("目标标识");
  if (priceCoins == null || priceCoins < 0) errors.push("金币价格必须是 0 或更大的整数");
  if (discountPercent == null || discountPercent < 0 || discountPercent > 100) errors.push("折扣必须是 0 到 100 的整数");
  if (sortOrder == null) errors.push("排序必须是整数");
  if (stockQuantity == null || stockQuantity < -1) errors.push("库存必须是 -1 或 0 以上整数");
  if (errors.length) {
    return { ok: false, error: `请检查：${errors.join("、")}` };
  }
  return {
    ok: true,
    value: {
      name: draft.name.trim(),
      category: draft.category,
      targetId: draft.targetId.trim(),
      itemTargetType: draft.itemTargetType === "character" ? "character" : "self",
      stockQuantity,
      priceCoins,
      discountPercent,
      purchasable: Boolean(draft.purchasable),
      enabled: Boolean(draft.enabled),
      sortOrder,
      description: draft.description.trim(),
      imageUrl: draft.imageUrl.trim()
    }
  };
}

export function emptyDecorationDraft() {
  return { id: "", slug: "", name: "", description: "", imageUrl: "", enabled: true, sortOrder: 0 };
}

export function buildDecorationDraft(decoration) {
  return { ...emptyDecorationDraft(), ...decoration };
}

export function decorationDraftToBody(draft) {
  const sortOrder = parseAdminInteger(draft.sortOrder);
  if (!draft.slug.trim() || !draft.name.trim() || sortOrder == null) return null;
  return {
    slug: draft.slug.trim(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    imageUrl: draft.imageUrl.trim(),
    enabled: Boolean(draft.enabled),
    sortOrder
  };
}

export function shopCategoryLabel(category) {
  if (category === "decoration") return "装饰";
  if (category === "item") return "道具";
  return "角色";
}

export function targetRuleForEffect(effectType) {
  if (effectType === "flip-stone") return "stone";
  if (effectType === "random-blast") return "none";
  if (effectType === "color-illusion-passive") return "none";
  return "empty-point";
}

export function parseAdminInteger(value) {
  const text = String(value ?? "").trim();
  if (!/^-?\d+$/.test(text)) return null;
  const number = Number(text);
  if (!Number.isSafeInteger(number)) return null;
  if (number < -2147483648 || number > 2147483647) return null;
  return number;
}
