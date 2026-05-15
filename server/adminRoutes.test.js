import { describe, expect, it } from "vitest";
import { requireUserUpdateData, resetUserPassword, sanitizeUserUpdate, serializeAudit } from "./adminRoutes.js";

describe("admin route helpers", () => {
  it("sanitizes editable user fields", () => {
    expect(sanitizeUserUpdate({
      role: "admin",
      status: "banned",
      rank: "17级",
      rating: "1020",
      coins: "500",
      ownedCharacters: ["sigrika", "danea"],
      selectedCharacter: "danea",
      passwordHash: "ignored"
    })).toEqual({
      role: "admin",
      status: "banned",
      rank: "17级",
      rating: 1020,
      coins: 500,
      ownedCharacters: "sigrika,danea",
      selectedCharacter: "danea"
    });
  });

  it("serializes audit before and after values", () => {
    expect(serializeAudit({ a: 1 })).toBe("{\"a\":1}");
  });

  it("rejects empty user update payloads", () => {
    expect(() => requireUserUpdateData({})).toThrow("没有可更新字段");
  });

  it("rejects invalid sanitizer input types", () => {
    expect(sanitizeUserUpdate({
      role: "owner",
      status: "muted",
      rank: 17,
      rating: "1020.5",
      coins: true,
      selectedCharacter: { slug: "danea" },
      ownedCharacters: ["sigrika", "", "  ", 42, null, "danea"]
    })).toEqual({
      ownedCharacters: "sigrika,danea"
    });

    expect(sanitizeUserUpdate({
      rating: null,
      coins: Number.NaN,
      ownedCharacters: "sigrika"
    })).toEqual({});
  });

  it("resets passwords inside a transaction without leaking secrets to audit logs", async () => {
    const auditWrites = [];
    const tx = {
      user: {
        findUnique: async () => userFixture(),
        update: async ({ data }) => ({ ...userFixture(), passwordHash: data.passwordHash })
      },
      adminAuditLog: {
        create: async ({ data }) => {
          auditWrites.push(data);
          return data;
        }
      }
    };
    const prisma = {
      $transaction: async (callback) => callback(tx)
    };

    const result = await resetUserPassword({
      prisma,
      adminUser: { id: "admin-1" },
      userId: "user-1",
      password: "new-secret"
    });

    expect(result).toEqual({ ok: true });
    expect(auditWrites).toHaveLength(1);
    expect(auditWrites[0].action).toBe("user.reset-password");
    expect(JSON.stringify(auditWrites[0])).not.toContain("new-secret");
    expect(JSON.stringify(auditWrites[0])).not.toContain("passwordHash");
  });
});

function userFixture() {
  return {
    id: "user-1",
    username: "player",
    passwordHash: "old-hash",
    role: "player",
    status: "active",
    rank: "18级",
    rating: 1000,
    wins: 0,
    losses: 0,
    coins: 300,
    selectedCharacter: "sigrika",
    ownedCharacters: "sigrika,danea",
    ownedItems: "",
    ownedDecorations: ""
  };
}
