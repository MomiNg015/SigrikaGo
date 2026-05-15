import express from "express";
import { describe, expect, it } from "vitest";
import {
  banUser,
  createAdminRouter,
  requireUserUpdateData,
  resetUserPassword,
  sanitizeUserUpdate,
  serializeAudit,
  unbanUser,
  updateUserProfile
} from "./adminRoutes.js";

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

  it("rejects integer updates outside the Prisma Int range", () => {
    expect(sanitizeUserUpdate({
      rating: 1e100,
      coins: "999999999999999999999999999999"
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

  it("updates user profiles and audit logs in the same transaction", async () => {
    const { prisma, calls, auditWrites } = transactionPrisma();

    const result = await updateUserProfile({
      prisma,
      adminUser: { id: "admin-1" },
      userId: "user-1",
      body: { rank: "19级" }
    });

    expect(result.user.rank).toBe("19级");
    expect(calls).toEqual([
      "transaction",
      "tx.user.findUnique",
      "tx.user.update",
      "tx.adminAuditLog.create"
    ]);
    expect(auditWrites[0].action).toBe("user.update");
    expect(auditWrites[0].targetId).toBe("user-1");
  });

  it("bans users and audit logs in the same transaction", async () => {
    const { prisma, calls, auditWrites } = transactionPrisma();

    const result = await banUser({
      prisma,
      adminUser: { id: "admin-1" },
      userId: "user-1",
      reason: "abuse"
    });

    expect(result.user.status).toBe("banned");
    expect(calls).toEqual([
      "transaction",
      "tx.user.findUnique",
      "tx.user.update",
      "tx.adminAuditLog.create"
    ]);
    expect(auditWrites[0].action).toBe("user.ban");
  });

  it("unbans users and audit logs in the same transaction", async () => {
    const { prisma, calls, auditWrites } = transactionPrisma();

    const result = await unbanUser({
      prisma,
      adminUser: { id: "admin-1" },
      userId: "user-1"
    });

    expect(result.user.status).toBe("active");
    expect(calls).toEqual([
      "transaction",
      "tx.user.findUnique",
      "tx.user.update",
      "tx.adminAuditLog.create"
    ]);
    expect(auditWrites[0].action).toBe("user.unban");
  });
});

describe("admin user routes", () => {
  it("returns 400 when PATCH /users/:id has legal fields but no updateable values", async () => {
    const { prisma } = transactionPrisma();

    const response = await requestAdminRoute(prisma, "/users/user-1", {
      method: "PATCH",
      body: {
        rank: "   ",
        selectedCharacter: "   ",
        ownedCharacters: []
      }
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "没有可更新字段" });
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

function transactionPrisma() {
  const calls = [];
  const auditWrites = [];
  const topLevelAccessError = () => {
    throw new Error("mutation must use the transaction client");
  };
  const tx = {
    user: {
      findUnique: async () => {
        calls.push("tx.user.findUnique");
        return userFixture();
      },
      update: async ({ data }) => {
        calls.push("tx.user.update");
        return { ...userFixture(), ...data };
      }
    },
    adminAuditLog: {
      create: async ({ data }) => {
        calls.push("tx.adminAuditLog.create");
        auditWrites.push(data);
        return data;
      }
    }
  };
  return {
    calls,
    auditWrites,
    prisma: {
      user: {
        findUnique: topLevelAccessError,
        update: topLevelAccessError
      },
      adminAuditLog: {
        create: topLevelAccessError
      },
      $transaction: async (callback) => {
        calls.push("transaction");
        return callback(tx);
      }
    }
  };
}

async function requestAdminRoute(prisma, path, { method, body }) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: "admin-1" };
    next();
  });
  app.use(createAdminRouter({ prisma }));
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    return {
      status: response.status,
      body: await response.json()
    };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}
