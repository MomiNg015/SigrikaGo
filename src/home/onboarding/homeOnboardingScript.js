import { applyAuthoredGuideExpression } from "../../shared/authoredGuideExpressions.js";

const say = (id, text, extra = {}) => ({ id, text, ...extra });
const action = (id, text, target, window) => say(id, text, { target, window, action: true });

export const HOME_ONBOARDING_STEPS = [
  say("hello", "对了，之前光聊围棋了，还没向你介绍我们围棋部呢。"),
  action("handbook", "这是你的部员手册，翻开来看看吧~", "handbook"),
  say("handbook-intro", "部员手册可以查看围棋部里现在有哪些部员，点击部员卡片可以查看相应部员的具体信息哦~", { window: "house", surface: ".house-modal" }),
  action("sigrika", "", "sigrika-card", "house"),
  say("skill", "看，在这里你能看到我的共鸣技能以及其它的所有信息。", { window: "house", surface: ".character-details-modal" }),
  say("know-members", "有空的时候也记得看看其它部员的哦。毕竟知己知彼方能百战百胜嘛。", { window: "house", surface: ".character-details-modal" }),
  action("match", "再回到我们棋盘前面，点击这个试试吧。", "match"),
  say("match-intro", "你可以在这里选择对局模式，选择模式后会自动帮你匹配选择了同一模式的在线玩家。匹配成功后就可以进行对局了哦。", { window: "matchModePicker", surface: ".match-mode-modal" }),
  say("practice", "嘿嘿，我们围棋部里还配置了准时宝机器人当陪练。虽然水平不怎么样，但是当你想熟悉部员技能或者星炬对弈模式，都可以找它练练手~", { window: "matchModePicker", target: "practice" }),
  action("resume", "再看看你的学生证吧~刚刚已经帮你登记进围棋部系统了。", "resume"),
  say("resume-intro", "这是你的围棋部履历，可以看到你在我们围棋部中的各种胜负、段位数据，还可以查看你的历史对局记录。", { window: "resume", surface: ".resume-modal" }),
  say("player-choice", "", { choice: "可是我看围棋部里好像只有你和达妮娅，其它部员呢？" }),
  say("new-club", "诶嘿嘿，其实我们围棋部才刚开张不久，还没来得及招新呢..."),
  action("recruitment", "不过我都想好办法了，点开这个看看吧。", "recruitment"),
  say("recruitment-intro", "铛铛，这就是我们的招募系统啦。我们可以准备招新物品来招募新部员。", { window: "recruitment", surface: ".recruitment-modal" }),
  say("recruitment-items", "目前来说，招募我们学院内的最好用招新海报，如果想找学院外的就只能通过电台广播来找啦。", { window: "recruitment", surface: ".recruitment-modal" }),
  say("recruitment-result", "使用了招募物品后，过一段时间就会有招募结果呢。可能一开始不太好招，但坚持下去相信总会吸引到新部员上门的！", { window: "recruitment", surface: ".recruitment-modal" }),
  say("recruitment-gift", "我过一会会准备一些招募物品发到你的邮箱，到时候记得查收哦。", { window: "recruitment", surface: ".recruitment-modal" }),
  action("shop", "不过我准备的招募物品数量有限...我先带你去扎希拉姐姐的商店吧。", "shop"),
  say("shop-intro", "这里就是扎希拉姐姐的商店了。在这里除了招募物品外，还可以买到其它各种小玩意儿哦~", { window: "shop", surface: ".shop-modal" }),
  say("shop-explore", "不过我就不一一介绍了，你可以自己再摸索一下。", { window: "shop", surface: ".shop-modal" }),
  action("mailbox", "你说邮箱在哪？嗯，这个应该在你的学生系统里的。我指给你看吧。", "mailbox"),
  say("mailbox-intro", "未来各种讯息、围棋部的奖励等等都会送到你的邮箱里哦~所以要记得定时查看一下。", { window: "mailbox", surface: ".mailbox-modal" }),
  say("goodbye", "嗯...我想应该介绍的差不多了。啊，差不多到上课的时间了，那我先走啦~拜拜~")
].map((step) => applyAuthoredGuideExpression({ ...step, characterId: "sigrika" }, "home.onboarding"));

export const HOME_ONBOARDING_WINDOWS = {
  house: "setShowHouse", matchModePicker: "setShowMatchModePicker", resume: "setShowResume",
  recruitment: "setShowRecruitment", shop: "setShowShop", mailbox: "setShowMailbox"
};
