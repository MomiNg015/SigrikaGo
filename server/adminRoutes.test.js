import express from "express";
import { describe, expect, it } from "vitest";
import {
  assertSafeJwtSecret,
} from "./auth.js";
import {
  banUser,
  createAdminRouter,
  detectImageMimeFromBuffer,
  requireUserUpdateData,
  resetUserPassword,
  runtimeCapacityPayload,
  sanitizeUserUpdate,
  serializeAudit,
  unbanUser,
  updateUserProfile,
  validatePortraitUpload
} from "./adminRoutes.js";

describe("admin route helpers", () => {
  it("builds a lightweight runtime capacity payload without database analytics", () => {
    expect(runtimeCapacityPayload({
      runtimeStabilityMetrics: { snapshot: () => ({ gameActionAttempts: 12 }) },
      runtimeServiceState: { snapshot: () => ({ current: { activeRooms: 4 } }) },
      now: new Date("2026-07-10T12:00:00.000Z")
    })).toEqual({
      generatedAt: "2026-07-10T12:00:00.000Z",
      runtimeStability: { gameActionAttempts: 12 },
      capacity: { current: { activeRooms: 4 } }
    });
  });

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
      body: { rating: "1150" }
    });

    expect(result.user.rating).toBe(1150);
    expect(result.user.rank).toBe("18级");
    expect(calls).toEqual([
      "transaction",
      "tx.user.findUnique",
      "tx.user.update",
      ["tx.userProgressLedger.create", expect.objectContaining({
        metric: "rating",
        delta: 150,
        beforeValue: 1000,
        afterValue: 1150,
        reason: "admin.update"
      })],
      "tx.adminAuditLog.create"
    ]);
    expect(auditWrites[0].action).toBe("user.update");
    expect(auditWrites[0].targetId).toBe("user-1");
  });

  it("syncs structured asset rows after admin asset edits", async () => {
    const { prisma, calls } = transactionPrisma();

    await updateUserProfile({
      prisma,
      adminUser: { id: "admin-1" },
      userId: "user-1",
      body: {
        ownedCharacters: ["sigrika", "denia"],
        ownedItems: [{ itemId: "rainbow-candy", quantity: 2 }]
      }
    });

    expect(calls).toContainEqual(["tx.userCharacter.upsert", expect.objectContaining({
      where: { userId_characterSlug: { userId: "user-1", characterSlug: "denia" } }
    })]);
    expect(calls).toContainEqual(["tx.userItem.upsert", expect.objectContaining({
      where: { userId_itemId: { userId: "user-1", itemId: "rainbow-candy" } },
      update: { quantity: 2, source: "legacy" }
    })]);
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

  it("lists submitted feedback messages for admins", async () => {
    const response = await requestAdminRoute({
      feedbackMessage: {
        findMany: async (query) => {
          expect(query).toMatchObject({
            orderBy: { createdAt: "desc" },
            take: 100
          });
          return [{
            id: "feedback-1",
            userId: "user-1",
            username: "alice",
            content: "希望优化大厅",
            createdAt: new Date("2026-05-25T00:00:00Z")
          }];
        }
      }
    }, "/feedback", { method: "GET" });

    expect(response.status).toBe(200);
    expect(response.body.feedbackMessages[0]).toMatchObject({
      username: "alice",
      content: "希望优化大厅"
    });
  });
});

describe("admin mailbox routes", () => {
  it("searches mailbox recipients by username", async () => {
    const response = await requestAdminRoute({
      user: {
        findMany: async ({ where, take }) => {
          expect(where.username.contains).toBe("ali");
          expect(take).toBe(20);
          return [{ id: "user-1", username: "alice", role: "player", status: "active" }];
        }
      }
    }, "/mailbox/users?q=ali", { method: "GET" });

    expect(response.status).toBe(200);
    expect(response.body.users).toEqual([{ id: "user-1", username: "alice", role: "player", status: "active" }]);
  });

  it("creates mailbox batches for admins", async () => {
    const response = await requestAdminRoute(mailboxAdminPrisma(), "/mailbox/batches", {
      method: "POST",
      body: {
        targetMode: "user",
        recipientUserId: "user-1",
        title: "Gift",
        body: "Please claim.",
        attachmentType: "coins",
        attachmentQuantity: 10
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.batch).toMatchObject({
      targetMode: "user",
      title: "Gift",
      deliveredCount: 1,
      skippedCount: 0
    });
  });
});

function mailboxAdminPrisma() {
  const user = { id: "user-1", username: "alice", role: "player", status: "active" };
  const batches = [];
  const messages = [];
  const tx = {
    user: {
      findUnique: async () => user,
      findMany: async () => [user]
    },
    mailboxBatch: {
      create: async ({ data }) => {
        const batch = { id: "batch-1", createdAt: new Date("2026-06-22T00:00:00Z"), ...data };
        batches.push(batch);
        return batch;
      },
      update: async ({ data }) => {
        batches[0] = { ...batches[0], ...data };
        return batches[0];
      },
      findMany: async () => batches
    },
    mailboxMessage: {
      count: async () => messages.length,
      findMany: async () => messages,
      create: async ({ data }) => {
        const message = { id: "mail-1", createdAt: new Date("2026-06-22T00:00:00Z"), isRead: false, claimedAt: null, ...data };
        messages.push(message);
        return message;
      },
      delete: async () => {}
    },
    adminAuditLog: {
      create: async () => ({})
    }
  };
  return {
    user: tx.user,
    mailboxBatch: {
      findMany: async () => batches
    },
    $transaction: async (callback) => callback(tx)
  };
}

describe("admin site settings routes", () => {
  it("allows admins to read and update lobby copy", async () => {
    const store = new Map();
    const auditWrites = [];
    const prisma = {
      siteSetting: {
        findMany: async () => [...store.entries()].map(([key, value]) => ({ key, value }))
      },
      $transaction: async (callback) => callback({
        siteSetting: {
          upsert: async ({ where, create, update }) => {
            store.set(where.key, update.value);
            return { ...create, value: update.value };
          },
          findMany: async () => [...store.entries()].map(([key, value]) => ({ key, value }))
        },
        adminAuditLog: {
          create: async ({ data }) => {
            auditWrites.push(data);
            return data;
          }
        }
      })
    };

    const updateResponse = await requestAdminRoute(prisma, "/site-settings", {
      method: "PATCH",
      body: {
        homeTitle: "棋境大厅",
        homeSubtitle: "SigrikaGo 测试服",
        aboutText: "关于测试文本",
        footerText: "棋境大厅\n[备案](https://beian.miit.gov.cn/)",
        preloadTips: "第一句提示\n第二句提示",
        characterLoadingLines: "sigrika=西格莉卡正在戳棋盘",
        skillEffectsEnabled: false
      }
    });
    const readResponse = await requestAdminRoute(prisma, "/site-settings", { method: "GET" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.settings).toMatchObject({
      homeTitle: "棋境大厅",
      homeSubtitle: "SigrikaGo 测试服",
      aboutText: "关于测试文本",
      footerText: "棋境大厅\n[备案](https://beian.miit.gov.cn/)",
      preloadTips: "第一句提示\n第二句提示",
      characterLoadingLines: "sigrika=西格莉卡正在戳棋盘",
      skillEffectsEnabled: false
    });
    expect(readResponse.body.settings.homeTitle).toBe("棋境大厅");
    expect(auditWrites[0].action).toBe("site-settings.update");
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

  it("allows PATCH /characters/:id to disable a character skill", async () => {
    const { prisma, characterUpdates } = characterRoutePrisma();

    const response = await requestAdminRoute(prisma, "/characters/danea", {
      method: "PATCH",
      body: {
        skill: {
          enabled: false
        }
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.character.skill.enabled).toBe(false);
    expect(characterUpdates[0].skill.upsert.update.enabled).toBe(false);
  });

  it("allows PATCH /characters/:id to update character CV metadata", async () => {
    const { prisma, characterUpdates } = characterRoutePrisma();

    const response = await requestAdminRoute(prisma, "/characters/danea", {
      method: "PATCH",
      body: {
        cvName: "Voice Actor",
        cvUrl: "https://example.com/voice-actor"
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.character.cvName).toBe("Voice Actor");
    expect(response.body.character.cvUrl).toBe("https://example.com/voice-actor");
    expect(characterUpdates[0].cvName).toBe("Voice Actor");
    expect(characterUpdates[0].cvUrl).toBe("https://example.com/voice-actor");
  });

  it("rejects unsafe character CV links in admin character updates", async () => {
    const { prisma } = characterRoutePrisma();

    const response = await requestAdminRoute(prisma, "/characters/danea", {
      method: "PATCH",
      body: {
        cvName: "Voice Actor",
        cvUrl: "javascript:alert(1)"
      }
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("cvUrl");
  });

  it("lists disabled character skills for admin editing", async () => {
    const fixture = characterFixture();
    const character = { ...fixture, skill: { ...fixture.skill, enabled: false } };
    const response = await requestAdminRoute({
      character: {
        findMany: async () => [character]
      }
    }, "/characters", { method: "GET" });

    expect(response.status).toBe(200);
    expect(response.body.characters[0].skill.enabled).toBe(false);
    expect(response.body.characters[0].skill.name).toBe(character.skill.name);
    expect(response.body.characters[0].cvName).toBe(character.cvName);
    expect(response.body.characters[0].cvUrl).toBe(character.cvUrl);
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

  it("detects image MIME types from file signatures", () => {
    expect(detectImageMimeFromBuffer(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectImageMimeFromBuffer(Buffer.from([0xff, 0xd8, 0xff, 0xdb]))).toBe("image/jpeg");
    expect(detectImageMimeFromBuffer(Buffer.from("GIF89a"))).toBe("image/gif");
    expect(detectImageMimeFromBuffer(Buffer.from("RIFFxxxxWEBP"))).toBe("image/webp");
  });

  it("rejects portrait uploads whose content does not match the declared MIME type", async () => {
    await expect(validatePortraitUpload({
      file: { mimetype: "image/png", path: "portrait.png" },
      readFile: async () => Buffer.from("GIF89a")
    })).rejects.toMatchObject({
      status: 400,
      message: "Portrait file content does not match image type"
    });
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
        imageUrl: "/assets/Danea_centered.webp",
        illustName: "Artist",
        illustUrl: "https://example.com/artist"
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.item.finalPrice).toBe(80);
    expect(response.body.item.illustName).toBe("Artist");
    expect(response.body.item.illustUrl).toBe("https://example.com/artist");
    expect(calls).toEqual(["tx.shopItem.create", "tx.adminAuditLog.create"]);
    expect(auditWrites[0].action).toBe("shop-item.create");
    expect(auditWrites[0].targetType).toBe("shop-item");
  });

  it("rejects unsafe shop item illustration links", async () => {
    const response = await requestAdminRoute({
      character: {
        findUnique: async () => ({ id: "character-1", slug: "danea" })
      },
      shopItem: {
        create: async () => {
          throw new Error("should not create invalid shop item");
        }
      }
    }, "/shop-items", {
      method: "POST",
      body: {
        name: "购买达妮娅",
        category: "character",
        targetId: "danea",
        priceCoins: 100,
        discountPercent: 0,
        purchasable: true,
        enabled: true,
        sortOrder: 1,
        illustName: "Artist",
        illustUrl: "javascript:alert(1)"
      }
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("illustUrl");
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

  it("updates a built-in decoration shop item even when it is not in the admin decoration table", async () => {
    const calls = [];
    const response = await requestAdminRoute({
      decoration: {
        findUnique: async () => null
      },
      shopItem: {
        findMany: async () => []
      },
      $transaction: async (callback) => callback({
        shopItem: {
          findUnique: async () => ({
            id: "shop-1",
            name: "Old Paw Stone",
            category: "decoration",
            targetId: "paw-stone",
            priceCoins: 500,
            discountPercent: 0,
            purchasable: true,
            enabled: true,
            sortOrder: 1,
            description: "old",
            imageUrl: "/assets/decorations/paw-stone-preview.webp"
          }),
          update: async ({ data }) => {
            calls.push(["tx.shopItem.update", data]);
            return { id: "shop-1", ...data };
          }
        },
        adminAuditLog: {
          create: async () => {
            calls.push(["tx.adminAuditLog.create"]);
          }
        }
      })
    }, "/shop-items/shop-1", {
      method: "PATCH",
      body: {
        name: "Paw Stone",
        category: "decoration",
        targetId: "paw-stone",
        priceCoins: 500,
        discountPercent: 0,
        purchasable: true,
        enabled: true,
        sortOrder: 1,
        description: "new description",
        imageUrl: "/assets/decorations/paw-stone-preview.webp"
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.item.description).toBe("new description");
    expect(calls).toContainEqual(["tx.shopItem.update", expect.objectContaining({ targetId: "paw-stone" })]);
  });
});

describe("admin gacha routes", () => {
  it("creates gacha pools with custom prices, prizes, and featured prizes", async () => {
    const calls = [];
    const response = await requestAdminRoute({
      character: {
        findUnique: async () => ({ slug: "denia" })
      },
      $transaction: async (callback) => callback({
        gachaPool: {
          create: async ({ data }) => {
            calls.push(["tx.gachaPool.create", data]);
            return { id: "pool-1", ...data, createdAt: new Date("2026-06-12T00:00:00Z") };
          },
          update: async ({ where, data }) => {
            calls.push(["tx.gachaPool.update", where, data]);
            return { id: where.id, name: "Summer Capsules", ...data };
          }
        },
        gachaPrize: {
          create: async ({ data }) => {
            const id = `prize-${calls.filter(([type]) => type === "tx.gachaPrize.create").length + 1}`;
            calls.push(["tx.gachaPrize.create", data]);
            return { id, ...data };
          }
        },
        adminAuditLog: {
          create: async ({ data }) => {
            calls.push(["tx.adminAuditLog.create", data]);
            return data;
          }
        }
      })
    }, "/gacha-pools", {
      method: "POST",
      body: {
        name: "Summer Capsules",
        description: "limited pool",
        permanent: true,
        enabled: true,
        singleDrawPrice: 60,
        tenDrawPrice: 560,
        sortOrder: 2,
        featuredPrizeIndexes: [0, 1],
        prizes: [
          { type: "character", targetId: "denia", quantity: 1, probabilityBasisPoints: 7000, enabled: true, name: "Danea", imageUrl: "/assets/Danea_centered.webp" },
          { type: "coins", targetId: "", quantity: 60, probabilityBasisPoints: 3000, enabled: true, name: "Coins", imageUrl: "" }
        ]
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.pool).toMatchObject({
      id: "pool-1",
      name: "Summer Capsules",
      singleDrawPrice: 60,
      tenDrawPrice: 560,
      featuredPrizeId: "prize-1",
      featuredPrizeIds: ["prize-1", "prize-2"]
    });
    expect(calls).toContainEqual(["tx.gachaPool.create", expect.objectContaining({
      name: "Summer Capsules",
      singleDrawPrice: 60,
      tenDrawPrice: 560
    })]);
    expect(calls).toContainEqual(["tx.gachaPrize.create", expect.objectContaining({
      poolId: "pool-1",
      type: "character",
      targetId: "denia",
      probabilityBasisPoints: 7000
    })]);
    expect(calls).toContainEqual(["tx.gachaPool.update", { id: "pool-1" }, {
      featuredPrizeId: "prize-1",
      featuredPrizeIds: "[\"prize-1\",\"prize-2\"]"
    }]);
    expect(calls).toContainEqual(["tx.adminAuditLog.create", expect.objectContaining({
      action: "gacha-pool.create",
      targetType: "gacha-pool"
    })]);
  });

  it("rejects enabled gacha pools whose prize probability total is not 100 percent", async () => {
    const response = await requestAdminRoute({}, "/gacha-pools", {
      method: "POST",
      body: {
        name: "Broken Capsules",
        permanent: true,
        enabled: true,
        singleDrawPrice: 50,
        tenDrawPrice: 500,
        prizes: [
          { type: "coins", targetId: "", quantity: 60, probabilityBasisPoints: 9000, enabled: true }
        ]
      }
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "enabled prize probabilities must total 100%" });
  });

  it("rejects gacha prizes whose selected resource does not exist", async () => {
    const response = await requestAdminRoute({
      character: {
        findUnique: async () => null
      }
    }, "/gacha-pools", {
      method: "POST",
      body: {
        name: "Broken Target Capsules",
        permanent: true,
        enabled: true,
        singleDrawPrice: 50,
        tenDrawPrice: 500,
        prizes: [
          { type: "character", targetId: "missing-character", quantity: 1, probabilityBasisPoints: 10000, enabled: true }
        ]
      }
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Gacha character target does not exist" });
  });

  it("lists all gacha pools for admins, including closed or disabled pools", async () => {
    const response = await requestAdminRoute({
      gachaPool: {
        findMany: async () => [{
          id: "pool-1",
          name: "Closed Capsules",
          enabled: false,
          permanent: false,
          startsAt: new Date("2026-05-01T00:00:00Z"),
          endsAt: new Date("2026-05-31T00:00:00Z"),
          singleDrawPrice: 50,
          tenDrawPrice: 500,
          featuredPrizeId: "prize-1",
          prizes: [{ id: "prize-1", type: "coins", targetId: "", quantity: 60, probabilityBasisPoints: 10000, enabled: true }]
        }]
      }
    }, "/gacha-pools", { method: "GET" });

    expect(response.status).toBe(200);
    expect(response.body.pools).toHaveLength(1);
    expect(response.body.pools[0]).toMatchObject({
      id: "pool-1",
      enabled: false,
      prizes: [expect.objectContaining({ probabilityBasisPoints: 10000 })]
    });
  });
});

describe("admin achievement routes", () => {
  it("updates only editable achievement fields and writes audit", async () => {
    const achievementUpdates = [];
    const auditWrites = [];
    const rewardAsset = {
      id: "reward-1",
      type: "title",
      name: "Reward",
      enabled: true,
      deletedAt: null,
      sortOrder: 0
    };
    const achievement = {
      id: "ach-1",
      key: "first-win",
      name: "Old Name",
      content: "Old content",
      conditionType: "wins",
      conditionParams: "{\"value\":1}",
      rewardAssetId: "",
      rewardAsset: null,
      enabled: true,
      deletedAt: null,
      sortOrder: 1,
      _count: { userAchievements: 2 }
    };
    const response = await requestAdminRoute({
      achievementRewardAsset: {
        findUnique: async ({ where }) => (where.id === rewardAsset.id ? rewardAsset : null)
      },
      $transaction: async (callback) => callback({
        achievement: {
          findUnique: async () => achievement,
          update: async ({ data }) => {
            achievementUpdates.push(data);
            return {
              ...achievement,
              ...data,
              rewardAssetId: data.rewardAssetId,
              rewardAsset,
              _count: achievement._count
            };
          }
        },
        adminAuditLog: {
          create: async ({ data }) => {
            auditWrites.push(data);
            return data;
          }
        }
      })
    }, "/achievements/ach-1", {
      method: "PATCH",
      body: {
        name: "New Name",
        content: "New content",
        rewardAssetId: "reward-1",
        sortOrder: 7
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.achievement).toMatchObject({
      id: "ach-1",
      name: "New Name",
      content: "New content",
      rewardAssetId: "reward-1",
      sortOrder: 7
    });
    expect(achievementUpdates).toEqual([{
      name: "New Name",
      content: "New content",
      rewardAssetId: "reward-1",
      sortOrder: 7
    }]);
    expect(auditWrites[0]).toMatchObject({
      action: "achievement.update",
      targetType: "achievement",
      targetId: "ach-1"
    });
  });

  it("rejects code-managed achievement fields in admin updates", async () => {
    const response = await requestAdminRoute({}, "/achievements/ach-1", {
      method: "PATCH",
      body: { conditionType: "wins" }
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("conditionType");
  });

  it("rejects direct achievement creation and deletion", async () => {
    const createResponse = await requestAdminRoute({}, "/achievements", {
      method: "POST",
      body: { key: "new-achievement" }
    });
    const deleteResponse = await requestAdminRoute({}, "/achievements/ach-1", {
      method: "DELETE"
    });

    expect(createResponse.status).toBe(405);
    expect(createResponse.body).toEqual({ error: "Achievement creation is code-managed" });
    expect(deleteResponse.status).toBe(405);
    expect(deleteResponse.body).toEqual({ error: "Achievement deletion is code-managed" });
  });
});

describe("admin music track routes", () => {
  it("lists and updates music display names", async () => {
    const auditWrites = [];
    const store = new Map([["home-default", { id: "home-default", displayName: "星炬大厅" }]]);
    const response = await requestAdminRoute({
      musicTrackSetting: {
        findMany: async () => [...store.values()]
      },
      $transaction: async (callback) => callback({
        musicTrackSetting: {
          findUnique: async ({ where }) => store.get(where.id) ?? null,
          upsert: async ({ where, create, update }) => {
            const record = { ...create, ...update, id: where.id };
            store.set(where.id, record);
            return record;
          }
        },
        adminAuditLog: {
          create: async ({ data }) => {
            auditWrites.push(data);
            return data;
          }
        }
      })
    }, "/music-tracks/home-default", {
      method: "PATCH",
      body: { displayName: "新大厅音乐" }
    });
    const listResponse = await requestAdminRoute({
      musicTrackSetting: {
        findMany: async () => [...store.values()]
      }
    }, "/music-tracks", { method: "GET" });

    expect(response.status).toBe(200);
    expect(response.body.track).toMatchObject({
      id: "home-default",
      name: "新大厅音乐",
      defaultName: "Default Home BGM"
    });
    expect(listResponse.body.tracks.some((track) => track.id === "home-default" && track.name === "新大厅音乐")).toBe(true);
    expect(auditWrites[0]).toMatchObject({
      action: "music-track.update",
      targetType: "music-track",
      targetId: "home-default"
    });
  });

  it("rejects updates for unknown music tracks", async () => {
    const response = await requestAdminRoute({}, "/music-tracks/missing-track", {
      method: "PATCH",
      body: { displayName: "Missing" }
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Music track not found" });
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
    },
    userCharacter: {
      upsert: async (input) => {
        calls.push(["tx.userCharacter.upsert", input]);
        return input.create;
      }
    },
    userDecoration: {
      upsert: async (input) => {
        calls.push(["tx.userDecoration.upsert", input]);
        return input.create;
      }
    },
    userItem: {
      upsert: async (input) => {
        calls.push(["tx.userItem.upsert", input]);
        return input.create;
      }
    },
    userItemEffect: {
      upsert: async (input) => {
        calls.push(["tx.userItemEffect.upsert", input]);
        return input.create;
      }
    },
    userProgressLedger: {
      create: async ({ data }) => {
        calls.push(["tx.userProgressLedger.create", data]);
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
    cvName: "Old Voice Actor",
    cvUrl: "https://example.com/old-voice-actor",
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
      paramsJson: "{}",
      costType: "numeric",
      costValue: "0",
      systemMessage: "{player} uses {skill}",
      enabled: true
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
