import { createHash } from "node:crypto";
import { authClientKey, failure } from "./authChallenges.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 10000;

export function createLoginAbuseGuard({ env = process.env, now = Date.now, capacity = MAX_ENTRIES } = {}) {
  const entries = new Map();
  function begin(req, username, challenges) {
    const time = now();
    for (const [key, entry] of entries) if (entry.expiresAt <= time && entry.inFlight === 0) entries.delete(key);
    const accountKey = createHash("sha256").update(username).digest("hex");
    const pairKey = `${accountKey}:${authClientKey(req, env)}`;
    const keys = [accountKey, pairKey];
    if (entries.size + keys.filter((key) => !entries.has(key)).length > capacity) {
      return failure(503, "login_busy", "登录服务繁忙，请稍后重试", 30);
    }
    const [account, pair] = keys.map((key) => {
      if (!entries.has(key)) entries.set(key, { failures: 0, inFlight: 0, blockedUntil: 0, expiresAt: time + WINDOW_MS });
      return entries.get(key);
    });
    if (pair.blockedUntil > time || pair.inFlight) {
      return failure(429, "login_backoff", "登录尝试过于频繁，请稍后再试", Math.max(1, Math.ceil((pair.blockedUntil - time) / 1000)));
    }
    // A distributed attack causes a challenge, never a hard account-wide lock.
    if (account.failures + account.inFlight >= 10 && !challenges.consume(req, "login")) {
      return failure(400, "captcha_required", "请完成图片验证后重试");
    }
    account.inFlight += 1;
    pair.inFlight += 1;
    let finished = false;
    return { ok: true, finish(result) {
      if (finished) return;
      finished = true;
      account.inFlight -= 1;
      pair.inFlight -= 1;
      if (result === "success") {
        account.failures = 0;
        pair.failures = 0;
        pair.blockedUntil = 0;
      } else if (result === "failure") {
        account.failures += 1;
        pair.failures += 1;
        account.expiresAt = pair.expiresAt = now() + WINDOW_MS;
        if (pair.failures >= 5) pair.blockedUntil = now() + Math.min(300, 2 ** Math.min(9, pair.failures - 4)) * 1000;
      }
    } };
  }
  return { begin };
}
