import express from "express";
import { describe, expect, it } from "vitest";
import {
  assertSafeJwtSecret,
} from "./auth.js";
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
  it("rejects default JWT secrets in production", () => {
    expect(() => assertSafeJwtSecret("change-me-in-production", "production")).toThrow("JWT_SECRET");
    expect(() => assertSafeJwtSecret("dev-secret", "production")).toThrow("JWT_SECRET");
    expect(() => assertSafeJwtSecret("local-only", "development")).not.toThrow();
  });

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
      rank: "17级",
      rating: 1020,
      coins: 500,
      ownedCharacters: "sigrika,danea",
      selectedCharacter: "danea"
    });
  });

  it("does not allow generic profile updates to change user status", () => {
    expect(sanitizeUserUpdate({
      status: "banned"
    })).toEqual({});
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

  it("does not allow removing the last active admin", async () => {
    const { prisma } = transactionPrisma({
      user: { ...userFixture(), role: "admin" },
      otherActiveAdmins: 0
    });

    await expect(updateUserProfile({
      prisma,
      adminUser: { id: "admin-1" },
      userId: "user-1",
      body: { role: "player" }
    })).rejects.toThrow("Cannot remove the last active admin");

    await expect(banUser({
      prisma,
      adminUser: { id: "admin-1" },
      userId: "user-1",
      reason: "risk"
    })).rejects.toThrow("Cannot remove the last active admin");
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

  it("lists game records for any selected user", async () => {
    const response = await requestAdminRoute({
      gameRecord: {
        findMany: async (query) => {
          expect(query.where.OR).toEqual([
            { blackUserId: "user-1" },
            { whiteUserId: "user-1" }
          ]);
          return [{
            id: "record-1",
            roomCode: "12345",
            blackName: "alice",
            whiteName: "bob",
            resultText: "黑中盘胜",
            moveCount: 42,
            createdAt: new Date("2026-01-01T00:00:00Z")
          }];
        }
      }
    }, "/users/user-1/replays", { method: "GET" });

    expect(response.status).toBe(200);
    expect(response.body.records).toEqual([{
      id: "record-1",
      roomCode: "12345",
      blackName: "alice",
      whiteName: "bob",
      resultText: "黑中盘胜",
      moveCount: 42,
      createdAt: "2026-01-01T00:00:00.000Z"
    }]);
  });

  it("lets admins read any replay snapshot by id", async () => {
    const snapshot = { code: "12345", game: { history: [] } };
    const response = await requestAdminRoute({
      gameRecord: {
        findUnique: async ({ where }) => {
          expect(where).toEqual({ id: "record-1" });
          return {
            id: "record-1",
            roomCode: "12345",
            snapshot: JSON.stringify(snapshot)
          };
        }
      }
    }, "/replays/record-1", { method: "GET" });

    expect(response.status).toBe(200);
    expect(response.body.record.snapshot).toEqual(snapshot);
  });
});

describe("admin character routes", () => {
  it("allows PATCH /characters/:id to update legacy top-level skill fields", async () => {
    const { prisma, characterUpdates } = characterRoutePrisma();

    const response = await requestAdminRoute(prisma, "/characters/danea", {
      method: "PATCH",
      body: {
        portraitSource: "upload",
        skillName: "Mirror Step",
        uses: 2
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.character.skill.name).toBe("Mirror Step");
    expect(response.body.character.skill.uses).toBe(2);
    expect(characterUpdates[0].portraitSource).toBe("upload");
    expect(characterUpdates[0].skill.upsert.update.name).toBe("Mirror Step");
    expect(characterUpdates[0].skill.upsert.update.uses).toBe(2);
  });

  it("returns JSON for unsupported portrait upload types", async () => {
    const uploadMiddleware = uploadMiddlewareThatFails(Object.assign(new Error("Unsupported image type"), { status: 400 }));
    const response = await requestAdminRoute({ character: {} }, "/uploads/character-portrait", {
      method: "POST",
      uploadMiddleware
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Unsupported image type" });
  });

  it("returns JSON for oversized portrait uploads", async () => {
    const error = Object.assign(new Error("File too large"), { code: "LIMIT_FILE_SIZE" });
    const uploadMiddleware = uploadMiddlewareThatFails(error);
    const response = await requestAdminRoute({ character: {} }, "/uploads/character-portrait", {
      method: "POST",
      uploadMiddleware
    });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: "Portrait file must be 3MB or smaller" });
  });
});

describe("admin shop and decoration routes", () => {
  it("creates and lists decorations", async () => {
    const decorations = [];
    const calls = [];
    const auditWrites = [];
    const response = await requestAdminRoute({
      decoration: {
        create: async ({ data }) => {
          calls.push("top.decoration.create");
          const record = { id: "decoration-1", ...data, createdAt: new Date("2026-01-01T00:00:00Z") };
          decorations.push(record);
          return record;
        },
        findMany: async () => decorations
      },
      adminAuditLog: {
        create: async () => {
          calls.push("top.adminAuditLog.create");
          throw new Error("audit must use the transaction client");
        }
      },
      $transaction: async (callback) => callback({
        decoration: {
          create: async ({ data }) => {
            calls.push("tx.decoration.create");
            const record = { id: "decoration-1", ...data, createdAt: new Date("2026-01-01T00:00:00Z") };
            decorations.push(record);
            return record;
          }
        },
        adminAuditLog: {
          create: async ({ data }) => {
            calls.push("tx.adminAuditLog.create");
            auditWrites.push(data);
            return data;
          }
        }
      })
    }, "/decorations", {
      method: "POST",
      body: {
        slug: "moon-frame",
        name: "月光头像框",
        description: "柔和月光装饰",
        imageUrl: "/assets/moon.png",
        enabled: true,
        sortOrder: 1
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.decoration.slug).toBe("moon-frame");
    expect(calls).toEqual(["tx.decoration.create", "tx.adminAuditLog.create"]);
    expect(auditWrites[0].action).toBe("decoration.create");
    expect(auditWrites[0].targetType).toBe("decoration");
  });

  it("creates shop items with character or decoration categories", async () => {
    const calls = [];
    const auditWrites = [];
    const response = await requestAdminRoute({
      character: {
        findUnique: async ({ where }) => where.slug === "danea" ? { id: "character-1", slug: "danea" } : null
      },
      shopItem: {
        create: async () => {
          calls.push("top.shopItem.create");
          throw new Error("shop mutation must use the transaction client");
        },
        findMany: async () => []
      },
      adminAuditLog: {
        create: async () => {
          calls.push("top.adminAuditLog.create");
          throw new Error("audit must use the transaction client");
        }
      },
      $transaction: async (callback) => callback({
        shopItem: {
          create: async ({ data }) => {
            calls.push("tx.shopItem.create");
            return { id: "shop-1", ...data };
          }
        },
        adminAuditLog: {
          create: async ({ data }) => {
            calls.push("tx.adminAuditLog.create");
            auditWrites.push(data);
            return data;
          }
        }
      })
    }, "/shop-items", {
      method: "POST",
      body: {
        name: "购买达妮娅",
        category: "character",
        targetId: "danea",
        priceCoins: 100,
        discountPercent: 20,
        purchasable: true,
        enabled: true,
        sortOrder: 1,
        description: "解锁角色",
        imageUrl: "/assets/Danea_centered.png"
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.item.finalPrice).toBe(80);
    expect(calls).toEqual(["tx.shopItem.create", "tx.adminAuditLog.create"]);
    expect(auditWrites[0].action).toBe("shop-item.create");
    expect(auditWrites[0].targetType).toBe("shop-item");
  });

  it("rejects shop items whose target does not exist", async () => {
    const response = await requestAdminRoute({
      character: {
        findUnique: async () => null
      },
      shopItem: {
        create: async () => {
          throw new Error("should not create invalid shop item");
        }
      }
    }, "/shop-items", {
      method: "POST",
      body: {
        name: "Missing Character",
        category: "character",
        targetId: "missing",
        priceCoins: 100,
        discountPercent: 0,
        purchasable: true,
        enabled: true,
        sortOrder: 1
      }
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Shop character target does not exist" });
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

function transactionPrisma(options = {}) {
  const calls = [];
  const auditWrites = [];
  const fixture = options.user ?? userFixture();
  const topLevelAccessError = () => {
    throw new Error("mutation must use the transaction client");
  };
  const tx = {
    user: {
      findUnique: async () => {
        calls.push("tx.user.findUnique");
        return fixture;
      },
      count: async () => {
        calls.push("tx.user.count");
        return options.otherActiveAdmins ?? 1;
      },
      update: async ({ data }) => {
        calls.push("tx.user.update");
        return { ...fixture, ...data };
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
        count: topLevelAccessError,
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

function characterRoutePrisma() {
  const characterUpdates = [];
  const character = characterFixture();
  const tx = {
    character: {
      findFirst: async () => character,
      update: async ({ data }) => {
        characterUpdates.push(data);
        return {
          ...character,
          ...data,
          skill: {
            ...character.skill,
            ...data.skill.upsert.update
          }
        };
      }
    },
    adminAuditLog: {
      create: async ({ data }) => data
    }
  };
  return {
    characterUpdates,
    prisma: {
      character: {
        findFirst: () => {
          throw new Error("mutation must use the transaction client");
        },
        update: () => {
          throw new Error("mutation must use the transaction client");
        }
      },
      adminAuditLog: {
        create: () => {
          throw new Error("mutation must use the transaction client");
        }
      },
      $transaction: async (callback) => callback(tx)
    }
  };
}

function characterFixture() {
  return {
    id: "character-db-1",
    slug: "danea",
    name: "Danea",
    portraitUrl: "/assets/danea.png",
    portraitSource: "url",
    palette: "#6ab7ff",
    enabled: true,
    sortOrder: 1,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    skill: {
      id: "skill-1",
      effectType: "flip-stone",
      name: "Old Skill",
      description: "Flip a stone",
      uses: 1,
      freeTurn: false,
      targetRule: "stone",
      paramsJson: "{}"
    }
  };
}

function uploadMiddlewareThatFails(error) {
  return {
    single: () => (_req, _res, next) => {
      next(error);
    }
  };
}

async function requestAdminRoute(prisma, path, { method, body, uploadMiddleware }) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: "admin-1" };
    next();
  });
  app.use(createAdminRouter({ prisma, uploadMiddleware }));
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: body == null ? undefined : JSON.stringify(body)
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
