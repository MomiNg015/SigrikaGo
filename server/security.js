import rateLimit from "express-rate-limit";

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 14;
export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 16;
export const CHAT_MAX_LENGTH = 240;

const USERNAME_PATTERN = /^[\p{Script=Han}A-Za-z0-9_]+$/u;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

export function validateUsername(input) {
  const value = stripControlChars(String(input ?? "")).trim();
  if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) {
    return { ok: false, error: `用户名需为 ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} 位` };
  }
  if (!USERNAME_PATTERN.test(value)) {
    return { ok: false, error: "用户名仅支持中文、英文、数字和下划线" };
  }
  return { ok: true, value };
}

export function validatePassword(input) {
  const value = String(input ?? "");
  if (value.length < PASSWORD_MIN_LENGTH || value.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, error: `密码需为 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 位` };
  }
  if (CONTROL_CHARS.test(value)) {
    return { ok: false, error: "密码不能包含控制字符" };
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

export function corsOriginForRequest(origin, callback, env = process.env) {
  if (!origin) {
    callback(null, true);
    return;
  }
  const allowed = buildAllowedOrigins(env);
  callback(null, allowed.has(origin.replace(/\/+$/, "")));
}

export function createAuthRateLimit() {
  return rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "请求过于频繁，请稍后再试" }
  });
}

export function createApiRateLimit() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 180,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "请求过于频繁，请稍后再试" }
  });
}

function stripControlChars(value) {
  return value.replace(CONTROL_CHARS, "");
}
