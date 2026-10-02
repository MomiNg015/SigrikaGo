import { COLORS } from "./game.js";
import { applyRankProgression, normalizeRankProgress } from "./rankProgression.js";

export const DEFAULT_RATING_RULES = {
  privateRewards: {
    winCoins: 20,
    lossCoins: 10,
    drawCoins: 10,
    dailyRewardLimit: 3
  }
};

export const RATING_RULES_SETTING_KEY = "ratingRules";

export function defaultRatingRulesJson() {
  return JSON.stringify(DEFAULT_RATING_RULES, null, 2);
}

export function normalizeRatingRules(value = DEFAULT_RATING_RULES) {
  const input = parseRatingRules(value);
  return {
    privateRewards: normalizePrivateRewards(input.privateRewards)
  };
}

export function ratingRulesFromSettings(settings = {}) {
  return normalizeRatingRules(settings[RATING_RULES_SETTING_KEY] ?? DEFAULT_RATING_RULES);
}

export function calculateRatingDelta({ self, outcome } = {}) {
  const before = normalizeRankProgress(self);
  return applyRankProgression({ ...before, outcome }).rating - before.rating;
}

export function privateCoinsForOutcome(outcome, rules = DEFAULT_RATING_RULES) {
  const rewards = normalizeRatingRules(rules).privateRewards;
  const normalizedOutcome = normalizeOutcome(outcome);
  if (normalizedOutcome === "win") return rewards.winCoins;
  if (normalizedOutcome === "loss") return rewards.lossCoins;
  if (normalizedOutcome === "draw") return rewards.drawCoins;
  return 0;
}

export function outcomeForPlayer(playerColor, winnerColor) {
  const normalizedPlayer = normalizeColor(playerColor);
  const normalizedWinner = normalizeColor(winnerColor);
  if (!normalizedPlayer) return "draw";
  if (!normalizedWinner) return "draw";
  return normalizedPlayer === normalizedWinner ? "win" : "loss";
}

function parseRatingRules(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return DEFAULT_RATING_RULES;
    }
  }
  return value && typeof value === "object" ? value : DEFAULT_RATING_RULES;
}

function normalizePrivateRewards(value = {}) {
  const fallback = DEFAULT_RATING_RULES.privateRewards;
  return {
    winCoins: clampInteger(value.winCoins, 0, 200, fallback.winCoins),
    lossCoins: clampInteger(value.lossCoins, 0, 100, fallback.lossCoins),
    drawCoins: clampInteger(value.drawCoins, 0, 100, fallback.drawCoins),
    dailyRewardLimit: clampInteger(value.dailyRewardLimit, 0, 20, fallback.dailyRewardLimit)
  };
}

function normalizeOutcome(outcome) {
  return outcome === "win" || outcome === "loss" || outcome === "draw" ? outcome : "";
}

function normalizeColor(color) {
  return color === COLORS.black || color === COLORS.white ? color : "";
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}
