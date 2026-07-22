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

const SUPPORTED_CHARACTER_IDS = new Set(["sigrika", "denia"]);

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
