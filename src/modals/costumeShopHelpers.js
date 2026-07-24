export const COSTUME_BATCH_SIZE = 5;
export const COSTUME_REFRESH_COOLDOWN_MS = 3000;

export const COSTUME_MASCOT_IMAGES = {
  greeting: "/assets/costumes/nivora-greeting.webp",
  thanks: "/assets/costumes/nivora-thanks.webp",
  empty: "/assets/costumes/nivora-empty.webp"
};

export const COSTUME_GREETING_LINES = [
  "欢迎。想给谁挑一身新衣服？",
  "舞台已经准备好了，来看看今天的服装吧。",
  "喜欢哪套就点开看看，别只站在门口。",
  "残星会的衣柜可不止你眼前这些。"
];

export const COSTUME_REFRESH_LINES = [
  "换了一批。你最好能挑中一件。",
  "衣架重新排过了，再看看吧。",
  "幕布拉开——这次有中意的吗？"
];

export const COSTUME_EMPTY_LINE = "暂时没有新的服装了。";
export const COSTUME_LOADING_LINE = "稍等，我正在整理衣架。";
export const COSTUME_ERROR_LINE = "衣架好像卡住了，再试一次。";
export const COSTUME_THANKS_LINE = "谢谢惠顾。";
export const COSTUME_INSUFFICIENT_LINE = "你是来找茬的吧？";

export function pickCostumeLine(lines = COSTUME_GREETING_LINES, random = Math.random) {
  return lines[Math.floor(random() * lines.length)] ?? lines[0] ?? "";
}

export function eligibleCostumes(costumes = []) {
  return costumes.filter((costume) => costume.enabled !== false && costume.shopVisible && !costume.owned);
}

export function selectCostumeBatch(costumes = [], previousIds = [], random = Math.random) {
  const candidates = eligibleCostumes(costumes);
  const previous = new Set(previousIds);
  const fresh = candidates.filter((costume) => !previous.has(costume.id));
  const source = fresh.length >= Math.min(COSTUME_BATCH_SIZE, candidates.length)
    ? fresh
    : candidates;
  const purchasable = shuffle(source.filter((costume) => costume.characterOwned), random);
  const locked = shuffle(source.filter((costume) => !costume.characterOwned), random);
  return [...purchasable, ...locked].slice(0, COSTUME_BATCH_SIZE);
}

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
