import { compareRankProgress } from "../src/shared/rankProgression.js";

const total = row => Number(row.totalGames ?? (Number(row.wins ?? 0) + Number(row.losses ?? 0) + Number(row.draws ?? 0)));

export function compareLeaderboardStanding(a, b) {
  return compareRankProgress(a, b)
    || Number(b.wins ?? 0) - Number(a.wins ?? 0)
    || (Number(b.wins ?? 0) * total(a) - Number(a.wins ?? 0) * total(b));
}

export function standingReachedAt(before, after, now = new Date()) {
  return before.leaderboardReachedAt && total(before) > 0 && compareLeaderboardStanding(before, after) === 0
    ? before.leaderboardReachedAt : now.toISOString();
}

export function compareArrival(a, b) {
  const timestamp = value => value ? new Date(value).getTime() : 0;
  return timestamp(a.leaderboardReachedAt) - timestamp(b.leaderboardReachedAt)
    || String(a.id).localeCompare(String(b.id));
}

// Shared by challenge settlement and profile projection; matches list order exactly.
export function capturePredecessors({ userId, captures, reachedAt }) {
  return { userId: { not: userId }, OR: [
    { captures: { gt: captures } },
    { captures, reachedAt: { lt: reachedAt } },
    { captures, reachedAt, userId: { lt: userId } }
  ] };
}
