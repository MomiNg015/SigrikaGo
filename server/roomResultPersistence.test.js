import { describe, expect, test, vi } from "vitest";
import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import {
  applyDrawResultToRoomUser,
  gameResultProgressEntries,
  modeStatsUpsertOperation,
  saveGameRecord
} from "./roomResultPersistence.js";

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
    userProgressLedger: { create: vi.fn() },
    userItemEffect: {
      deleteMany: vi.fn(),
      upsert: vi.fn()
    },
    $transaction: vi.fn((operations) => Promise.all(operations))
  };
}

describe("roomResultPersistence", () => {
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

  test("marks invalid finished rooms as saved without database writes", async () => {
    const prisma = fakePrisma();
    const room = {
      recordSaved: false,
      game: {
        phase: GAME_PHASES.finished,
        winner: { invalid: true }
      },
      players: []
    };

    await saveGameRecord({ prisma, room });

    expect(room.recordSaved).toBe(true);
    expect(prisma.gameRecord.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
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
            rank: "6段",
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
        rank: "6段",
        recentResults: "win,loss",
        wins: 9,
        losses: 10,
        draws: 11
      },
      update: {
        rating: { increment: 20 },
        rank: "6段",
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
