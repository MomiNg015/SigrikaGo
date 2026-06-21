import { COLORS } from "./game.js";
import { rankToStep } from "./rankProgression.js";

export const DEFAULT_RATING_RULES = {
  elo: {
    kFactor: 40,
    deltaMin: 4,
    deltaMax: 36
  },
  rankChangeRatingDelta: 100,
  rankGapAdjustment: {
    enabled: true,
    steps: [
      { minGap: 0, rewardMultiplier: 1, normalPenaltyMultiplier: 1, highRankUpsetPenaltyMultiplier: 1 },
      { minGap: 2, rewardMultiplier: 0.75, normalPenaltyMultiplier: 0.75, highRankUpsetPenaltyMultiplier: 1.25 },
      { minGap: 4, rewardMultiplier: 0.5, normalPenaltyMultiplier: 0.5, highRankUpsetPenaltyMultiplier: 1.5 },
      { minGap: 6, rewardMultiplier: 0.25, normalPenaltyMultiplier: 0.25, highRankUpsetPenaltyMultiplier: 2 }
    ]
  },
  antiBoost: {
    enabled: false,
    windowHours: 24,
    fullScoreGames: 3,
    reducedScoreGames: 6,
    reducedMultiplier: 0.25,
    modeOverrides: {}
  },
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
    elo: normalizeEloRules(input.elo),
    rankChangeRatingDelta: clampInteger(input.rankChangeRatingDelta, 0, 500, DEFAULT_RATING_RULES.rankChangeRatingDelta),
    rankGapAdjustment: normalizeRankGapAdjustment(input.rankGapAdjustment),
    antiBoost: normalizeAntiBoostRules(input.antiBoost),
    privateRewards: normalizePrivateRewards(input.privateRewards)
  };
}

export function ratingRulesFromSettings(settings = {}) {
  return normalizeRatingRules(settings[RATING_RULES_SETTING_KEY] ?? DEFAULT_RATING_RULES);
}

export function calculateRatingDelta({ self, opponent, outcome, rules = DEFAULT_RATING_RULES, antiBoostMultiplier = 1 } = {}) {
  const normalizedRules = normalizeRatingRules(rules);
  const normalizedOutcome = normalizeOutcome(outcome);
  if (!normalizedOutcome) return 0;

  const expected = expectedScore(Number(self?.rating ?? 1000), Number(opponent?.rating ?? 1000));
  const actual = normalizedOutcome === "win" ? 1 : normalizedOutcome === "loss" ? 0 : 0.5;
  const rawDelta = Math.round(normalizedRules.elo.kFactor * (actual - expected));
  const clampedDelta = clampRatingDelta(rawDelta, normalizedOutcome, normalizedRules.elo);
  const rankAdjustedDelta = applyRankGapAdjustment(clampedDelta, {
    selfRank: self?.rank,
    opponentRank: opponent?.rank,
    outcome: normalizedOutcome,
    rules: normalizedRules.rankGapAdjustment
  });
  return Math.round(rankAdjustedDelta * clampNumber(antiBoostMultiplier, 0, 1, 1));
}

export function antiBoostMultiplierForRepeatCount(repeatCount, rules = DEFAULT_RATING_RULES) {
  const antiBoost = normalizeRatingRules(rules).antiBoost;
  if (!antiBoost.enabled) return 1;
  const count = Math.max(0, Math.trunc(Number(repeatCount) || 0));
  if (count < antiBoost.fullScoreGames) return 1;
  if (count < antiBoost.reducedScoreGames) return antiBoost.reducedMultiplier;
  return 0;
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

function expectedScore(selfRating, opponentRating) {
  return 1 / (1 + 10 ** ((opponentRating - selfRating) / 400));
}

function clampRatingDelta(delta, outcome, eloRules) {
  if (delta === 0) return 0;
  const sign = delta > 0 ? 1 : -1;
  const absolute = Math.abs(delta);
  const minimum = outcome === "draw" ? 0 : eloRules.deltaMin;
  return sign * Math.min(eloRules.deltaMax, Math.max(minimum, absolute));
}

function applyRankGapAdjustment(delta, { selfRank, opponentRank, outcome, rules }) {
  if (!rules.enabled || delta === 0) return delta;
  const selfStep = rankToStep(selfRank);
  const opponentStep = rankToStep(opponentRank);
  const gap = Math.abs(selfStep - opponentStep);
  const step = [...rules.steps]
    .sort((a, b) => Number(a.minGap) - Number(b.minGap))
    .filter((entry) => gap >= Number(entry.minGap))
    .at(-1) ?? rules.steps[0];
  if (delta > 0) return delta * step.rewardMultiplier;
  const selfIsHigher = selfStep > opponentStep;
  if (outcome === "loss" && selfIsHigher) return delta * step.highRankUpsetPenaltyMultiplier;
  return delta * step.normalPenaltyMultiplier;
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

function normalizeEloRules(value = {}) {
  return {
    kFactor: clampInteger(value.kFactor, 10, 80, DEFAULT_RATING_RULES.elo.kFactor),
    deltaMin: clampInteger(value.deltaMin, 0, 20, DEFAULT_RATING_RULES.elo.deltaMin),
    deltaMax: clampInteger(
      Math.max(Number(value.deltaMax ?? DEFAULT_RATING_RULES.elo.deltaMax), Number(value.deltaMin ?? 0)),
      20,
      80,
      DEFAULT_RATING_RULES.elo.deltaMax
    )
  };
}

function normalizeRankGapAdjustment(value = {}) {
  const fallback = DEFAULT_RATING_RULES.rankGapAdjustment;
  const steps = Array.isArray(value.steps) && value.steps.length ? value.steps : fallback.steps;
  return {
    enabled: value.enabled !== false,
    steps: steps.map((step) => ({
      minGap: clampInteger(step.minGap, 0, 99, 0),
      rewardMultiplier: clampNumber(step.rewardMultiplier, 0, 2, 1),
      normalPenaltyMultiplier: clampNumber(step.normalPenaltyMultiplier, 0, 2, 1),
      highRankUpsetPenaltyMultiplier: clampNumber(step.highRankUpsetPenaltyMultiplier, 0, 3, 1)
    }))
  };
}

function normalizeAntiBoostRules(value = {}) {
  const fallback = DEFAULT_RATING_RULES.antiBoost;
  return {
    enabled: value.enabled === true,
    windowHours: clampInteger(value.windowHours, 1, 168, fallback.windowHours),
    fullScoreGames: clampInteger(value.fullScoreGames, 0, 50, fallback.fullScoreGames),
    reducedScoreGames: clampInteger(value.reducedScoreGames, 0, 100, fallback.reducedScoreGames),
    reducedMultiplier: clampNumber(value.reducedMultiplier, 0, 1, fallback.reducedMultiplier),
    modeOverrides: value.modeOverrides && typeof value.modeOverrides === "object" ? value.modeOverrides : {}
  };
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

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
