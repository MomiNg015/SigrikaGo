export const PRACTICE_MATCH_SOURCE = "practice";
export const PRACTICE_RECORD_POLICY = "none";
export const PRACTICE_BOT_ID = "zhunshibao";
export const PRACTICE_BOT_NAME = "准时宝";
export const PRACTICE_BOT_PORTRAIT_URL = "/assets/characters/zhunshibao.png";

const BEGINNER_DIFFICULTY = Object.freeze({
  id: "beginner",
  label: "入门",
  description: "沙包型准时宝",
  rankLabel: "入门陪练",
  strategy: "heuristic",
  captureResignThreshold: 22,
  delayMs: Object.freeze([1200, 1800]),
  topChoices: 8,
  randomMoveChance: 0.25
});

const INTERMEDIATE_DIFFICULTY = Object.freeze({
  id: "intermediate",
  label: "中级",
  description: "一般型准时宝",
  rankLabel: "中级陪练",
  strategy: "gnugo",
  captureResignThreshold: 22,
  delayMs: Object.freeze([650, 1000]),
  engine: Object.freeze({
    name: "gnugo",
    level: 5,
    timeoutMs: 3500,
    cacheSizeMb: 8
  })
});

const ADVANCED_DIFFICULTY = Object.freeze({
  id: "advanced",
  label: "高级",
  description: "红温型准时宝",
  rankLabel: "高级陪练",
  strategy: "gnugo",
  captureResignThreshold: 22,
  delayMs: Object.freeze([650, 1000]),
  engine: Object.freeze({
    name: "gnugo",
    level: 10,
    timeoutMs: 5000,
    cacheSizeMb: 8
  })
});

const LEGACY_BASIC_DIFFICULTY = Object.freeze({
  id: "basic",
  label: "入门",
  description: "沙包型准时宝",
  rankLabel: "入门陪练",
  strategy: "gnugo",
  captureResignThreshold: 22,
  delayMs: Object.freeze([600, 1000]),
  engine: Object.freeze({
    name: "gnugo",
    level: 1,
    timeoutMs: 2000,
    cacheSizeMb: 8
  }),
  legacy: true
});

export const PRACTICE_DIFFICULTIES = Object.freeze({
  beginner: BEGINNER_DIFFICULTY,
  intermediate: INTERMEDIATE_DIFFICULTY,
  advanced: ADVANCED_DIFFICULTY,
  basic: LEGACY_BASIC_DIFFICULTY
});

export const PRACTICE_DIFFICULTY_OPTIONS = Object.freeze([
  BEGINNER_DIFFICULTY,
  INTERMEDIATE_DIFFICULTY,
  ADVANCED_DIFFICULTY
]);

export const PRACTICE_PUBLIC_DIFFICULTY_IDS = Object.freeze(
  PRACTICE_DIFFICULTY_OPTIONS.map((difficulty) => difficulty.id)
);

export const PRACTICE_PLAYER_COLORS = Object.freeze(["black", "white", "random"]);

export function practiceDifficulty(value) {
  return PRACTICE_DIFFICULTIES[value] ?? null;
}

export function requestedPracticeDifficulty(value) {
  return PRACTICE_PUBLIC_DIFFICULTY_IDS.includes(value)
    ? PRACTICE_DIFFICULTIES[value]
    : null;
}

export function practiceCaptureResignThreshold(practice) {
  const explicitThreshold = Number(practice?.captureResignThreshold);
  if (Number.isInteger(explicitThreshold) && explicitThreshold > 0) return explicitThreshold;
  if (practice?.difficulty === "beginner") return 11;
  return practiceDifficulty(practice?.difficulty)?.captureResignThreshold
    ?? BEGINNER_DIFFICULTY.captureResignThreshold;
}

export function isPracticePlayerColor(value) {
  return PRACTICE_PLAYER_COLORS.includes(value);
}

export function isPracticeRoom(room) {
  return room?.matchSource === PRACTICE_MATCH_SOURCE;
}
