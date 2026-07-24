import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import { PRACTICE_MATCH_SOURCE, PRACTICE_RECORD_POLICY } from "../src/shared/practiceMode.js";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { DEFAULT_RANK, normalizeRank, rankToStep, serializeRecentResults } from "../src/shared/rankProgression.js";
import {
  antiBoostMultiplierForRepeatCount,
  outcomeForPlayer,
  privateCoinsForOutcome,
  ratingRulesFromSettings
} from "../src/shared/ratingRules.js";
import { resultRewardDelta } from "../src/shared/resultRewards.js";
import { gameResultMetadata } from "./gameRecords.js";
import { candyEffectData, prepareCandyEffectUpdates } from "./roomItemEffects.js";
import { applyUserReward } from "./roomRewards.js";
import { modeStatsForUser } from "./roomFactory.js";
import { roomView } from "./roomBroadcasts.js";
import { getCachedPublicSiteSettings } from "./siteSettings.js";
import { structuredUserItemEffectSyncOperations } from "./userAssets.js";
import {
  PROGRESS_METRICS,
  PROGRESS_REASONS,
  progressLedgerCreateOperations
} from "./userProgressLedger.js";

export async function saveGameRecord({ prisma, room }) {
  if (room.recordSaved || room.game.phase !== GAME_PHASES.finished) return;
  if (room.recordPolicy === PRACTICE_RECORD_POLICY || room.matchSource === PRACTICE_MATCH_SOURCE) {
    room.recordSaved = true;
    room.game.resultRewards = null;
    return;
  }
  if (room.game.winner?.invalid) {
    room.recordSaved = true;
    return;
  }
  const black = room.players.find((player) => player.color === COLORS.black);
  const white = room.players.find((player) => player.color === COLORS.white);
  if (!black || !white) return;

  const mode = normalizeGameModeId(room.mode ?? room.game.mode);
  const rated = room.rated !== false;
  const matchSource = room.matchSource ?? (rated ? "matchmaking" : "private");
  const ratingRules = loadRatingRules();
  const resultMetadata = gameResultMetadata(room.game.winner);
  const candyEffectUpdates = prepareCandyEffectUpdates(room);
  const candyEffectAssetOperations = () => candyEffectUpdates.flatMap(({ player }) => (
    structuredUserItemEffectSyncOperations(prisma, player.user)
  ));
  const settlement = emptySettlement();

  room.recordSaved = true;

  const createRecord = () => prisma.gameRecord.create({
    data: {
      roomCode: room.code,
      blackUserId: black.user.id,
      whiteUserId: white.user.id,
      blackName: black.user.username,
      whiteName: white.user.username,
      blackCharacter: black.characterId,
      whiteCharacter: white.characterId,
      blackCostumeId: black.costumeSnapshot?.id ?? "",
      whiteCostumeId: white.costumeSnapshot?.id ?? "",
      blackCostumePortraitUrl: black.costumeSnapshot?.portraitUrl ?? "",
      whiteCostumePortraitUrl: white.costumeSnapshot?.portraitUrl ?? "",
      blackCostumePortraitScalePercent: black.costumeSnapshot?.portraitScalePercent ?? 100,
      whiteCostumePortraitScalePercent: white.costumeSnapshot?.portraitScalePercent ?? 100,
      blackCostumePortraitOffsetXPercent: black.costumeSnapshot?.portraitOffsetXPercent ?? 0,
      whiteCostumePortraitOffsetXPercent: white.costumeSnapshot?.portraitOffsetXPercent ?? 0,
      blackCostumePortraitOffsetYPercent: black.costumeSnapshot?.portraitOffsetYPercent ?? 0,
      whiteCostumePortraitOffsetYPercent: white.costumeSnapshot?.portraitOffsetYPercent ?? 0,
      resultText: room.game.winner?.text ?? "对局结束",
      winnerColor: resultMetadata.winnerColor,
      resultReason: resultMetadata.resultReason,
      rated,
      matchSource,
      blackRatingDelta: settlement[COLORS.black].rating,
      whiteRatingDelta: settlement[COLORS.white].rating,
      blackCoinsDelta: settlement[COLORS.black].coins,
      whiteCoinsDelta: settlement[COLORS.white].coins,
      blackRankDelta: settlement[COLORS.black].rank,
      whiteRankDelta: settlement[COLORS.white].rank,
      moveCount: room.game.moveNumber,
      mode,
      snapshot: JSON.stringify(roomView(room, black.user.id)),
      snapshotVersion: 2
    }
  });

  const winnerColor = resultMetadata.winnerColor;
  if (![COLORS.black, COLORS.white].includes(winnerColor)) {
    const before = new Map([
      [black.color, playerProgressSnapshot(black, mode)],
      [white.color, playerProgressSnapshot(white, mode)]
    ]);
    if (rated) {
      const antiBoostMultiplier = repeatOpponentMultiplier({ black, white, mode, rules: ratingRules });
      applyRatedRewards([
        { player: black, opponent: white, recordDelta: { draws: 1 } },
        { player: white, opponent: black, recordDelta: { draws: 1 } }
      ], null, { mode, ratingRules, antiBoostMultiplier });
    } else {
      applyUnratedReward({ player: black, outcome: "draw", rules: ratingRules });
      applyUnratedReward({ player: white, outcome: "draw", rules: ratingRules });
    }
    fillSettlement(settlement, black, before.get(black.color), mode);
    fillSettlement(settlement, white, before.get(white.color), mode);
    attachResultRewards(room, settlement, { rated, matchSource });

    const operations = [
      createRecord(),
      ...(rated ? [
        prisma.userModeStats.upsert(modeStatsUpsertOperation(black, mode, {
          ratingDelta: settlement[black.color].rating,
          drawsDelta: 1
        })),
        prisma.userModeStats.upsert(modeStatsUpsertOperation(white, mode, {
          ratingDelta: settlement[white.color].rating,
          drawsDelta: 1
        }))
      ] : []),
      ...userUpdateOperations(prisma, black, mode, settlement[black.color], {}, candyEffectData(black, candyEffectUpdates)),
      ...userUpdateOperations(prisma, white, mode, settlement[white.color], {}, candyEffectData(white, candyEffectUpdates)),
      ...progressLedgerCreateOperations(prisma, [
        ...gameResultProgressEntries(black, before.get(black.color), room.code),
        ...gameResultProgressEntries(white, before.get(white.color), room.code)
      ]),
      ...candyEffectAssetOperations()
    ];
    await prisma.$transaction(operations);
    if (rated) noteRatedPair({ black, white, mode });
    return;
  }

  const winner = winnerColor === COLORS.black ? black : white;
  const loser = winner.color === COLORS.black ? white : black;
  const before = new Map([
    [winner.color, playerProgressSnapshot(winner, mode)],
    [loser.color, playerProgressSnapshot(loser, mode)]
  ]);
  if (rated) {
    const antiBoostMultiplier = repeatOpponentMultiplier({ black, white, mode, rules: ratingRules });
    applyRatedRewards([
      { player: winner, opponent: loser, recordDelta: { wins: 1 } },
      { player: loser, opponent: winner, recordDelta: { losses: 1 } }
    ], winnerColor, { mode, ratingRules, antiBoostMultiplier });
  } else {
    applyUnratedReward({ player: winner, outcome: "win", rules: ratingRules });
    applyUnratedReward({ player: loser, outcome: "loss", rules: ratingRules });
  }
  fillSettlement(settlement, winner, before.get(winner.color), mode);
  fillSettlement(settlement, loser, before.get(loser.color), mode);
  attachResultRewards(room, settlement, { rated, matchSource });

  await prisma.$transaction([
    createRecord(),
    ...(rated ? [
      prisma.userModeStats.upsert(modeStatsUpsertOperation(winner, mode, {
        ratingDelta: settlement[winner.color].rating,
        winsDelta: 1
      })),
      prisma.userModeStats.upsert(modeStatsUpsertOperation(loser, mode, {
        ratingDelta: settlement[loser.color].rating,
        lossesDelta: 1
      }))
    ] : []),
    ...userUpdateOperations(prisma, winner, mode, settlement[winner.color], { winsDelta: rated ? 1 : 0 }, candyEffectData(winner, candyEffectUpdates)),
    ...userUpdateOperations(prisma, loser, mode, settlement[loser.color], { lossesDelta: rated ? 1 : 0 }, candyEffectData(loser, candyEffectUpdates)),
    ...progressLedgerCreateOperations(prisma, [
      ...gameResultProgressEntries(winner, before.get(winner.color), room.code),
      ...gameResultProgressEntries(loser, before.get(loser.color), room.code)
    ]),
    ...candyEffectAssetOperations()
  ]);
  if (rated) noteRatedPair({ black, white, mode });
}

function applyRatedRewards(entries, winnerColor, { mode, ratingRules, antiBoostMultiplier }) {
  const rewards = entries.map(({ player, opponent }) => resultRewardDelta(player.color, winnerColor, {
    self: modeStatsForUser(player.user, mode),
    opponent: modeStatsForUser(opponent.user, mode),
    rules: ratingRules,
    antiBoostMultiplier
  }));
  entries.forEach(({ player, recordDelta }, index) => {
    player.user = applyUserReward(player.user, rewards[index], recordDelta, { mode, rules: ratingRules });
  });
}

function applyUnratedReward({ player, outcome, rules }) {
  const rewardLimitReached = privateRewardLimitReached({ player, rules });
  const reward = {
    outcome,
    rating: 0,
    coins: rewardLimitReached ? 0 : privateCoinsForOutcome(outcome, rules),
    rewardLimitReached
  };
  player.user = {
    ...player.user,
    coins: Number(player.user.coins ?? 0) + reward.coins,
    privateRewardLimitReached: reward.rewardLimitReached
  };
  notePrivateReward(player);
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
      delta: modeRatingForPlayer(player, before.mode ?? "spark") - Number(before.rating ?? 0),
      beforeValue: before.rating,
      afterValue: modeRatingForPlayer(player, before.mode ?? "spark"),
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

function emptySettlement() {
  return {
    [COLORS.black]: { rating: 0, coins: 0, rank: 0, rewardLimitReached: false },
    [COLORS.white]: { rating: 0, coins: 0, rank: 0, rewardLimitReached: false }
  };
}

function fillSettlement(settlement, player, before, mode) {
  const currentStats = modeStatsForUser(player.user, mode);
  settlement[player.color] = {
    rating: Number(currentStats.rating ?? 0) - Number(before.rating ?? 0),
    coins: Number(player.user.coins ?? 0) - Number(before.coins ?? 0),
    rank: rankToStep(currentStats.rank) - Number(before.rankStep ?? rankToStep(currentStats.rank)),
    rewardLimitReached: Boolean(player.user.privateRewardLimitReached)
  };
}

function attachResultRewards(room, settlement, { rated, matchSource }) {
  room.rated = rated;
  room.matchSource = matchSource;
  room.game.resultRewards = Object.fromEntries(room.players.map((player) => [
    player.user.id,
    {
      ...settlement[player.color],
      outcome: outcomeForPlayer(player.color, room.game.winner?.winnerColor),
      rated,
      matchSource
    }
  ]));
  for (const player of room.players) {
    delete player.user.privateRewardLimitReached;
  }
}

function userUpdateOperations(prisma, player, mode, settlement, recordDelta = {}, extraData = {}) {
  const data = {
    ...(mode === "spark" && recordDelta.winsDelta ? { wins: { increment: recordDelta.winsDelta } } : {}),
    ...(mode === "spark" && recordDelta.lossesDelta ? { losses: { increment: recordDelta.lossesDelta } } : {}),
    ...(mode === "spark" && settlement.rating ? { rating: { increment: settlement.rating }, rank: player.user.rank } : {}),
    ...(mode === "spark" && settlement.rank && !settlement.rating ? { rank: player.user.rank } : {}),
    ...(settlement.coins ? { coins: { increment: settlement.coins } } : {}),
    ...extraData
  };
  if (!Object.keys(data).length) return [];
  return [prisma.user.update({
    where: { id: player.user.id },
    data
  })];
}

function playerProgressSnapshot(player, mode) {
  const stats = modeStatsForUser(player.user, mode);
  return {
    mode,
    rating: Number(stats.rating ?? 0),
    rankStep: rankToStep(stats.rank),
    coins: Number(player.user.coins ?? 0)
  };
}

function modeRatingForPlayer(player, mode) {
  return Number(modeStatsForUser(player.user, mode).rating ?? player.user.rating ?? 0);
}

function loadRatingRules() {
  return ratingRulesFromSettings(getCachedPublicSiteSettings());
}

const ratedPairHistory = [];
const privateRewardUsage = new Map();

function repeatOpponentMultiplier({ black, white, mode, rules }) {
  if (!rules.antiBoost.enabled) return 1;
  const since = Date.now() - rules.antiBoost.windowHours * 60 * 60 * 1000;
  pruneRatedPairHistory(since);
  const key = pairKey(black.user.id, white.user.id, mode);
  const repeatCount = ratedPairHistory.filter((entry) => entry.key === key).length;
  return antiBoostMultiplierForRepeatCount(repeatCount, rules);
}

function noteRatedPair({ black, white, mode }) {
  ratedPairHistory.push({ key: pairKey(black.user.id, white.user.id, mode), at: Date.now() });
}

function pruneRatedPairHistory(since) {
  while (ratedPairHistory.length && ratedPairHistory[0].at < since) {
    ratedPairHistory.shift();
  }
}

function pairKey(firstUserId, secondUserId, mode) {
  return [mode, ...[firstUserId, secondUserId].sort()].join(":");
}

function privateRewardLimitReached({ player, rules }) {
  const limit = rules.privateRewards.dailyRewardLimit;
  if (limit <= 0) return true;
  return (privateRewardUsage.get(privateRewardKey(player.user.id)) ?? 0) >= limit;
}

function notePrivateReward(player) {
  const key = privateRewardKey(player.user.id);
  privateRewardUsage.set(key, (privateRewardUsage.get(key) ?? 0) + 1);
}

function privateRewardKey(userId, now = new Date()) {
  const offsetMs = 8 * 60 * 60 * 1000;
  const dayKey = new Date(now.getTime() + offsetMs).toISOString().slice(0, 10);
  return `${dayKey}:${userId}`;
}

export function serverDayRange(now) {
  const offsetMs = 8 * 60 * 60 * 1000;
  const shifted = new Date(now.getTime() + offsetMs);
  const dayKey = shifted.toISOString().slice(0, 10);
  const startUtc = new Date(`${dayKey}T00:00:00.000Z`).getTime() - offsetMs;
  return {
    start: new Date(startUtc),
    end: new Date(startUtc + 24 * 60 * 60 * 1000)
  };
}
