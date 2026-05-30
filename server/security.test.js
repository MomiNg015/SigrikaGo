import { describe, expect, it } from "vitest";
import {
  buildAllowedOrigins,
  normalizeChatText,
  validateProductionDeployment,
  validatePassword,
  validateRoomCode,
  validateUsername
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
      JWT_SECRET: "dev-secret"
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("JWT_SECRET must be at least 32 characters in production");
    expect(result.errors).toContain("At least one production origin must be configured with PUBLIC_ORIGIN, SITE_ORIGIN, or ALLOWED_ORIGINS");
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
});
