import { DEFAULT_SKILL_SYSTEM_MESSAGE } from "./skillMessages.js";
import { skillEffectTargetRule } from "./skillEffectCatalog.js";

export function emptyCharacterDraft() {
  return {
    dbId: "",
    originalSlug: "",
    slug: "",
    name: "",
    description: "",
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
    description: character.description ?? "",
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
    description: String(draft.description ?? "").trim(),
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

export function emptyGachaPrizeDraft() {
  return {
    id: "",
    type: "character",
    targetId: "",
    quantity: 1,
    probabilityBasisPoints: 10000,
    enabled: true,
    name: "",
    imageUrl: "",
    sortOrder: 0
  };
}

export function emptyGachaPoolDraft() {
  return {
    id: "",
    name: "",
    description: "",
    enabled: true,
    permanent: true,
    startsAt: "",
    endsAt: "",
    singleDrawPrice: 50,
    tenDrawPrice: 500,
    featuredPrizeIndex: null,
    featuredPrizeIndexes: [],
    sortOrder: 0,
    prizes: [emptyGachaPrizeDraft()]
  };
}

export function buildGachaPoolDraft(pool = {}) {
  const prizes = (pool.prizes?.length ? pool.prizes : [emptyGachaPrizeDraft()]).map((prize, index) => ({
    ...emptyGachaPrizeDraft(),
    ...prize,
    sortOrder: prize.sortOrder ?? index
  }));
  const featuredPrizeIndexes = featuredPrizeIdsFromPool(pool)
    .map((id) => prizes.findIndex((prize) => prize.id && prize.id === id))
    .filter((index, position, indexes) => index >= 0 && indexes.indexOf(index) === position);
  return {
    ...emptyGachaPoolDraft(),
    ...pool,
    startsAt: toInputDateTime(pool.startsAt),
    endsAt: toInputDateTime(pool.endsAt),
    featuredPrizeIndex: featuredPrizeIndexes[0] ?? null,
    featuredPrizeIndexes,
    prizes
  };
}

export function gachaPoolDraftToBody(draft) {
  const singleDrawPrice = parseAdminInteger(draft.singleDrawPrice);
  const tenDrawPrice = parseAdminInteger(draft.tenDrawPrice);
  const sortOrder = parseAdminInteger(draft.sortOrder);
  const featuredPrizeIndexes = normalizeFeaturedPrizeIndexes(draft);
  const featuredPrizeIndex = featuredPrizeIndexes[0] ?? null;
  const errors = [];
  if (!String(draft.name ?? "").trim()) errors.push("扭蛋池名称");
  if (singleDrawPrice == null || singleDrawPrice <= 0) errors.push("单抽价格必须是正整数");
  if (tenDrawPrice == null || tenDrawPrice <= 0) errors.push("十连价格必须是正整数");
  if (sortOrder == null) errors.push("排序必须是整数");
  const prizes = (draft.prizes ?? []).map((prize, index) => gachaPrizeDraftToBody(prize, index, errors)).filter(Boolean);
  if (!prizes.length) errors.push("至少一个奖项");
  if (featuredPrizeIndexes.some((index) => index < 0 || index >= prizes.length)) errors.push("大奖索引无效");
  if (errors.length) return null;
  return {
    name: String(draft.name).trim(),
    description: String(draft.description ?? "").trim(),
    enabled: Boolean(draft.enabled),
    permanent: Boolean(draft.permanent),
    startsAt: draft.permanent ? null : draft.startsAt,
    endsAt: draft.permanent ? null : draft.endsAt,
    singleDrawPrice,
    tenDrawPrice,
    sortOrder,
    featuredPrizeIndex,
    featuredPrizeIndexes,
    prizes
  };
}

export function gachaTypeLabel(type) {
  if (type === "decoration") return "装饰";
  if (type === "item") return "道具";
  if (type === "music") return "音乐";
  if (type === "coins") return "金币";
  return "角色";
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
  if (category === "music") return "闊充箰";
  if (category === "decoration") return "装饰";
  if (category === "item") return "道具";
  return "角色";
}

export function targetRuleForEffect(effectType) {
  return skillEffectTargetRule(effectType, "empty-point");
}

function gachaPrizeDraftToBody(prize, index, errors) {
  const quantity = parseAdminInteger(prize.quantity);
  const probabilityBasisPoints = parseAdminInteger(prize.probabilityBasisPoints);
  const sortOrder = parseAdminInteger(prize.sortOrder ?? index);
  if (!["character", "decoration", "item", "music", "coins"].includes(prize.type)) errors.push("奖项类型无效");
  if (prize.type !== "coins" && !String(prize.targetId ?? "").trim()) errors.push("奖项资源标识");
  if (quantity == null || quantity <= 0) errors.push("奖项数量必须是正整数");
  if (probabilityBasisPoints == null || probabilityBasisPoints < 0 || probabilityBasisPoints > 10000) errors.push("概率必须是 0-10000");
  if (sortOrder == null) errors.push("奖项排序必须是整数");
  if (errors.length) return null;
  return {
    type: prize.type,
    targetId: prize.type === "coins" ? "" : String(prize.targetId).trim(),
    quantity,
    probabilityBasisPoints,
    enabled: Boolean(prize.enabled),
    name: String(prize.name ?? "").trim(),
    imageUrl: String(prize.imageUrl ?? "").trim(),
    sortOrder
  };
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function featuredPrizeIdsFromPool(pool = {}) {
  const ids = [];
  if (Array.isArray(pool.featuredPrizeIds)) {
    ids.push(...pool.featuredPrizeIds);
  } else if (typeof pool.featuredPrizeIds === "string" && pool.featuredPrizeIds.trim()) {
    try {
      const parsed = JSON.parse(pool.featuredPrizeIds);
      if (Array.isArray(parsed)) ids.push(...parsed);
    } catch {
      ids.push(...pool.featuredPrizeIds.split(","));
    }
  }
  if (Array.isArray(pool.featuredPrizes)) {
    ids.push(...pool.featuredPrizes.map((prize) => prize?.id));
  }
  if (pool.featuredPrizeId) ids.push(pool.featuredPrizeId);
  return [...new Set(ids.map((id) => String(id ?? "").trim()).filter(Boolean))];
}

function normalizeFeaturedPrizeIndexes(draft = {}) {
  const rawIndexes = Array.isArray(draft.featuredPrizeIndexes)
    ? draft.featuredPrizeIndexes
    : (draft.featuredPrizeIndex == null || draft.featuredPrizeIndex === "" ? [] : [draft.featuredPrizeIndex]);
  const indexes = [];
  for (const rawIndex of rawIndexes) {
    const index = parseAdminInteger(rawIndex);
    if (index == null || indexes.includes(index)) continue;
    indexes.push(index);
  }
  return indexes;
}

export function parseAdminInteger(value) {
  const text = String(value ?? "").trim();
  if (!/^-?\d+$/.test(text)) return null;
  const number = Number(text);
  if (!Number.isSafeInteger(number)) return null;
  if (number < -2147483648 || number > 2147483647) return null;
  return number;
}
