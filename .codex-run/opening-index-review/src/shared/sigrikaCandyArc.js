export const SIGRIKA_CANDY_MAX_USE_COUNT = 8;

export const SIGRIKA_CANDY_PHASES = Object.freeze({
  normal: "normal",
  corruptionStory: "corruption-story",
  awaitingDuel: "awaiting-duel",
  duelActive: "duel-active",
  resultPending: "result-pending",
  recoveryStory: "recovery-story"
});

export const SIGRIKA_CANDY_OUTCOMES = Object.freeze({
  win: "win",
  loss: "loss"
});

export const SIGRIKA_CANDY_STORY_NODE_IDS = Object.freeze({
  sharedEffect: "shared-effect-start",
  corruptionStart: "corruption-start",
  corruptionClimax: "corruption-climax",
  recoveryWin: "recovery-win-start",
  recoveryLoss: "recovery-loss-start"
});

export const SIGRIKA_CANDY_DEBUG_JUMP_NODE_ID = "debug-jump-to-sigrika-candy-use-8";

export const SIGRIKA_CANDY_DUEL = Object.freeze({
  matchSource: "sigrika-corruption-duel",
  replayTitle: "和西格莉卡？决战",
  replayTag: "特殊对局",
  boardSize: 13,
  komi: 2.75,
  mainTimeSeconds: 30 * 60
});

export const SIGRIKA_CANDY_DUEL_AVAILABILITY = Object.freeze({
  available: "available",
  owned: "owned",
  occupied: "occupied"
});

export const SIGRIKA_CANDY_DUEL_PRESENTATION = Object.freeze({
  speaker: "西格莉卡？",
  hiddenSkillName: "？？？",
  hiddenSkillUses: "？",
  openingDialogue: "那么，让你看看才能的差距吧。",
  openingSkillName: "秘日六席",
  aiReactionDialogues: Object.freeze([
    "为什么你所展示的力量，和那个禁忌的来源这么像...",
    "我懂了......我懂了！那么你也是恶啊！",
    "行吧，那就用恶的方式来结束这令人失望的一局吧。"
  ]),
  aiReactionSkillName: "七宗罪"
});

const VALID_PHASES = new Set(Object.values(SIGRIKA_CANDY_PHASES));
const VALID_OUTCOMES = new Set(Object.values(SIGRIKA_CANDY_OUTCOMES));

export function sigrikaCandyUseStartNodeId(useCount) {
  const count = normalizeSigrikaCandyUseCount(useCount);
  return count >= SIGRIKA_CANDY_MAX_USE_COUNT
    ? SIGRIKA_CANDY_STORY_NODE_IDS.corruptionStart
    : `use-${Math.max(1, count)}-start`;
}

export function normalizeSigrikaCandyArc(user = {}) {
  const phase = VALID_PHASES.has(user.sigrikaCandyPhase)
    ? user.sigrikaCandyPhase
    : SIGRIKA_CANDY_PHASES.normal;
  const outcome = VALID_OUTCOMES.has(user.sigrikaCandyOutcome)
    ? user.sigrikaCandyOutcome
    : "";
  const useCount = normalizeSigrikaCandyUseCount(user.sigrikaCandyUseCount);
  const roomCode = String(user.sigrikaCandyRoomCode ?? "").trim();
  return {
    useCount,
    phase,
    outcome,
    roomCode,
    corrupted: isSigrikaCandyCorruptedPhase(phase),
    active: phase !== SIGRIKA_CANDY_PHASES.normal || useCount > 0
  };
}

export function isSigrikaCandyCorruptedPhase(phase) {
  return phase === SIGRIKA_CANDY_PHASES.awaitingDuel
    || phase === SIGRIKA_CANDY_PHASES.duelActive
    || phase === SIGRIKA_CANDY_PHASES.resultPending
    || phase === SIGRIKA_CANDY_PHASES.recoveryStory;
}

export function normalizeSigrikaCandyUseCount(value) {
  const count = Math.trunc(Number(value ?? 0));
  if (!Number.isFinite(count)) return 0;
  return Math.max(0, Math.min(SIGRIKA_CANDY_MAX_USE_COUNT, count));
}
