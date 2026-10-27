import express from "express";
import { once } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { createAuthRouter } from "./authRoutes.js";
import { createAuthChallenges } from "./authChallenges.js";
import { createLoginAbuseGuard } from "./loginAbuseGuard.js";
import { createRegistrationRateLimit } from "./security.js";

describe("production auth boundaries over HTTP", () => {
  it("requires one-use registration proof and limits successful registrations without blocking login", async () => {
    const env = { NODE_ENV: "production", ENABLE_TEST_ACTIONS: "true" };
    let answer;
    const user = { id: "new-user", username: "Alice", passwordHash: "hash" };
    const prisma = { user: { create: vi.fn(async () => user), findUnique: vi.fn(async () => user) }, mailboxMessage: { create: vi.fn() } };
    prisma.$transaction = async (callback) => callback(prisma);
    const hashPassword = vi.fn(async () => "hash");
    const app = express();
    app.use(express.json());
    app.use("/api/auth/register", createRegistrationRateLimit(env));
    app.use("/api/auth", createAuthRouter({
      prisma, jwtSecret: "0123456789abcdef0123456789abcdef", hashPassword,
      comparePassword: async () => true,
      blockLoginForActiveAccount: () => false,
      loginSessions: {},
      onlineSessions: { createLoginResponse: async () => ({ token: "token", user, refreshToken: "refresh" }) },
      challenges: createAuthChallenges({ env, render: async (text) => { answer = text; return "data:image/png;base64,AA=="; } }),
      loginAbuseGuard: createLoginAbuseGuard({ env })
    }));
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}/api/auth`;
    const post = async (path, body) => fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", "x-stability-scope": "cannot-bypass" }, body: JSON.stringify(body) });
    const credentials = { username: "Alice", password: "password123" };
    try {
      const missing = await post("/register", credentials);
      expect(missing.status).toBe(400);
      expect((await missing.json()).code).toBe("captcha_invalid");
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
      let firstProof;
      for (let index = 0; index < 10; index++) {
        const issued = await fetch(base + "/challenge?purpose=register");
        expect(issued.headers.get("cache-control")).toBe("no-store");
        const data = await issued.json();
        expect(data).not.toHaveProperty("answer");
        const proof = { id: data.id, answer };
        firstProof ??= proof;
        const registered = await post("/register", { ...credentials, challenge: proof });
        expect(registered.status).toBe(200);
        await registered.json();
        if (index === 0) {
          const replay = await post("/register", { ...credentials, challenge: firstProof });
          expect(replay.status).toBe(400);
          await replay.json();
        }
      }
      const limited = await post("/register", { ...credentials, challenge: firstProof });
      expect(limited.status).toBe(429);
      expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
      expect(prisma.user.create).toHaveBeenCalledTimes(10);
      const login = await post("/login", credentials);
      expect(login.status).toBe(200);
      await login.json();
    } finally {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
