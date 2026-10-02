export const SHOP_MASCOT_DIALOGUE_SETTING_KEY = "shopMascotDialogues";
export const MAX_MASCOT_DIALOGUE_LENGTH = 120;
export const MAX_MASCOT_DIALOGUE_POOL_SIZE = 12;

export const DEFAULT_SHOP_MASCOT_DIALOGUES = deepFreeze({
  zahira: {
    greetingLines: [
      "……我听见了。你在找能派上用场的东西，对吗？",
      "欢迎。请先随意看看，不必急着开口。",
      "你的心声像晨鸟一样热闹……是有什么，悄悄锁住你的目光了吗？"
    ],
    refreshLines: [
      "没有合心意的？请稍等，我再换一批。"
    ],
    loadingLine: "请稍等……我正在把它们一件件摆好。",
    emptyLine: "今天的货物都已有归处了。等下次集市再见吧。",
    errorLine: "……这一批货物没能顺利抵达。请再给我一点时间。",
    thanksLine: "请收好……看来，它也一直在等你。"
  },
  nabomo: {
    greetingLines: [
      "有兴趣加入残星会吗？什么，只是来看衣服的？好吧，随你。",
      "铛铛！此乃开幕之刻！",
      "今天想扮演谁呢？"
    ],
    refreshLines: [
      "不满意？那这些呢？",
      "真是个爱挑剔的客人呢。那看看这些吧。"
    ],
    loadingLine: "别急，我正在收拾房间。",
    emptyLine: "真不凑巧呢，今天没有能给你看的东西。",
    errorLine: "呃，锁孔卡住了。再重新试一次吧。",
    thanksLine: "嗯，还挺有眼光的。",
    insufficientLine: "你是来找茬的吧？"
  }
});

export function normalizeShopMascotDialogues(value) {
  const parsed = parseDialogueConfig(value);
  return {
    zahira: normalizeMascotConfig(parsed?.zahira, DEFAULT_SHOP_MASCOT_DIALOGUES.zahira),
    nabomo: normalizeMascotConfig(parsed?.nabomo, DEFAULT_SHOP_MASCOT_DIALOGUES.nabomo)
  };
}

export function shopMascotDialoguesFromSettings(settings = {}) {
  return normalizeShopMascotDialogues(settings?.[SHOP_MASCOT_DIALOGUE_SETTING_KEY]);
}

export function shopMascotDialoguesSettingJson(value = DEFAULT_SHOP_MASCOT_DIALOGUES) {
  return JSON.stringify(normalizeShopMascotDialogues(value), null, 2);
}

function normalizeMascotConfig(value, fallback) {
  return Object.fromEntries(
    Object.entries(fallback).map(([key, fallbackValue]) => (
      Array.isArray(fallbackValue)
        ? [key, normalizeDialoguePool(value?.[key], fallbackValue)]
        : [key, normalizeDialogueLine(value?.[key], fallbackValue)]
    ))
  );
}

function normalizeDialoguePool(value, fallback) {
  if (!Array.isArray(value)) return [...fallback];
  const lines = value
    .map((line) => normalizeDialogueLine(line, ""))
    .filter(Boolean)
    .slice(0, MAX_MASCOT_DIALOGUE_POOL_SIZE);
  return lines.length ? lines : [...fallback];
}

function normalizeDialogueLine(value, fallback) {
  const line = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MASCOT_DIALOGUE_LENGTH);
  return line || fallback;
}

function parseDialogueConfig(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function deepFreeze(value) {
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") deepFreeze(nested);
  }
  return Object.freeze(value);
}
