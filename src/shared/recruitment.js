export const RECRUITMENT_ITEM_TYPES = Object.freeze({
  campusPoster: "campus-recruitment-poster",
  radioTicket: "radio-recruitment-ticket"
});

export const RECRUITMENT_ITEMS = Object.freeze({
  [RECRUITMENT_ITEM_TYPES.campusPoster]: Object.freeze({
    itemType: RECRUITMENT_ITEM_TYPES.campusPoster,
    name: "招新贴报",
    scopeLabel: "可以招募学院内的人",
    description: "贴在学院公告栏上的围棋部招新贴报，可以招募学院内的人。",
    imageUrl: "/assets/items/recruitment-poster.svg",
    sortOrder: 120,
    priceCoins: 120,
    candidates: Object.freeze(["lynae", "mornye", "chisa"])
  }),
  [RECRUITMENT_ITEM_TYPES.radioTicket]: Object.freeze({
    itemType: RECRUITMENT_ITEM_TYPES.radioTicket,
    name: "先约电台广播券",
    scopeLabel: "可以招募学院外的人",
    description: "给先约电台的广播券，可以招募学院外的人。",
    imageUrl: "/assets/items/radio-recruitment-ticket.svg",
    sortOrder: 121,
    priceCoins: 180,
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
  })
});

export function isRecruitmentItemType(itemType) {
  return RECRUITMENT_ITEM_TYPE_SET.has(String(itemType ?? ""));
}

export function recruitmentItemForType(itemType) {
  return RECRUITMENT_ITEMS[String(itemType ?? "")] ?? null;
}
