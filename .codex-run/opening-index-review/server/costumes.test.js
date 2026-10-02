import { describe, expect, it, vi } from "vitest";
import {
  ensureCostumeSchema,
  equipCostume,
  listCostumes,
  purchaseCostume,
  validateCostumeInput
} from "./costumes.js";

const COSTUME = {
  id: "denia-costume-01",
  name: "达妮娅·服装 01",
  characterSlug: "denia",
  portraitUrl: "/assets/costumes/denia-01.webp",
  candyEffectPortraitUrl: "",
  portraitScalePercent: 88,
  portraitOffsetXPercent: -2,
  portraitOffsetYPercent: 3,
  description: "",
  illustName: "",
  illustUrl: "",
  priceCoins: 600,
  discountPercent: 0,
  shopVisible: true,
  purchasable: true,
  enabled: true,
  sortOrder: 10,
  source: "default",
  createdAt: new Date("2026-07-23T00:00:00Z")
};

function user(overrides = {}) {
  return {
    id: "user-1",
    username: "player",
    role: "player",
    status: "active",
    rank: "3段",
    rating: 1000,
    wins: 0,
    losses: 0,
    coins: 800,
    blueGems: 0,
    selectedCharacter: "denia",
    selectedStoneDecoration: "",
    ownedCharacters: "sigrika,denia",
    ownedItems: "",
    ownedDecorations: "",
    itemEffects: "",
    ownedMusicIds: "",
    musicSelections: "{}",
    userCharacters: [],
    userDecorations: [],
    userItems: [],
    userItemEffects: [],
    userCostumes: [],
    costumeEquipment: [],
    modeStats: [],
    ...overrides
  };
}

describe("costume schema", () => {
  it("creates catalog, ownership, equipment, and their indexes before default seeding", async () => {
    const client = { $executeRawUnsafe: vi.fn(async () => 0) };
    await ensureCostumeSchema(client);
    const sql = client.$executeRawUnsafe.mock.calls.map(([statement]) => statement).join("\n");
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "Costume"');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "UserCostume"');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "UserCostumeEquipment"');
    expect(sql).toContain('"UserCostume_userId_costumeId_key"');
    expect(sql).toContain('"UserCostumeEquipment_userId_characterSlug_key"');
  });

  it("adds portrait framing columns to an existing costume catalog without replacing rows", async () => {
    const client = {
      $executeRawUnsafe: vi.fn(async () => 0),
      $queryRawUnsafe: vi.fn(async () => [{ name: "id" }, { name: "portraitUrl" }])
    };
    await ensureCostumeSchema(client);
    const sql = client.$executeRawUnsafe.mock.calls.map(([statement]) => statement).join("\n");
    expect(sql).toContain('ALTER TABLE "Costume" ADD COLUMN "portraitScalePercent"');
    expect(sql).toContain('ALTER TABLE "Costume" ADD COLUMN "portraitOffsetXPercent"');
    expect(sql).toContain('ALTER TABLE "Costume" ADD COLUMN "portraitOffsetYPercent"');
    expect(sql).not.toContain('DROP TABLE');
  });

  it("does nothing for narrowed test doubles without raw SQL support", async () => {
    await expect(ensureCostumeSchema({})).resolves.toBeUndefined();
  });
});

describe("costume input", () => {
  it("normalizes a safe admin payload", () => {
    expect(validateCostumeInput({
      ...COSTUME,
      id: " Denia-Costume-01 ",
      illustName: "artist",
      illustUrl: "https://example.com/artist"
    })).toMatchObject({
      ok: true,
      value: {
        id: "denia-costume-01",
        characterSlug: "denia",
        portraitUrl: "/assets/costumes/denia-01.webp",
        portraitScalePercent: 88,
        portraitOffsetXPercent: -2,
        portraitOffsetYPercent: 3
      }
    });
  });

  it("rejects unsafe resource URLs", () => {
    const result = validateCostumeInput({ ...COSTUME, portraitUrl: "javascript:alert(1)" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("portraitUrl");
  });

  it("rejects portrait framing values outside the admin contract", () => {
    expect(validateCostumeInput({ ...COSTUME, portraitScalePercent: 49 }).error).toContain("portraitScalePercent");
    expect(validateCostumeInput({ ...COSTUME, portraitOffsetXPercent: 51 }).error).toContain("portraitOffsetXPercent");
    expect(validateCostumeInput({ ...COSTUME, portraitOffsetYPercent: -51 }).error).toContain("portraitOffsetYPercent");
  });
});

describe("costume catalog", () => {
  it("projects ownership, character locks, and current equipment", async () => {
    const equipped = { ...COSTUME };
    const prisma = {
      costume: { findMany: vi.fn(async () => [COSTUME]) },
      user: {
        findUnique: vi.fn(async () => user({
          userCostumes: [{ costumeId: COSTUME.id }],
          costumeEquipment: [{ characterSlug: "denia", costume: equipped }]
        }))
      }
    };
    const result = await listCostumes({ prisma, userId: "user-1" });
    expect(result.costumes[0]).toMatchObject({
      id: COSTUME.id,
      owned: true,
      characterOwned: true,
      equipped: true,
      finalPrice: 600
    });
  });
});

describe("costume purchase", () => {
  it("deducts coins and creates ownership in one transaction", async () => {
    const before = user();
    const after = user({
      coins: 200,
      userCostumes: [{ costumeId: COSTUME.id }]
    });
    const tx = {
      user: {
        findUnique: vi.fn()
          .mockResolvedValueOnce(before)
          .mockResolvedValueOnce(after),
        updateMany: vi.fn(async () => ({ count: 1 }))
      },
      costume: { findUnique: vi.fn(async () => COSTUME) },
      userCostume: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }) => data)
      },
      userProgressLedger: { create: vi.fn(async ({ data }) => data) }
    };
    const prisma = { $transaction: (callback) => callback(tx) };

    const result = await purchaseCostume({ prisma, userId: "user-1", costumeId: COSTUME.id });

    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", coins: { gte: 600 } },
      data: { coins: { decrement: 600 } }
    });
    expect(tx.userCostume.create).toHaveBeenCalledWith({
      data: { userId: "user-1", costumeId: COSTUME.id, source: "purchase" }
    });
    expect(tx.userProgressLedger.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reason: "costume.purchase",
        refType: "costume",
        refId: COSTUME.id,
        delta: -600
      })
    });
    expect(result.user).toMatchObject({ coins: 200, ownedCostumeIds: [COSTUME.id] });
  });

  it("rejects a costume for an unowned character before writing", async () => {
    const lockedCostume = { ...COSTUME, id: "nabomo-costume-01", characterSlug: "nabomo" };
    const tx = {
      user: {
        findUnique: vi.fn(async () => user({ ownedCharacters: "sigrika" })),
        updateMany: vi.fn()
      },
      costume: { findUnique: vi.fn(async () => lockedCostume) },
      userCostume: {
        findUnique: vi.fn(async () => null),
        create: vi.fn()
      }
    };
    const prisma = { $transaction: (callback) => callback(tx) };
    await expect(purchaseCostume({ prisma, userId: "user-1", costumeId: lockedCostume.id }))
      .rejects.toMatchObject({ status: 400, message: "需要先拥有对应角色" });
    expect(tx.user.updateMany).not.toHaveBeenCalled();
    expect(tx.userCostume.create).not.toHaveBeenCalled();
  });
});

describe("costume equipment", () => {
  it("equips an enabled owned costume immediately", async () => {
    const before = user({ userCostumes: [{ costumeId: COSTUME.id }] });
    const after = user({
      userCostumes: [{ costumeId: COSTUME.id }],
      costumeEquipment: [{ characterSlug: "denia", costume: COSTUME }]
    });
    const tx = {
      user: {
        findUnique: vi.fn()
          .mockResolvedValueOnce(before)
          .mockResolvedValueOnce(after)
      },
      costume: { findUnique: vi.fn(async () => COSTUME) },
      userCostume: { findUnique: vi.fn(async () => ({ costumeId: COSTUME.id })) },
      userCostumeEquipment: {
        deleteMany: vi.fn(),
        upsert: vi.fn(async ({ create }) => create)
      }
    };
    const result = await equipCostume({
      prisma: { $transaction: (callback) => callback(tx) },
      userId: "user-1",
      characterSlug: "denia",
      costumeId: COSTUME.id
    });
    expect(tx.userCostumeEquipment.upsert).toHaveBeenCalledWith({
      where: { userId_characterSlug: { userId: "user-1", characterSlug: "denia" } },
      create: { userId: "user-1", characterSlug: "denia", costumeId: COSTUME.id },
      update: { costumeId: COSTUME.id }
    });
    expect(result.user.equippedCostumes.denia.id).toBe(COSTUME.id);
  });

  it("returns to the permanent default by deleting only that character equipment", async () => {
    const current = user({ userCostumes: [{ costumeId: COSTUME.id }] });
    const tx = {
      user: { findUnique: vi.fn(async () => current) },
      userCostumeEquipment: { deleteMany: vi.fn(async () => ({ count: 1 })) }
    };
    const result = await equipCostume({
      prisma: { $transaction: (callback) => callback(tx) },
      userId: "user-1",
      characterSlug: "denia",
      costumeId: "default"
    });
    expect(tx.userCostumeEquipment.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", characterSlug: "denia" }
    });
    expect(result.costumeId).toBe("default");
  });
});
