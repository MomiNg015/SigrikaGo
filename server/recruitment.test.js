import { describe, expect, it } from "vitest";
import { fastForwardRecruitment, startRecruitment } from "./recruitment.js";
import { RECRUITMENT_ITEM_TYPES } from "../src/shared/recruitment.js";

describe("recruitment", () => {
  it("rejects recruitment immediately when the item has no remaining candidates", async () => {
    const calls = [];
    const user = {
      id: "user-1",
      username: "moming",
      role: "player",
      status: "active",
      rank: "18级",
      rating: 1000,
      wins: 0,
      losses: 0,
      coins: 100,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika,lynae,mornye,chisa",
      ownedItems: `${RECRUITMENT_ITEM_TYPES.campusPoster}:1`,
      ownedDecorations: ""
    };
    const prisma = {
      $transaction: async (callback) => callback(prisma),
      user: {
        findUnique: async () => user,
        update: async (args) => {
          calls.push(["user.update", args]);
          return user;
        }
      },
      recruitmentTask: {
        findFirst: async () => null,
        create: async (args) => {
          calls.push(["recruitmentTask.create", args]);
          return args.data;
        }
      },
      recruitmentMissStreak: {
        findUnique: async () => null
      },
      userCharacter: { upsert: async () => {} },
      userDecoration: { upsert: async () => {} },
      userItem: { upsert: async () => {} },
      userMusicTrack: { upsert: async () => {} }
    };

    await expect(startRecruitment({
      prisma,
      userId: user.id,
      itemType: RECRUITMENT_ITEM_TYPES.campusPoster
    })).rejects.toThrow("好像已经没有可以用该道具招募的角色了");
    expect(calls).toEqual([]);
  });

  it("counts structured owned characters before allowing recruitment", async () => {
    const calls = [];
    const user = {
      id: "user-1",
      username: "moming",
      role: "player",
      status: "active",
      rank: "18级",
      rating: 1000,
      wins: 0,
      losses: 0,
      coins: 100,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika",
      ownedItems: JSON.stringify({ [RECRUITMENT_ITEM_TYPES.radioTicket]: 1 }),
      ownedDecorations: "",
      userCharacters: [
        { characterSlug: "qiuyuan" },
        { characterSlug: "changli" }
      ]
    };
    const prisma = {
      $transaction: async (callback) => callback(prisma),
      user: {
        findUnique: async () => user,
        update: async (args) => {
          calls.push(["user.update", args]);
          return user;
        }
      },
      recruitmentTask: {
        findFirst: async () => null,
        create: async (args) => {
          calls.push(["recruitmentTask.create", args]);
          return args.data;
        }
      },
      recruitmentMissStreak: {
        findUnique: async () => null
      },
      userCharacter: { upsert: async () => {} },
      userDecoration: { upsert: async () => {} },
      userItem: { upsert: async () => {} },
      userMusicTrack: { upsert: async () => {} }
    };

    await expect(startRecruitment({
      prisma,
      userId: user.id,
      itemType: RECRUITMENT_ITEM_TYPES.radioTicket
    })).rejects.toThrow("好像已经没有可以用该道具招募的角色了");
    expect(calls).toEqual([]);
  });

  it("fast-forwards a pending recruitment to five seconds remaining", async () => {
    const now = new Date("2026-06-20T06:00:00.000Z");
    const task = {
      id: "task-1",
      userId: "user-1",
      itemType: RECRUITMENT_ITEM_TYPES.radioTicket,
      status: "pending",
      resultType: "miss",
      resultCharacterSlug: null,
      responseText: "暂时没有回应。",
      startedAt: now,
      readyAt: new Date(now.getTime() + 5 * 60 * 1000),
      claimedAt: null
    };
    const updates = [];
    const prisma = {
      $transaction: async (callback) => callback(prisma),
      recruitmentTask: {
        findFirst: async () => task,
        update: async (args) => {
          updates.push(args);
          return { ...task, ...args.data };
        }
      }
    };

    const response = await fastForwardRecruitment({
      prisma,
      userId: "user-1",
      now,
      env: { NODE_ENV: "development", ENABLE_TEST_ACTIONS: "true" }
    });

    expect(updates).toEqual([expect.objectContaining({
      where: { id: task.id },
      data: { readyAt: new Date(now.getTime() + 5000) }
    })]);
    expect(response.task.status).toBe("pending");
    expect(response.task.remainingMs).toBe(5000);
  });

  it("rejects fast-forward outside enabled development test tools", async () => {
    await expect(fastForwardRecruitment({
      prisma: {},
      userId: "user-1",
      env: { NODE_ENV: "production", ENABLE_TEST_ACTIONS: "true" }
    })).rejects.toThrow("测试工具仅开发环境可用");
  });
});
