import jwt from "jsonwebtoken";
import { publicUser } from "./db.js";
import { USER_ROLES, USER_STATUS } from "./adminConfig.js";

const DEFAULT_JWT_SECRETS = new Set(["dev-secret", "change-me-in-production"]);

export function assertSafeJwtSecret(jwtSecret, env = process.env.NODE_ENV ?? "development") {
  if (env === "production" && DEFAULT_JWT_SECRETS.has(String(jwtSecret ?? ""))) {
    throw new Error("JWT_SECRET must be changed before running in production");
  }
}

export function makeAuth({ prisma, jwtSecret }) {
  assertSafeJwtSecret(jwtSecret);
  async function authHttp(req, res, next) {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const payload = jwt.verify(token, jwtSecret);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new Error("missing user");
      if (user.status === USER_STATUS.banned) {
        res.status(403).json({ error: user.banReason ? `账号已封禁：${user.banReason}` : "账号已封禁" });
        return;
      }
      req.user = user;
      next();
    } catch {
      res.status(401).json({ error: "请先登录" });
    }
  }

  function requireAdmin(req, res, next) {
    if (req.user?.role !== USER_ROLES.admin) {
      res.status(403).json({ error: "需要管理员权限" });
      return;
    }
    next();
  }

  return { authHttp, requireAdmin };
}

export function withToken(user, jwtSecret) {
  return {
    token: jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: "14d" }),
    user: publicUser(user)
  };
}
