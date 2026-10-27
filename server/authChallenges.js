import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { ipKeyGenerator } from "express-rate-limit";
import { canUseVerificationFixtures, stabilityRateLimitKey } from "./security.js";

export const AUTH_CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const VERIFICATION_CHALLENGE_ANSWER = "246823";
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CHALLENGE_FONT = fileURLToPath(new URL("../public/assets/fonts/LXGWMarkerGothic-Regular.ttf", import.meta.url));
const digest = (text) => createHash("sha256").update(text).digest();

export function authClientKey(req, env = process.env) {
  return env.NODE_ENV === "stability" ? stabilityRateLimitKey(req) : ipKeyGenerator(req.ip || "127.0.0.1");
}

export function createAuthChallenges({ env = process.env, now = Date.now, render = renderChallengeImage, capacity = 2000 } = {}) {
  const challenges = new Map();
  const issuance = new Map();
  let windowStarted = now();
  let windowCount = 0;
  const fixtures = canUseVerificationFixtures(env);

  async function issue(req, purpose) {
    if (!["register", "login"].includes(purpose)) return failure(400, "invalid_challenge_purpose", "验证用途无效");
    const time = now();
    for (const [id, challenge] of challenges) if (challenge.expiresAt <= time) challenges.delete(id);
    if (time - windowStarted >= 60_000) { issuance.clear(); windowCount = 0; windowStarted = time; }
    const clientKey = authClientKey(req, env);
    if (windowCount >= 120 || (issuance.get(clientKey) || 0) >= 10) {
      return failure(429, "challenge_rate_limited", "验证码获取过于频繁，请稍后再试", Math.max(1, Math.ceil((windowStarted + 60_000 - time) / 1000)));
    }
    if (challenges.size >= capacity) return failure(503, "challenge_busy", "验证码服务繁忙，请稍后重试", 30);
    windowCount += 1;
    issuance.set(clientKey, (issuance.get(clientKey) || 0) + 1);
    const answer = fixtures ? VERIFICATION_CHALLENGE_ANSWER : Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    const id = randomBytes(24).toString("base64url");
    const expiresAt = time + AUTH_CHALLENGE_TTL_MS;
    // Reserve before rendering so concurrent requests cannot exceed the bound.
    challenges.set(id, { clientKey, purpose, expiresAt, answerHash: digest(answer) });
    try {
      const image = await render(answer);
      return { ok: true, id, image, expiresAt };
    } catch (error) {
      challenges.delete(id);
      throw error;
    }
  }

  function consume(req, purpose) {
    const input = req.body?.challenge;
    // Isolated verification servers only. No header or NODE_ENV=test bypass.
    if (fixtures && input == null) return true;
    if (typeof input?.id !== "string" || input.id.length > 64 || typeof input.answer !== "string" || input.answer.length > 32) return false;
    const challenge = challenges.get(input.id);
    if (!challenge || challenge.clientKey !== authClientKey(req, env) || challenge.purpose !== purpose) return false;
    challenges.delete(input.id); // One attempt, including wrong or expired answers.
    return challenge.expiresAt > now() && timingSafeEqual(challenge.answerHash, digest(input.answer.trim().toUpperCase()));
  }

  return { issue, consume };
}

export function failure(status, code, error, retryAfter) {
  return { ok: false, status, code, error, ...(retryAfter ? { retryAfter } : {}) };
}

export async function renderChallengeImage(answer) {
  // Use the shipped font so a minimal Linux host needs no system font package.
  if (!/^[A-Z2-9]{6}$/.test(answer)) throw new Error("Invalid challenge image input");
  const letters = await Promise.all([...answer].map(async (char, index) => {
    const color = ["#284e46", "#534263", "#315570", "#6a4431"][randomInt(4)];
    const input = await sharp({ text: {
      text: `<span foreground="${color}">${char}</span>`,
      font: "LXGW Marker Gothic 34", fontfile: CHALLENGE_FONT, rgba: true, dpi: 72
    } }).rotate(randomInt(-15, 16), { background: "#00000000" }).png().toBuffer();
    return { input, left: 15 + index * 29 + randomInt(-2, 3), top: 16 + randomInt(-4, 5) };
  }));
  const noise = Array.from({ length: 7 }, () => `<path d="M ${randomInt(210)} ${randomInt(64)} Q ${randomInt(210)} ${randomInt(64)} ${randomInt(210)} ${randomInt(64)}" fill="none" stroke="#a8a29e" stroke-width="1"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="64"><rect width="210" height="64" fill="#faf7ed"/>${noise}</svg>`;
  const png = await sharp(Buffer.from(svg)).composite(letters).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}
