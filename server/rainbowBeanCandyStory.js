import { canonicalCharacterId } from "../src/shared/characterAliases.js";

export const RAINBOW_BEAN_CANDY_REJECTION_PROBABILITY = 0.35;

export const RAINBOW_BEAN_CANDY_OUTCOMES = Object.freeze({
  accepted: "accepted",
  rejected: "rejected"
});

export const RAINBOW_BEAN_CANDY_STORY_START_NODE_IDS = Object.freeze({
  [RAINBOW_BEAN_CANDY_OUTCOMES.accepted]: "accepted-start",
  [RAINBOW_BEAN_CANDY_OUTCOMES.rejected]: "rejected-start"
});

const SUPPORTED_CHARACTER_IDS = new Set(["sigrika", "denia", "aemeath"]);

export function rollRainbowBeanCandyOutcome(characterId, random = Math.random) {
  if (!SUPPORTED_CHARACTER_IDS.has(canonicalCharacterId(characterId))) {
    return RAINBOW_BEAN_CANDY_OUTCOMES.accepted;
  }
  const value = Number(typeof random === "function" ? random() : random);
  const roll = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
  return roll < RAINBOW_BEAN_CANDY_REJECTION_PROBABILITY
    ? RAINBOW_BEAN_CANDY_OUTCOMES.rejected
    : RAINBOW_BEAN_CANDY_OUTCOMES.accepted;
}

export function selectRainbowBeanCandyStoryBranch(script, outcome) {
  if (!script) return null;
  const startNodeId = RAINBOW_BEAN_CANDY_STORY_START_NODE_IDS[outcome];
  if (!startNodeId || !(script.nodes ?? []).some((node) => node.id === startNodeId)) return script;
  return { ...script, startNodeId };
}

export function defaultRainbowBeanCandyStoryDraft(characterId) {
  const canonicalId = canonicalCharacterId(characterId);
  if (canonicalId === "sigrika") return sigrikaStoryDraft();
  if (canonicalId === "denia") return deniaStoryDraft();
  if (canonicalId === "aemeath") return aemeathStoryDraft();
  return null;
}

function sigrikaStoryDraft() {
  return {
    startNodeId: RAINBOW_BEAN_CANDY_STORY_START_NODE_IDS.accepted,
    nodes: [
      choiceNode("accepted-start", "把彩虹豆豆跳跳糖递给西格莉卡", "accepted-admire"),
      characterNode("accepted-admire", "西格莉卡", "sigrika", "哇，好漂亮的糖！这些颜色像揉在一起的星光一样。", "accepted-agree", [
        option("要尝一颗吗？", "accepted-agree")
      ]),
      characterNode("accepted-agree", "西格莉卡", "sigrika", "嗯！闻起来甜甜的，那我就不客气啦。", "accepted-eat"),
      narrationNode("accepted-eat", "西格莉卡把糖果放进口中，开心地嚼了几下。", "accepted-taste"),
      characterNode("accepted-taste", "西格莉卡", "sigrika", "唔，味道还不错——嗝！", "accepted-hiccup"),
      characterNode("accepted-hiccup", "西格莉卡", "sigrika", "诶？嗝！怎么回......嗝！为什么嗝不下来呀！", "accepted-doctor", [
        option("你还好吗？", "accepted-doctor")
      ]),
      characterNode("accepted-doctor", "西格莉卡", "sigrika", "我、嗝没事！嗝！我先去找嗝医生看看！", "accepted-runs"),
      narrationNode("accepted-runs", "西格莉卡红着脸跑远了。等你抬头想叫住她时，她早已不见踪影。", "accepted-unavailable"),
      narrationNode("accepted-unavailable", "看来暂时不能找她下棋了。"),
      choiceNode("rejected-start", "把彩虹豆豆跳跳糖递给西格莉卡", "rejected-admire"),
      characterNode("rejected-admire", "西格莉卡", "sigrika", "哇，好漂亮的糖！是给我的吗？", "rejected-check"),
      characterNode("rejected-check", "西格莉卡", "sigrika", "……等等，这个包装上怎么连生产日期都没有？", "rejected-refuse", [
        option("吃一颗应该没关系吧？", "rejected-refuse")
      ]),
      characterNode("rejected-refuse", "西格莉卡", "sigrika", "不行不行！我今天还要陪大家下棋呢，万一又出现什么奇怪的副作用就糟了。", "rejected-doctor"),
      characterNode("rejected-doctor", "西格莉卡", "sigrika", "等陆医生检查过再说吧。放心，如果确认没问题，我会认真考虑吃一颗的！", "rejected-return"),
      narrationNode("rejected-return", "西格莉卡把糖果推了回来。看来今天没办法得逞了。")
    ]
  };
}

function deniaStoryDraft() {
  return {
    startNodeId: RAINBOW_BEAN_CANDY_STORY_START_NODE_IDS.accepted,
    nodes: [
      narrationNode("accepted-start", "达妮娅靠在椅背上，似乎已经睡着了。", "accepted-swallow", [
        option("偷偷把彩虹豆豆跳跳糖塞进达妮娅嘴里", "accepted-swallow")
      ]),
      characterNode("accepted-swallow", "达妮娅", "denia", "唔……咕咚。", "accepted-rays"),
      narrationNode("accepted-rays", "达妮娅迷迷糊糊地咽下糖果。下一秒，她猛然睁开双眼——彩虹射线同时从她的双眼和嘴巴里喷射而出！", "accepted-shock"),
      characterNode("accepted-shock", "达妮娅", "denia-rainbow-glow", "唔唔唔——？！", "accepted-accuse", [
        option("成功了！真的会喷彩虹诶！", "accepted-accuse")
      ]),
      characterNode("accepted-accuse", "达妮娅", "denia-rainbow-glow", "所以你早就知道会变成这样？！", "accepted-angry", [
        option("别动别动，让我再看清楚一点！", "accepted-angry")
      ]),
      characterNode("accepted-angry", "达妮娅", "denia-rainbow-glow", "{username}——！！", "accepted-chase"),
      narrationNode("accepted-chase", "达妮娅顶着三道乱晃的彩虹射线站了起来。在她爆发之前，还是赶紧溜了吧。"),
      narrationNode("rejected-start", "达妮娅靠在椅背上，似乎已经睡着了。", "rejected-warning", [
        option("偷偷把彩虹豆豆跳跳糖塞进达妮娅嘴里", "rejected-warning")
      ]),
      characterNode("rejected-warning", "达妮娅", "denia", "……不要趁别人睡着的时候往别人嘴里塞奇怪的东西。", "rejected-awake", [
        option("原来你醒着？", "rejected-awake")
      ]),
      characterNode("rejected-awake", "达妮娅", "denia", "本来没有。可是包装袋都快贴到我脸上了……", "rejected-suspicious"),
      characterNode("rejected-suspicious", "达妮娅", "denia", "而且这颗糖的颜色，看起来就像吃下去会发生很麻烦的事情。", "rejected-return"),
      characterNode("rejected-return", "达妮娅", "denia", "你自己留着吧……我要继续睡了。下次不许偷袭哦。", "rejected-sleep"),
      narrationNode("rejected-sleep", "达妮娅趴在桌子上，把脸埋在了臂弯中。糖果被完整地退了回来。")
    ]
  };
}

function aemeathStoryDraft() {
  return {
    startNodeId: RAINBOW_BEAN_CANDY_STORY_START_NODE_IDS.accepted,
    nodes: [
      narrationNode("accepted-start", "午后的围棋部，爱弥斯坐在棋盘前，指尖转着一枚黑棋，认真研究棋盘上的一道死活题。", "accepted-puzzle"),
      characterNode("accepted-puzzle", "爱弥斯", "aemeath", "这里扳一下，那边就会被打吃……唔，这本《鬼手魔手》死活题到底是哪位神仙出的？每道题的陷阱路线是不是有点太多了？", "", [
        option("把彩虹豆豆跳跳糖递给爱弥斯", "accepted-reward")
      ]),
      characterNode("accepted-reward", "爱弥斯", "aemeath", "好鲜艳！这是围棋部给勤奋思考死活题的人准备的限定奖励吗？", "", [
        option("差不多吧，要尝一颗吗？", "accepted-taste")
      ]),
      characterNode("accepted-taste", "爱弥斯", "aemeath", "虽然我现在已经不需要吃东西了，不过作为跟风尝鲜派，流行新品还是要积极体验一下的——", "accepted-afterimages"),
      narrationNode("accepted-afterimages", "爱弥斯将糖果放进口中。细碎的噼啪声刚刚响起，她的电子轮廓便猛地闪烁了一下。\n红、橙、黄、绿、青、蓝、紫七道像素残影依次从她身后弹开，又摇摇晃晃地重叠在一起。", "accepted-frequency"),
      characterNode("accepted-frequency", "爱弥斯", "aemeath", "咦？我的频率怎么突然被拆成七种颜色了？！", "", [
        option("原来爱弥斯吃了糖果会变成这样啊。", "accepted-prank")
      ]),
      characterNode("accepted-prank", "爱弥斯", "aemeath", "‘会变成这样’？原来这不是奖励，是你的整蛊道具啊！", "accepted-drop"),
      narrationNode("accepted-drop", "爱弥斯眯起眼睛看向你，手中的黑棋却不小心落在了棋盘上。", "accepted-ripple"),
      narrationNode("accepted-ripple", "棋子接触交叉点的瞬间，一圈七彩像素光纹“啪”地绽开，沿着棋盘线飞快扩散。", "accepted-again"),
      characterNode("accepted-again", "爱弥斯", "aemeath", "哇——等等！刚才那是什么？再来一次！", "accepted-white-move"),
      narrationNode("accepted-white-move", "爱弥斯又拿起一枚白棋，兴致勃勃地拍上棋盘。新的彩虹光纹随之炸开，围棋部里的其他成员也纷纷围了过来。", "", [
        option("太酷了！每次落子都会触发彩虹特效！", "accepted-explain")
      ]),
      characterNode("accepted-explain", "爱弥斯", "aemeath", "原来如此……糖果影响了我的频率，棋子在接触我的时候也会受到影响。", "accepted-name"),
      characterNode("accepted-name", "爱弥斯", "aemeath", "好！这个状态就叫——彩虹落子模式！"),
      narrationNode("rejected-start", "爱弥斯趴在棋盘前，捧着脸拿着手机浏览着校内论坛上最新的美食推荐。", "", [
        option("把彩虹豆豆跳跳糖递给爱弥斯", "rejected-trend")
      ]),
      characterNode("rejected-trend", "爱弥斯", "aemeath", "新品糖果？颜色倒是很符合最近的流行趋势……", "", [
        option("只是普通的糖，尝一颗吧。", "rejected-smile")
      ]),
      characterNode("rejected-smile", "爱弥斯", "aemeath", "嗯——糖可能很普通，但刚刚你说‘普通’的时候，脸上诡异的笑容像是触发了隐藏成就。", "", [
        option("啊？有这么明显的吗？", "rejected-obvious")
      ]),
      characterNode("rejected-obvious", "爱弥斯", "aemeath", "很明显噢。我可是电子幽灵，观察表情可算是基本功~", "rejected-rules"),
      characterNode("rejected-rules", "爱弥斯", "aemeath", "想让我当新品测试玩家也不是不行，不过测试规则得公平一点。", "", [
        option("怎样才算公平？", "rejected-record")
      ]),
      characterNode("rejected-record", "爱弥斯", "aemeath", "你先吃，我负责录像、剪辑，再把全过程上传到学院论坛。这样我们谁也不吃亏，对吧？", "rejected-withdraw"),
      narrationNode("rejected-withdraw", "你默默收回了糖果。爱弥斯托着脸，满是遗憾地看着你。", "rejected-title"),
      characterNode("rejected-title", "爱弥斯", "aemeath", "诶，别走呀？标题我都想好了——《{username}的整蛊糖果首秀》！真的不考虑一下吗？")
    ]
  };
}

function choiceNode(id, label, nextNodeId) {
  return {
    id,
    type: "player-choice",
    speakerName: "",
    characterId: "",
    text: "",
    nextNodeId: "",
    options: [option(label, nextNodeId)]
  };
}

function narrationNode(id, text, nextNodeId = "", options = []) {
  return {
    id,
    type: "story",
    speakerName: "",
    characterId: "",
    text,
    nextNodeId,
    options
  };
}

function characterNode(id, speakerName, characterId, text, nextNodeId = "", options = []) {
  return {
    id,
    type: "story",
    speakerName,
    characterId,
    text,
    nextNodeId,
    options
  };
}

function option(label, nextNodeId) {
  return { label, nextNodeId };
}
