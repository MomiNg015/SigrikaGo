import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const PASSWORD_MIN_LENGTH = 6;
export const NEW_PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_MAX_BYTES = 72;
export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_WIDTH = 8;
export const USERNAME_MAX_LENGTH = USERNAME_MAX_WIDTH;
export const CHAT_MAX_LENGTH = 240;
export const PRODUCTION_JWT_SECRET_MIN_LENGTH = 32;

const USERNAME_PATTERN = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}A-Za-z0-9_]+$/u;
const CJK_USERNAME_CHAR = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]$/u;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;
const DEFAULT_JWT_SECRETS = new Set(["dev-secret", "change-me-in-production"]);

export function validateUsername(input) {
  const value = stripControlChars(String(input ?? "")).trim();
  if (value.length < USERNAME_MIN_LENGTH || usernameDisplayWidth(value) > USERNAME_MAX_WIDTH) {
    return { ok: false, error: `\u7528\u6237\u540d\u9700\u4e3a ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_WIDTH} \u4e2a\u534a\u89d2\u5b57\u7b26\u5bbd\u5ea6\uff0c\u6700\u591a 4 \u4e2a\u4e2d\u6587/\u65e5\u6587/\u97e9\u6587\u5b57\u6216 8 \u4e2a\u534a\u89d2\u82f1\u6587/\u6570\u5b57/\u4e0b\u5212\u7ebf` };
  }
  if (!USERNAME_PATTERN.test(value)) {
    return { ok: false, error: "\u7528\u6237\u540d\u4ec5\u652f\u6301\u4e2d\u6587\u3001\u65e5\u6587\u3001\u97e9\u6587\u3001\u534a\u89d2\u82f1\u6587\u3001\u6570\u5b57\u548c\u4e0b\u5212\u7ebf" };
  }
  return { ok: true, value };
}

export function usernameDisplayWidth(value) {
  return [...String(value ?? "")].reduce((width, char) => width + (CJK_USERNAME_CHAR.test(char) ? 2 : 1), 0);
}

export function truncateUsernameToMaxWidthFromEnd(input, maxWidth = USERNAME_MAX_WIDTH) {
  const chars = [...stripControlChars(String(input ?? "")).trim()];
  let width = 0;
  const result = [];
  for (let index = chars.length - 1; index >= 0; index -= 1) {
    const char = chars[index];
    const nextWidth = width + (CJK_USERNAME_CHAR.test(char) ? 2 : 1);
    if (nextWidth > maxWidth) break;
    width = nextWidth;
    result.unshift(char);
  }
  return result.join("");
}

export function validatePassword(input) {
  return validateLoginPassword(input);
}

export function validateLoginPassword(input) {
  return validatePasswordWithMinimum(input, PASSWORD_MIN_LENGTH, "密码长度不正确");
}

export function validateNewPassword(input) {
  return validatePasswordWithMinimum(input, NEW_PASSWORD_MIN_LENGTH, `新密码需为 ${NEW_PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 位`);
}

function validatePasswordWithMinimum(input, minimumLength, lengthError) {
  const value = String(input ?? "");
  const length = [...value].length;
  if (length < minimumLength || length > PASSWORD_MAX_LENGTH) {
    return { ok: false, error: lengthError };
  }
  if (Buffer.byteLength(value, "utf8") > PASSWORD_MAX_BYTES) {
    return { ok: false, error: "密码太长，请缩短后重试" };
  }
  if (CONTROL_CHARS.test(value)) {
    return { ok: false, error: "密码包含不支持的字符" };
  }
  return { ok: true, value };
}

export function validateRoomCode(input) {
  const value = String(input ?? "").trim();
  if (!/^\d{5}$/.test(value)) return { ok: false, error: "房间号必须是 5 位数字" };
  return { ok: true, value };
}

export function validatePointId(input, boardSize = 13) {
  const value = String(input ?? "").trim();
  const match = /^(\d{1,2}),(\d{1,2})$/.exec(value);
  if (!match) return { ok: false, error: "棋盘点位无效" };
  const x = Number(match[1]);
  const y = Number(match[2]);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= boardSize || y >= boardSize) {
    return { ok: false, error: "棋盘点位无效" };
  }
  return { ok: true, value };
}

export function normalizeChatText(input) {
  const value = stripControlChars(String(input ?? "")).trim();
  if (!value) return { ok: false, error: "聊天内容不能为空" };
  if (value.length > CHAT_MAX_LENGTH) return { ok: false, error: `聊天内容不能超过 ${CHAT_MAX_LENGTH} 字` };
  return { ok: true, value };
}

export function buildAllowedOrigins(env = process.env) {
  const origins = new Set();
  for (const value of [env.PUBLIC_ORIGIN, env.SITE_ORIGIN, env.ALLOWED_ORIGINS]) {
    for (const origin of String(value ?? "").split(",")) {
      const normalized = origin.trim().replace(/\/+$/, "");
      if (normalized) origins.add(normalized);
    }
  }
  if (env.NODE_ENV !== "production") {
    origins.add("http://localhost:5173");
    origins.add("http://127.0.0.1:5173");
    origins.add("http://localhost:3001");
    origins.add("http://127.0.0.1:3001");
  }
  return origins;
}

export function validateProductionDeployment(env = process.env) {
  if (env.NODE_ENV !== "production") return { ok: true, errors: [] };

  const errors = [];
  const jwtSecret = String(env.JWT_SECRET ?? "");
  if (jwtSecret.length < PRODUCTION_JWT_SECRET_MIN_LENGTH) {
    errors.push(`JWT_SECRET must be at least ${PRODUCTION_JWT_SECRET_MIN_LENGTH} characters in production`);
  }
  if (DEFAULT_JWT_SECRETS.has(jwtSecret)) {
    errors.push("JWT_SECRET must be changed before running in production");
  }
  if (debugTestActionsEnabled(env)) {
    errors.push("ENABLE_TEST_ACTIONS must not be enabled in production");
  }
  if (multiInstanceDeploymentRequested(env)) {
    errors.push("Production must run a single Node instance until room state and Socket.IO are shared");
  }

  const origins = [...buildAllowedOrigins(env)];
  if (origins.length === 0) {
    errors.push("At least one production origin must be configured with PUBLIC_ORIGIN, SITE_ORIGIN, or ALLOWED_ORIGINS");
  }
  for (const origin of origins) {
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      errors.push(`Production origin is not a valid URL: ${origin}`);
      continue;
    }
    if (parsed.protocol !== "https:") {
      errors.push(`Production origins must use https: ${origin}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function debugTestActionsEnabled(env = process.env) {
  return ["1", "true", "yes", "on"].includes(String(env.ENABLE_TEST_ACTIONS ?? "").trim().toLowerCase());
}

export function multiInstanceDeploymentRequested(env = process.env) {
  const numericFlags = [env.WEB_CONCURRENCY, env.PM2_INSTANCES, env.INSTANCES, env.NODE_CLUSTER_WORKERS];
  if (numericFlags.some((value) => Number(String(value ?? "").trim()) > 1)) return true;
  const nodeAppInstance = String(env.NODE_APP_INSTANCE ?? "").trim();
  return nodeAppInstance !== "" && nodeAppInstance !== "0";
}

export function canUseDebugTestActions(env = process.env) {
  return env.NODE_ENV !== "production";
}

export function canUseVerificationFixtures(env = process.env) {
  return ["stability", "capacity"].includes(env.NODE_ENV) && debugTestActionsEnabled(env);
}

export function assertProductionDeployment(env = process.env) {
  const result = validateProductionDeployment(env);
  if (!result.ok) {
    throw new Error(`Invalid production deployment configuration:\n${result.errors.join("\n")}`);
  }
}

export function corsOriginForRequest(origin, callback, env = process.env) {
  if (!origin) {
    callback(null, true);
    return;
  }
  const allowed = buildAllowedOrigins(env);
  callback(null, allowed.has(origin.replace(/\/+$/, "")));
}

export function credentialAuthRateLimitOptions(env = process.env) {
  return withStabilityRateLimitNamespace({
    windowMs: 10 * 60 * 1000,
    limit: env.NODE_ENV === "capacity" ? 2000 : env.NODE_ENV === "stability" ? 240 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "请求过于频繁，请稍后再试" }
  }, env);
}

export function sessionAuthRateLimitOptions(env = process.env) {
  return withStabilityRateLimitNamespace({
    windowMs: 10 * 60 * 1000,
    limit: env.NODE_ENV === "capacity" ? 6000 : env.NODE_ENV === "stability" ? 1200 : 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "请求过于频繁，请稍后再试" }
  }, env);
}

export function authRateLimitOptions(env = process.env) {
  return credentialAuthRateLimitOptions(env);
}

export function createCredentialAuthRateLimit(env = process.env) {
  return rateLimit(credentialAuthRateLimitOptions(env));
}

export function createSessionAuthRateLimit(env = process.env) {
  return rateLimit(sessionAuthRateLimitOptions(env));
}

export function createAuthRateLimit(env = process.env) {
  return createCredentialAuthRateLimit(env);
}

export function createApiRateLimit(env = process.env) {
  return rateLimit(withStabilityRateLimitNamespace({
    windowMs: 60 * 1000,
    limit: env.NODE_ENV === "capacity" ? 5000 : 180,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "请求过于频繁，请稍后再试" }
  }, env));
}

export function stabilityRateLimitKey(req) {
  const ipKey = ipKeyGenerator(req.ip);
  const scope = String(req.get?.("x-stability-scope") ?? req.headers?.["x-stability-scope"] ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(scope)) return ipKey;
  return `${ipKey}:${scope}`;
}

function withStabilityRateLimitNamespace(options, env) {
  if (env.NODE_ENV !== "stability") return options;
  return { ...options, keyGenerator: stabilityRateLimitKey };
}

function stripControlChars(value) {
  return value.replace(CONTROL_CHARS, "");
}
