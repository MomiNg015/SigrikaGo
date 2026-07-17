import { describe, expect, it, vi } from "vitest";
import {
  ACHIEVEMENT_TRIGGER_EVENTS,
  ensureAchievementSchema,
  evaluateAchievementsForUser,
  attachAchievementEquipmentAssetsToUsers,
  listAchievementsForUser,
  publicUserWithAchievementEquipment,
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
      expect.stringContaining('ALTER TABLE "Character" ADD COLUMN "cvName"'),
      expect.stringContaining('ALTER TABLE "Character" ADD COLUMN "cvUrl"'),
      expect.stringContaining('ALTER TABLE "ShopItem" ADD COLUMN "illustName"'),
      expect.stringContaining('ALTER TABLE "ShopItem" ADD COLUMN "illustUrl"'),
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

  it("seeds built-in achievements without overwriting existing records", async () => {
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

    expect(rewardCreates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "reward-denia-rainbow-bean-candy-coins",
        type: "currency",
        targetType: "coins",
        amount: 100
      }),
      expect.objectContaining({
        id: "reward-sigrika-spark-100-wins-nameplate",
        type: "nameplate",
        imageUrl: "/assets/achievements/semantic-nameplate.png",
        text: "用户名背景"
      }),
      expect.objectContaining({
        id: "reward-denia-spark-100-wins-nameplate",
        type: "nameplate",
        imageUrl: "/assets/achievements/denia-spark-100-wins-nameplate.png",
        text: "用户名背景"
      }),
      expect.objectContaining({
        id: "reward-aemeath-spark-100-wins-nameplate",
        type: "nameplate",
        imageUrl: "/assets/achievements/aemeath-spark-100-wins-nameplate.png",
        text: "用户名背景"
      })
    ]));
    expect(achievementCreates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "achievement-denia-rainbow-bean-candy",
        key: "denia-rainbow-bean-candy",
        conditionType: "trigger_event",
        rewardAssetId: "reward-denia-rainbow-bean-candy-coins"
      }),
      expect.objectContaining({
        id: "achievement-sigrika-spark-100-wins",
        key: "sigrika-spark-100-wins",
        name: "点亮语义！",
        content: "使用西格莉卡在星炬对弈中获得100胜",
        conditionType: "mode_character_wins",
        rewardAssetId: "reward-sigrika-spark-100-wins-nameplate"
      }),
      expect.objectContaining({
        id: "achievement-denia-spark-100-wins",
        key: "denia-spark-100-wins",
        name: "百次回响",
        content: "使用达妮娅在星炬对弈中获得100胜",
        conditionType: "mode_character_wins",
        rewardAssetId: "reward-denia-spark-100-wins-nameplate"
      }),
      expect.objectContaining({
        id: "achievement-aemeath-spark-100-wins",
        key: "aemeath-spark-100-wins",
        name: "飞行雪绒，出击！",
        content: "使用爱弥斯在星炬对弈中获得100胜",
        conditionType: "mode_character_wins",
        rewardAssetId: "reward-aemeath-spark-100-wins-nameplate"
      })
    ]));
    expect(JSON.parse(achievementCreates.find((achievement) => achievement.key === "denia-rainbow-bean-candy").conditionParams)).toEqual({
      event: ACHIEVEMENT_TRIGGER_EVENTS.deniaRainbowBeanCandy
    });
    expect(JSON.parse(achievementCreates.find((achievement) => achievement.key === "sigrika-spark-100-wins").conditionParams)).toEqual({
      mode: "spark",
      characterId: "sigrika",
      value: 100
    });
    expect(JSON.parse(achievementCreates.find((achievement) => achievement.key === "denia-spark-100-wins").conditionParams)).toEqual({
      mode: "spark",
      characterId: "denia",
      value: 100
    });
    expect(JSON.parse(achievementCreates.find((achievement) => achievement.key === "aemeath-spark-100-wins").conditionParams)).toEqual({
      mode: "spark",
      characterId: "aemeath",
      value: 100
    });

    prisma.achievementRewardAsset.findUnique.mockImplementation(async ({ where }) => (
      rewardCreates.find((asset) => asset.id === where.id) ?? null
    ));
    prisma.achievement.findUnique.mockImplementation(async ({ where }) => (
      achievementCreates.find((achievement) => achievement.key === where.key) ?? null
    ));
    await seedBuiltinAchievements(prisma);

    expect(prisma.achievementRewardAsset.create).toHaveBeenCalledTimes(4);
    expect(prisma.achievement.create).toHaveBeenCalledTimes(4);
  });

  it("marks built-in achievements as achieved for admins by default", async () => {
    const userAchievementCreates = [];
    const prisma = {
      achievementRewardAsset: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }) => data)
      },
      achievement: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }) => data)
      },
      user: {
        findMany: vi.fn(async () => [{ id: "admin-1" }])
      },
      userAchievement: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }) => {
          userAchievementCreates.push(data);
          return { id: `ua-${userAchievementCreates.length}`, ...data };
        })
      }
    };

    await seedBuiltinAchievements(prisma);

    expect(userAchievementCreates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        userId: "admin-1",
        achievementId: "achievement-denia-rainbow-bean-candy"
      }),
      expect.objectContaining({
        userId: "admin-1",
        achievementId: "achievement-sigrika-spark-100-wins"
      }),
      expect.objectContaining({
        userId: "admin-1",
        achievementId: "achievement-denia-spark-100-wins"
      }),
      expect.objectContaining({
        userId: "admin-1",
        achievementId: "achievement-aemeath-spark-100-wins"
      })
    ]));
    expect(userAchievementCreates).toHaveLength(4);
    expect(userAchievementCreates[0].achievedAt).toBeInstanceOf(Date);
    expect(userAchievementCreates[0].rewardGrantedAt).toBe(userAchievementCreates[0].achievedAt);
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

  it("unlocks the Sigrika spark 100 wins nameplate only from spark wins", async () => {
    const achievement = sigrikaSpark100WinsAchievement();
    const userAchievementCreates = [];
    const rewardGrantUpdates = [];
    let gameRecords = [
      ...sparkWins(99),
      {
        blackUserId: "user-1",
        whiteUserId: "op-standard",
        blackCharacter: "sigrika",
        whiteCharacter: "denia",
        winnerColor: "black",
        mode: "standard",
        resultText: ""
      }
    ];
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
          const row = { id: "ua-sigrika", ...data, achievedAt: new Date("2026-06-14T01:00:00.000Z") };
          userAchievementCreates.push(row);
          return row;
        })
      },
      achievementCounter: {
        findMany: vi.fn(async () => [])
      },
      gameRecord: {
        findMany: vi.fn(async () => gameRecords)
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
          update: vi.fn()
        }
      })
    };

    const before = await evaluateAchievementsForUser({ prisma, userId: "user-1" });
    gameRecords = sparkWins(100);
    const after = await evaluateAchievementsForUser({ prisma, userId: "user-1" });

    expect(before).toEqual([]);
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({
      key: "sigrika-spark-100-wins",
      name: "点亮语义！",
      reward: {
        type: "nameplate",
        imageUrl: "/assets/achievements/semantic-nameplate.png",
        text: "用户名背景"
      }
    });
    expect(userAchievementCreates).toHaveLength(1);
    expect(rewardGrantUpdates[0]).toHaveProperty("rewardGrantedAt");
  });

  it("unlocks the Danya spark 100 wins nameplate only from Danya spark wins", async () => {
    const achievement = deniaSpark100WinsAchievement();
    const userAchievementCreates = [];
    const rewardGrantUpdates = [];
    let gameRecords = [
      ...sparkWins(99, "denia"),
      {
        blackUserId: "user-1",
        whiteUserId: "op-standard",
        blackCharacter: "denia",
        whiteCharacter: "sigrika",
        winnerColor: "black",
        mode: "standard",
        resultText: ""
      }
    ];
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
          const row = { id: "ua-denia", ...data, achievedAt: new Date("2026-07-17T01:00:00.000Z") };
          userAchievementCreates.push(row);
          return row;
        })
      },
      achievementCounter: {
        findMany: vi.fn(async () => [])
      },
      gameRecord: {
        findMany: vi.fn(async () => gameRecords)
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
          update: vi.fn()
        }
      })
    };

    const before = await evaluateAchievementsForUser({ prisma, userId: "user-1" });
    gameRecords = sparkWins(100, "denia");
    const after = await evaluateAchievementsForUser({ prisma, userId: "user-1" });

    expect(before).toEqual([]);
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({
      key: "denia-spark-100-wins",
      name: "百次回响",
      reward: {
        type: "nameplate",
        imageUrl: "/assets/achievements/denia-spark-100-wins-nameplate.png",
        text: "用户名背景"
      }
    });
    expect(userAchievementCreates).toHaveLength(1);
    expect(rewardGrantUpdates[0]).toHaveProperty("rewardGrantedAt");
  });

  it("unlocks the Aemeath spark 100 wins nameplate only from Aemeath spark wins", async () => {
    const achievement = aemeathSpark100WinsAchievement();
    const userAchievementCreates = [];
    const rewardGrantUpdates = [];
    let gameRecords = [
      ...sparkWins(99, "aemeath"),
      {
        blackUserId: "user-1",
        whiteUserId: "op-standard",
        blackCharacter: "aemeath",
        whiteCharacter: "sigrika",
        winnerColor: "black",
        mode: "standard",
        resultText: ""
      }
    ];
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
          const created = { id: "ua-aemeath", ...data, achievedAt: new Date("2026-07-17T01:00:00.000Z") };
          userAchievementCreates.push(created);
          return created;
        })
      },
      achievementCounter: {
        findMany: vi.fn(async () => [])
      },
      gameRecord: {
        findMany: vi.fn(async () => gameRecords)
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
          update: vi.fn()
        }
      })
    };

    const before = await evaluateAchievementsForUser({ prisma, userId: "user-1" });
    gameRecords = sparkWins(100, "aemeath");
    const after = await evaluateAchievementsForUser({ prisma, userId: "user-1" });

    expect(before).toEqual([]);
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({
      key: "aemeath-spark-100-wins",
      name: "飞行雪绒，出击！",
      reward: {
        type: "nameplate",
        imageUrl: "/assets/achievements/aemeath-spark-100-wins-nameplate.png",
        text: "用户名背景"
      }
    });
    expect(userAchievementCreates).toHaveLength(1);
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

  it("returns selected nameplate asset payloads after equipment updates", async () => {
    const prisma = {
      userAchievement: {
        findMany: vi.fn(async () => [{
          achievement: {
            rewardAsset: semanticNameplateAsset()
          }
        }])
      },
      userAchievementEquipment: {
        upsert: vi.fn(async ({ create, update }) => ({ ...create, ...update }))
      }
    };

    const result = await updateAchievementEquipment({
      prisma,
      userId: "user-1",
      body: { nameplateAssetId: "reward-sigrika-spark-100-wins-nameplate" }
    });

    expect(result.equipment).toMatchObject({
      nameplateAssetId: "reward-sigrika-spark-100-wins-nameplate"
    });
    expect(result.equipmentAssets.nameplate).toMatchObject({
      id: "reward-sigrika-spark-100-wins-nameplate",
      type: "nameplate",
      imageUrl: "/assets/achievements/semantic-nameplate.png"
    });
  });

  it("includes selected nameplate asset display data in public user payloads", async () => {
    const prisma = {
      userAchievementEquipment: {
        findMany: vi.fn(async () => [{
          userId: "user-1",
          titleAssetId: "",
          badgeAssetId: "",
          nameplateAssetId: "reward-sigrika-spark-100-wins-nameplate"
        }])
      },
      achievement: {
        count: vi.fn(async () => 2)
      },
      userAchievement: {
        count: vi.fn(async () => 1)
      },
      achievementRewardAsset: {
        findMany: vi.fn(async () => [semanticNameplateAsset()])
      }
    };

    const result = await publicUserWithAchievementEquipment({ prisma, user: baseUser() });

    expect(result.achievementEquipment).toMatchObject({
      nameplateAssetId: "reward-sigrika-spark-100-wins-nameplate"
    });
    expect(result.achievementEquipmentAssets.nameplate).toMatchObject({
      id: "reward-sigrika-spark-100-wins-nameplate",
      imageUrl: "/assets/achievements/semantic-nameplate.png"
    });
  });

  it("decorates user lists with selected achievement equipment assets", async () => {
    const prisma = {
      userAchievementEquipment: {
        findMany: vi.fn(async () => [{
          userId: "user-2",
          titleAssetId: "",
          badgeAssetId: "",
          nameplateAssetId: "reward-sigrika-spark-100-wins-nameplate"
        }])
      },
      achievementRewardAsset: {
        findMany: vi.fn(async () => [semanticNameplateAsset()])
      }
    };

    const users = await attachAchievementEquipmentAssetsToUsers(prisma, [
      { id: "user-1", username: "Alice" },
      { id: "user-2", username: "Moming" }
    ]);

    expect(users[0].achievementEquipmentAssets.nameplate).toBeNull();
    expect(users[1].achievementEquipment).toMatchObject({
      nameplateAssetId: "reward-sigrika-spark-100-wins-nameplate"
    });
    expect(users[1].achievementEquipmentAssets.nameplate).toMatchObject({
      id: "reward-sigrika-spark-100-wins-nameplate"
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

function sigrikaSpark100WinsAchievement() {
  return {
    id: "achievement-sigrika-spark-100-wins",
    key: "sigrika-spark-100-wins",
    name: "点亮语义！",
    content: "使用西格莉卡在星炬对弈中获得100胜",
    conditionType: "mode_character_wins",
    conditionParams: JSON.stringify({ mode: "spark", characterId: "sigrika", value: 100 }),
    rewardAssetId: "reward-sigrika-spark-100-wins-nameplate",
    enabled: true,
    deletedAt: null,
    sortOrder: 110,
    rewardAsset: {
      id: "reward-sigrika-spark-100-wins-nameplate",
      type: "nameplate",
      name: "点亮语义！",
      description: "使用西格莉卡在星炬对弈中获得100胜",
      imageUrl: "/assets/achievements/semantic-nameplate.png",
      text: "用户名背景",
      targetType: "",
      targetId: "",
      amount: 0,
      enabled: true,
      deletedAt: null,
      sortOrder: 110
    }
  };
}

function deniaSpark100WinsAchievement() {
  return {
    id: "achievement-denia-spark-100-wins",
    key: "denia-spark-100-wins",
    name: "百次回响",
    content: "使用达妮娅在星炬对弈中获得100胜",
    conditionType: "mode_character_wins",
    conditionParams: JSON.stringify({ mode: "spark", characterId: "denia", value: 100 }),
    rewardAssetId: "reward-denia-spark-100-wins-nameplate",
    enabled: true,
    deletedAt: null,
    sortOrder: 120,
    rewardAsset: {
      id: "reward-denia-spark-100-wins-nameplate",
      type: "nameplate",
      name: "百次回响",
      description: "使用达妮娅在星炬对弈中获得100胜",
      imageUrl: "/assets/achievements/denia-spark-100-wins-nameplate.png",
      text: "用户名背景",
      targetType: "",
      targetId: "",
      amount: 0,
      enabled: true,
      deletedAt: null,
      sortOrder: 120
    }
  };
}

function aemeathSpark100WinsAchievement() {
  return {
    id: "achievement-aemeath-spark-100-wins",
    key: "aemeath-spark-100-wins",
    name: "飞行雪绒，出击！",
    content: "使用爱弥斯在星炬对弈中获得100胜",
    conditionType: "mode_character_wins",
    conditionParams: JSON.stringify({ mode: "spark", characterId: "aemeath", value: 100 }),
    rewardAssetId: "reward-aemeath-spark-100-wins-nameplate",
    enabled: true,
    deletedAt: null,
    sortOrder: 130,
    rewardAsset: {
      id: "reward-aemeath-spark-100-wins-nameplate",
      type: "nameplate",
      name: "飞行雪绒，出击！",
      description: "使用爱弥斯在星炬对弈中获得100胜",
      imageUrl: "/assets/achievements/aemeath-spark-100-wins-nameplate.png",
      text: "用户名背景",
      targetType: "",
      targetId: "",
      amount: 0,
      enabled: true,
      deletedAt: null,
      sortOrder: 130
    }
  };
}

function semanticNameplateAsset() {
  return {
    id: "reward-sigrika-spark-100-wins-nameplate",
    type: "nameplate",
    name: "点亮语义！",
    description: "使用西格莉卡在星炬对弈中获得100胜",
    imageUrl: "/assets/achievements/semantic-nameplate.png",
    text: "用户名背景",
    targetType: "",
    targetId: "",
    amount: 0,
    enabled: true,
    deletedAt: null,
    sortOrder: 110
  };
}

function sparkWins(count, characterId = "sigrika") {
  return Array.from({ length: count }, (_, index) => ({
    blackUserId: "user-1",
    whiteUserId: `op-${index}`,
    blackCharacter: characterId,
    whiteCharacter: characterId === "denia" ? "sigrika" : "denia",
    winnerColor: "black",
    mode: "spark",
    resultText: ""
  }));
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
