import { describe, expect, it } from "vitest";
import {
  authRateLimitOptions,
  buildAllowedOrigins,
  canUseDebugTestActions,
  normalizeChatText,
  validateProductionDeployment,
  validatePassword,
  validateRoomCode,
  validateUsername,
  usernameDisplayWidth
} from "./security.js";

describe("deployment security helpers", () => {
  it("accepts passwords from 6 to 14 characters only", () => {
    expect(validatePassword("12345").ok).toBe(false);
    expect(validatePassword("123456").ok).toBe(true);
    expect(validatePassword("12345678901234").ok).toBe(true);
    expect(validatePassword("123456789012345").ok).toBe(false);
  });

  it("normalizes safe usernames and rejects unsafe usernames", () => {
    expect(validateUsername("  玩家_01  ")).toEqual({ ok: true, value: "玩家_01" });
    expect(validateUsername("a").ok).toBe(false);
    expect(validateUsername("name<script>").ok).toBe(false);
    expect(validateUsername("very-very-very-long-name").ok).toBe(false);
  });

  it("limits usernames by CJK and half-width display width", () => {
    expect(usernameDisplayWidth("\u9732\u9732A_12")).toBe(8);
    expect(validateUsername("\u9732\u9732A_12")).toEqual({ ok: true, value: "\u9732\u9732A_12" });
    expect(validateUsername("\u9732\u9732A_123").ok).toBe(false);
    expect(validateUsername("\u4e00\u4e8c\u4e09\u56db").ok).toBe(true);
    expect(validateUsername("\u4e00\u4e8c\u4e09\u56db\u4e94").ok).toBe(false);
    expect(validateUsername("Alice_12").ok).toBe(true);
    expect(validateUsername("Alice_123").ok).toBe(false);
    expect(validateUsername("\u304b\u306a\u30ab\u30ca").ok).toBe(true);
  });

  it("normalizes chat text without allowing control characters or unbounded length", () => {
    expect(normalizeChatText(" hi\u0000 there ")).toEqual({ ok: true, value: "hi there" });
    expect(normalizeChatText("   ").ok).toBe(false);
    expect(normalizeChatText("x".repeat(241)).ok).toBe(false);
  });

  it("accepts only five digit room codes", () => {
    expect(validateRoomCode("12345").ok).toBe(true);
    expect(validateRoomCode("1234").ok).toBe(false);
    expect(validateRoomCode("abcde").ok).toBe(false);
  });

  it("allows debug test actions in development only", () => {
    expect(canUseDebugTestActions({})).toBe(true);
    expect(canUseDebugTestActions({ NODE_ENV: "development" })).toBe(true);
    expect(canUseDebugTestActions({ NODE_ENV: "test" })).toBe(true);
    expect(canUseDebugTestActions({ NODE_ENV: "production", ENABLE_TEST_ACTIONS: "true" })).toBe(false);
  });

  it("keeps production throttling strict while allowing isolated verification setup traffic", () => {
    expect(authRateLimitOptions({ NODE_ENV: "production" }).limit).toBe(20);
    expect(authRateLimitOptions({ NODE_ENV: "stability" }).limit).toBeGreaterThanOrEqual(200);
    expect(authRateLimitOptions({ NODE_ENV: "capacity" }).limit).toBeGreaterThanOrEqual(1000);
  });

  it("builds a production origin allowlist from configured domains", () => {
    expect(buildAllowedOrigins({
      NODE_ENV: "production",
      PUBLIC_ORIGIN: "https://sigrika.fun",
      ALLOWED_ORIGINS: "https://www.sigrika.fun, https://admin.sigrika.fun"
    })).toEqual(new Set([
      "https://sigrika.fun",
      "https://www.sigrika.fun",
      "https://admin.sigrika.fun"
    ]));
  });

  it("accepts production deployment config only when secrets and origins are explicit", () => {
    expect(validateProductionDeployment({
      NODE_ENV: "production",
      JWT_SECRET: "0123456789abcdef0123456789abcdef",
      PUBLIC_ORIGIN: "https://sigrika.fun"
    })).toEqual({ ok: true, errors: [] });
  });

  it("rejects production deployment config with weak secrets or missing origins", () => {
    const result = validateProductionDeployment({
      NODE_ENV: "production",
      JWT_SECRET: "dev-secret",
      ENABLE_TEST_ACTIONS: "true"
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("JWT_SECRET must be at least 32 characters in production");
    expect(result.errors).toContain("At least one production origin must be configured with PUBLIC_ORIGIN, SITE_ORIGIN, or ALLOWED_ORIGINS");
    expect(result.errors).toContain("ENABLE_TEST_ACTIONS must not be enabled in production");
  });

  it("rejects non-https production origins", () => {
    expect(validateProductionDeployment({
      NODE_ENV: "production",
      JWT_SECRET: "0123456789abcdef0123456789abcdef",
      PUBLIC_ORIGIN: "http://sigrika.fun"
    })).toEqual({
      ok: false,
      errors: ["Production origins must use https: http://sigrika.fun"]
    });
  });

  it("rejects explicit multi-instance production settings until room state is shared", () => {
    const result = validateProductionDeployment({
      NODE_ENV: "production",
      JWT_SECRET: "0123456789abcdef0123456789abcdef",
      PUBLIC_ORIGIN: "https://sigrika.fun",
      WEB_CONCURRENCY: "2"
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Production must run a single Node instance until room state and Socket.IO are shared");
  });
});
