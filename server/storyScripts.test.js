import { describe, expect, it } from "vitest";
import {
  defaultStoryScriptSeeds,
  deleteStoryScript,
  ensureStoryScriptSchema,
  getPublishedStoryScriptForTrigger,
  publishStoryScript,
  seedDefaultStoryScripts,
  STORY_TRIGGER_TYPES,
  toAdminStoryScriptPayload,
  toPlayerStoryScriptPayload,
  unpublishStoryScript,
  validateStoryScriptInput
} from "./storyScripts.js";
import { STORY_NODE_EFFECTS } from "../src/shared/storyPresentation.js";

describe("story script domain", () => {
  function makeStoryRecord(overrides = {}) {
    return {
      id: "script.test",
      key: "script.test",
      title: "Test script",
      triggerType: STORY_TRIGGER_TYPES.onboarding,
      triggerParamsJson: "{}",
      isPublished: false,
      draftStartNodeId: "start",
      draftInitialBoardJson: "null",
      draftNodesJson: JSON.stringify([{ id: "start", type: "story", text: "Hello", nextNodeId: "" }]),
      publishedStartNodeId: "",
      publishedInitialBoardJson: "null",
      publishedNodesJson: "[]",
      firstPublishedAt: null,
      publishedAt: null,
      createdAt: new Date("2026-06-29T08:00:00.000Z"),
      updatedAt: new Date("2026-06-29T08:00:00.000Z"),
      ...overrides
    };
  }

  it("creates the generic story script table for older local databases", async () => {
    const executed = [];
    await ensureStoryScriptSchema({
      $executeRawUnsafe: async (sql) => executed.push(sql)
    });

    expect(executed).toEqual(expect.arrayContaining([
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "StoryScript"'),
      expect.stringContaining('ADD COLUMN "draftInitialBoardJson"'),
      expect.stringContaining('ADD COLUMN "publishedInitialBoardJson"'),
      expect.stringContaining('CREATE UNIQUE INDEX IF NOT EXISTS "StoryScript_key_key"'),
      expect.stringContaining('CREATE INDEX IF NOT EXISTS "StoryScript_triggerType_isPublished_idx"')
    ]));
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

  it("normalizes node effects, per-option reveal delays, transition delays, and progression flags", () => {
    expect(validateStoryScriptInput({
      key: "item.rainbow-bean-candy.denia",
      title: "Timing story",
      triggerType: STORY_TRIGGER_TYPES.itemCharacterUse,
      triggerParams: { itemId: "rainbow-bean-candy", characterId: "denia" },
      draft: {
        startNodeId: "start",
        nodes: [
          {
            id: "start",
            speakerName: "Denia",
            characterId: "denia",
            effect: STORY_NODE_EFFECTS.longTextCompressPortrait,
            text: "Long speech",
            manualContinueEnabled: false,
            autoContinueEnabled: true,
            autoContinueDelaySeconds: "1.5",
            options: [
              { label: "Interrupt", nextNodeId: "", revealDelaySeconds: "0.5", transitionDelaySeconds: "1.2" },
              { label: "Wait", nextNodeId: "", revealDelaySeconds: "" }
            ]
          }
        ]
      }
    }, { publishing: true })).toMatchObject({
      draft: {
        nodes: [
          expect.objectContaining({
            effect: STORY_NODE_EFFECTS.longTextCompressPortrait,
            manualContinueEnabled: false,
            autoContinueEnabled: true,
            autoContinueDelaySeconds: 1.5,
            options: [
              expect.objectContaining({ label: "Interrupt", revealDelaySeconds: 0.5, transitionDelaySeconds: 1.2 }),
              expect.objectContaining({ label: "Wait", revealDelaySeconds: "", transitionDelaySeconds: "" })
            ]
          })
        ]
      }
    });
  });

  it("keeps legacy NPC dialogue progression defaults when fields are missing", () => {
    expect(validateStoryScriptInput({
      key: "tutorial.npc-dialogue-defaults",
      title: "NPC dialogue defaults",
      triggerType: STORY_TRIGGER_TYPES.onboarding,
      triggerParams: {},
      draft: {
        startNodeId: "npc",
        nodes: [
          { id: "npc", type: "npc-dialogue", text: "看这里", nextNodeId: "" }
        ]
      }
    }, { publishing: true }).draft.nodes[0]).toMatchObject({
      manualContinueEnabled: true,
      autoContinueEnabled: true,
      autoContinueDelaySeconds: ""
    });
  });

  it("normalizes tutorial wrong-move, target-highlight, loading, and last-move fields", () => {
    const input = {
      key: "tutorial.wrong-move-fields",
      title: "Wrong move fields",
      triggerType: STORY_TRIGGER_TYPES.onboarding,
      triggerParams: {},
      draft: {
        startNodeId: "setup",
        nodes: [
          {
            id: "setup",
            type: "board-setup",
            boardSetupLoadingEnabled: false,
            boardSetup: {
              mode: "spark",
              stones: [{ pointId: "3,3", color: "black" }],
              lastMovePointId: "3,3"
            },
            nextNodeId: "move"
          },
          {
            id: "move",
            type: "player-move",
            pointId: "5,5",
            color: "white",
            targetHighlightEnabled: false,
            wrongMovePointId: "4,4",
            wrongMoveNextNodeId: "wrong",
            applyWrongMove: true,
            nextNodeId: "end"
          },
          { id: "wrong", type: "npc-dialogue", text: "Try again", nextNodeId: "move" },
          { id: "end", type: "story", text: "Done", nextNodeId: "" }
        ]
      }
    };
    const nodes = validateStoryScriptInput(input, { publishing: true }).draft.nodes;

    expect(nodes.find((node) => node.id === "setup")).toMatchObject({
      boardSetupLoadingEnabled: false,
      boardSetup: { mode: "spark", stones: [{ pointId: "3,3", color: "black" }], lastMovePointId: "3,3" }
    });
    expect(nodes.find((node) => node.id === "move")).toMatchObject({
      targetHighlightEnabled: false,
      wrongMovePointId: "4,4",
      wrongMoveNextNodeId: "wrong",
      applyWrongMove: true
    });
    expect(nodes.find((node) => node.id === "end")).toMatchObject({
      targetHighlightEnabled: true,
      applyWrongMove: false,
      boardSetupLoadingEnabled: true
    });
    expect(() => validateStoryScriptInput({
      ...input,
      draft: {
        ...input.draft,
        nodes: input.draft.nodes.map((node) => node.id === "move" ? { ...node, wrongMoveNextNodeId: "missing" } : node)
      }
    }, { publishing: true })).toThrow("跳转目标不存在");
  });

  it("validates unified tutorial scripts with story and battle node types", () => {
    expect(validateStoryScriptInput({
      key: "tutorial.unified",
      title: "Unified tutorial",
      triggerType: STORY_TRIGGER_TYPES.onboarding,
      triggerParams: {},
      draft: {
        startNodeId: "intro",
        initialBoard: {
          mode: "spark",
          stones: [
            { pointId: "3,3", color: "black" },
            { pointId: "4,4", color: "white" }
          ]
        },
        nodes: [
          { id: "intro", type: "story", text: "Try a move.", nextNodeId: "setup-beginner" },
          { id: "setup-beginner", type: "board-setup", boardSetup: { mode: "spark", stones: [{ pointId: "2,2", color: "black" }] }, nextNodeId: "move-1" },
          { id: "move-1", type: "player-move", pointId: "5,5", color: "black", nextNodeId: "npc-1" },
          { id: "npc-1", type: "npc-move", pointId: "6,6", color: "white", nextNodeId: "skill-1" },
          { id: "skill-1", type: "player-skill", skillId: "denia", pointId: "4,4", color: "black", nextNodeId: "resign-1" },
          { id: "resign-1", type: "resign", color: "black", nextNodeId: "ending" },
          { id: "ending", type: "story", text: "That is the lesson.", options: [{ label: "Done", nextNodeId: "" }] }
        ]
      }
    }, { publishing: true })).toMatchObject({
      draft: {
        initialBoard: {
          mode: "spark",
          stones: [
            { pointId: "3,3", color: "black" },
            { pointId: "4,4", color: "white" }
          ]
        },
        nodes: expect.arrayContaining([
          expect.objectContaining({ id: "intro", type: "story" }),
          expect.objectContaining({ id: "setup-beginner", type: "board-setup", boardSetup: { mode: "spark", stones: [{ pointId: "2,2", color: "black" }] } }),
          expect.objectContaining({ id: "move-1", type: "player-move", pointId: "5,5", color: "black" }),
          expect.objectContaining({ id: "npc-1", type: "npc-move", pointId: "6,6", color: "white" }),
          expect.objectContaining({ id: "skill-1", type: "player-skill", skillId: "denia", pointId: "4,4", color: "black" }),
          expect.objectContaining({ id: "resign-1", type: "resign", color: "black" })
        ])
      }
    });
  });

  it("allows draft skill nodes to stay incomplete but rejects invalid skills on publish", () => {
    const input = {
      key: "tutorial.invalid-skill",
      title: "Invalid skill",
      triggerType: STORY_TRIGGER_TYPES.onboarding,
      triggerParams: {},
      draft: {
        startNodeId: "skill-1",
        nodes: [
          { id: "skill-1", type: "player-skill", skillId: "denia-rainbow-glow", pointId: "4,4", color: "black", nextNodeId: "" }
        ]
      }
    };

    expect(validateStoryScriptInput(input, { publishing: false }).draft.nodes[0]).toMatchObject({
      skillId: "denia-rainbow-glow"
    });
    expect(() => validateStoryScriptInput(input, { publishing: true })).toThrow("教学技能 ID 无效");
  });

  it("rejects invalid story presentation fields", () => {
    const baseInput = {
      key: "item.rainbow-bean-candy.denia",
      title: "Bad presentation",
      triggerType: STORY_TRIGGER_TYPES.itemCharacterUse,
      triggerParams: { itemId: "rainbow-bean-candy", characterId: "denia" },
      draft: {
        startNodeId: "start",
        nodes: [{ id: "start", text: "Hello", options: [{ label: "Done", nextNodeId: "" }] }]
      }
    };

    expect(() => validateStoryScriptInput({
      ...baseInput,
      draft: {
        ...baseInput.draft,
        nodes: [{ ...baseInput.draft.nodes[0], effect: "unknown-effect" }]
      }
    }, { publishing: true })).toThrow("剧情节点效果无效");

    expect(() => validateStoryScriptInput({
      ...baseInput,
      draft: {
        ...baseInput.draft,
        nodes: [{
          ...baseInput.draft.nodes[0],
          options: [{ label: "Done", nextNodeId: "", revealDelaySeconds: "-1" }]
        }]
      }
    }, { publishing: true })).toThrow("选项出现时间必须是非负数字");

    expect(() => validateStoryScriptInput({
      ...baseInput,
      draft: {
        ...baseInput.draft,
        nodes: [{
          ...baseInput.draft.nodes[0],
          options: [{ label: "Done", nextNodeId: "", transitionDelaySeconds: "-1" }]
        }]
      }
    }, { publishing: true })).toThrow("选项选择后等待必须是非负数字");
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

  it("matches legacy item-character scripts that stored the shop item row id instead of the item target id", async () => {
    const prisma = {
      shopItem: {
        findMany: async ({ where }) => {
          expect(where).toMatchObject({
            category: "item",
            OR: [
              { targetId: { in: ["rainbow-bean-candy", "shop-rainbow-row"] } },
              { id: { in: ["rainbow-bean-candy", "shop-rainbow-row"] } }
            ]
          });
          return [{ id: "shop-rainbow-row", targetId: "rainbow-bean-candy" }];
        }
      },
      storyScript: {
        findMany: async ({ where }) => {
          expect(where).toEqual({
            triggerType: "item-character-use",
            isPublished: true
          });
          return [{
            id: "story-1",
            key: "item.rainbow-bean-candy.sigrika",
            title: "西格莉卡的彩虹糖",
            triggerType: "item-character-use",
            triggerParamsJson: JSON.stringify({ itemId: "shop-rainbow-row", characterId: "sigrika" }),
            publishedStartNodeId: "start",
            publishedNodesJson: JSON.stringify([
              { id: "start", speakerName: "西格莉卡", characterId: "sigrika", text: "新发布版本" }
            ]),
            publishedAt: new Date("2026-07-06T08:00:00.000Z")
          }];
        }
      }
    };

    await expect(getPublishedStoryScriptForTrigger({
      prisma,
      triggerType: STORY_TRIGGER_TYPES.itemCharacterUse,
      triggerParams: { itemId: "rainbow-bean-candy", characterId: "sigrika" }
    })).resolves.toMatchObject({
      key: "item.rainbow-bean-candy.sigrika",
      nodes: [
        expect.objectContaining({ text: "新发布版本" })
      ]
    });
  });

  it("rejects publishing item-character scripts that conflict after legacy shop row ids are canonicalized", async () => {
    const prisma = {
      $transaction: async (callback) => callback({
        shopItem: {
          findMany: async ({ where }) => {
            expect(where).toMatchObject({
              category: "item",
              OR: [
                { targetId: { in: ["rainbow-bean-candy", "shop-rainbow-row"] } },
                { id: { in: ["rainbow-bean-candy", "shop-rainbow-row"] } }
              ]
            });
            return [{ id: "shop-rainbow-row", targetId: "rainbow-bean-candy" }];
          }
        },
        storyScript: {
          findUnique: async () => null,
          findMany: async ({ where }) => {
            expect(where).toEqual({
              triggerType: "item-character-use",
              isPublished: true
            });
            return [{
              key: "legacy.sigrika.candy",
              triggerParamsJson: JSON.stringify({ itemId: "shop-rainbow-row", characterId: "sigrika" })
            }];
          },
          upsert: async () => {
            throw new Error("should not publish conflicting story");
          }
        }
      })
    };

    await expect(publishStoryScript({
      prisma,
      adminUser: { id: "admin-1" },
      input: {
        key: "item.rainbow-bean-candy.sigrika",
        title: "西格莉卡的彩虹糖",
        triggerType: STORY_TRIGGER_TYPES.itemCharacterUse,
        triggerParams: { itemId: "rainbow-bean-candy", characterId: "sigrika" },
        draft: {
          startNodeId: "start",
          nodes: [{ id: "start", text: "新版本", nextNodeId: "" }]
        }
      }
    })).rejects.toThrow("同一个触发点只能发布一个剧情脚本");
  });

  it("preserves tutorial initial board data in admin and player payloads", () => {
    const record = {
      id: "tutorial.unified",
      key: "tutorial.unified",
      title: "Unified tutorial",
      triggerType: "onboarding",
      triggerParamsJson: "{}",
      isPublished: true,
      draftStartNodeId: "intro",
      draftInitialBoardJson: JSON.stringify({ mode: "spark", stones: [{ pointId: "3,3", color: "black" }] }),
      draftNodesJson: JSON.stringify([{ id: "intro", type: "story", text: "Draft", nextNodeId: "" }]),
      publishedStartNodeId: "intro",
      publishedInitialBoardJson: JSON.stringify({ mode: "spark", stones: [{ pointId: "4,4", color: "white" }] }),
      publishedNodesJson: JSON.stringify([{ id: "intro", type: "story", text: "Published", nextNodeId: "" }]),
      publishedAt: new Date("2026-06-29T08:00:00.000Z")
    };

    expect(toAdminStoryScriptPayload(record)).toMatchObject({
      draft: { initialBoard: { mode: "spark", stones: [{ pointId: "3,3", color: "black" }] } },
      published: { initialBoard: { mode: "spark", stones: [{ pointId: "4,4", color: "white" }] } }
    });
    expect(toPlayerStoryScriptPayload(record)).toMatchObject({
      initialBoard: { mode: "spark", stones: [{ pointId: "4,4", color: "white" }] }
    });
  });

  it("unpublishes a published story script without deleting draft data", async () => {
    const auditLogs = [];
    const before = makeStoryRecord({ isPublished: true });
    const prisma = {
      $transaction: async (callback) => callback({
        storyScript: {
          findUnique: async ({ where }) => {
            expect(where).toEqual({ key: "script.test" });
            return before;
          },
          update: async ({ where, data }) => {
            expect(where).toEqual({ key: "script.test" });
            expect(data).toEqual({ isPublished: false });
            return { ...before, ...data };
          }
        },
        adminAuditLog: {
          create: async ({ data }) => auditLogs.push(data)
        }
      })
    };

    await expect(unpublishStoryScript({
      prisma,
      adminUser: { id: "admin-1" },
      key: "script.test"
    })).resolves.toMatchObject({
      script: {
        key: "script.test",
        isPublished: false,
        draft: { startNodeId: "start" }
      }
    });

    expect(auditLogs).toEqual([
      expect.objectContaining({
        adminUserId: "admin-1",
        action: "story-script.unpublish",
        targetId: "script.test",
        targetType: "story-script"
      })
    ]);
  });

  it("deletes only unpublished non-system story scripts", async () => {
    const auditLogs = [];
    let deletedKey = "";
    const record = makeStoryRecord();
    const prisma = {
      $transaction: async (callback) => callback({
        storyScript: {
          findUnique: async ({ where }) => {
            expect(where).toEqual({ key: "script.test" });
            return record;
          },
          delete: async ({ where }) => {
            deletedKey = where.key;
            return record;
          }
        },
        adminAuditLog: {
          create: async ({ data }) => auditLogs.push(data)
        }
      })
    };

    await expect(deleteStoryScript({
      prisma,
      adminUser: { id: "admin-1" },
      key: "script.test"
    })).resolves.toMatchObject({
      deleted: true,
      script: { key: "script.test" }
    });

    expect(deletedKey).toBe("script.test");
    expect(auditLogs).toEqual([
      expect.objectContaining({
        action: "story-script.delete",
        afterJson: null,
        targetId: "script.test"
      })
    ]);
  });

  it("blocks deletion for system or published story scripts", async () => {
    await expect(deleteStoryScript({
      prisma: {},
      adminUser: { id: "admin-1" },
      key: "onboarding.default"
    })).rejects.toMatchObject({ status: 400 });

    const prisma = {
      $transaction: async (callback) => callback({
        storyScript: {
          findUnique: async () => makeStoryRecord({ isPublished: true })
        }
      })
    };

    await expect(deleteStoryScript({
      prisma,
      adminUser: { id: "admin-1" },
      key: "script.test"
    })).rejects.toMatchObject({ status: 400 });
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
      "item.rainbow-bean-candy.denia",
      "item.rainbow-bean-candy.aemeath"
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
