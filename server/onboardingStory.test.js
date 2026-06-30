import { describe, expect, it } from "vitest";
import {
  ensureOnboardingStorySchema,
  getPlayerOnboardingStory,
  markOnboardingAutoShown,
  markOnboardingCompleted,
  validateOnboardingStoryScript
} from "./onboardingStory.js";

describe("onboarding story domain", () => {
  it("creates onboarding script and user auto-touch schema for older local databases", async () => {
    const executed = [];
    const queried = [];
    await ensureOnboardingStorySchema({
      $executeRawUnsafe: async (sql) => executed.push(sql),
      $queryRawUnsafe: async (sql) => {
        queried.push(sql);
        return [];
      }
    });

    expect(executed).toEqual([
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "OnboardingStoryScript"'),
      expect.stringContaining('ALTER TABLE "User" ADD COLUMN "onboardingRequired" BOOLEAN NOT NULL DEFAULT false'),
      expect.stringContaining('ALTER TABLE "User" ADD COLUMN "onboardingAutoShownAt" DATETIME'),
      expect.stringContaining('ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" DATETIME')
    ]);
    expect(queried).toContain('PRAGMA table_info("User")');
  });

  it("validates publishable scripts with unique nodes, valid targets, and an ending", () => {
    expect(validateOnboardingStoryScript({
      startNodeId: "start",
      nodes: [
        {
          id: "start",
          speakerName: "希格莉卡",
          characterId: "sigrika",
          text: "你以前下过围棋吗？",
          options: [
            { label: "会一点", nextNodeId: "knows-go" },
            { label: "完全不会", nextNodeId: "new-go" }
          ]
        },
        { id: "knows-go", speakerName: "希格莉卡", characterId: "sigrika", text: "那我们直接看特色规则。", nextNodeId: "" },
        { id: "new-go", speakerName: "希格莉卡", characterId: "sigrika", text: "没关系，我会先讲基础。", nextNodeId: "" }
      ]
    }, { publishing: true })).toMatchObject({
      startNodeId: "start",
      nodes: expect.arrayContaining([
        expect.objectContaining({ id: "start", options: expect.any(Array) })
      ])
    });
  });

  it("rejects broken publish scripts before they reach players", () => {
    expect(() => validateOnboardingStoryScript({
      startNodeId: "start",
      nodes: [
        { id: "start", speakerName: "A", characterId: "sigrika", text: "Hello", nextNodeId: "missing" }
      ]
    }, { publishing: true })).toThrow("跳转目标不存在");

    expect(() => validateOnboardingStoryScript({
      startNodeId: "start",
      nodes: [
        { id: "start", speakerName: "A", characterId: "sigrika", text: "Hello", nextNodeId: "loop" },
        { id: "start", speakerName: "B", characterId: "denia", text: "Duplicate" }
      ]
    }, { publishing: true })).toThrow("节点 ID 不能重复");

    expect(() => validateOnboardingStoryScript({
      startNodeId: "start",
      nodes: [
        { id: "start", speakerName: "A", characterId: "sigrika", text: "Hello", nextNodeId: "start" }
      ]
    }, { publishing: true })).toThrow("至少需要一个结束节点");
  });

  it("returns no player script and does not consume auto-touch state when nothing is published", async () => {
    const prisma = {
      storyScript: {
        findMany: async () => []
      }
    };

    await expect(getPlayerOnboardingStory({
      prisma,
      user: { id: "user-1", onboardingRequired: true, onboardingAutoShownAt: null }
    })).resolves.toEqual({
      script: null,
      autoEligible: false
    });
  });

  it("returns the generic onboarding story through the legacy player endpoint contract", async () => {
    const prisma = {
      storyScript: {
        findMany: async () => [{
          id: "onboarding.default",
          key: "onboarding.default",
          title: "新手引导",
          triggerType: "onboarding",
          triggerParamsJson: "{}",
          isPublished: true,
          publishedStartNodeId: "start",
          publishedNodesJson: JSON.stringify([
            { id: "start", speakerName: "希格莉卡", characterId: "sigrika", text: "欢迎，{username}。" }
          ]),
          publishedAt: new Date("2026-06-28T08:00:00.000Z")
        }]
      }
    };

    await expect(getPlayerOnboardingStory({
      prisma,
      user: { id: "user-1", username: "Moming", onboardingRequired: true, onboardingAutoShownAt: null }
    })).resolves.toMatchObject({
      script: {
        key: "onboarding.default",
        startNodeId: "start",
        nodes: [expect.objectContaining({ text: "欢迎，Moming。" })]
      },
      autoEligible: true
    });
  });

  it("marks automatic onboarding touch once for newly registered users", async () => {
    const updates = [];
    const prisma = {
      user: {
        update: async ({ where, data }) => {
          updates.push({ where, data });
          return { id: where.id, ...data };
        }
      }
    };
    const user = { id: "user-1", onboardingRequired: true, onboardingAutoShownAt: null };

    await markOnboardingAutoShown({ prisma, user, now: new Date("2026-06-28T08:00:00.000Z") });
    await markOnboardingAutoShown({
      prisma,
      user: { ...user, onboardingRequired: false, onboardingAutoShownAt: new Date("2026-06-28T08:00:00.000Z") }
    });

    expect(updates).toEqual([{
      where: { id: "user-1" },
      data: {
        onboardingRequired: false,
        onboardingAutoShownAt: new Date("2026-06-28T08:00:00.000Z")
      }
    }]);
  });

  it("marks onboarding completion separately from automatic display state", async () => {
    const updates = [];
    const prisma = {
      user: {
        update: async ({ where, data }) => {
          updates.push({ where, data });
          return { id: where.id, ...data };
        }
      }
    };

    await markOnboardingCompleted({
      prisma,
      user: { id: "user-1", onboardingCompletedAt: null },
      now: new Date("2026-06-29T08:00:00.000Z")
    });
    await markOnboardingCompleted({
      prisma,
      user: { id: "user-1", onboardingCompletedAt: new Date("2026-06-29T08:00:00.000Z") }
    });

    expect(updates).toEqual([{
      where: { id: "user-1" },
      data: {
        onboardingRequired: false,
        onboardingCompletedAt: new Date("2026-06-29T08:00:00.000Z")
      }
    }]);
  });
});
