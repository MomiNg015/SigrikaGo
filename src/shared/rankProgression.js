export const DEFAULT_RANK = "3段";
export const MAX_RANK = "9段";
export const MIN_RANK = "18级";
export const RANK_RESULT_WIN = "win";
export const RANK_RESULT_LOSS = "loss";
export const RANK_WINDOW_LIMIT = 10;
export const RANK_PROMOTION_WINS = 7;
export const RANK_DEMOTION_LOSSES = 8;

const MIN_STEP = -18;
const MAX_STEP = 9;

export function applyRankProgression({ rank = DEFAULT_RANK, recentResults = [], outcome = "" } = {}) {
  const normalizedRank = normalizeRank(rank);
  const normalizedOutcome = normalizeRankOutcome(outcome);
  if (!normalizedOutcome) {
    return {
      rank: normalizedRank,
      recentResults: normalizeRecentResults(recentResults),
      triggered: false,
      direction: ""
    };
  }

  const nextResults = [...normalizeRecentResults(recentResults), normalizedOutcome].slice(-RANK_WINDOW_LIMIT);
  const wins = nextResults.filter((result) => result === RANK_RESULT_WIN).length;
  const losses = nextResults.filter((result) => result === RANK_RESULT_LOSS).length;

  if (wins >= RANK_PROMOTION_WINS) {
    return {
      rank: promoteRank(normalizedRank),
      recentResults: [],
      triggered: true,
      direction: "up"
    };
  }
  if (losses >= RANK_DEMOTION_LOSSES) {
    return {
      rank: demoteRank(normalizedRank),
      recentResults: [],
      triggered: true,
      direction: "down"
    };
  }

  return {
    rank: normalizedRank,
    recentResults: nextResults,
    triggered: false,
    direction: ""
  };
}

export function promoteRank(rank = DEFAULT_RANK) {
  const next = rankToStep(rank) + 1;
  return rankFromStep(Math.min(MAX_STEP, next === 0 ? 1 : next));
}

export function demoteRank(rank = DEFAULT_RANK) {
  const next = rankToStep(rank) - 1;
  return rankFromStep(Math.max(MIN_STEP, next === 0 ? -1 : next));
}

export function normalizeRank(rank = DEFAULT_RANK) {
  return rankFromStep(rankToStep(rank));
}

export function serializeRecentResults(results = []) {
  return normalizeRecentResults(results).join(",");
}

export function parseRecentResults(value = "") {
  if (Array.isArray(value)) return normalizeRecentResults(value);
  return normalizeRecentResults(String(value ?? "").split(","));
}

export function normalizeRecentResults(results = []) {
  return (Array.isArray(results) ? results : [])
    .map(normalizeRankOutcome)
    .filter(Boolean)
    .slice(-RANK_WINDOW_LIMIT);
}

export function normalizeRankOutcome(outcome = "") {
  const value = String(outcome ?? "").trim().toLowerCase();
  if (value === RANK_RESULT_WIN || value === "w" || value === "胜") return RANK_RESULT_WIN;
  if (value === RANK_RESULT_LOSS || value === "l" || value === "负") return RANK_RESULT_LOSS;
  return "";
}

function rankToStep(rank = DEFAULT_RANK) {
  const value = String(rank ?? "").trim();
  const danMatch = value.match(/^(\d+)段$/u);
  if (danMatch) {
    return clampStep(Number(danMatch[1]));
  }
  const kyuMatch = value.match(/^(\d+)级$/u);
  if (kyuMatch) {
    return clampStep(-Number(kyuMatch[1]));
  }
  return 3;
}

function rankFromStep(step) {
  const normalized = clampStep(step);
  if (normalized > 0) return `${normalized}段`;
  return `${Math.abs(normalized)}级`;
}

function clampStep(step) {
  const value = Number.isFinite(Number(step)) ? Math.trunc(Number(step)) : 3;
  if (value === 0) return 1;
  return Math.max(MIN_STEP, Math.min(MAX_STEP, value));
}
