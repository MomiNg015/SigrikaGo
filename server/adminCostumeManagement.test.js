import { describe, expect, it, vi } from "vitest";
import {
  assertCostumeCharacterExists,
  createCostume,
  updateCostume
} from "./adminCostumeManagement.js";

const costume = {
  id: "denia-costume-01",
  name: "达妮娅舞台服",
  characterSlug: "denia",
  portraitUrl: "/assets/costumes/denia-01.webp",
  candyEffectPortraitUrl: "",
  description: "",
  illustName: "",
  illustUrl: "",
  priceCoins: 600,
  discountPercent: 0,
  shopVisible: true,
  purchasable: true,
  enabled: true,
  sortOrder: 0,
  source: "admin"
};

describe("admin costume management", () => {
  it("rejects costumes whose character target does not exist", async () => {
    await expect(assertCostumeCharacterExists({
      character: { findUnique: vi.fn(async () => null) }
    }, costume)).rejects.toMatchObject({
      status: 400,
      message: "服装所属角色不存在"
    });
  });

  it("creates a costume and writes an audit row in one transaction", async () => {
    const tx = {
      costume: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }) => data)
      },
      adminAuditLog: { create: vi.fn(async ({ data }) => data) }
    };
    const result = await createCostume({
      prisma: { $transaction: (callback) => callback(tx) },
      adminUser: { id: "admin-1" },
      input: costume
    });

    expect(result.id).toBe(costume.id);
    expect(tx.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "costume.create",
        targetType: "costume",
        targetId: costume.id
      })
    });
  });

  it("returns active equipment to default when a costume is disabled without deleting ownership", async () => {
    const tx = {
      costume: {
        findUnique: vi.fn(async () => costume),
        update: vi.fn(async () => ({ ...costume, enabled: false }))
      },
      userCostumeEquipment: { deleteMany: vi.fn(async () => ({ count: 2 })) },
      userCostume: { deleteMany: vi.fn() },
      adminAuditLog: { create: vi.fn(async ({ data }) => data) }
    };
    await updateCostume({
      prisma: { $transaction: (callback) => callback(tx) },
      adminUser: { id: "admin-1" },
      costumeId: costume.id,
      input: { ...costume, enabled: false }
    });

    expect(tx.userCostumeEquipment.deleteMany).toHaveBeenCalledWith({
      where: { costumeId: costume.id }
    });
    expect(tx.userCostume.deleteMany).not.toHaveBeenCalled();
  });
});
