import { describe, expect, it, vi } from "vitest";
import {
  ACHIEVEMENT_TRIGGER_EVENTS,
  ensureAchievementSchema,
  evaluateAchievementsForUser,
  listAchievementsForUser,
  seedBuiltinAchievements,
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

  it("seeds the Denia rainbow bean candy achievement without overwriting existing records", async () => {
    const rewardCreates = [];
    const achievementCreates = [];
    const prisma = {
      achievementRewardAsset: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }) => {
          rewardCreates.push(data);
          return data;
        })
      },
      achievement: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }) => {
          achievementCreates.push(data);
          return data;
        })
      }
    };

    await seedBuiltinAchievements(prisma);

    expect(rewardCreates[0]).toMatchObject({
      id: "reward-denia-rainbow-bean-candy-coins",
      type: "currency",
      targetType: "coins",
      amount: 100
    });
    expect(achievementCreates[0]).toMatchObject({
      id: "achievement-denia-rainbow-bean-candy",
      key: "denia-rainbow-bean-candy",
      name: "你给我吃了什么！？",
      content: "请达妮娅吃了彩虹豆豆跳跳糖",
      conditionType: "trigger_event",
      rewardAssetId: "reward-denia-rainbow-bean-candy-coins"
    });
    expect(JSON.parse(achievementCreates[0].conditionParams)).toEqual({
      event: ACHIEVEMENT_TRIGGER_EVENTS.deniaRainbowBeanCandy
    });

    prisma.achievementRewardAsset.findUnique.mockResolvedValueOnce(rewardCreates[0]);
    prisma.achievement.findUnique.mockResolvedValueOnce(achievementCreates[0]);
    await seedBuiltinAchievements(prisma);

    expect(prisma.achievementRewardAsset.create).toHaveBeenCalledTimes(1);
    expect(prisma.achievement.create).toHaveBeenCalledTimes(1);
  });

  it("unlocks Denia rainbow bean candy only from the new trigger event and grants 100 coins", async () => {
    const achievement = deniaRainbowBeanCandyAchievement();
    const userAchievementCreates = [];
    const userUpdates = [];
    const rewardGrantUpdates = [];
    const prisma = {
      user: {
        findUnique: vi.fn(async () => baseUser())
      },
      achievement: {
        findMany: vi.fn(async () => [achievement])
      },
      userAchievement: {
        findMany: vi.fn(async () => []),
        create: vi.fn(async ({ data }) => {
          const row = { id: "ua-1", ...data, achievedAt: new Date("2026-06-14T00:00:00.000Z") };
          userAchievementCreates.push(row);
          return row;
        })
      },
      achievementCounter: {
        findMany: vi.fn(async () => [])
      },
      gameRecord: {
        findMany: vi.fn(async () => [])
      },
      $transaction: async (callback) => callback({
        userAchievement: {
          findUnique: async () => userAchievementCreates[0],
          update: async ({ data }) => {
            rewardGrantUpdates.push(data);
            return { ...userAchievementCreates[0], ...data };
          }
        },
        user: {
          findUnique: async () => baseUser(),
          update: async ({ data }) => {
            userUpdates.push(data);
            return { ...baseUser(), coins: baseUser().coins + 100 };
          }
        }
      })
    };

    const withoutTrigger = await evaluateAchievementsForUser({ prisma, userId: "user-1" });
    const withTrigger = await evaluateAchievementsForUser({
      prisma,
      userId: "user-1",
      triggerEvent: ACHIEVEMENT_TRIGGER_EVENTS.deniaRainbowBeanCandy
    });

    expect(withoutTrigger).toEqual([]);
    expect(withTrigger).toHaveLength(1);
    expect(withTrigger[0]).toMatchObject({
      key: "denia-rainbow-bean-candy",
      name: "你给我吃了什么！？",
      reward: {
        type: "currency",
        targetType: "coins",
        amount: 100
      }
    });
    expect(userAchievementCreates).toHaveLength(1);
    expect(userUpdates).toEqual([{ coins: { increment: 100 } }]);
    expect(rewardGrantUpdates[0]).toHaveProperty("rewardGrantedAt");
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

function deniaRainbowBeanCandyAchievement() {
  return {
    id: "achievement-denia-rainbow-bean-candy",
    key: "denia-rainbow-bean-candy",
    name: "你给我吃了什么！？",
    content: "请达妮娅吃了彩虹豆豆跳跳糖",
    conditionType: "trigger_event",
    conditionParams: JSON.stringify({ event: ACHIEVEMENT_TRIGGER_EVENTS.deniaRainbowBeanCandy }),
    rewardAssetId: "reward-denia-rainbow-bean-candy-coins",
    enabled: true,
    deletedAt: null,
    sortOrder: 100,
    rewardAsset: {
      id: "reward-denia-rainbow-bean-candy-coins",
      type: "currency",
      name: "你给我吃了什么！？奖励",
      description: "",
      imageUrl: "",
      text: "100 金币",
      targetType: "coins",
      targetId: "",
      amount: 100,
      enabled: true,
      deletedAt: null,
      sortOrder: 100
    }
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
