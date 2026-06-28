import { describe, expect, it } from "vitest";
import { ALREADY_LOGGED_IN_CODE, REFRESH_COOKIE_NAME } from "./loginSessions.js";
import { createAuthRouteHandlers } from "./authRoutes.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

function createHandlers(overrides = {}) {
  const users = overrides.users ?? new Map();
  const createdUsers = [];
  const clearedSessions = [];
  const clearedRefreshTokens = [];
  const forcedLogouts = [];
  const loginResponses = [];
  const prisma = overrides.prisma ?? {
    user: {
      create: async ({ data }) => {
        createdUsers.push(data);
        return { id: "new-user", username: data.username, passwordHash: data.passwordHash };
      },
      findUnique: async ({ where }) => users.get(where.username ?? where.id) ?? null
    }
  };
  const loginSessions = overrides.loginSessions ?? {
    refresh: async () => null,
    clear: async (userId, sessionId) => {
      clearedSessions.push({ userId, sessionId });
    },
    clearRefreshToken: async (refreshToken) => {
      clearedRefreshTokens.push(refreshToken);
    }
  };
  const onlineSessions = overrides.onlineSessions ?? {
    createLoginResponse: async (user) => {
      const response = {
        token: "access-token",
        refreshToken: "refresh-token",
        refreshExpiresAt: "ignored",
        user: { id: user.id, username: user.username }
      };
      loginResponses.push(response);
      return response;
    },
    forceLogoutUser: async (userId) => {
      forcedLogouts.push(userId);
    }
  };

  return {
    handlers: createAuthRouteHandlers({
      prisma,
      jwtSecret: "test-secret",
      loginSessions,
      onlineSessions,
      hashPassword: async (password, rounds) => `hash:${password}:${rounds}`,
      comparePassword: async (password, hash) => hash === `hash:${password}`,
      syncAdmin: async (user) => ({ ...user, synced: true }),
      signWithToken: (user, _jwtSecret, options) => ({
        token: `token:${user.id}:${options.sessionId}`,
        user: { id: user.id, username: user.username }
      }),
      ...overrides.deps
    }),
    createdUsers,
    clearedSessions,
    clearedRefreshTokens,
    forcedLogouts,
    loginResponses
  };
}

describe("auth route handlers", () => {
  it("registers a user and returns the login response without leaking refresh fields", async () => {
    const { handlers, createdUsers } = createHandlers();
    const res = createResponse();

    await handlers.register({
      body: { username: "alice", password: "secret1" }
    }, res);

    expect(res.statusCode).toBe(200);
    expect(createdUsers).toEqual([{
      username: "alice",
      passwordHash: "hash:secret1:10",
      onboardingRequired: true
    }]);
    expect(res.headers["Set-Cookie"]).toContain(`${REFRESH_COOKIE_NAME}=refresh-token`);
    expect(res.body).toEqual({
      token: "access-token",
      user: { id: "new-user", username: "alice" }
    });
  });

  it("returns the active-session conflict response before creating a new login session", async () => {
    const users = new Map([[
      "alice",
      { id: "user-1", username: "alice", passwordHash: "hash:secret1" }
    ]]);
    const { handlers, loginResponses } = createHandlers({
      users,
      deps: {
        blockLoginForActiveAccount: () => true
      }
    });
    const res = createResponse();

    await handlers.login({
      body: { username: "alice", password: "secret1" }
    }, res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toMatchObject({ code: ALREADY_LOGGED_IN_CODE });
    expect(loginResponses).toEqual([]);
  });

  it("force-login bypasses the active-session conflict and logs out existing sockets", async () => {
    const users = new Map([[
      "alice",
      { id: "user-1", username: "alice", passwordHash: "hash:secret1" }
    ]]);
    const { handlers, forcedLogouts } = createHandlers({
      users,
      deps: {
        blockLoginForActiveAccount: () => false
      }
    });
    const res = createResponse();

    await handlers.login({
      body: { username: "alice", password: "secret1", forceLogin: true }
    }, res);

    expect(res.statusCode).toBe(200);
    expect(forcedLogouts).toEqual(["user-1"]);
    expect(res.body.user).toMatchObject({ id: "user-1", username: "alice" });
  });

  it("clears the refresh cookie when refresh token lookup fails", async () => {
    const { handlers } = createHandlers();
    const res = createResponse();

    await handlers.refresh({
      headers: { cookie: `${REFRESH_COOKIE_NAME}=missing-token` }
    }, res);

    expect(res.statusCode).toBe(401);
    expect(res.headers["Set-Cookie"]).toContain(`${REFRESH_COOKIE_NAME}=;`);
    expect(res.body).toEqual({ error: "\u8bf7\u5148\u767b\u5f55" });
  });

  it("refreshes a valid session and rotates the refresh cookie", async () => {
    const users = new Map([[
      "user-1",
      { id: "user-1", username: "alice", passwordHash: "hash:secret1" }
    ]]);
    const { handlers } = createHandlers({
      users,
      loginSessions: {
        refresh: async () => ({
          userId: "user-1",
          sessionId: "session-1",
          refreshToken: "rotated-token"
        }),
        clear: async () => {},
        clearRefreshToken: async () => {}
      }
    });
    const res = createResponse();

    await handlers.refresh({
      headers: { cookie: `${REFRESH_COOKIE_NAME}=old-token` }
    }, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers["Set-Cookie"]).toContain(`${REFRESH_COOKIE_NAME}=rotated-token`);
    expect(res.body).toEqual({
      token: "token:user-1:session-1",
      user: { id: "user-1", username: "alice" }
    });
  });

  it("logout clears refresh and access-token sessions even when token parsing is optional", async () => {
    const { handlers, clearedSessions, clearedRefreshTokens } = createHandlers();
    const payload = Buffer.from(JSON.stringify({ sub: "user-1", sid: "session-1" }), "utf8").toString("base64url");
    const res = createResponse();

    await handlers.logout({
      headers: {
        cookie: `${REFRESH_COOKIE_NAME}=refresh-token`,
        authorization: `Bearer header.${payload}.signature`
      }
    }, res);

    expect(clearedRefreshTokens).toEqual(["refresh-token"]);
    expect(clearedSessions).toEqual([{ userId: "user-1", sessionId: "session-1" }]);
    expect(res.headers["Set-Cookie"]).toContain(`${REFRESH_COOKIE_NAME}=;`);
    expect(res.body).toEqual({ ok: true });
  });
});
