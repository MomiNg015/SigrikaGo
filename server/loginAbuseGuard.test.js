import { describe, expect, it, vi } from "vitest";
import { createLoginAbuseGuard } from "./loginAbuseGuard.js";

describe("login abuse guard", () => {
  function setup(options = {}) {
    let time = 1000;
    const guard = createLoginAbuseGuard({ env: { NODE_ENV: "production" }, now: () => time, ...options });
    const challenges = { consume: vi.fn(() => false) };
    const begin = (ip = "192.0.2.1", username = "Alice") => guard.begin({ ip }, username, challenges);
    return { begin, challenges, tick: (ms) => { time += ms; } };
  }
  it("backs off an IP/account pair while leaving a different network usable", () => {
    const f = setup();
    for (let i = 0; i < 5; i++) f.begin().finish("failure");
    expect(f.begin()).toMatchObject({ ok: false, status: 429, retryAfter: 2 });
    expect(f.begin("192.0.2.2").ok).toBe(true);
    f.tick(2000);
    const good = f.begin();
    expect(good.ok).toBe(true);
    good.finish("success");
    expect(f.begin().ok).toBe(true);
  });
  it("uses a challenge instead of account-wide lockout for distributed failures", () => {
    const f = setup();
    for (let i = 1; i <= 10; i++) f.begin(`192.0.2.${i}`).finish("failure");
    expect(f.begin("192.0.2.100")).toMatchObject({ ok: false, code: "captcha_required" });
    f.challenges.consume.mockReturnValue(true);
    const verified = f.begin("192.0.2.100");
    expect(verified.ok).toBe(true);
    verified.finish("success");
    f.challenges.consume.mockReturnValue(false);
    expect(f.begin("192.0.2.100").ok).toBe(true);
  });
  it("reserves attempts before asynchronous password work and releases failures safely", () => {
    const f = setup();
    const active = f.begin();
    expect(f.begin().status).toBe(429);
    active.finish("ignored");
    active.finish("failure");
    expect(f.begin().ok).toBe(true);
  });
  it("expires stale failures and refuses rather than evicts active capacity", () => {
    const f = setup({ capacity: 2 });
    f.begin().finish("failure");
    expect(f.begin("192.0.2.2", "Bob").status).toBe(503);
    f.tick(15 * 60 * 1000);
    expect(f.begin("192.0.2.2", "Bob").ok).toBe(true);
  });
});
