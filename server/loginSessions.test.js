import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import {
  buildClearRefreshCookie,
  buildRefreshCookie,
  createLoginSessionStore,
  parseCookies,
  REFRESH_COOKIE_NAME
} from "./loginSessions.js";
import { withToken } from "./auth.js";

describe("login session store", () => {
  it("tracks a single active session per user", async () => {
    const sessions = createLoginSessionStore();
    const first = await sessions.create("user-1");
    expect(await sessions.hasActive("user-1")).toBe(true);
    expect(await sessions.isActive("user-1", first.sessionId)).toBe(true);

    const second = await sessions.replace("user-1");

    expect(second.sessionId).not.toBe(first.sessionId);
    expect(await sessions.isActive("user-1", first.sessionId)).toBe(false);
    expect(await sessions.isActive("user-1", second.sessionId)).toBe(true);
  });

  it("adopts a token session after an in-memory session store restart", async () => {
    const sessions = createLoginSessionStore();

    expect(await sessions.adopt("user-1", "restored-session")).toBe(true);
    expect(await sessions.isActive("user-1", "restored-session")).toBe(true);
  });

  it("does not adopt a different token when a session already exists", async () => {
    const sessions = createLoginSessionStore();
    const active = await sessions.create("user-1");

    expect(await sessions.adopt("user-1", "other-session")).toBe(false);
    expect(await sessions.isActive("user-1", active.sessionId)).toBe(true);
  });

  it("does not re-adopt a session that was explicitly cleared", async () => {
    const sessions = createLoginSessionStore();
    const active = await sessions.create("user-1");

    await sessions.clear("user-1", active.sessionId);

    expect(await sessions.adopt("user-1", active.sessionId)).toBe(false);
    expect(await sessions.hasActive("user-1")).toBe(false);
  });

  it("signs tokens with the active session id", async () => {
    const sessions = createLoginSessionStore();
    const { sessionId } = await sessions.create("user-1");
    const response = withToken(testUser("user-1"), "secret", { sessionId });
    const payload = jwt.verify(response.token, "secret");

    expect(payload).toMatchObject({ sub: "user-1", sid: sessionId });
  });

  it("persists sessions and rotates refresh tokens", async () => {
    const prisma = fakePrisma();
    const sessions = createLoginSessionStore({
      prisma,
      now: () => new Date("2026-05-29T00:00:00.000Z")
    });

    const first = await sessions.replace("user-1");
    expect(await sessions.hasActive("user-1")).toBe(true);
    expect(await sessions.adopt("user-1", first.sessionId)).toBe(true);

    const refreshed = await sessions.refresh(first.refreshToken);

    expect(refreshed.sessionId).toBe(first.sessionId);
    expect(refreshed.refreshToken).not.toBe(first.refreshToken);
    expect(await sessions.refresh(first.refreshToken)).toBe(null);
    expect(await sessions.refresh(refreshed.refreshToken)).toMatchObject({
      sessionId: first.sessionId,
      userId: "user-1"
    });
  });

  it("builds http-only refresh cookies and can parse them back", () => {
    const cookie = buildRefreshCookie("refresh value", { env: "production", maxAgeMs: 1000 });

    expect(cookie).toContain(`${REFRESH_COOKIE_NAME}=refresh%20value`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(parseCookies(cookie)[REFRESH_COOKIE_NAME]).toBe("refresh value");
    expect(buildClearRefreshCookie()).toContain("Max-Age=0");
  });
});

function fakePrisma() {
  const rows = new Map();
  const matches = (row, where = {}) => {
    if (where.id && row.id !== where.id) return false;
    if (where.userId && row.userId !== where.userId) return false;
    if (where.refreshTokenHash && row.refreshTokenHash !== where.refreshTokenHash) return false;
    if (where.revokedAt === null && row.revokedAt !== null) return false;
    if (where.expiresAt?.gt && !(new Date(row.expiresAt).getTime() > where.expiresAt.gt.getTime())) return false;
    return true;
  };
  return {
    loginSession: {
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const row of rows.values()) {
          if (!matches(row, where)) continue;
          Object.assign(row, data, { updatedAt: new Date() });
          count += 1;
        }
        return { count };
      },
      create: async ({ data }) => {
        const row = {
          revokedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data
        };
        rows.set(row.id, row);
        return { ...row };
      },
      findFirst: async ({ where }) => {
        const row = [...rows.values()].find((candidate) => matches(candidate, where));
        return row ? { ...row } : null;
      },
      findUnique: async ({ where }) => {
        const row = where.id
          ? rows.get(where.id)
          : [...rows.values()].find((candidate) => candidate.refreshTokenHash === where.refreshTokenHash);
        return row ? { ...row } : null;
      },
      update: async ({ where, data }) => {
        const row = rows.get(where.id);
        Object.assign(row, data, { updatedAt: new Date() });
        return { ...row };
      }
    }
  };
}

function testUser(id) {
  return {
    id,
    username: "alice",
    role: "player",
    status: "active",
    rating: 1000,
    wins: 0,
    losses: 0,
    coins: 300,
    selectedCharacter: "sigrika",
    selectedStoneDecoration: "",
    ownedCharacters: "sigrika,danea,aemeath",
    ownedItems: "",
    itemEffects: "",
    ownedDecorations: ""
  };
}
