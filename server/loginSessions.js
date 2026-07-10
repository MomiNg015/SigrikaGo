import { createHash, randomBytes, randomUUID } from "node:crypto";

export const ALREADY_LOGGED_IN_CODE = "already_logged_in";
export const ALREADY_LOGGED_IN_MESSAGE = "当前账号已登录了，确定继续登录吗？";
export const REFRESH_COOKIE_NAME = "sigrika_refresh";
export const REFRESH_SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
export const SESSION_LAST_SEEN_WRITE_INTERVAL_MS = 5 * 60 * 1000;

export async function ensureLoginSessionSchema(prisma) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "LoginSession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "refreshTokenHash" TEXT NOT NULL,
      "revokedAt" DATETIME,
      "expiresAt" DATETIME NOT NULL,
      "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "LoginSession_refreshTokenHash_key" ON "LoginSession"("refreshTokenHash")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LoginSession_userId_revokedAt_idx" ON "LoginSession"("userId", "revokedAt")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LoginSession_expiresAt_idx" ON "LoginSession"("expiresAt")`);
}

export function createLoginSessionStore({ prisma = null, now = () => new Date(), maxAgeMs = REFRESH_SESSION_MAX_AGE_MS } = {}) {
  const memorySessions = new Map();
  const revokedSessions = new Set();
  const sessionKey = (userId, sessionId) => `${userId}:${sessionId}`;
  const revokeMemory = (userId, sessionId) => {
    if (userId && sessionId) revokedSessions.add(sessionKey(userId, sessionId));
  };
  const expiresAt = () => new Date(now().getTime() + maxAgeMs);
  const validWhere = () => ({
    revokedAt: null,
    expiresAt: { gt: now() }
  });

  async function findActive(userId) {
    return prisma.loginSession.findFirst({
      where: { userId, ...validWhere() },
      orderBy: { updatedAt: "desc" }
    });
  }

  return {
    async create(userId) {
      return this.replace(userId);
    },
    async replace(userId) {
      const sessionId = randomUUID();
      const refreshToken = createRefreshToken();
      if (!prisma) {
        revokeMemory(userId, memorySessions.get(userId));
        memorySessions.set(userId, sessionId);
        return { sessionId, refreshToken, expiresAt: expiresAt() };
      }
      await prisma.loginSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now() }
      });
      const session = await prisma.loginSession.create({
        data: {
          id: sessionId,
          userId,
          refreshTokenHash: hashRefreshToken(refreshToken),
          expiresAt: expiresAt(),
          lastSeenAt: now()
        }
      });
      return { sessionId: session.id, refreshToken, expiresAt: session.expiresAt };
    },
    async hasActive(userId) {
      if (!prisma) return memorySessions.has(userId);
      return Boolean(await findActive(userId));
    },
    async isActive(userId, sessionId) {
      if (!sessionId) return false;
      if (!prisma) return memorySessions.get(userId) === sessionId;
      const session = await prisma.loginSession.findUnique({ where: { id: sessionId } });
      return isValidSession(session, userId, now());
    },
    async adopt(userId, sessionId) {
      if (!userId || !sessionId) return false;
      if (!prisma) {
        if (revokedSessions.has(sessionKey(userId, sessionId))) return false;
        if (!memorySessions.has(userId)) {
          memorySessions.set(userId, sessionId);
          return true;
        }
        return memorySessions.get(userId) === sessionId;
      }
      const session = await prisma.loginSession.findUnique({ where: { id: sessionId } });
      const currentTime = now();
      if (!isValidSession(session, userId, currentTime)) return false;
      if (currentTime.getTime() - new Date(session.lastSeenAt).getTime() >= SESSION_LAST_SEEN_WRITE_INTERVAL_MS) {
        await prisma.loginSession.updateMany({
          where: { id: sessionId, userId, revokedAt: null },
          data: { lastSeenAt: currentTime }
        });
      }
      return true;
    },
    async refresh(refreshToken) {
      if (!prisma || !refreshToken) return null;
      const session = await prisma.loginSession.findUnique({
        where: { refreshTokenHash: hashRefreshToken(refreshToken) }
      });
      const currentTime = now();
      if (!isValidSession(session, session?.userId, currentTime)) return null;
      const nextRefreshToken = createRefreshToken();
      const nextExpiresAt = new Date(currentTime.getTime() + maxAgeMs);
      const rotated = await prisma.loginSession.updateMany({
        where: {
          id: session.id,
          refreshTokenHash: hashRefreshToken(refreshToken),
          revokedAt: null,
          expiresAt: { gt: currentTime }
        },
        data: {
          refreshTokenHash: hashRefreshToken(nextRefreshToken),
          expiresAt: nextExpiresAt,
          lastSeenAt: currentTime
        }
      });
      if (rotated.count !== 1) return null;
      return {
        sessionId: session.id,
        userId: session.userId,
        refreshToken: nextRefreshToken,
        expiresAt: nextExpiresAt
      };
    },
    async clear(userId, sessionId) {
      if (!prisma) {
        const activeSessionId = memorySessions.get(userId);
        if (!sessionId || activeSessionId === sessionId) {
          revokeMemory(userId, sessionId ?? activeSessionId);
          memorySessions.delete(userId);
        }
        return;
      }
      const where = sessionId ? { id: sessionId, userId } : { userId, revokedAt: null };
      await prisma.loginSession.updateMany({ where, data: { revokedAt: now() } });
    },
    async clearUser(userId) {
      if (!prisma) {
        revokeMemory(userId, memorySessions.get(userId));
        memorySessions.delete(userId);
        return;
      }
      await prisma.loginSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now() }
      });
    },
    async clearRefreshToken(refreshToken) {
      if (!prisma || !refreshToken) return;
      await prisma.loginSession.updateMany({
        where: { refreshTokenHash: hashRefreshToken(refreshToken), revokedAt: null },
        data: { revokedAt: now() }
      });
    }
  };
}

export function createRefreshToken() {
  return randomBytes(32).toString("base64url");
}

export function hashRefreshToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export function parseCookies(cookieHeader = "") {
  return Object.fromEntries(String(cookieHeader)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf("=");
      if (separator === -1) return [decodeURIComponent(part), ""];
      return [
        decodeURIComponent(part.slice(0, separator)),
        decodeURIComponent(part.slice(separator + 1))
      ];
    }));
}

export function refreshCookieOptions({
  maxAgeMs = REFRESH_SESSION_MAX_AGE_MS,
  env = process.env.NODE_ENV ?? "development"
} = {}) {
  return [
    `Path=/api/auth`,
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
    env === "production" ? "Secure" : ""
  ].filter(Boolean);
}

export function buildRefreshCookie(refreshToken, options = {}) {
  return `${REFRESH_COOKIE_NAME}=${encodeURIComponent(refreshToken)}; ${refreshCookieOptions(options).join("; ")}`;
}

export function buildClearRefreshCookie() {
  return `${REFRESH_COOKIE_NAME}=; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function isValidSession(session, userId, currentTime) {
  return Boolean(
    session &&
    session.userId === userId &&
    !session.revokedAt &&
    new Date(session.expiresAt).getTime() > currentTime.getTime()
  );
}
