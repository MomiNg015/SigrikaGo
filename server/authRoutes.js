import bcrypt from "bcryptjs";
import express from "express";
import { withToken } from "./auth.js";
import { syncConfiguredAdmin, USER_STATUS } from "./adminConfig.js";
import { USER_ASSET_RELATION_INCLUDE } from "./db.js";
import {
  ALREADY_LOGGED_IN_CODE,
  ALREADY_LOGGED_IN_MESSAGE,
  buildClearRefreshCookie,
  buildRefreshCookie,
  parseCookies,
  REFRESH_COOKIE_NAME
} from "./loginSessions.js";
import { shouldBlockLoginForActiveAccount } from "./loginConflicts.js";
import { validateNewPassword, validatePassword, validateUsername } from "./security.js";
import {
  aemeathWelcomeMailboxMessageData,
  newUserInitialOwnedCharacters
} from "./aemeathAcquisition.js";

const DUMMY_PASSWORD_HASH = "$2b$10$IvEAhFgqDEMheGwJ3R/kA.qCmfCeoDs7kPwyyfyCwFB4K1x6njnL.";

export function createAuthRouteHandlers({
  prisma,
  jwtSecret,
  loginSessions,
  onlineSessions,
  comparePassword = bcrypt.compare,
  hashPassword = bcrypt.hash,
  syncAdmin = syncConfiguredAdmin,
  blockLoginForActiveAccount = shouldBlockLoginForActiveAccount,
  signWithToken = withToken
}) {
  async function sendLoginResponse(res, user) {
    const response = await onlineSessions.createLoginResponse(user);
    res.setHeader("Set-Cookie", buildRefreshCookie(response.refreshToken));
    const { refreshToken, refreshExpiresAt, ...publicResponse } = response;
    res.json(publicResponse);
  }

  async function register(req, res) {
    const usernameResult = validateUsername(req.body.username);
    const passwordResult = validateNewPassword(req.body.password);
    if (!usernameResult.ok) {
      res.status(400).json({ error: usernameResult.error });
      return;
    }
    if (!passwordResult.ok) {
      res.status(400).json({ error: passwordResult.error });
      return;
    }
    const username = usernameResult.value;
    const password = passwordResult.value;
    const passwordHash = await hashPassword(password, 10);
    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            username,
            passwordHash,
            onboardingRequired: true,
            ownedCharacters: newUserInitialOwnedCharacters()
          }
        });
        await tx.mailboxMessage.create({
          data: aemeathWelcomeMailboxMessageData(createdUser.id)
        });
        return createdUser;
      });
    } catch (error) {
      if (!isPrismaUniqueConstraintError(error)) throw error;
      res.status(409).json({ error: "用户名已存在" });
      return;
    }
    const syncedUser = await syncAdmin(user, prisma);
    await sendLoginResponse(res, syncedUser);
  }

  async function login(req, res) {
    const usernameResult = validateUsername(req.body.username);
    const passwordResult = validatePassword(req.body.password);
    if (!usernameResult.ok || !passwordResult.ok) {
      res.status(401).json({ error: "\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef" });
      return;
    }
    const username = usernameResult.value;
    const password = passwordResult.value;
    const user = await prisma.user.findUnique({
      where: { username },
      include: USER_ASSET_RELATION_INCLUDE
    });
    const passwordMatches = await comparePassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !passwordMatches) {
      res.status(401).json({ error: "\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef" });
      return;
    }
    if (user.status === USER_STATUS.banned) {
      res.status(403).json({ error: user.banReason ? `\u8d26\u53f7\u5df2\u5c01\u7981\uff1a${user.banReason}` : "\u8d26\u53f7\u5df2\u5c01\u7981" });
      return;
    }
    if (blockLoginForActiveAccount({
      onlineSessions,
      userId: user.id,
      forceLogin: Boolean(req.body.forceLogin)
    })) {
      res.status(409).json({
        code: ALREADY_LOGGED_IN_CODE,
        error: ALREADY_LOGGED_IN_MESSAGE
      });
      return;
    }
    if (req.body.forceLogin) await onlineSessions.forceLogoutUser(user.id);
    const syncedUser = await syncAdmin(user, prisma);
    await sendLoginResponse(res, syncedUser);
  }

  async function refresh(req, res) {
    const refreshToken = parseCookies(req.headers.cookie)[REFRESH_COOKIE_NAME];
    const session = await loginSessions.refresh(refreshToken);
    if (!session) {
      res.setHeader("Set-Cookie", buildClearRefreshCookie());
      res.status(401).json({ error: "\u8bf7\u5148\u767b\u5f55" });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: USER_ASSET_RELATION_INCLUDE
    });
    if (!user || user.status === USER_STATUS.banned) {
      await loginSessions.clear(session.userId, session.sessionId);
      res.setHeader("Set-Cookie", buildClearRefreshCookie());
      res.status(user?.status === USER_STATUS.banned ? 403 : 401).json({
        error: user?.banReason ? `\u8d26\u53f7\u5df2\u5c01\u7981\uff1a${user.banReason}` : "\u8bf7\u5148\u767b\u5f55"
      });
      return;
    }
    res.setHeader("Set-Cookie", buildRefreshCookie(session.refreshToken));
    res.json(signWithToken(await syncAdmin(user, prisma), jwtSecret, { sessionId: session.sessionId }));
  }

  async function logout(req, res) {
    const refreshToken = parseCookies(req.headers.cookie)[REFRESH_COOKIE_NAME];
    await loginSessions.clearRefreshToken(refreshToken);
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const payload = token ? JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) : null;
      if (payload?.sub && payload?.sid) await loginSessions.clear(payload.sub, payload.sid);
    } catch {
      // Logout should succeed even if the access token is malformed or expired.
    }
    res.setHeader("Set-Cookie", buildClearRefreshCookie());
    res.json({ ok: true });
  }

  return {
    register,
    login,
    refresh,
    logout
  };
}

function isPrismaUniqueConstraintError(error) {
  return error?.code === "P2002";
}

export function createAuthRouter(deps) {
  const router = express.Router();
  const handlers = createAuthRouteHandlers(deps);
  router.post("/register", handlers.register);
  router.post("/login", handlers.login);
  router.post("/refresh", handlers.refresh);
  router.post("/logout", handlers.logout);
  return router;
}
