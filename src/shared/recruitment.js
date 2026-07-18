import { AEMEATH_CHARACTER_ID } from "./aemeathAcquisition.js";

export const RECRUITMENT_ITEM_TYPES = Object.freeze({
  campusPoster: "campus-recruitment-poster",
  aemeathMemorialTicket: "aemeath-flight-snow-memorial-ticket",
  radioTicket: "radio-recruitment-ticket"
});

export const RECRUITMENT_NO_CANDIDATE_MESSAGE = "好像已经没有可以用该道具招募的角色了";

export const RECRUITMENT_CINEMATIC_IDS = Object.freeze({
  aemeathArrival: "aemeath-flight-snow-arrival"
});

export const AEMEATH_RECRUITMENT_TIMING = Object.freeze({
  taskDurationMs: 11_250,
  theatricalCountdownMs: 999 * 60 * 1000,
  darkenAtMs: 0,
  flightAtMs: 3_200,
  hoverAtMs: 5_200,
  glowAtMs: 5_800,
  concealedSwapAtMs: 6_250,
  unlockAtMs: 7_050
});

export const RECRUITMENT_READY_SETTLEMENT_BUFFER_MS = 400;

export function recruitmentReadyDelayMs(task, now = Date.now(), readyAt = task?.readyAt) {
  const remainingMs = new Date(readyAt).getTime() - now;
  return Math.max(0, Number.isFinite(remainingMs) ? remainingMs : 0)
    + RECRUITMENT_READY_SETTLEMENT_BUFFER_MS;
}

export function cinematicPresentationReadyAt(task, now = Date.now()) {
  if (!task?.cinematic || task.status !== "pending") return "";
  return new Date(now + AEMEATH_RECRUITMENT_TIMING.taskDurationMs).toISOString();
}

export const AEMEATH_RECRUITMENT_ASSET_SLOTS = Object.freeze({
  ticketImageUrl: "/assets/items/aemeath-flight-snow-memorial-ticket.webp",
  cinematicSpriteUrl: "/assets/Aemeath_centered.webp",
  cinematicSpriteSheetUrl: "/assets/recruitment/aemeath-pink-cyber-angel-spritesheet.webp",
  flightSoundUrl: "",
  flashSoundUrl: "/assets/music/aemeath-recruitment-full-white-burst.ogg"
});

export const RECRUITMENT_ITEMS = Object.freeze({
  [RECRUITMENT_ITEM_TYPES.campusPoster]: Object.freeze({
    itemType: RECRUITMENT_ITEM_TYPES.campusPoster,
    name: "招新贴报",
    scopeLabel: "可以招募学院内的人",
    description: "贴在学院公告栏上的围棋部招新贴报，可以招募学院内的人。",
    imageUrl: "/assets/items/recruitment-poster.webp",
    staleImageUrls: Object.freeze(["/assets/items/recruitment-poster.svg"]),
    sortOrder: 120,
    priceCoins: 120,
    playerShopAvailability: "available",
    catalogVisibility: "always",
    resultMode: "probability",
    configurableProbability: true,
    candidates: Object.freeze(["lynae", "mornye", "chisa"])
  }),
  [RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket]: Object.freeze({
    itemType: RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket,
    name: "飞行雪绒纪念券",
    scopeLabel: "回应飞行雪绒歌友会的特别招募",
    description: "从飞行雪绒歌友会那里收到的特殊的奖品。上面的儿童画是怎么一回事呢？",
    imageUrl: AEMEATH_RECRUITMENT_ASSET_SLOTS.ticketImageUrl,
    staleImageUrls: Object.freeze([]),
    sortOrder: 121,
    priceCoins: 0,
    playerShopAvailability: "hidden",
    catalogVisibility: "owned-only",
    resultMode: "fixed",
    configurableProbability: false,
    fixedResultCharacterId: AEMEATH_CHARACTER_ID,
    candidates: Object.freeze([AEMEATH_CHARACTER_ID]),
    durationMs: AEMEATH_RECRUITMENT_TIMING.taskDurationMs,
    cinematicId: RECRUITMENT_CINEMATIC_IDS.aemeathArrival,
    theatricalCountdownMs: AEMEATH_RECRUITMENT_TIMING.theatricalCountdownMs,
    appearanceId: "aemeath-holographic-ticket",
    resultText: "爱弥斯，回应粉丝的期待，闪亮登台！嗯？是想让我加入围棋部吗？哼哼哼，也好，就让你们见识一下我的实力吧！",
    assetSlots: AEMEATH_RECRUITMENT_ASSET_SLOTS
  }),
  [RECRUITMENT_ITEM_TYPES.radioTicket]: Object.freeze({
    itemType: RECRUITMENT_ITEM_TYPES.radioTicket,
    name: "先约电台广播券",
    scopeLabel: "可以招募学院外的人",
    description: "给先约电台的广播券，可以招募学院外的人。",
    imageUrl: "/assets/items/radio-recruitment-ticket.webp",
    staleImageUrls: Object.freeze(["/assets/items/radio-recruitment-ticket.svg"]),
    sortOrder: 122,
    priceCoins: 180,
    playerShopAvailability: "available",
    catalogVisibility: "always",
    resultMode: "probability",
    configurableProbability: true,
    candidates: Object.freeze(["qiuyuan", "changli"])
  })
});

export const RECRUITMENT_ITEM_TYPE_SET = new Set(Object.keys(RECRUITMENT_ITEMS));

export const DEFAULT_RECRUITMENT_CONFIG = Object.freeze({
  durationMs: 5 * 60 * 1000,
  successRates: Object.freeze([50, 75, 100]),
  confidenceTexts: Object.freeze([
    "回应还不算稳，先把招新说明写清楚。",
    "已经有人认真看了招新信息，可以再等一等。",
    "这次回应很明确，基本可以准备迎新了。"
  ]),
  noResponseTexts: Object.freeze({
    [RECRUITMENT_ITEM_TYPES.campusPoster]: Object.freeze([
      "公告栏前人来人往，但这次还没有人把名字写到申请表上。",
      "贴报被认真看过了，只是暂时没有收到入部回应。"
    ]),
    [RECRUITMENT_ITEM_TYPES.radioTicket]: Object.freeze([
      "广播已经播出去了，不过这次没有收到明确回信。",
      "电台那边帮忙念完了招新词，暂时还没人约时间到部室。"
    ])
  }),
  successTexts: Object.freeze({
    lynae: "琳奈带着一盒彩色颜料走进部室，说想看看这里的棋盘会不会发光。",
    mornye: "莫宁把申请表夹进文件夹，冷静地说可以从今天开始试部。",
    chisa: "千咲站在门口确认了活动时间，然后认真地写下了自己的名字。",
    qiuyuan: "仇远收到广播后准时出现，只说了一句：棋盘在哪里？",
    changli: "长离循着广播找来，笑着问围棋部还缺不缺一个后手专家。"
  }),
  fixedItemTexts: Object.freeze({
    [RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket]: Object.freeze({
      scopeLabel: RECRUITMENT_ITEMS[RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket].scopeLabel,
      resultText: RECRUITMENT_ITEMS[RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket].resultText
    })
  })
});

export function isRecruitmentItemType(itemType) {
  return RECRUITMENT_ITEM_TYPE_SET.has(String(itemType ?? ""));
}

export function recruitmentItemForType(itemType) {
  return RECRUITMENT_ITEMS[String(itemType ?? "")] ?? null;
}

export function recruitmentItemImageUrlForType(itemType, fallback = "") {
  return recruitmentItemForType(itemType)?.imageUrl ?? String(fallback ?? "");
}

export function probabilityRecruitmentItems() {
  return Object.values(RECRUITMENT_ITEMS).filter((item) => item.configurableProbability !== false);
}

export function fixedRecruitmentItems() {
  return Object.values(RECRUITMENT_ITEMS).filter((item) => item.resultMode === "fixed");
}

export function isPlayerShopRecruitmentItem(itemType) {
  const item = recruitmentItemForType(itemType);
  return Boolean(item && item.playerShopAvailability !== "hidden");
}
