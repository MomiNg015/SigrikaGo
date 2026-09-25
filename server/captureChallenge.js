import { GAME_PHASES, exposeHiddenHands } from "../src/shared/game.js";
import { CAPTURE_CHALLENGE_MOVE_LIMIT, isCaptureChallenge, captureChallengeResultText } from "../src/shared/captureChallenge.js";
import { modeStatsForUser } from "./roomFactory.js";

export function finishCaptureChallenge(room) {
  if (!isCaptureChallenge(room) || room.game.phase !== GAME_PHASES.playing
    || room.game.pendingSkill || room.game.moveNumber < CAPTURE_CHALLENGE_MOVE_LIMIT) return false;
  room.game.phase = GAME_PHASES.finished;
  room.game.extraTurn = null;
  room.game.winner = { winnerColor: null, reason: "capture-challenge", text: "挑战完成，成绩结算中…" };
  exposeHiddenHands(room.game);
  return true;
}

export async function saveCaptureChallengeResult({ prisma, room }) {
  room.game.resultRewards = null;
  if (room.game.winner?.reason !== "capture-challenge" || room.game.moveNumber !== CAPTURE_CHALLENGE_MOVE_LIMIT) {
    room.recordSaved = true;
    return;
  }
  const player = room.players.find((entry) => entry.user.id === room.practice.humanUserId);
  if (!player || !room.practice.challengeId) throw new Error("Missing capture challenge identity");
  const captures = room.game.captures[player.color];
  const result = await prisma.$transaction(async (tx) => {
    // A durable receipt keeps the original rank and breakthrough decision on retries/restores.
    const previous = await tx.captureChallengeResult.findUnique({ where: { id: room.practice.challengeId } });
    if (previous) return previous;
    const best = await tx.captureChallengeBest.findUnique({ where: { userId: player.user.id } });
    const rank = 1 + await tx.captureChallengeBest.count({
      where: { userId: { not: player.user.id }, captures: { gt: captures } }
    });
    const breakthrough = !best || rank < best.bestRank;
    const recordData = {
      captures,
      characterId: player.characterId,
      costumeSnapshot: JSON.stringify(player.costumeSnapshot ?? null)
    };
    await tx.captureChallengeBest.upsert({
      where: { userId: player.user.id },
      create: { userId: player.user.id, ...recordData, bestRank: rank },
      update: {
        ...(best && captures > best.captures ? recordData : {}),
        bestRank: Math.min(best?.bestRank ?? rank, rank)
      }
    });
    return tx.captureChallengeResult.create({ data: {
      id: room.practice.challengeId, userId: player.user.id, captures, rank, breakthrough
    } });
  });
  room.practice.result = { captures: result.captures, rank: result.rank, breakthrough: result.breakthrough };
  room.game.winner.text = captureChallengeResultText(result.captures, result.rank);
  room.recordSaved = true;
}

export async function listCaptureChallengeLeaderboard(prisma) {
  const records = await prisma.captureChallengeBest.findMany({
    include: { user: { select: { id: true, username: true, rank: true, modeStats: true } } },
    orderBy: [{ captures: "desc" }, { userId: "asc" }]
  });
  let ranking = 0;
  return records.map((record, index) => {
    if (index === 0 || record.captures !== records[index - 1].captures) ranking = index + 1;
    return {
      id: record.userId, username: record.user.username,
      rank: modeStatsForUser(record.user, "spark").rank,
      ranking, captures: record.captures, recordCharacter: record.characterId,
      costumeSnapshot: JSON.parse(record.costumeSnapshot)
    };
  });
}
