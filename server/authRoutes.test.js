import { describe, expect, it, vi } from "vitest";
import { ALREADY_LOGGED_IN_CODE, REFRESH_COOKIE_NAME } from "./loginSessions.js";
import { createAuthRouteHandlers } from "./authRoutes.js";
import { AEMEATH_WELCOME_MAIL } from "../src/shared/aemeathAcquisition.js";
import { RECRUITMENT_ITEM_TYPES } from "../src/shared/recruitment.js";

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
  const createdMailboxMessages = [];
  const clearedSessions = [];
  const clearedRefreshTokens = [];
  const forcedLogouts = [];
  const loginResponses = [];
  const loginUsers = [];
  const prisma = overrides.prisma ?? {
    $transaction: async (callback) => callback(prisma),
    user: {
      create: async ({ data }) => {
        createdUsers.push(data);
        return { id: "new-user", username: data.username, passwordHash: data.passwordHash, role: "player" };
      },
      findUnique: async ({ where }) => users.get(where.username ?? where.id) ?? null
    },
    mailboxMessage: {
      create: async ({ data }) => {
        createdMailboxMessages.push(data);
        return { id: "welcome-mail", ...data };
      }
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
      loginUsers.push(user);
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
      signWithToken: (user, _jwtSecret, options) => ({
        token: `token:${user.id}:${options.sessionId}`,
        user: { id: user.id, username: user.username, role: user.role }
      }),
      ...overrides.deps
    }),
    createdUsers,
    createdMailboxMessages,
    clearedSessions,
    clearedRefreshTokens,
    forcedLogouts,
    loginResponses,
    loginUsers
  };
}

describe("auth route handlers", () => {
  it("registers a user and returns the login response without leaking refresh fields", async () => {
    const { handlers, createdUsers, createdMailboxMessages } = createHandlers();
    const res = createResponse();

    await handlers.register({
      body: { username: "alice", password: "secret12" }
    }, res);

    expect(res.statusCode).toBe(200);
    expect(createdUsers).toEqual([{
      username: "alice",
      passwordHash: "hash:secret12:10",
      onboardingRequired: true,
      ownedCharacters: "sigrika,denia"
    }]);
    expect(createdMailboxMessages).toEqual([{
      userId: "new-user",
      sender: AEMEATH_WELCOME_MAIL.sender,
      title: AEMEATH_WELCOME_MAIL.title,
      body: AEMEATH_WELCOME_MAIL.body,
      attachmentType: "item",
      attachmentItemId: RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket,
      attachmentQuantity: 1
    }]);
    expect(res.headers["Set-Cookie"]).toContain(`${REFRESH_COOKIE_NAME}=refresh-token`);
    expect(res.body).toEqual({
      token: "access-token",
      user: { id: "new-user", username: "alice" }
    });
  });

  it("does not elevate a newly registered user by username", async () => {
    const previousAdminUsernames = process.env.ADMIN_USERNAMES;
    process.env.ADMIN_USERNAMES = "alice";
    try {
      const { handlers, loginUsers } = createHandlers();
      const res = createResponse();

      await handlers.register({
        body: { username: "alice", password: "secret12" }
      }, res);

      expect(res.statusCode).toBe(200);
      expect(loginUsers).toHaveLength(1);
      expect(loginUsers[0]).toHaveProperty("role", "player");
    } finally {
      if (previousAdminUsernames === undefined) delete process.env.ADMIN_USERNAMES;
      else process.env.ADMIN_USERNAMES = previousAdminUsernames;
    }
  });

  it("maps only Prisma unique conflicts to the username-exists response", async () => {
    const uniqueError = Object.assign(new Error("unique"), { code: "P2002" });
    const { handlers } = createHandlers({
      prisma: {
        $transaction: async (callback) => callback({
          user: { create: async () => { throw uniqueError; } },
          mailboxMessage: { create: async () => {} }
        })
      }
    });
    const res = createResponse();

    await handlers.register({ body: { username: "alice", password: "secret12" } }, res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: "\u7528\u6237\u540d\u5df2\u5b58\u5728" });
  });

  it("lets unexpected registration failures reach the shared error handler", async () => {
    const { handlers } = createHandlers({
      prisma: {
        $transaction: async (callback) => callback({
          user: { create: async () => { throw new Error("database offline"); } },
          mailboxMessage: { create: async () => {} }
        })
      }
    });

    await expect(handlers.register({
      body: { username: "alice", password: "secret12" }
    }, createResponse())).rejects.toThrow("database offline");
  });

  it("runs a dummy password comparison for missing users", async () => {
    const comparePassword = vi.fn(async () => false);
    const { handlers } = createHandlers({ deps: { comparePassword } });
    const res = createResponse();

    await handlers.login({ body: { username: "alice", password: "secret1" } }, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef" });
    expect(comparePassword).toHaveBeenCalledTimes(1);
    expect(comparePassword.mock.calls[0][1]).toEqual(expect.stringMatching(/^\$2[aby]\$/));
  });

  it("returns the active-session conflict response before creating a new login session", async () => {
    const users = new Map([[
      "alice",
      { id: "user-1", username: "alice", passwordHash: "hash:secret1", role: "player" }
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

  it("keeps database roles authoritative during login", async () => {
    const previousAdminUsernames = process.env.ADMIN_USERNAMES;
    process.env.ADMIN_USERNAMES = "player1";
    const users = new Map([
      ["player1", { id: "user-1", username: "player1", passwordHash: "hash:secret1", role: "player" }],
      ["admin1", { id: "user-2", username: "admin1", passwordHash: "hash:secret1", role: "admin" }]
    ]);
    try {
      const { handlers, loginUsers } = createHandlers({ users });

      await handlers.login({ body: { username: "player1", password: "secret1" } }, createResponse());
      await handlers.login({ body: { username: "admin1", password: "secret1" } }, createResponse());

      expect(loginUsers.map((user) => user.role)).toEqual(["player", "admin"]);
    } finally {
      if (previousAdminUsernames === undefined) delete process.env.ADMIN_USERNAMES;
      else process.env.ADMIN_USERNAMES = previousAdminUsernames;
    }
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
      { id: "user-1", username: "alice", passwordHash: "hash:secret1", role: "player" }
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
      user: { id: "user-1", username: "alice", role: "player" }
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
