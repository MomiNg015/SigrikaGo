import { describe, expect, it, vi } from "vitest";
import {
  ensureAchievementSchema,
  listAchievementsForUser,
  updateAchievementEquipment
} from "./achievements.js";

describe("achievements", () => {
  it("creates compatibility tables and source columns idempotently", async () => {
    const executed = [];
    const queried = [];
    const client = {
      $queryRawUnsafe: async (sql) => {
        queried.push(sql);
        return [];
      },
      $executeRawUnsafe: async (sql) => {
        executed.push(sql);
      }
    };

    await ensureAchievementSchema(client);

    expect(queried).toContain('PRAGMA table_info("Character")');
    expect(executed).toEqual(expect.arrayContaining([
      expect.stringContaining('ALTER TABLE "Character" ADD COLUMN "source"'),
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "Achievement"'),
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "UserAchievement"'),
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "UserAchievementEquipment"')
    ]));
  });

  it("lists active achievements with per-user achieved state", async () => {
    const prisma = {
      user: {
        findUnique: vi.fn(async () => baseUser())
      },
      achievement: {
        findMany: vi.fn(async () => [sampleAchievement()]),
        count: vi.fn(async () => 1)
      },
      userAchievement: {
        findMany: vi.fn(async () => [{
          id: "ua-1",
          userId: "user-1",
          achievementId: "ach-1",
          achievedAt: new Date("2026-06-13T08:00:00.000Z"),
          rewardGrantedAt: new Date("2026-06-13T08:00:00.000Z")
        }])
      },
      achievementCounter: {
        findMany: vi.fn(async () => [])
      },
      gameRecord: {
        findMany: vi.fn(async () => [])
      }
    };

    const result = await listAchievementsForUser({ prisma, userId: "user-1" });

    expect(result.achievements[0]).toMatchObject({
      id: "ach-1",
      name: "初次登场",
      achieved: true,
      reward: { name: "新人称号" }
    });
  });

  it("rejects equipment assets the user has not unlocked", async () => {
    const prisma = {
      userAchievement: {
        findMany: vi.fn(async () => [])
      }
    };

    await expect(updateAchievementEquipment({
      prisma,
      userId: "user-1",
      body: { titleAssetId: "locked-title" }
    })).rejects.toMatchObject({
      status: 400,
      message: "title asset is not unlocked"
    });
  });
});

function baseUser() {
  return {
    id: "user-1",
    username: "Moming",
    rating: 1000,
    wins: 0,
    losses: 0,
    coins: 300,
    blueGems: 0,
    ownedCharacters: "sigrika",
    ownedDecorations: "",
    ownedItems: "",
    ownedMusicIds: "",
    itemEffects: "",
    musicSelections: "{}",
    modeStats: []
  };
}

function sampleAchievement() {
  return {
    id: "ach-1",
    key: "first-entry",
    name: "初次登场",
    content: "完成一次对局",
    conditionType: "total_games",
    conditionParams: "{\"value\":1}",
    enabled: true,
    deletedAt: null,
    sortOrder: 0,
    rewardAsset: {
      id: "reward-1",
      type: "title",
      name: "新人称号",
      description: "",
      imageUrl: "",
      text: "",
      targetType: "",
      targetId: "",
      amount: 0,
      enabled: true,
      deletedAt: null,
      sortOrder: 0
    }
  };
}
