export const PRACTICE_MATCH_SOURCE = "practice";
export const PRACTICE_RECORD_POLICY = "none";
export const PRACTICE_BOT_ID = "zhunshibao";
export const PRACTICE_BOT_NAME = "准时宝";

export const PRACTICE_DIFFICULTIES = Object.freeze({
  beginner: {
    id: "beginner",
    label: "入门",
    captureResignThreshold: 11,
    delayMs: [1200, 1800],
    topChoices: 8,
    randomMoveChance: 0.25
  },
  basic: {
    id: "basic",
    label: "基础",
    captureResignThreshold: 22,
    delayMs: [600, 1000],
    topChoices: 3,
    randomMoveChance: 0
  }
});

export const PRACTICE_PLAYER_COLORS = Object.freeze(["black", "white", "random"]);

export function practiceDifficulty(value) {
  return PRACTICE_DIFFICULTIES[value] ?? null;
}

export function isPracticePlayerColor(value) {
  return PRACTICE_PLAYER_COLORS.includes(value);
}

export function isPracticeRoom(room) {
  return room?.matchSource === PRACTICE_MATCH_SOURCE;
}
