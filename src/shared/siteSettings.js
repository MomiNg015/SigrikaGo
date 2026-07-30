import { defaultRatingRulesJson } from "./ratingRules.js";
import { irisGreetingsSettingJson } from "./irisGreeting.js";
import { irisLinksSettingJson } from "./irisLinks.js";
import { shopMascotDialoguesSettingJson } from "./shopMascotDialogues.js";

export const DEFAULT_SITE_SETTINGS = {
  homeTitle: "星炬学院围棋部",
  homeVersion: "v0.1.0",
  homeSubtitle: "连罗伊人的都爱玩的智力游戏",
  aboutText: "星炬学院围棋部是一间面向幻想对局的棋舍。这里使用 13 路棋盘、中国数子规则，并保留角色技能、装饰和语音等扩展空间。",
  footerText: "星炬学院围棋部\nCopyright ©KURO GAMES. ALL RIGHTS RESERVED.\n浙ICP备2026035038号",
  preloadTips: "露露米是一只小猪\n因为使用数子规则，建议下完单官再申请数目哦~\n在对局中需要判断形势时，可以粗略以“实空+提子数+除子数-超频数*2”来判断双方的目数。\n禁止互相刷棋上分哦~GM会看后台的。",
  characterLoadingLines: "sigrika=西格莉卡正在戳棋盘\nmornye=莫宁正在校准协议光束\nchangli=长离正在点燃棋盘\nlynae=琳奈正在摇匀颜料\nnabomo=娜波摩正在调试幻色棋盘",
  shopMascotDialogues: shopMascotDialoguesSettingJson(),
  irisGreeting: irisGreetingsSettingJson(),
  irisLinks: irisLinksSettingJson(),
  skillEffectsEnabled: true,
  ratingRules: defaultRatingRulesJson()
};
