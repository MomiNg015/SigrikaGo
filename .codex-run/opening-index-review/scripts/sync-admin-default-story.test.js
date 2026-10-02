import { describe, expect, it, vi } from "vitest";
import { storyScriptWriteData, syncAdminDefaultStory } from "./sync-admin-default-story.mjs";

const SOURCE = Object.freeze({
  id: "story-onboarding",
  key: "onboarding.default",
  title: "新手引导",
  triggerType: "onboarding",
  triggerParamsJson: "{}",
  draftStartNodeId: "start",
  draftInitialBoardJson: "null",
  draftNodesJson: '[{"id":"start","text":"new"}]',
  isPublished: true,
  publishedStartNodeId: "start",
  publishedInitialBoardJson: "null",
  publishedNodesJson: '[{"id":"start","text":"new"}]',
  firstPublishedAt: "2026-07-20T00:00:00.000Z",
  publishedAt: "2026-07-21T13:24:41.917Z"
});

describe("admin default story sync", () => {
  it("previews without writing and then updates only the selected story", async () => {
    const existing = {
      ...SOURCE,
      draftNodesJson: '[{"id":"start","text":"old"}]',
      publishedNodesJson: '[{"id":"start","text":"old"}]',
      publishedAt: new Date("2026-07-21T12:54:14.597Z")
    };
    const prisma = storyPrisma(existing);
    const snapshot = { storyScripts: [SOURCE, { ...SOURCE, id: "other", key: "item.other" }] };

    await expect(syncAdminDefaultStory({ prisma, key: SOURCE.key, snapshot })).resolves.toMatchObject({
      applied: false,
      changed: true,
      existed: true
    });
    expect(prisma.storyScript.update).not.toHaveBeenCalled();

    await expect(syncAdminDefaultStory({ prisma, key: SOURCE.key, snapshot, apply: true })).resolves.toMatchObject({
      applied: true,
      changed: true,
      existed: true
    });
    expect(prisma.storyScript.update).toHaveBeenCalledTimes(1);
    expect(prisma.storyScript.update).toHaveBeenCalledWith({
      where: { key: SOURCE.key },
      data: storyScriptWriteData(SOURCE)
    });
    expect(prisma.storyScript.create).not.toHaveBeenCalled();
  });

  it("creates a missing selected story", async () => {
    const prisma = storyPrisma(null);

    await syncAdminDefaultStory({
      prisma,
      key: SOURCE.key,
      snapshot: { storyScripts: [SOURCE] },
      apply: true
    });

    expect(prisma.storyScript.create).toHaveBeenCalledWith({
      data: {
        id: SOURCE.id,
        key: SOURCE.key,
        ...storyScriptWriteData(SOURCE)
      }
    });
  });

  it("refuses to overwrite a newer cloud edit unless explicitly forced", async () => {
    const prisma = storyPrisma({
      ...SOURCE,
      publishedNodesJson: '[{"id":"start","text":"cloud edit"}]',
      publishedAt: new Date("2026-07-22T00:00:00.000Z")
    });

    await expect(syncAdminDefaultStory({
      prisma,
      key: SOURCE.key,
      snapshot: { storyScripts: [SOURCE] },
      apply: true
    })).rejects.toThrow("is newer than the committed snapshot");
    expect(prisma.storyScript.update).not.toHaveBeenCalled();
  });
});

function storyPrisma(existing) {
  return {
    storyScript: {
      findUnique: vi.fn(async () => existing),
      update: vi.fn(async () => null),
      create: vi.fn(async () => null)
    }
  };
}
