import { capturePredecessors } from "./leaderboardOrder.js";

// A bounded personal summary; do not fetch the complete challenge leaderboard.
export async function profileCaptureRecord({ prisma, userId }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return undefined;
  const best = await prisma.captureChallengeBest.findUnique({ where: { userId } });
  if (!best) return null;
  const higher = await prisma.captureChallengeBest.count({ where: capturePredecessors({ ...best, userId }) });
  let costumeSnapshot = null;
  try { costumeSnapshot = JSON.parse(best.costumeSnapshot ?? "null"); } catch { /* Older rows can omit the appearance snapshot. */ }
  return { captures: best.captures, ranking: higher + 1, characterId: best.characterId, costumeSnapshot };
}
