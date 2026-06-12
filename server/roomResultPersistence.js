import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { DEFAULT_RANK, normalizeRank, serializeRecentResults } from "../src/shared/rankProgression.js";
import { resultRewardDelta } from "../src/shared/resultRewards.js";
import { gameResultMetadata } from "./gameRecords.js";
import { candyEffectData, prepareCandyEffectUpdates } from "./roomItemEffects.js";
import { applyResultRewardsToRoomUsers } from "./roomRewards.js";
import { modeStatsForUser } from "./roomFactory.js";
import { roomView } from "./roomBroadcasts.js";
import { structuredUserItemEffectSyncOperations } from "./userAssets.js";
import {
  PROGRESS_METRICS,
  PROGRESS_REASONS,
  progressLedgerCreateOperations
} from "./userProgressLedger.js";

export async function saveGameRecord({ prisma, room }) {
  if (room.recordSaved || room.game.phase !== GAME_PHASES.finished) return;
  if (room.game.winner?.invalid) {
    room.recordSaved = true;
    return;
  }
  const black = room.players.find((player) => player.color === COLORS.black);
  const white = room.players.find((player) => player.color === COLORS.white);
  if (!black || !white) return;
  const candyEffectUpdates = prepareCandyEffectUpdates(room);
  const candyEffectAssetOperations = () => candyEffectUpdates.flatMap(({ player }) => (
    structuredUserItemEffectSyncOperations(prisma, player.user)
  ));
  room.recordSaved = true;
  const resultMetadata = gameResultMetadata(room.game.winner);
  const createRecord = () => prisma.gameRecord.create({
    data: {
      roomCode: room.code,
      blackUserId: black.user.id,
      whiteUserId: white.user.id,
      blackName: black.user.username,
      whiteName: white.user.username,
      blackCharacter: black.characterId,
      whiteCharacter: white.characterId,
      resultText: room.game.winner?.text ?? "对局结束",
      winnerColor: resultMetadata.winnerColor,
      resultReason: resultMetadata.resultReason,
      moveCount: room.game.moveNumber,
      mode: room.mode ?? room.game.mode ?? "spark",
      snapshot: JSON.stringify(roomView(room, black.user.id)),
      snapshotVersion: 1
    }
  });
  const mode = normalizeGameModeId(room.mode ?? room.game.mode);
  if (![COLORS.black, COLORS.white].includes(room.game.winner?.winnerColor)) {
    applyDrawResultToRoomUser(black, mode);
    applyDrawResultToRoomUser(white, mode);
    const recordCreate = createRecord();
    const operations = [
      recordCreate,
      prisma.userModeStats.upsert(modeStatsUpsertOperation(black, mode, { drawsDelta: 1 })),
      prisma.userModeStats.upsert(modeStatsUpsertOperation(white, mode, { drawsDelta: 1 })),
      ...candyEffectUpdates.map(({ player, clear }) => prisma.user.update({
        where: { id: player.user.id },
        data: { itemEffects: clear.itemEffects }
      })),
      ...candyEffectAssetOperations()
    ];
    if (operations.length > 1) await prisma.$transaction(operations);
    else await recordCreate;
    return;
  }
  const winner = room.game.winner.winnerColor === COLORS.black ? black : white;
  const loser = winner.color === COLORS.black ? white : black;
  const winnerBefore = { rating: winner.user.rating, coins: winner.user.coins };
  const loserBefore = { rating: loser.user.rating, coins: loser.user.coins };
  const winnerReward = resultRewardDelta(winner.color, room.game.winner.winnerColor);
  const loserReward = resultRewardDelta(loser.color, room.game.winner.winnerColor);
  applyResultRewardsToRoomUsers(winner, loser, winnerReward, loserReward, { mode });
  const recordCreate = createRecord();
  await prisma.$transaction([
    recordCreate,
    prisma.userModeStats.upsert(modeStatsUpsertOperation(winner, mode, {
      ratingDelta: winnerReward.rating,
      winsDelta: 1
    })),
    prisma.userModeStats.upsert(modeStatsUpsertOperation(loser, mode, {
      ratingDelta: loserReward.rating,
      lossesDelta: 1
    })),
    prisma.user.update({
      where: { id: winner.user.id },
      data: {
        ...(mode === "spark" ? {
          wins: { increment: 1 },
          rating: { increment: winnerReward.rating },
          rank: winner.user.rank
        } : {}),
        coins: { increment: winnerReward.coins },
        ...candyEffectData(winner, candyEffectUpdates)
      }
    }),
    prisma.user.update({
      where: { id: loser.user.id },
      data: {
        ...(mode === "spark" ? {
          losses: { increment: 1 },
          rating: { increment: loserReward.rating },
          rank: loser.user.rank
        } : {}),
        coins: { increment: loserReward.coins },
        ...candyEffectData(loser, candyEffectUpdates)
      }
    }),
    ...progressLedgerCreateOperations(prisma, [
      ...gameResultProgressEntries(winner, winnerBefore, room.code),
      ...gameResultProgressEntries(loser, loserBefore, room.code)
    ]),
    ...candyEffectAssetOperations()
  ]);
}

export function applyDrawResultToRoomUser(player, mode) {
  const currentStats = modeStatsForUser(player.user, mode);
  player.user = {
    ...player.user,
    modeStats: {
      ...(player.user.modeStats ?? {}),
      [mode]: {
        ...currentStats,
        draws: Number(currentStats.draws ?? 0) + 1
      }
    }
  };
}

export function modeStatsUpsertOperation(player, mode, { ratingDelta = 0, winsDelta = 0, lossesDelta = 0, drawsDelta = 0 } = {}) {
  return {
    where: {
      userId_mode: {
        userId: player.user.id,
        mode
      }
    },
    create: {
      userId: player.user.id,
      mode,
      rating: Number(player.user.modeStats?.[mode]?.rating ?? player.user.rating ?? 1000),
      rank: normalizeRank(player.user.modeStats?.[mode]?.rank ?? player.user.rank ?? DEFAULT_RANK),
      recentResults: serializeRecentResults(player.user.modeStats?.[mode]?.recentResults),
      wins: Math.max(0, Number(player.user.modeStats?.[mode]?.wins ?? player.user.wins ?? 0)),
      losses: Math.max(0, Number(player.user.modeStats?.[mode]?.losses ?? player.user.losses ?? 0)),
      draws: Math.max(0, Number(player.user.modeStats?.[mode]?.draws ?? 0))
    },
    update: {
      rating: { increment: ratingDelta },
      rank: normalizeRank(player.user.modeStats?.[mode]?.rank ?? player.user.rank ?? DEFAULT_RANK),
      recentResults: serializeRecentResults(player.user.modeStats?.[mode]?.recentResults),
      ...(winsDelta ? { wins: { increment: winsDelta } } : {}),
      ...(lossesDelta ? { losses: { increment: lossesDelta } } : {}),
      ...(drawsDelta ? { draws: { increment: drawsDelta } } : {})
    }
  };
}

export function gameResultProgressEntries(player, before, roomCode) {
  return [
    {
      userId: player.user.id,
      metric: PROGRESS_METRICS.rating,
      delta: Number(player.user.rating ?? 0) - Number(before.rating ?? 0),
      beforeValue: before.rating,
      afterValue: player.user.rating,
      reason: PROGRESS_REASONS.gameResult,
      refType: "room",
      refId: roomCode
    },
    {
      userId: player.user.id,
      metric: PROGRESS_METRICS.coins,
      delta: Number(player.user.coins ?? 0) - Number(before.coins ?? 0),
      beforeValue: before.coins,
      afterValue: player.user.coins,
      reason: PROGRESS_REASONS.gameResult,
      refType: "room",
      refId: roomCode
    }
  ];
}
