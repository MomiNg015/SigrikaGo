import { describe, expect, test, vi } from "vitest";
import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import {
  applyDrawResultToRoomUser,
  gameResultProgressEntries,
  modeStatsUpsertOperation,
  saveGameRecord
} from "./roomResultPersistence.js";
import { createRoom, createSigrikaCandyDuelRoom } from "./roomFactory.js";

function roomPlayer(color, overrides = {}) {
  return {
    color,
    characterId: `${color}-character`,
    user: {
      id: `${color}-user`,
      username: `${color}-name`,
      rating: 1000,
      rank: "3段",
      wins: 1,
      losses: 2,
      coins: 0,
      modeStats: {},
      ...overrides.user
    },
    ...overrides
  };
}

function fakePrisma() {
  return {
    gameRecord: { create: vi.fn() },
    userModeStats: { upsert: vi.fn() },
    user: { update: vi.fn() },
    userCharacter: { upsert: vi.fn() },
    userProgressLedger: { create: vi.fn() },
    userItemEffect: {
      deleteMany: vi.fn(),
      upsert: vi.fn()
    },
    $transaction: vi.fn((operations) => Promise.all(operations))
  };
}

describe("roomResultPersistence", () => {
  test("distant matchmaking uses friendly rewards without changing rank or record counters", async () => {
    const prisma = fakePrisma();
    const room = createRoom(
      { user: { id: "friendly-high", username: "high", selectedCharacter: "sigrika", rank: "9段", rating: 1000, stars: 0, wins: 7, losses: 3 } },
      { user: { id: "friendly-low", username: "low", selectedCharacter: "sigrika", rank: "3段", rating: 0, stars: 4, wins: 4, losses: 2 } },
      { rated: false, matchSource: "matchmaking", random: () => 0.75 }
    );
    const before = room.players.map(({ user }) => ({ rank: user.rank, stars: user.stars, rating: user.rating, wins: user.wins, losses: user.losses }));
    room.game.phase = GAME_PHASES.finished;
    room.game.winner = { winnerColor: COLORS.black, text: "黑胜" };
    await saveGameRecord({ prisma, room });
    room.players.forEach(({ user }, index) => expect(user).toMatchObject(before[index]));
    expect(prisma.userModeStats.upsert).not.toHaveBeenCalled();
    expect(prisma.gameRecord.create).toHaveBeenCalledWith({ data: expect.objectContaining({ rated: false, matchSource: "matchmaking", blackRatingDelta: 0, whiteRatingDelta: 0, blackCoinsDelta: 20, whiteCoinsDelta: 10 }) });
  });

  function promotionRoom(mode = "spark") {
    const players = ["winner", "loser"].map((id) => ({ user: {
      id, username: id, selectedCharacter: "sigrika", rank: "5段", stars: 6, rating: 0,
      ownedCharacters: ["sigrika"], modeStats: {
        spark: { rank: "5段", stars: 6, rating: 0 },
        standard: { rank: "5段", stars: 6, rating: 0 }
      }
    } }));
    const room = createRoom(...players, { random: () => 0.75, modeInput: mode });
    room.game.phase = GAME_PHASES.finished;
    room.game.winner = { winnerColor: COLORS.black, text: "黑胜" };
    return room;
  }

  test("shares concurrent settlement and permanently awards the spark six-dan unlock", async () => {
    const prisma = fakePrisma();
    const room = promotionRoom();
    await Promise.all([saveGameRecord({ prisma, room }), saveGameRecord({ prisma, room })]);
    await saveGameRecord({ prisma, room });
    expect(prisma.gameRecord.create).toHaveBeenCalledTimes(1);
    expect(room.players[0].user).toMatchObject({ rank: "6段", stars: 3, rating: 0 });
    expect(room.players[0].user.ownedCharacters).toContain("nabomo");
    expect(prisma.userCharacter.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: { userId: "winner", characterSlug: "nabomo", source: "rank" }
    }));
    expect(room.players[0].user.modeStats.standard).toMatchObject({ rank: "5段", stars: 6 });
  });

  test("restores in-memory progress on transaction failure so retry advances only once", async () => {
    const prisma = fakePrisma();
    prisma.$transaction.mockRejectedValueOnce(new Error("database busy"));
    const room = promotionRoom();
    await expect(saveGameRecord({ prisma, room })).rejects.toThrow("database busy");
    expect(room.recordSaved).toBe(false);
    expect(room.players[0].user).toMatchObject({ rank: "5段", stars: 6 });
    expect(room.players[0].user.ownedCharacters).not.toContain("nabomo");
    await saveGameRecord({ prisma, room });
    expect(room.players[0].user).toMatchObject({ rank: "6段", stars: 3 });
    expect(room.game.resultRewards.winner).toMatchObject({ rankAfter: "6段", starsAfter: 3 });
  });

  test("standard promotion neither changes spark progression nor unlocks Nabomo", async () => {
    const prisma = fakePrisma();
    const room = promotionRoom("standard");
    await saveGameRecord({ prisma, room });
    expect(room.players[0].user.modeStats.standard).toMatchObject({ rank: "6段", stars: 3 });
    expect(room.players[0].user.modeStats.spark).toMatchObject({ rank: "5段", stars: 6 });
    expect(prisma.userCharacter.upsert).not.toHaveBeenCalled();
  });

  test("does not create records or rewards for practice rooms", async () => {
    const prisma = fakePrisma();
    const room = {
      recordSaved: false,
      recordPolicy: "none",
      matchSource: "practice",
      game: { phase: GAME_PHASES.finished, winner: { winnerColor: COLORS.black } },
      players: [roomPlayer(COLORS.black), roomPlayer(COLORS.white)]
    };

    await saveGameRecord({ prisma, room });

    expect(room.recordSaved).toBe(true);
    expect(room.game.resultRewards).toBeNull();
    expect(prisma.gameRecord.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test.each([
    { mode: "spark" }, { mode: "standard" }, { mode: "gomoku" }, { mode: "team" },
    { mode: "spark", matchSource: "practice" },
    { mode: "spark", matchSource: "sigrika-corruption-duel" },
    { mode: "spark", practice: { challenge: "capture-challenge" } }
  ])("marks invalid finished rooms as saved before all mode branches: %j", async (options) => {
    const prisma = fakePrisma();
    const room = {
      ...options,
      recordSaved: false,
      game: {
        phase: GAME_PHASES.finished,
        winner: { invalid: true }
      },
      players: []
    };

    await saveGameRecord({ prisma, room });

    expect(room.recordSaved).toBe(true);
    expect(room.game.resultRewards).toBeNull();
    expect(prisma.gameRecord.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test("saves a Sigrika duel replay and arc outcome without rewards or mode stats", async () => {
    const prisma = fakePrisma();
    const room = createSigrikaCandyDuelRoom({
      user: {
        id: "human",
        username: "测试玩家",
        rank: "3段",
        rating: 1000,
        selectedCharacter: "sigrika",
        characterConfig: null,
        modeStats: {}
      },
      socketId: "socket-human",
      mode: "spark"
    }, { random: () => 0.75 });
    room.game.phase = GAME_PHASES.finished;
    room.game.moveNumber = 42;
    room.game.winner = { winnerColor: room.sigrikaCandyDuel.humanColor, reason: "score", text: "黑胜" };

    await saveGameRecord({ prisma, room });

    expect(room.recordSaved).toBe(true);
    expect(room.game.resultRewards).toBeNull();
    expect(room.sigrikaCandyDuel.resultOutcome).toBe("win");
    expect(room.sigrikaCandyDuel.resultHook).toMatchObject({
      event: "sigrika-candy-duel-win",
      userId: "human"
    });
    expect(prisma.gameRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        matchSource: "sigrika-corruption-duel",
        rated: false,
        blackRatingDelta: 0,
        whiteRatingDelta: 0,
        blackCoinsDelta: 0,
        whiteCoinsDelta: 0
      })
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "human" },
      data: expect.objectContaining({
        sigrikaCandyPhase: "result-pending",
        sigrikaCandyOutcome: "win"
      })
    });
    expect(prisma.userModeStats.upsert).not.toHaveBeenCalled();
    expect(prisma.userProgressLedger.create).not.toHaveBeenCalled();
  });

  test("applies draw results to in-room mode stats", () => {
    const player = roomPlayer(COLORS.black, {
      user: {
        modeStats: {
          standard: {
            rating: 1200,
            rank: "4段",
            wins: 3,
            losses: 4,
            draws: 5
          }
        }
      }
    });

    applyDrawResultToRoomUser(player, "standard");

    expect(player.user.modeStats.standard).toMatchObject({
      rating: 1200,
      rank: "4段",
      wins: 3,
      losses: 4,
      draws: 6
    });
  });

  test("builds mode-stats upsert operations from room players", () => {
    const player = roomPlayer(COLORS.white, {
      user: {
        id: "player-1",
        rating: 1050,
        rank: "5段",
        wins: 7,
        losses: 8,
        modeStats: {
          standard: {
            rating: 1300,
            rank: "6段", stars: 2,
            recentResults: ["win", "loss"],
            wins: 9,
            losses: 10,
            draws: 11
          }
        }
      }
    });

    expect(modeStatsUpsertOperation(player, "standard", {
      ratingDelta: 20,
      winsDelta: 1
    })).toEqual({
      where: { userId_mode: { userId: "player-1", mode: "standard" } },
      create: {
        userId: "player-1",
        mode: "standard",
        rating: 1300,
        rank: "6段", stars: 2,
        recentResults: "win,loss",
        wins: 9,
        losses: 10,
        draws: 11
      },
      update: {
        rating: 1300,
        rank: "6段", stars: 2,
        recentResults: "win,loss",
        wins: { increment: 1 }
      }
    });
  });

  test("builds rating and coin progress ledger entries", () => {
    const player = roomPlayer(COLORS.black, {
      user: {
        id: "winner",
        rating: 1020,
        coins: 50
      }
    });

    expect(gameResultProgressEntries(player, { rating: 1000, coins: 0 }, "12345")).toEqual([
      {
        userId: "winner",
        metric: "rating",
        delta: 20,
        beforeValue: 1000,
        afterValue: 1020,
        reason: "game.result",
        refType: "room",
        refId: "12345"
      },
      {
        userId: "winner",
        metric: "coins",
        delta: 50,
        beforeValue: 0,
        afterValue: 50,
        reason: "game.result",
        refType: "room",
        refId: "12345"
      }
    ]);
  });
});
