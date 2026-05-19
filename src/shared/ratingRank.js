const DAN_RATING_START = 900;
const DAN_RATING_STEP = 100;
const MAX_DAN = 9;
const MIN_RATING_RANK = 0;
const MAX_KYU = 10;

export function rankFromRating(rating) {
  const normalizedRating = normalizeRating(rating);
  if (normalizedRating < MIN_RATING_RANK) return `${MAX_KYU}级`;
  if (normalizedRating >= DAN_RATING_START) {
    const dan = Math.floor((normalizedRating - DAN_RATING_START) / DAN_RATING_STEP) + 1;
    return `${Math.min(MAX_DAN, dan)}段`;
  }
  const kyu = Math.floor((DAN_RATING_START - 1 - normalizedRating) / DAN_RATING_STEP) + 1;
  return `${Math.min(MAX_KYU, kyu)}级`;
}

function normalizeRating(rating) {
  const value = Number(rating);
  if (!Number.isFinite(value)) return 0;
  return Math.trunc(value);
}
