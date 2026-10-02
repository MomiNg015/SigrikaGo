import { describe, expect, it } from "vitest";
import {
  ZHIZI_KATAGO_ENGINE_ARGS,
  ZHIZI_KATAGO_MAX_THINK_TIME_MS,
  resolveZhiziKataGoConfig,
  zhiziKataGoConfigErrors
} from "./zhiziKataGoConfig.js";

describe("Zhizi KataGo configuration", () => {
  it("stays disabled and credential-free by default", () => {
    expect(resolveZhiziKataGoConfig({})).toMatchObject({
      enabled: false,
      phone: "",
      email: "",
      password: ""
    });
    expect(zhiziKataGoConfigErrors({})).toEqual([]);
  });

  it("locks engine allocation to VIP shared compute", () => {
    expect(ZHIZI_KATAGO_ENGINE_ARGS).toContain("--gpu-type vip-share");
    expect(ZHIZI_KATAGO_ENGINE_ARGS).not.toMatch(/--gpu-type\s+(?:1x|3x|6x|12x|24x)/);
  });

  it("caps every cloud search at five seconds even when the environment requests more", () => {
    expect(resolveZhiziKataGoConfig({}).searchTimeoutMs).toBe(ZHIZI_KATAGO_MAX_THINK_TIME_MS);
    expect(resolveZhiziKataGoConfig({ ZHIZI_SEARCH_TIMEOUT_MS: "999999" }).searchTimeoutMs)
      .toBe(ZHIZI_KATAGO_MAX_THINK_TIME_MS);
    expect(resolveZhiziKataGoConfig({ ZHIZI_SEARCH_TIMEOUT_MS: "2500" }).searchTimeoutMs).toBe(2_500);
  });

  it("requires exactly one documented login identifier and a password when enabled", () => {
    expect(zhiziKataGoConfigErrors({ ZHIZI_ENABLED: "true" })).toEqual([
      "ZHIZI_ENABLED requires exactly one of ZHIZI_ACCOUNT_PHONE or ZHIZI_ACCOUNT_EMAIL",
      "ZHIZI_ENABLED requires ZHIZI_ACCOUNT_PASSWORD"
    ]);
    expect(zhiziKataGoConfigErrors({
      ZHIZI_ENABLED: "true",
      ZHIZI_ACCOUNT_PHONE: "13800000000",
      ZHIZI_ACCOUNT_EMAIL: "player@example.com",
      ZHIZI_ACCOUNT_PASSWORD: "secret"
    })).toEqual([
      "ZHIZI_ENABLED requires exactly one of ZHIZI_ACCOUNT_PHONE or ZHIZI_ACCOUNT_EMAIL"
    ]);
    expect(zhiziKataGoConfigErrors({
      ZHIZI_ENABLED: "true",
      ZHIZI_ACCOUNT_PHONE: "13800000000",
      ZHIZI_ACCOUNT_PASSWORD: "secret"
    })).toEqual([]);
  });

  it("bounds runtime tuning without accepting arbitrary engine args", () => {
    expect(resolveZhiziKataGoConfig({
      ZHIZI_CONNECT_TIMEOUT_MS: "1",
      ZHIZI_NPC_MIN_VISITS: "999999",
      ZHIZI_ENGINE_ARGS: "--gpu-type 24x"
    })).toMatchObject({
      connectTimeoutMs: 2_000,
      npcMinVisits: 10_000,
      engineArgs: ZHIZI_KATAGO_ENGINE_ARGS
    });
  });
});
