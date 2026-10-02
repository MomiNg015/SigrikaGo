import { describe, expect, it } from "vitest";
import {
  claimRecruitment,
  ensureRecruitmentSchema,
  fastForwardRecruitment,
  getRecruitmentConfig,
  getRecruitmentStatus,
  interruptRecruitmentCinematic,
  startRecruitment,
  updateRecruitmentConfig
} from "./recruitment.js";
import {
  AEMEATH_RECRUITMENT_ASSET_SLOTS,
  AEMEATH_RECRUITMENT_TIMING,
  RECRUITMENT_FAST_FORWARD_TIMING,
  RECRUITMENT_ITEM_TYPES,
  RECRUITMENT_NO_CANDIDATE_MESSAGE
} from "../src/shared/recruitment.js";

describe("recruitment", () => {
  it("adds the persisted fast-forward marker to existing recruitment databases", async () => {
    const executed = [];
    await ensureRecruitmentSchema({
      $executeRawUnsafe: async (sql) => executed.push(sql),
      $queryRawUnsafe: async () => [{ name: "id" }, { name: "readyAt" }]
    });

    expect(executed).toContain('ALTER TABLE "RecruitmentTask" ADD COLUMN "fastForwardedAt" DATETIME');
    expect(executed.join("\n")).toContain('"fastForwardedAt" DATETIME');
  });

  it("inserts the owned memorial ticket between the two normal catalog items", async () => {
    const user = recruitmentUser({
      ownedItems: JSON.stringify({ [RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket]: 1 })
    });
    const prisma = {
      user: { findUnique: async () => user },
      recruitmentTask: { findFirst: async () => null },
      recruitmentMissStreak: { findMany: async () => [] },
      siteSetting: { findUnique: async () => null }
    };

    const withTicket = await getRecruitmentStatus({ prisma, userId: user.id });
    expect(withTicket.items.map((item) => item.itemType)).toEqual([
      RECRUITMENT_ITEM_TYPES.campusPoster,
      RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket,
      RECRUITMENT_ITEM_TYPES.radioTicket
    ]);
    expect(withTicket.items).not.toContainEqual(expect.objectContaining({
      itemType: RECRUITMENT_ITEM_TYPES.magicClock
    }));
    expect(withTicket.utilities).toEqual([expect.objectContaining({
      itemType: RECRUITMENT_ITEM_TYPES.magicClock,
      name: "神奇小钟表",
      quantity: 0
    })]);

    user.ownedItems = "{}";
    const withoutTicket = await getRecruitmentStatus({ prisma, userId: user.id });
    expect(withoutTicket.items.map((item) => item.itemType)).toEqual([
      RECRUITMENT_ITEM_TYPES.campusPoster,
      RECRUITMENT_ITEM_TYPES.radioTicket
    ]);
  });

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

  it("consumes one magic clock and fast-forwards an ordinary recruitment through the six-second presentation", async () => {
    const now = new Date("2026-06-20T06:00:00.000Z");
    const user = recruitmentUser({
      ownedItems: JSON.stringify({ [RECRUITMENT_ITEM_TYPES.magicClock]: 2 })
    });
    const task = {
      id: "task-1",
      userId: user.id,
      itemType: RECRUITMENT_ITEM_TYPES.radioTicket,
      status: "pending",
      resultType: "miss",
      resultCharacterSlug: null,
      responseText: "暂时没有回应。",
      startedAt: now,
      readyAt: new Date(now.getTime() + 5 * 60 * 1000),
      fastForwardedAt: null,
      claimedAt: null
    };
    const updates = [];
    const prisma = {
      $transaction: async (callback) => callback(prisma),
      user: {
        findUnique: async () => user,
        update: async (args) => {
          updates.push(["user.update", args]);
          Object.assign(user, args.data);
          return user;
        }
      },
      recruitmentTask: {
        findFirst: async () => task,
        updateMany: async (args) => {
          updates.push(["recruitmentTask.updateMany", args]);
          return { count: 1 };
        }
      },
      userCharacter: { deleteMany: async () => {} },
      userDecoration: { deleteMany: async () => {} },
      userItem: { deleteMany: async () => {}, upsert: async () => {} },
      userItemEffect: { deleteMany: async () => {} }
    };

    const response = await fastForwardRecruitment({
      prisma,
      userId: user.id,
      itemType: RECRUITMENT_ITEM_TYPES.magicClock,
      now
    });

    expect(updates).toContainEqual(["recruitmentTask.updateMany", expect.objectContaining({
      where: expect.objectContaining({
        id: task.id,
        fastForwardedAt: null,
        readyAt: { gt: new Date(now.getTime() + RECRUITMENT_FAST_FORWARD_TIMING.totalMs) }
      }),
      data: {
        readyAt: new Date(now.getTime() + RECRUITMENT_FAST_FORWARD_TIMING.totalMs),
        fastForwardedAt: now
      }
    })]);
    expect(updates).toContainEqual(["user.update", expect.objectContaining({
      data: { ownedItems: JSON.stringify({ [RECRUITMENT_ITEM_TYPES.magicClock]: 1 }) }
    })]);
    expect(response.task.status).toBe("pending");
    expect(response.task.remainingMs).toBe(RECRUITMENT_FAST_FORWARD_TIMING.totalMs);
    expect(response.task.fastForwarded).toBe(true);
    expect(response.utilities[0].quantity).toBe(1);
  });

  it.each([
    ["special cinematic", {
      task: { itemType: RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket },
      message: "特殊招募演出期间不能使用神奇小钟表"
    }],
    ["already accelerated", {
      task: { fastForwardedAt: new Date("2026-06-20T05:59:00.000Z") },
      message: "本次招募已经使用过神奇小钟表"
    }],
    ["too close to completion", {
      task: { readyAt: new Date("2026-06-20T06:00:06.000Z") },
      message: "招募即将完成，无需使用神奇小钟表"
    }]
  ])("rejects magic-clock use for %s", async (_label, scenario) => {
    const now = new Date("2026-06-20T06:00:00.000Z");
    const user = recruitmentUser({
      ownedItems: JSON.stringify({ [RECRUITMENT_ITEM_TYPES.magicClock]: 1 })
    });
    const task = {
      id: "task-guard",
      userId: user.id,
      itemType: RECRUITMENT_ITEM_TYPES.radioTicket,
      status: "pending",
      readyAt: new Date(now.getTime() + 60_000),
      fastForwardedAt: null,
      claimedAt: null,
      ...scenario.task
    };
    const prisma = {
      $transaction: async (callback) => callback(prisma),
      user: { findUnique: async () => user },
      recruitmentTask: { findFirst: async () => task }
    };

    await expect(fastForwardRecruitment({
      prisma,
      userId: user.id,
      now
    })).rejects.toThrow(scenario.message);
  });

  it("does not consume a magic clock when another request wins the same task", async () => {
    const now = new Date("2026-06-20T06:00:00.000Z");
    const user = recruitmentUser({
      ownedItems: JSON.stringify({ [RECRUITMENT_ITEM_TYPES.magicClock]: 1 })
    });
    let userUpdated = false;
    const prisma = {
      $transaction: async (callback) => callback(prisma),
      user: {
        findUnique: async () => user,
        update: async () => {
          userUpdated = true;
          return user;
        }
      },
      recruitmentTask: {
        findFirst: async () => ({
          id: "task-race",
          userId: user.id,
          itemType: RECRUITMENT_ITEM_TYPES.radioTicket,
          status: "pending",
          readyAt: new Date(now.getTime() + 60_000),
          fastForwardedAt: null,
          claimedAt: null
        }),
        updateMany: async () => ({ count: 0 })
      }
    };

    await expect(fastForwardRecruitment({ prisma, userId: user.id, now })).rejects.toMatchObject({
      status: 409
    });
    expect(userUpdated).toBe(false);
  });

  it("rejects starting recruitment with the magic clock", async () => {
    await expect(startRecruitment({
      prisma: {},
      userId: "user-1",
      itemType: RECRUITMENT_ITEM_TYPES.magicClock
    })).rejects.toThrow("未知招募道具");
  });

  it("consumes the memorial ticket and fixes the result to Aemeath with the cinematic duration", async () => {
    const now = new Date("2026-07-17T08:00:00.000Z");
    const user = recruitmentUser({
      ownedCharacters: "sigrika,denia",
      ownedItems: JSON.stringify({ [RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket]: 1 })
    });
    const calls = [];
    const prisma = recruitmentPrisma(user, calls);

    const response = await startRecruitment({
      prisma,
      userId: user.id,
      itemType: RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket,
      now,
      random: () => 0.999
    });

    expect(calls).toContainEqual(["user.update", expect.objectContaining({
      data: { ownedItems: "{}" }
    })]);
    expect(calls).toContainEqual(["recruitmentTask.create", expect.objectContaining({
      data: expect.objectContaining({
        resultType: "success",
        resultCharacterSlug: "aemeath",
        successRatePercent: 100,
        missStreakAtStart: 0,
        readyAt: new Date(now.getTime() + AEMEATH_RECRUITMENT_TIMING.taskDurationMs)
      })
    })]);
    expect(response.task).toMatchObject({
      status: "pending",
      remainingMs: AEMEATH_RECRUITMENT_TIMING.taskDurationMs,
      cinematic: {
        id: "aemeath-flight-snow-arrival",
        theatricalCountdownMs: AEMEATH_RECRUITMENT_TIMING.theatricalCountdownMs,
        spriteImageUrl: AEMEATH_RECRUITMENT_ASSET_SLOTS.cinematicSpriteUrl,
        spriteSheetUrl: AEMEATH_RECRUITMENT_ASSET_SLOTS.cinematicSpriteSheetUrl,
        flightSoundUrl: AEMEATH_RECRUITMENT_ASSET_SLOTS.flightSoundUrl,
        flashSoundUrl: AEMEATH_RECRUITMENT_ASSET_SLOTS.flashSoundUrl
      },
      result: null
    });
  });

  it("persists fixed-item copy and uses it for both the catalog and Aemeath result", async () => {
    const itemType = RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket;
    const customScopeLabel = "拿纪念券呼唤飞行雪绒";
    const customResultText = "爱弥斯从舞台灯光中现身。";
    let storedValue = null;
    const user = recruitmentUser({
      ownedCharacters: "sigrika,denia",
      ownedItems: JSON.stringify({ [itemType]: 1 })
    });
    const calls = [];
    const prisma = recruitmentPrisma(user, calls);
    prisma.siteSetting = {
      findUnique: async () => storedValue ? { value: storedValue } : null,
      upsert: async ({ create, update }) => {
        storedValue = storedValue ? update.value : create.value;
        return { key: "recruitmentConfig", value: storedValue };
      }
    };

    const saved = await updateRecruitmentConfig({
      prisma,
      input: {
        fixedItemTexts: {
          [itemType]: { scopeLabel: customScopeLabel, resultText: customResultText }
        }
      }
    });
    expect(saved.config.fixedItemTexts[itemType]).toEqual({
      scopeLabel: customScopeLabel,
      resultText: customResultText
    });
    expect((await getRecruitmentConfig(prisma)).fixedItemTexts[itemType]).toEqual(
      saved.config.fixedItemTexts[itemType]
    );

    const status = await getRecruitmentStatus({ prisma, userId: user.id });
    expect(status.items.find((item) => item.itemType === itemType)).toMatchObject({
      scopeLabel: customScopeLabel,
      confidenceText: customScopeLabel
    });

    await startRecruitment({ prisma, userId: user.id, itemType });
    expect(calls).toContainEqual(["recruitmentTask.create", expect.objectContaining({
      data: expect.objectContaining({ responseText: customResultText })
    })]);
  });

  it("rejects an owned-Aemeath memorial ticket before consuming it", async () => {
    const user = recruitmentUser({
      ownedCharacters: "sigrika,denia,aemeath",
      ownedItems: JSON.stringify({ [RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket]: 1 })
    });
    const calls = [];
    const prisma = recruitmentPrisma(user, calls);

    await expect(startRecruitment({
      prisma,
      userId: user.id,
      itemType: RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket
    })).rejects.toThrow(RECRUITMENT_NO_CANDIDATE_MESSAGE);
    expect(calls).toEqual([]);
  });

  it("moves an interrupted Aemeath cinematic immediately to the ready phase", async () => {
    const now = new Date("2026-07-17T08:00:06.000Z");
    const task = {
      id: "task-aemeath",
      userId: "user-1",
      itemType: RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket,
      status: "pending",
      resultType: "success",
      resultCharacterSlug: "aemeath",
      responseText: "爱弥斯登台",
      startedAt: new Date(now.getTime() - 6000),
      readyAt: new Date(now.getTime() + 5250),
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

    const response = await interruptRecruitmentCinematic({ prisma, userId: "user-1", now });

    expect(updates).toEqual([{ where: { id: task.id }, data: { readyAt: now } }]);
    expect(response.task.status).toBe("ready");
    expect(response.task.remainingMs).toBe(0);
  });

  it("claims the fixed Aemeath result without changing miss streaks", async () => {
    const now = new Date("2026-07-17T08:00:12.000Z");
    const user = recruitmentUser({ ownedCharacters: "sigrika,denia", ownedItems: "{}" });
    const task = {
      id: "task-aemeath",
      userId: user.id,
      itemType: RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket,
      status: "pending",
      resultType: "success",
      resultCharacterSlug: "aemeath",
      successRatePercent: 100,
      missStreakAtStart: 0,
      responseText: "爱弥斯，回应粉丝的期待，闪亮登台！嗯？是想让我加入围棋部吗？哼哼哼，也好，就让你们见识一下我的实力吧！",
      startedAt: new Date(now.getTime() - 12000),
      readyAt: new Date(now.getTime() - 750),
      claimedAt: null
    };
    const calls = [];
    const prisma = recruitmentPrisma(user, calls, task);

    const response = await claimRecruitment({ prisma, userId: user.id, now });

    expect(response.user.ownedCharacters).toContain("aemeath");
    expect(response.task.result).toEqual({
      type: "success",
      characterId: "aemeath",
      text: task.responseText
    });
    expect(calls.some(([name]) => name === "recruitmentMissStreak.upsert")).toBe(false);
  });
});

function recruitmentUser(overrides = {}) {
  return {
    id: "user-1",
    username: "moming",
    role: "player",
    status: "active",
    rank: "3段",
    rating: 1000,
    wins: 0,
    losses: 0,
    coins: 100,
    selectedCharacter: "sigrika",
    selectedStoneDecoration: "",
    ownedCharacters: "sigrika,denia",
    ownedItems: "{}",
    ownedDecorations: "",
    userCharacters: [],
    ...overrides
  };
}

function recruitmentPrisma(user, calls, activeTask = null) {
  const prisma = {
    $transaction: async (callback) => callback(prisma),
    siteSetting: { findUnique: async () => null },
    user: {
      findUnique: async () => user,
      update: async (args) => {
        calls.push(["user.update", args]);
        Object.assign(user, args.data);
        return user;
      }
    },
    recruitmentTask: {
      findFirst: async () => activeTask,
      create: async (args) => {
        calls.push(["recruitmentTask.create", args]);
        return { id: "task-aemeath", claimedAt: null, ...args.data };
      },
      update: async (args) => {
        calls.push(["recruitmentTask.update", args]);
        return { ...activeTask, ...args.data };
      }
    },
    recruitmentMissStreak: {
      findMany: async () => [],
      findUnique: async () => null,
      upsert: async (args) => calls.push(["recruitmentMissStreak.upsert", args])
    },
    userCharacter: {
      deleteMany: async () => {},
      upsert: async () => {}
    },
    userDecoration: { deleteMany: async () => {} },
    userItem: { deleteMany: async () => {} },
    userItemEffect: { deleteMany: async () => {} }
  };
  return prisma;
}
