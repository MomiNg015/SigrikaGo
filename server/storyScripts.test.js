import { describe, expect, it } from "vitest";
import {
  defaultStoryScriptSeeds,
  ensureStoryScriptSchema,
  getPublishedStoryScriptForTrigger,
  seedDefaultStoryScripts,
  STORY_TRIGGER_TYPES,
  validateStoryScriptInput
} from "./storyScripts.js";

describe("story script domain", () => {
  it("creates the generic story script table for older local databases", async () => {
    const executed = [];
    await ensureStoryScriptSchema({
      $executeRawUnsafe: async (sql) => executed.push(sql)
    });

    expect(executed).toEqual([
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "StoryScript"'),
      expect.stringContaining('CREATE UNIQUE INDEX IF NOT EXISTS "StoryScript_key_key"'),
      expect.stringContaining('CREATE INDEX IF NOT EXISTS "StoryScript_triggerType_isPublished_idx"')
    ]);
  });

  it("validates publishable scripts with structured triggers", () => {
    expect(validateStoryScriptInput({
      key: "item.rainbow-bean-candy.denia",
      title: "达妮娅的彩虹糖",
      triggerType: STORY_TRIGGER_TYPES.itemCharacterUse,
      triggerParams: { itemId: "rainbow-bean-candy", characterId: "denia" },
      draft: {
        startNodeId: "start",
        nodes: [
          { id: "start", speakerName: "达妮娅", characterId: "denia", text: "{username}！你到底给我吃了什么！" }
        ]
      }
    }, { publishing: true })).toMatchObject({
      key: "item.rainbow-bean-candy.denia",
      triggerType: "item-character-use",
      triggerParams: { itemId: "rainbow-bean-candy", characterId: "denia" },
      draft: {
        startNodeId: "start",
        nodes: [expect.objectContaining({ id: "start" })]
      }
    });
  });

  it("treats an option with an empty target as a close-window ending", () => {
    expect(validateStoryScriptInput({
      key: "item.rainbow-bean-candy.denia",
      title: "Close option story",
      triggerType: STORY_TRIGGER_TYPES.itemCharacterUse,
      triggerParams: { itemId: "rainbow-bean-candy", characterId: "denia" },
      draft: {
        startNodeId: "start",
        nodes: [
          {
            id: "start",
            speakerName: "Denia",
            characterId: "denia",
            text: "Run away?",
            options: [{ label: "Sneak away", nextNodeId: "" }]
          }
        ]
      }
    }, { publishing: true })).toMatchObject({
      draft: {
        nodes: [
          expect.objectContaining({
            options: [expect.objectContaining({ label: "Sneak away", nextNodeId: "" })]
          })
        ]
      }
    });
  });

  it("still rejects option targets that name a missing node", () => {
    expect(() => validateStoryScriptInput({
      key: "item.rainbow-bean-candy.denia",
      title: "Bad option target",
      triggerType: STORY_TRIGGER_TYPES.itemCharacterUse,
      triggerParams: { itemId: "rainbow-bean-candy", characterId: "denia" },
      draft: {
        startNodeId: "start",
        nodes: [
          {
            id: "start",
            text: "Where next?",
            options: [{ label: "Missing branch", nextNodeId: "missing" }]
          }
        ]
      }
    }, { publishing: true })).toThrow("跳转目标不存在");
  });

  it("rejects raw or incomplete trigger params before publish", () => {
    expect(() => validateStoryScriptInput({
      key: "bad",
      title: "Bad",
      triggerType: STORY_TRIGGER_TYPES.itemCharacterUse,
      triggerParams: { itemId: "rainbow-bean-candy" },
      draft: {
        startNodeId: "start",
        nodes: [{ id: "start", text: "Hello" }]
      }
    }, { publishing: true })).toThrow("道具角色触发器需要选择道具和角色");

    expect(() => validateStoryScriptInput({
      key: "bad-json",
      title: "Bad JSON",
      triggerType: STORY_TRIGGER_TYPES.onboarding,
      triggerParamsJson: "{\"unexpected\":true}",
      draft: {
        startNodeId: "start",
        nodes: [{ id: "start", text: "Hello" }]
      }
    }, { publishing: true })).toThrow("后台不能直接提交触发器 JSON");
  });

  it("returns a published script for an exact trigger and interpolates whitelisted variables", async () => {
    const prisma = {
      storyScript: {
        findMany: async ({ where }) => {
          expect(where).toEqual({
            triggerType: "item-character-use",
            isPublished: true
          });
          return [{
            id: "story-1",
            key: "item.rainbow-bean-candy.denia",
            title: "达妮娅的彩虹糖",
            triggerType: "item-character-use",
            triggerParamsJson: JSON.stringify({ itemId: "rainbow-bean-candy", characterId: "denia" }),
            publishedStartNodeId: "start",
            publishedNodesJson: JSON.stringify([
              { id: "start", speakerName: "达妮娅", characterId: "denia", text: "{username} 给 {characterName} 使用了 {itemName}。{unknown}" }
            ]),
            publishedAt: new Date("2026-06-28T08:00:00.000Z")
          }];
        }
      }
    };

    await expect(getPublishedStoryScriptForTrigger({
      prisma,
      triggerType: STORY_TRIGGER_TYPES.itemCharacterUse,
      triggerParams: { itemId: "rainbow-bean-candy", characterId: "denia" },
      variables: {
        username: "Moming",
        characterName: "达妮娅",
        itemName: "彩虹豆豆跳跳糖",
        unknown: "SHOULD_NOT_RENDER"
      }
    })).resolves.toMatchObject({
      key: "item.rainbow-bean-candy.denia",
      title: "达妮娅的彩虹糖",
      nodes: [
        expect.objectContaining({
          text: "Moming 给 达妮娅 使用了 彩虹豆豆跳跳糖。{unknown}"
        })
      ]
    });
  });

  it("seeds default scripts only when their keys are missing", async () => {
    const created = [];
    const keys = defaultStoryScriptSeeds().map((seed) => seed.key);
    const prisma = {
      storyScript: {
        findMany: async ({ where }) => {
          expect(where.key.in).toEqual(keys);
          return [{ key: "onboarding.default" }];
        },
        create: async ({ data }) => {
          created.push(data);
          return data;
        }
      }
    };

    await seedDefaultStoryScripts(prisma);

    expect(created.map((record) => record.key)).toEqual([
      "item.rainbow-bean-candy.sigrika",
      "item.rainbow-bean-candy.denia"
    ]);
    expect(created.every((record) => record.isPublished)).toBe(true);
  });

  it("seeds onboarding from the legacy singleton when the generic onboarding key is missing", async () => {
    const created = [];
    const prisma = {
      onboardingStoryScript: {
        findUnique: async () => ({
          id: "singleton",
          isPublished: true,
          draftStartNodeId: "legacy",
          draftNodesJson: JSON.stringify([{ id: "legacy", text: "旧草稿", nextNodeId: "" }]),
          publishedStartNodeId: "legacy",
          publishedNodesJson: JSON.stringify([{ id: "legacy", text: "旧发布", nextNodeId: "" }]),
          firstPublishedAt: new Date("2026-06-01T08:00:00.000Z"),
          publishedAt: new Date("2026-06-02T08:00:00.000Z")
        })
      },
      storyScript: {
        findMany: async () => [],
        create: async ({ data }) => {
          created.push(data);
          return data;
        }
      }
    };

    await seedDefaultStoryScripts(prisma);

    expect(created.find((record) => record.key === "onboarding.default")).toMatchObject({
      draftStartNodeId: "legacy",
      publishedStartNodeId: "legacy",
      publishedNodesJson: expect.stringContaining("旧发布")
    });
  });
});
