import { DEFAULT_SHOP_MASCOT_DIALOGUES } from "../shared/shopMascotDialogues.js";

const DEFAULT_NABOMO_DIALOGUES = DEFAULT_SHOP_MASCOT_DIALOGUES.nabomo;

export const COSTUME_BATCH_SIZE = 5;
export const COSTUME_REFRESH_COOLDOWN_MS = 1000;

export const COSTUME_MASCOT_IMAGES = {
  greeting: "/assets/costumes/nivora-greeting.webp",
  thanks: "/assets/costumes/nivora-thanks.webp",
  empty: "/assets/costumes/nivora-empty.webp"
};

export const COSTUME_GREETING_LINES = [...DEFAULT_NABOMO_DIALOGUES.greetingLines];
export const COSTUME_REFRESH_LINES = [...DEFAULT_NABOMO_DIALOGUES.refreshLines];
export const COSTUME_EMPTY_LINE = DEFAULT_NABOMO_DIALOGUES.emptyLine;
export const COSTUME_LOADING_LINE = DEFAULT_NABOMO_DIALOGUES.loadingLine;
export const COSTUME_ERROR_LINE = DEFAULT_NABOMO_DIALOGUES.errorLine;
export const COSTUME_THANKS_LINE = DEFAULT_NABOMO_DIALOGUES.thanksLine;
export const COSTUME_INSUFFICIENT_LINE = DEFAULT_NABOMO_DIALOGUES.insufficientLine;

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
