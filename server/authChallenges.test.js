import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { createAuthChallenges, renderChallengeImage, AUTH_CHALLENGE_TTL_MS, VERIFICATION_CHALLENGE_ANSWER } from "./authChallenges.js";

function fixture(options = {}) {
  let time = 1000;
  let answer;
  const store = createAuthChallenges({ env: { NODE_ENV: "production" }, now: () => time,
    render: async (text) => { answer = text; return "data:image/png;base64,AA=="; }, ...options });
  const request = (proof, ip = "192.0.2.1") => ({ ip, body: { challenge: proof }, headers: {} });
  return { store, request, answer: () => answer, tick: (ms) => { time += ms; } };
}

describe("authentication image challenges", () => {
  it("binds a one-use answer to purpose and network, without exposing its text", async () => {
    const f = fixture();
    const issued = await f.store.issue(f.request(), "register");
    expect(issued).not.toHaveProperty("answer");
    const proof = { id: issued.id, answer: f.answer().toLowerCase() };
    expect(f.store.consume(f.request(proof, "192.0.2.2"), "register")).toBe(false);
    expect(f.store.consume(f.request(proof), "login")).toBe(false);
    expect(f.store.consume(f.request(proof), "register")).toBe(true);
    expect(f.store.consume(f.request(proof), "register")).toBe(false);
  });
  it("consumes an incorrect attempt and rejects expired or malformed answers", async () => {
    const f = fixture();
    const a = await f.store.issue(f.request(), "register");
    const answer = f.answer();
    expect(f.store.consume(f.request({ id: a.id, answer: "wrong!" }), "register")).toBe(false);
    expect(f.store.consume(f.request({ id: a.id, answer }), "register")).toBe(false);
    const b = await f.store.issue(f.request(), "register");
    f.tick(AUTH_CHALLENGE_TTL_MS);
    expect(f.store.consume(f.request({ id: b.id, answer: f.answer() }), "register")).toBe(false);
    expect(f.store.consume(f.request({ id: [], answer: {} }), "register")).toBe(false);
  });
  it("limits issuance before image rendering and bounds pending memory", async () => {
    const render = vi.fn(async () => "data:image/png;base64,AA==");
    const f = fixture({ render });
    for (let i = 0; i < 10; i++) expect((await f.store.issue(f.request(), "register")).ok).toBe(true);
    expect((await f.store.issue(f.request(), "register")).status).toBe(429);
    expect(render).toHaveBeenCalledTimes(10);
    f.tick(60_000);
    expect((await f.store.issue(f.request(), "login")).ok).toBe(true);
    const bounded = fixture({ capacity: 1 });
    await bounded.store.issue(bounded.request(), "register");
    expect((await bounded.store.issue(bounded.request(), "register")).status).toBe(503);
    bounded.tick(AUTH_CHALLENGE_TTL_MS);
    expect((await bounded.store.issue(bounded.request(), "register")).ok).toBe(true);
  });
  it.each(["production", "development", "test"])("ignores verification flags and client headers in %s", (NODE_ENV) => {
    const f = fixture({ env: { NODE_ENV, ENABLE_TEST_ACTIONS: "true" } });
    const req = { ...f.request(), headers: { "x-stability-scope": "bypass", "x-test-actions": "true" } };
    expect(f.store.consume(req, "register")).toBe(false);
  });
  it("only explicit isolated verification environments allow legacy fixture admission", async () => {
    for (const NODE_ENV of ["stability", "capacity"]) {
      const strict = fixture({ env: { NODE_ENV } });
      expect(strict.store.consume(strict.request(), "register")).toBe(false);
      const f = fixture({ env: { NODE_ENV, ENABLE_TEST_ACTIONS: "true" } });
      expect(f.store.consume(f.request(), "register")).toBe(true);
      await f.store.issue(f.request(), "register");
      expect(f.answer()).toBe(VERIFICATION_CHALLENGE_ANSWER);
    }
  });
  it("returns raster PNG with no recoverable SVG text/metadata", async () => {
    const image = await renderChallengeImage("ABC234");
    const bytes = Buffer.from(image.split(",")[1], "base64");
    expect(bytes.includes(Buffer.from("ABC234"))).toBe(false);
    expect(await sharp(bytes).metadata()).toMatchObject({ format: "png", width: 210, height: 64 });
    await expect(renderChallengeImage("<svg/>" )).rejects.toThrow();
  });
});
