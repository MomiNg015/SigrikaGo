import { describe, expect, it, vi } from "vitest";
import {
  CANONICAL_DENIA_SLUG,
  cleanupLegacyDeniaCharacterData,
  LEGACY_DENIA_SLUGS,
  normalizeLegacyDeniaList,
  normalizeLegacyDeniaSlug
} from "./legacyDeniaCleanup.js";

describe("legacy Denia cleanup", () => {
  it("normalizes legacy Danea spellings to canonical Denia", () => {
    expect(normalizeLegacyDeniaSlug("danea")).toBe(CANONICAL_DENIA_SLUG);
    expect(normalizeLegacyDeniaSlug("denea")).toBe(CANONICAL_DENIA_SLUG);
    expect(normalizeLegacyDeniaSlug("sigrika")).toBe("sigrika");
    expect(normalizeLegacyDeniaList("sigrika,danea,denea,denia")).toEqual(["sigrika", "denia"]);
  });

  it("migrates user ownership and deletes legacy character records idempotently", async () => {
    const calls = [];
    const prisma = {
      userCharacter: {
        findMany: vi.fn(async (query) => {
          calls.push(["userCharacter.findMany", query]);
          if (query.where.characterSlug === CANONICAL_DENIA_SLUG) {
            return [{ userId: "user-1", chainCount: 5 }];
          }
          return [
            { userId: "user-1", chainCount: 2 },
            { userId: "user-2", chainCount: 3 }
          ];
        }),
        upsert: vi.fn(async (query) => calls.push(["userCharacter.upsert", query])),
        deleteMany: vi.fn(async (query) => calls.push(["userCharacter.deleteMany", query]))
      },
      user: {
        findMany: vi.fn(async () => [
          { id: "user-1", selectedCharacter: "danea", ownedCharacters: "sigrika,danea,aemeath" },
          { id: "user-2", selectedCharacter: "sigrika", ownedCharacters: "denea,denia" },
          { id: "user-3", selectedCharacter: "denia", ownedCharacters: "sigrika,denia" }
        ]),
        update: vi.fn(async (query) => calls.push(["user.update", query]))
      },
      shopItem: { updateMany: vi.fn(async (query) => calls.push(["shopItem.updateMany", query])) },
      gachaPrize: { updateMany: vi.fn(async (query) => calls.push(["gachaPrize.updateMany", query])) },
      gachaDrawReward: { updateMany: vi.fn(async (query) => calls.push(["gachaDrawReward.updateMany", query])) },
      achievementRewardAsset: { updateMany: vi.fn(async (query) => calls.push(["achievementRewardAsset.updateMany", query])) },
      gameRecord: { deleteMany: vi.fn(async (query) => calls.push(["gameRecord.deleteMany", query])) },
      character: { deleteMany: vi.fn(async (query) => calls.push(["character.deleteMany", query])) }
    };

    await cleanupLegacyDeniaCharacterData(prisma);

    expect(prisma.userCharacter.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_characterSlug: { userId: "user-1", characterSlug: "denia" } },
      update: { chainCount: 5 }
    }));
    expect(prisma.userCharacter.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_characterSlug: { userId: "user-2", characterSlug: "denia" } },
      create: expect.objectContaining({ userId: "user-2", characterSlug: "denia", chainCount: 3 })
    }));
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { selectedCharacter: "denia", ownedCharacters: "sigrika,denia,aemeath" }
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { ownedCharacters: "denia" }
    });
    expect(prisma.gameRecord.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { blackCharacter: { in: LEGACY_DENIA_SLUGS } },
          { whiteCharacter: { in: LEGACY_DENIA_SLUGS } }
        ]
      }
    });
    expect(prisma.character.deleteMany).toHaveBeenCalledWith({
      where: { slug: { in: LEGACY_DENIA_SLUGS } }
    });
    expect(calls).toContainEqual(["shopItem.updateMany", {
      where: { category: "character", targetId: { in: LEGACY_DENIA_SLUGS } },
      data: { targetId: "denia" }
    }]);
  });

  it("still deletes legacy rows when narrow Prisma mocks do not expose read delegates", async () => {
    const calls = [];
    await cleanupLegacyDeniaCharacterData({
      userCharacter: {
        deleteMany: async (query) => calls.push(["userCharacter.deleteMany", query])
      },
      character: {
        deleteMany: async (query) => calls.push(["character.deleteMany", query])
      }
    });

    expect(calls).toContainEqual(["userCharacter.deleteMany", {
      where: { characterSlug: { in: LEGACY_DENIA_SLUGS } }
    }]);
    expect(calls).toContainEqual(["character.deleteMany", {
      where: { slug: { in: LEGACY_DENIA_SLUGS } }
    }]);
  });
});
