import { createHash } from "node:crypto";
import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import { isCaptureChallenge } from "../src/shared/captureChallenge.js";
import { saveCaptureChallengeResult } from "./captureChallenge.js";
import { PRACTICE_MATCH_SOURCE, PRACTICE_RECORD_POLICY } from "../src/shared/practiceMode.js";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { DEFAULT_RANK, normalizeRank, rankToStep, serializeRecentResults } from "../src/shared/rankProgression.js";
import {
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
  SIGRIKA_CANDY_DUEL,
  SIGRIKA_CANDY_OUTCOMES
} from "../src/shared/sigrikaCandyArc.js";
import { sigrikaCandyResultData } from "./sigrikaCandyArc.js";
import {
  PROGRESS_METRICS,
  PROGRESS_REASONS,
  progressLedgerCreateOperations
} from "./userProgressLedger.js";

const pendingResults = new WeakMap();

export function saveGameRecord({ prisma, room }) {
  if (pendingResults.has(room)) return pendingResults.get(room);
  if (room.recordSaved || room.game.phase !== GAME_PHASES.finished) return Promise.resolve();
  if (room.game.winner?.invalid) {
    room.recordSaved = true;
    room.game.resultRewards = null;
    return Promise.resolve();
  }
  room.settlementId ??= legacySettlementId(room);
  const operation = settleRoom({ prisma, room }).finally(() => pendingResults.delete(room));
  pendingResults.set(room, operation);
  return operation;
}

function legacySettlementId(room) {
  return createHash("sha256").update(JSON.stringify([
    room.code, room.createdAt, room.players.map((player) => player.user.id)
  ])).digest("hex");
}

async function settleRoom({ prisma, room }) {
  const suppressRecord = isCaptureChallenge(room) || room.game.winner?.invalid || room.recordPolicy === PRACTICE_RECORD_POLICY || room.matchSource === PRACTICE_MATCH_SOURCE;
  const previous = suppressRecord ? null : await prisma.gameRecord.findUnique({ where: { settlementId: room.settlementId } });
  if (previous) return publishReceipt(room, previous.settlementState);
  // Reward calculations must never be visible or persisted before the transaction commits.
  const staged = { ...room, players: structuredClone(room.players), game: structuredClone(room.game),
    sigrikaCandyDuel: room.sigrikaCandyDuel ? structuredClone(room.sigrikaCandyDuel) : null,
    practice: room.practice ? structuredClone(room.practice) : null };
  staged.candyEffectUpdates = room.candyEffectUpdates?.map((entry) => ({
    ...entry, player: staged.players.find((player) => player.user.id === entry.player.user.id)
  }));
  // Prisma Client is itself a Proxy: inherited assignments can mutate the real client.
  const gameRecord = prisma.gameRecord;
  const settlementRecord = {
    create: ({ data }) => gameRecord.create({ data: {
      ...data, settlementId: room.settlementId, settlementState: receiptState(staged, room)
    } })
  };
  const settlementPrisma = new Proxy({}, {
    get(_target, key) {
      if (key === "gameRecord") return settlementRecord;
      const value = prisma[key];
      return typeof value === "function" ? value.bind(prisma) : value;
    }
  });
  try {
    await saveGameRecordOnce({ prisma: settlementPrisma, room: staged });
  } catch (error) {
    if (error.code !== "P2002") throw error;
    const committed = await prisma.gameRecord.findUnique({ where: { settlementId: room.settlementId } });
    if (!committed) throw error;
    return publishReceipt(room, committed.settlementState);
  }
  if (!staged.recordSaved) return;
  publishReceipt(room, receiptState(staged, room));
  if (staged.rated === false && !staged.sigrikaCandyDuel && !staged.practice) {
    staged.players.forEach(notePrivateReward);
  }
}

function receiptState(staged, original) {
  return JSON.stringify({
    players: staged.players.map((player, index) => ({
      id: player.user.id,
      userChanges: Object.fromEntries(Object.entries(player.user).filter(([key, value]) => (
        JSON.stringify(value) !== JSON.stringify(original.players[index].user[key])
      ))),
      completedItemEffects: player.completedItemEffects ?? null
    })),
    resultRewards: staged.game.resultRewards ?? null,
    sigrikaCandyDuel: staged.sigrikaCandyDuel,
    practice: staged.practice
  });
}

function publishReceipt(room, state) {
  const receipt = JSON.parse(state);
  for (const entry of receipt.players) {
    const player = room.players.find((candidate) => candidate.user.id === entry.id);
    if (!player) continue;
    player.user = { ...player.user, ...entry.userChanges };
    player.completedItemEffects = entry.completedItemEffects;
  }
  room.game.resultRewards = receipt.resultRewards;
  if (receipt.sigrikaCandyDuel) room.sigrikaCandyDuel = receipt.sigrikaCandyDuel;
  if (receipt.practice) room.practice = receipt.practice;
  room.recordSaved = true;
}

async function saveGameRecordOnce({ prisma, room }) {
  if (room.recordSaved || room.game.phase !== GAME_PHASES.finished) return;
  if (room.game.winner?.invalid) {
    room.recordSaved = true;
    room.game.resultRewards = null;
    return;
  }
  if (isCaptureChallenge(room)) return saveCaptureChallengeResult({ prisma, room });
  if (room.recordPolicy === PRACTICE_RECORD_POLICY || room.matchSource === PRACTICE_MATCH_SOURCE) {
    room.recordSaved = true;
    room.game.resultRewards = null;
    return;
  }
  if (room.matchSource === SIGRIKA_CANDY_DUEL.matchSource) {
    await saveSigrikaCandyDuelRecord({ prisma, room });
    return;
  }
  if (room.mode === "team") {
    await saveTeamGameRecord({ prisma, room });
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
      applyRatedRewards([
        { player: black, opponent: white, recordDelta: { draws: 1 } },
        { player: white, opponent: black, recordDelta: { draws: 1 } }
      ], null, { mode, ratingRules });
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
    return;
  }

  const winner = winnerColor === COLORS.black ? black : white;
  const loser = winner.color === COLORS.black ? white : black;
  const before = new Map([
    [winner.color, playerProgressSnapshot(winner, mode)],
    [loser.color, playerProgressSnapshot(loser, mode)]
  ]);
  if (rated) {
    applyRatedRewards([
      { player: winner, opponent: loser, recordDelta: { wins: 1 } },
      { player: loser, opponent: winner, recordDelta: { losses: 1 } }
    ], winnerColor, { mode, ratingRules });
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
}

async function saveTeamGameRecord({ prisma, room }) {
  const black = room.players.find((p) => p.color === COLORS.black);
  const white = room.players.find((p) => p.color === COLORS.white);
  if (!black || !white) return;
  room.recordSaved = true;
  room.game.resultRewards = null;
  try {
    await prisma.gameRecord.create({ data: {
      roomCode: room.code, blackUserId: black.user.id, whiteUserId: white.user.id,
      blackName: black.user.username, whiteName: white.user.username,
      blackCharacter: black.characterId, whiteCharacter: white.characterId,
      resultText: room.game.winner?.text ?? "对局结束",
      ...gameResultMetadata(room.game.winner),
      rated: false, matchSource: "team", mode: "team", moveCount: room.game.moveNumber,
      snapshot: JSON.stringify(roomView(room, black.user.id)), snapshotVersion: 2
    } });
  } catch (error) {
    room.recordSaved = false;
    throw error;
  }
}

async function saveSigrikaCandyDuelRecord({ prisma, room }) {
  const black = room.players.find((player) => player.color === COLORS.black);
  const white = room.players.find((player) => player.color === COLORS.white);
  const human = room.players.find((player) => player.user.id === room.sigrikaCandyDuel?.ownerUserId);
  if (!black || !white || !human || ![COLORS.black, COLORS.white].includes(room.game.winner?.winnerColor)) return;
  const outcome = room.game.winner.winnerColor === human.color
    ? SIGRIKA_CANDY_OUTCOMES.win
    : SIGRIKA_CANDY_OUTCOMES.loss;
  room.sigrikaCandyDuel.resultOutcome = outcome;
  room.sigrikaCandyDuel.achievementHooks[outcome] = true;
  room.sigrikaCandyDuel.resultHook = {
    event: `sigrika-candy-duel-${outcome}`,
    userId: human.user.id,
    roomCode: room.code
  };
  human.user = {
    ...human.user,
    sigrikaCandyArc: {
      ...(human.user.sigrikaCandyArc ?? {}),
      phase: "result-pending",
      outcome,
      roomCode: room.code,
      corrupted: true,
      active: true
    }
  };
  room.recordSaved = true;
  try {
    await prisma.$transaction([
      prisma.gameRecord.create({
        data: {
          roomCode: room.code,
          blackUserId: black.user.id,
          whiteUserId: white.user.id,
          blackName: black.user.username,
          whiteName: white.user.username,
          blackCharacter: "",
          whiteCharacter: "",
          blackCostumeId: "",
          whiteCostumeId: "",
          blackCostumePortraitUrl: "",
          whiteCostumePortraitUrl: "",
          blackCostumePortraitScalePercent: 100,
          whiteCostumePortraitScalePercent: 100,
          blackCostumePortraitOffsetXPercent: 0,
          whiteCostumePortraitOffsetXPercent: 0,
          blackCostumePortraitOffsetYPercent: 0,
          whiteCostumePortraitOffsetYPercent: 0,
          resultText: room.game.winner.text ?? "对局结束",
          winnerColor: room.game.winner.winnerColor,
          resultReason: room.game.winner.reason ?? "",
          rated: false,
          matchSource: SIGRIKA_CANDY_DUEL.matchSource,
          blackRatingDelta: 0,
          whiteRatingDelta: 0,
          blackCoinsDelta: 0,
          whiteCoinsDelta: 0,
          blackRankDelta: 0,
          whiteRankDelta: 0,
          moveCount: room.game.moveNumber,
          mode: "spark",
          snapshot: JSON.stringify(roomView(room, human.user.id)),
          snapshotVersion: 2
        }
      }),
      prisma.user.update({
        where: { id: human.user.id },
        data: sigrikaCandyResultData(outcome)
      })
    ]);
  } catch (error) {
    room.recordSaved = false;
    throw error;
  }
  room.game.resultRewards = null;
}

function applyRatedRewards(entries, winnerColor, { mode, ratingRules }) {
  const rewards = entries.map(({ player, opponent }) => resultRewardDelta(player.color, winnerColor, {
    self: modeStatsForUser(player.user, mode),
    opponent: modeStatsForUser(opponent.user, mode),
    rules: ratingRules,
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

export function modeStatsUpsertOperation(player, mode, { winsDelta = 0, lossesDelta = 0, drawsDelta = 0 } = {}) {
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
      rating: Number(player.user.modeStats?.[mode]?.rating ?? player.user.rating ?? 0),
      rank: normalizeRank(player.user.modeStats?.[mode]?.rank ?? player.user.rank ?? DEFAULT_RANK),
      stars: Number(player.user.modeStats?.[mode]?.stars ?? 2),
      recentResults: serializeRecentResults(player.user.modeStats?.[mode]?.recentResults),
      wins: Math.max(0, Number(player.user.modeStats?.[mode]?.wins ?? player.user.wins ?? 0)),
      losses: Math.max(0, Number(player.user.modeStats?.[mode]?.losses ?? player.user.losses ?? 0)),
      draws: Math.max(0, Number(player.user.modeStats?.[mode]?.draws ?? 0))
    },
    update: {
      rating: Number(player.user.modeStats?.[mode]?.rating ?? 0),
      rank: normalizeRank(player.user.modeStats?.[mode]?.rank ?? player.user.rank ?? DEFAULT_RANK),
      stars: Number(player.user.modeStats?.[mode]?.stars ?? 2),
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
    stars: Number(currentStats.stars ?? 2) - Number(before.stars ?? 2),
    rankAfter: currentStats.rank,
    starsAfter: currentStats.stars,
    ratingAfter: currentStats.rating,
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
    ...(mode === "spark" && settlement.rankAfter ? {
      rating: settlement.ratingAfter, rank: settlement.rankAfter, stars: settlement.starsAfter
    } : {}),
    ...(settlement.coins ? { coins: { increment: settlement.coins } } : {}),
    ...extraData
  };
  const earnedNabomo = mode === "spark" && rankToStep(player.user.rank) >= 6;
  const unlockOperations = earnedNabomo && prisma.userCharacter?.upsert ? [prisma.userCharacter.upsert({
    where: { userId_characterSlug: { userId: player.user.id, characterSlug: "nabomo" } },
    create: { userId: player.user.id, characterSlug: "nabomo", source: "rank" },
    update: {}
  })] : [];
  if (earnedNabomo) {
    const owned = new Set(Array.isArray(player.user.ownedCharacters) ? player.user.ownedCharacters : String(player.user.ownedCharacters ?? "").split(",").filter(Boolean));
    owned.add("nabomo");
    data.ownedCharacters = [...owned].join(",");
    player.user.ownedCharacters = [...owned];
  }
  if (!Object.keys(data).length) return unlockOperations;
  return [...unlockOperations, prisma.user.update({
    where: { id: player.user.id },
    data
  })];
}

function playerProgressSnapshot(player, mode) {
  const stats = modeStatsForUser(player.user, mode);
  return {
    mode,
    rating: Number(stats.rating ?? 0),
    stars: Number(stats.stars ?? 2),
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

const privateRewardUsage = new Map();

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
