export const DEFAULT_RANK = "3段";
export const MAX_RANK = "9段";
export const MIN_RANK = "18级";
export const RANK_RESULT_WIN = "win";
export const RANK_RESULT_LOSS = "loss";
export const RANK_WINDOW_LIMIT = 10;
export const DEFAULT_STARS = 2;
export const NINE_DAN_ENTRY_POINTS = 1000;

const MIN_STEP = -18;
const MAX_STEP = 9;

export function rankStarLimit(rank = DEFAULT_RANK) {
  const step = rankToStep(rank);
  return step >= 9 ? 0 : step >= 7 ? 8 : step >= 4 ? 6 : 4;
}

export function normalizeRankProgress({ rank = DEFAULT_RANK, stars, rating = 0 } = {}) {
  rank = normalizeRank(rank);
  const limit = rankStarLimit(rank);
  const integer = (value, fallback) => Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : fallback;
  return {
    rank,
    stars: limit ? Math.max(0, Math.min(limit, integer(stars ?? limit / 2, limit / 2))) : 0,
    rating: limit ? 0 : Math.max(0, Math.min(2147483647, integer(rating, 0)))
  };
}

export function rankMatchStatus(progress) {
  const state = normalizeRankProgress(progress);
  if (state.rank === MAX_RANK) return state.rating === 0 ? "demotion" : "";
  if (state.stars === rankStarLimit(state.rank)) return "promotion";
  return state.stars === 0 && state.rank !== MIN_RANK ? "demotion" : "";
}

export function compareRankProgress(a, b) {
  return rankToStep(b.rank) - rankToStep(a.rank)
    || (a.rank === MAX_RANK ? Number(b.rating ?? 0) - Number(a.rating ?? 0) : Number(b.stars ?? DEFAULT_STARS) - Number(a.stars ?? DEFAULT_STARS));
}

export function applyRankProgression({ rank = DEFAULT_RANK, stars, rating = 0, recentResults = [], outcome = "" } = {}) {
  const before = normalizeRankProgress({ rank, stars, rating });
  const result = normalizeRankOutcome(outcome);
  const next = { ...before, recentResults: normalizeRecentResults(recentResults), triggered: false, direction: "" };
  if (!result) return next;
  next.recentResults = [...next.recentResults, result].slice(-RANK_WINDOW_LIMIT);
  const won = result === RANK_RESULT_WIN;
  let destination = before.rank;
  if (before.rank === MAX_RANK) {
    if (!won && before.rating === 0) destination = demoteRank(before.rank);
    else next.rating = Math.min(2147483647, Math.max(0, before.rating + (won ? 200 : -250)));
  } else if (won && before.stars === rankStarLimit(before.rank)) {
    destination = promoteRank(before.rank);
  } else if (!won && before.stars === 0) {
    destination = demoteRank(before.rank);
  } else {
    next.stars = before.stars + (won ? 1 : -1);
  }
  if (destination !== before.rank) {
    Object.assign(next, {
      rank: destination,
      stars: rankStarLimit(destination) / 2,
      rating: destination === MAX_RANK ? NINE_DAN_ENTRY_POINTS : 0,
      triggered: true,
      direction: won ? "up" : "down"
    });
  }
  return next;
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

export function rankToStep(rank = DEFAULT_RANK) {
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
